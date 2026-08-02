import { NextResponse } from "next/server";
import { dbStore } from "@rencanangoding/db";
import { isTelemetryEnabled } from "@/lib/telemetry";

/**
 * Read/update the telemetry preference for this installation.
 *
 * Kept server-side (not in localStorage) because the reporter itself runs on the server —
 * a browser-only flag could not actually stop anything from being sent.
 */
export async function GET() {
  const settings = dbStore.getAppSettings();
  const forcedOff = (process.env.RENCANANGODING_TELEMETRY || "").toLowerCase() === "off";

  return NextResponse.json({
    success: true,
    telemetryEnabled: settings.telemetryEnabled !== false,
    /** True when an env var overrides the toggle, so the UI can explain why it is locked. */
    forcedOffByEnv: forcedOff,
    effective: isTelemetryEnabled(),
    instanceId: settings.instanceId,
    pendingCount: settings.telemetryPending.length,
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (typeof body?.telemetryEnabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Field telemetryEnabled (boolean) diperlukan" },
        { status: 400 }
      );
    }

    const settings = dbStore.updateAppSettings({ telemetryEnabled: body.telemetryEnabled });

    return NextResponse.json({
      success: true,
      telemetryEnabled: settings.telemetryEnabled,
      effective: isTelemetryEnabled(),
      message: settings.telemetryEnabled
        ? "Laporan metadata projek diaktifkan."
        : "Laporan metadata projek dimatikan. Tidak ada data yang dikirim keluar.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
