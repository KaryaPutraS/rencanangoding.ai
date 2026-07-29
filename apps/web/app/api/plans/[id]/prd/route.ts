import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { processPrdRevision, AiConfig } from "@rencanangoding/ai";

function extractAiConfig(req: Request): AiConfig {
  const provider = (req.headers.get("x-ai-provider") || undefined) as AiConfig["provider"];
  const apiKey = req.headers.get("x-ai-api-key") || undefined;
  const modelName = req.headers.get("x-ai-model-name") || undefined;
  return { provider, apiKey, modelName };
}

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  const prd = await dbStore.getPrd(id);
  if (!prd) {
    return NextResponse.json({ success: false, error: "PRD belum dibuat" }, { status: 404 });
  }

  return NextResponse.json({ success: true, prd });
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const body = await req.json();

    // Direct manual edit
    if (typeof body.contentMarkdown === "string") {
      const prd = await dbStore.savePrd(id, body.contentMarkdown);
      return NextResponse.json({ success: true, prd });
    }

    // AI Chat Revision
    if (typeof body.chatMessage === "string") {
      const plan = await dbStore.getPlan(id);
      const prd = await dbStore.getPrd(id);

      if (!prd) {
        return NextResponse.json({ success: false, error: "PRD belum tersedia untuk direvisi" }, { status: 400 });
      }

      await dbStore.addChatMessage(id, "user", body.chatMessage);

      const aiConfig = extractAiConfig(req);
      const revisionResult = await processPrdRevision(
        prd.contentMarkdown,
        body.chatMessage,
        plan?.outputLanguage || "id",
        aiConfig
      );

      let updatedPrdDoc = prd;
      if (revisionResult.updatedPrd) {
        updatedPrdDoc = await dbStore.savePrd(id, revisionResult.updatedPrd);
      }

      await dbStore.addChatMessage(id, "assistant", revisionResult.replyText);

      const chatHistory = await dbStore.getChatMessages(id);

      return NextResponse.json({
        success: true,
        prd: updatedPrdDoc,
        replyText: revisionResult.replyText,
        chatHistory
      });
    }

    return NextResponse.json({ success: false, error: "Payload tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui PRD" },
      { status: 500 }
    );
  }
}
