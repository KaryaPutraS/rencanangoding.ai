import { generateObject, generateText } from "ai";
import { z } from "zod";

interface GenerateStructuredOptions<T extends z.ZodType> {
  model: any;
  schema: T;
  system?: string;
  prompt: string;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Normalises the SDK usage object; fields are optional depending on the provider. */
export function normalizeUsage(usage: any): AiUsage {
  const inputTokens = Number(usage?.inputTokens ?? usage?.promptTokens ?? 0) || 0;
  const outputTokens = Number(usage?.outputTokens ?? usage?.completionTokens ?? 0) || 0;
  const totalTokens = Number(usage?.totalTokens ?? inputTokens + outputTokens) || inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

/** Errors that will never be fixed by retrying with a different output mode. */
function isHardFailure(err: any): boolean {
  const status = err?.statusCode ?? err?.status ?? err?.response?.status;
  return status === 401 || status === 403 || status === 429;
}

/** Pulls the first JSON object out of a model reply, tolerating ```json fences and prose. */
function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf("{");
  if (start === -1) return null;

  // Walk the string to find the matching closing brace, ignoring braces inside strings.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Generates a schema-validated object, with a provider-agnostic fallback.
 *
 * `generateObject` asks the provider for native structured output
 * (`response_format: json_schema`). Not every OpenAI-compatible endpoint implements
 * that — DeepSeek, for instance, only supports plain JSON mode — so when the native
 * call fails we retry once by asking for raw JSON and validating it ourselves.
 * If the retry also fails, the original error is surfaced because it is the more
 * informative one.
 */
export async function generateStructured<T extends z.ZodType>({
  model,
  schema,
  system,
  prompt
}: GenerateStructuredOptions<T>): Promise<z.infer<T>> {
  const { object } = await generateStructuredWithUsage({ model, schema, system, prompt });
  return object;
}

/** Same as {@link generateStructured} but also reports token usage for accounting. */
export async function generateStructuredWithUsage<T extends z.ZodType>({
  model,
  schema,
  system,
  prompt
}: GenerateStructuredOptions<T>): Promise<{ object: z.infer<T>; usage: AiUsage }> {
  try {
    const result = await generateObject({ model, schema, ...(system ? { system } : {}), prompt });
    return { object: result.object as z.infer<T>, usage: normalizeUsage(result.usage) };
  } catch (nativeErr: any) {
    if (isHardFailure(nativeErr)) throw nativeErr;

    console.warn(
      "Structured output natif gagal, mencoba ulang dengan JSON mode manual:",
      nativeErr?.message || nativeErr
    );

    try {
      const jsonSchema = JSON.stringify(z.toJSONSchema(schema as any));
      const result = await generateText({
        model,
        ...(system ? { system } : {}),
        prompt: `${prompt}

### FORMAT JAWABAN (WAJIB)
Balas HANYA dengan satu objek JSON valid yang cocok dengan JSON Schema berikut.
Jangan menambahkan penjelasan, komentar, atau teks apa pun di luar JSON.

${jsonSchema}`
      });

      const raw = extractJson(result.text);
      if (!raw) throw new Error("Model tidak mengembalikan JSON yang dapat dibaca");

      return { object: schema.parse(JSON.parse(raw)) as z.infer<T>, usage: normalizeUsage(result.usage) };
    } catch (fallbackErr: any) {
      console.warn("JSON mode manual juga gagal:", fallbackErr?.message || fallbackErr);
      throw nativeErr;
    }
  }
}
