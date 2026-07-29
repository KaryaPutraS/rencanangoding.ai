import { generateText } from "ai";
import { getAiModel, AiConfig } from "../providers";

export async function processPrdRevision(
  currentPrd: string,
  userInstruction: string,
  language: string = "id",
  config?: AiConfig
): Promise<{ replyText: string; updatedPrd?: string }> {
  const modelInfo = getAiModel(config);

  if (modelInfo.type !== "mock" && modelInfo.model) {
    try {
      const result = await generateText({
        model: modelInfo.model,
        prompt: `Anda adalah AI Co-pilot Product Manager.
Dokumen PRD saat ini:
\`\`\`markdown
${currentPrd}
\`\`\`

Instruksi / Revisi dari User: "${userInstruction}"

Tugas Anda:
1. Analisis masukan user.
2. Jika masukan meminta perubahan dokumen, kembalikan versi PRD yang telah diperbarui secara utuh di dalam blok kode markdown \`\`\`markdown ... \`\`\`.
3. Berikan penjelaskan singkat mengenai poin-poin yang diperbarui.`
      });

      const responseText = result.text;
      const match = responseText.match(/```markdown([\s\S]*?)```/);
      const updatedPrd = match ? match[1].trim() : undefined;

      return {
        replyText: responseText.replace(/```markdown[\s\S]*?```/g, "").trim() || "PRD berhasil diperbarui sesuai instruksi Anda.",
        updatedPrd
      };
    } catch (err) {
      console.warn("AI generation fallback to mock for PRD revision:", err);
    }
  }

  // Mock Revision handling
  let addition = "";
  if (userInstruction.includes("MVP") || userInstruction.includes("Prioritas")) {
    addition = "\n\n> **[Catatan Revisi AI]**: Prioritas MVP disesuaikan untuk mengedepankan core flow terlebih dahulu (Phase 1 focus).";
  } else if (userInstruction.includes("auth") || userInstruction.includes("Auth")) {
    addition = "\n\n> **[Catatan Revisi AI]**: Keamanan autentikasi diperketat dengan opsi JWT / Multi-tenant Token Revocation.";
  } else if (userInstruction.includes("Notifikasi") || userInstruction.includes("notification")) {
    addition = "\n\n> **[Catatan Revisi AI]**: Menambahkan modul Push Notification & Email Webhooks pada Fase 2.";
  } else {
    addition = `\n\n> **[Catatan Revisi AI]**: Diperbarui berdasarkan instruksi "${userInstruction}".`;
  }

  return {
    replyText: `Saya telah menyesuaikan dokumen PRD sesuai dengan masukan Anda: "${userInstruction}".`,
    updatedPrd: currentPrd + addition
  };
}
