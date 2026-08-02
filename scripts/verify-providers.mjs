/**
 * Verifies the multi-provider layer against a local mock of an OpenAI-compatible
 * endpoint (the shape DeepSeek and Groq expose).
 *
 * Checks that:
 *   - the DeepSeek/Groq/OpenAI paths call /chat/completions, not /responses
 *     (DeepSeek does not implement the Responses API at all)
 *   - a model id configured for one provider is not leaked to another provider
 *   - structured generation still succeeds on endpoints that reject
 *     `response_format: json_schema` (plain JSON-mode fallback)
 *
 *   node --experimental-strip-types scripts/verify-providers.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import http from "node:http";

const repoRoot = path.resolve(import.meta.dirname, "..");
register(pathToFileURL(path.join(repoRoot, "scripts/alias-loader.mjs")));

let pass = 0, fail = 0;
const check = (n, c, d) => { c ? (pass++, console.log(`  ✅ ${n}`)) : (fail++, console.log(`  ❌ ${n}${d ? ` → ${d}` : ""}`)); };

// --- Mock OpenAI-compatible server -----------------------------------------
const requests = [];
let rejectJsonSchema = false;

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let parsed = {};
    try { parsed = JSON.parse(body || "{}"); } catch {}
    requests.push({ url: req.url, body: parsed });

    // DeepSeek only implements /chat/completions.
    if (!req.url.endsWith("/chat/completions")) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: `Unknown endpoint ${req.url}` } }));
      return;
    }

    if (rejectJsonSchema && parsed.response_format?.type === "json_schema") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "response_format json_schema is not supported" } }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      id: "mock", object: "chat.completion", created: Date.now(), model: parsed.model,
      choices: [{ index: 0, message: { role: "assistant", content: '{"status":"ok","provider":"mock-deepseek"}' }, finish_reason: "stop" }],
      usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 }
    }));
  });
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const mockUrl = `http://127.0.0.1:${server.address().port}/v1`;

process.env.DEEPSEEK_BASE_URL = mockUrl;
process.env.GROQ_BASE_URL = mockUrl;
process.env.OPENAI_BASE_URL = mockUrl;

const { getAiModel } = await import(pathToFileURL(path.join(repoRoot, "packages/ai/src/providers/index.ts")).href);
const { generateStructured } = await import(pathToFileURL(path.join(repoRoot, "packages/ai/src/generateStructured.ts")).href);
const { z } = await import("zod");

const schema = z.object({ status: z.string(), provider: z.string() });
const probe = (model) => generateStructured({ model, schema, prompt: "uji koneksi" });

// --- 1. DeepSeek endpoint ---------------------------------------------------
console.log("\n── 1. Jalur DeepSeek ──");

const ds = getAiModel({ provider: "deepseek", apiKey: "sk-mock", modelName: "deepseek-chat" });
check("provider deepseek terpilih", ds.type === "deepseek", ds.type);
check("model id yang dipakai = deepseek-chat", ds.modelId === "deepseek-chat", ds.modelId);

requests.length = 0;
const dsResult = await probe(ds.model);
check("panggilan DeepSeek berhasil", dsResult.status === "ok", JSON.stringify(dsResult));
check("endpoint yang dipanggil /chat/completions (bukan /responses)",
  requests.every((r) => r.url.endsWith("/chat/completions")),
  requests.map((r) => r.url).join(", "));
check("model dikirim apa adanya ke provider", requests[0].body.model === "deepseek-chat", requests[0].body.model);

// --- 2. Endpoint yang menolak json_schema ----------------------------------
console.log("\n── 2. DeepSeek tanpa dukungan response_format json_schema ──");

rejectJsonSchema = true;
requests.length = 0;
const legacy = await probe(ds.model);
check("tetap menghasilkan objek valid lewat JSON mode manual", legacy.status === "ok", JSON.stringify(legacy));
check("percobaan pertama memakai json_schema", requests[0]?.body?.response_format?.type === "json_schema",
  JSON.stringify(requests[0]?.body?.response_format));
check("percobaan kedua tanpa response_format json_schema",
  requests.length === 2 && requests[1].body.response_format?.type !== "json_schema",
  `${requests.length} request`);
rejectJsonSchema = false;

// --- 3. Groq & OpenAI juga chat completions --------------------------------
console.log("\n── 3. Groq & OpenAI ──");

process.env.GROQ_API_KEY = "gsk-mock";
const groq = getAiModel({ provider: "groq" });
requests.length = 0;
await probe(groq.model);
check("groq memanggil /chat/completions", requests.every((r) => r.url.endsWith("/chat/completions")),
  requests.map((r) => r.url).join(", "));
check("groq memakai model default llama", groq.modelId === "llama-3.3-70b-versatile", groq.modelId);

const oai = getAiModel({ provider: "openai", apiKey: "sk-mock", modelName: "gpt-4o" });
requests.length = 0;
await probe(oai.model);
check("openai memanggil /chat/completions", requests.every((r) => r.url.endsWith("/chat/completions")),
  requests.map((r) => r.url).join(", "));

// --- 4. Isolasi model antar provider ---------------------------------------
console.log("\n── 4. Fallback provider & isolasi nama model ──");

// Requested provider has no key at all → must fall back to one that does,
// and must NOT reuse the requested provider's model name.
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
delete process.env.OPENAI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
process.env.DEEPSEEK_API_KEY = "sk-mock-env";

const switched = getAiModel({ provider: "anthropic", modelName: "claude-3-5-sonnet-20241022" });
check("provider tanpa key otomatis pindah ke provider yang punya key",
  switched.type === "deepseek", switched.type);
check("nama model provider lama tidak ikut terbawa",
  switched.modelId === "deepseek-chat", switched.modelId);
check("perpindahan provider ditandai", switched.switchedFromRequested === true);

requests.length = 0;
const switchedResult = await probe(switched.model);
check("provider hasil perpindahan benar-benar bisa dipanggil", switchedResult.status === "ok");

// No keys anywhere → mock engine, never a crash.
delete process.env.DEEPSEEK_API_KEY;
delete process.env.GROQ_API_KEY;
const none = getAiModel({ provider: "openai" });
check("tanpa API key sama sekali → mode mock (tidak crash)", none.type === "mock" && none.model === null, none.type);

server.close();
console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} lolos, ${fail} gagal\n`);
process.exit(fail === 0 ? 0 : 1);
