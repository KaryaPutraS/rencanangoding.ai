import { dbStore } from "@rencanangoding/db";
import type { Plan } from "@rencanangoding/shared";

/**
 * Reports project METADATA to the RencanaNgodingAI dashboard when this machine is online.
 *
 * What leaves this machine: project name, a short excerpt of the idea, the tech stack,
 * the app version, and an anonymous installation id.
 *
 * What never leaves this machine: the PRD document, the mind map, the task list, the
 * discovery answers, the AI chat history, and your API keys.
 *
 * Switch it off in Settings, or set RENCANANGODING_TELEMETRY=off before starting the
 * server. Every failure here is swallowed — reporting must never break the app or slow a
 * request down, and being offline is a normal state, not an error.
 */

const ENDPOINT =
  process.env.RENCANANGODING_TELEMETRY_URL || "https://rencanangodingai.site/api/v1/telemetry/ingest";

/**
 * Public app key. The sender is open source, so this cannot prove who is calling — it
 * only lets the receiving server turn away bots probing random endpoints and gives the
 * operator something to rotate. Flood protection there is by rate limit, not by this key.
 */
const APP_KEY = process.env.RENCANANGODING_TELEMETRY_KEY || "rng-selfhost-public-2026";

const APP_VERSION = process.env.RENCANANGODING_VERSION || "0.1.0";

/** A report is refreshed at most this often per project. */
const RESEND_AFTER_MS = 24 * 60 * 60 * 1000;

const REQUEST_TIMEOUT_MS = 5000;
const IDEA_SNIPPET_LENGTH = 200;

export function isTelemetryEnabled(): boolean {
  // The environment switch wins, so an air-gapped or CI install can hard-disable it.
  if ((process.env.RENCANANGODING_TELEMETRY || "").toLowerCase() === "off") return false;
  return dbStore.getAppSettings().telemetryEnabled !== false;
}

function techStackOf(plan: Plan): string[] {
  const raw = (plan as any).techStackJson;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).slice(0, 12);
  if (typeof raw === "object") return Object.keys(raw).slice(0, 12);
  return [];
}

async function postReport(plan: Plan): Promise<boolean> {
  const settings = dbStore.getAppSettings();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-telemetry-key": APP_KEY },
      signal: controller.signal,
      body: JSON.stringify({
        instanceId: settings.instanceId,
        instanceType: "self-hosted",
        version: APP_VERSION,
        projectName: plan.name,
        ideaSnippet: (plan.rawIdea || "").trim().slice(0, IDEA_SNIPPET_LENGTH),
        techStack: techStackOf(plan)
      })
    });

    return res.ok;
  } catch {
    // Offline, DNS failure, timeout — all normal. Retried on a later request.
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Queues one project for reporting. Fire-and-forget: callers must not await it, so a slow
 * or unreachable network never delays the user's request.
 */
export function reportProject(plan: Plan | null | undefined): void {
  if (!plan || !isTelemetryEnabled()) return;

  const settings = dbStore.getAppSettings();
  const lastSent = settings.telemetryReported[plan.id];
  if (lastSent && Date.now() - new Date(lastSent).getTime() < RESEND_AFTER_MS) return;

  void postReport(plan).then((ok) => {
    if (ok) dbStore.markTelemetryReported(plan.id);
    else dbStore.markTelemetryPending(plan.id);
  });
}

/**
 * Retries whatever failed while the machine was offline. Called opportunistically on
 * ordinary requests — no background timer, so an idle install stays completely quiet.
 */
export function flushPendingReports(): void {
  if (!isTelemetryEnabled()) return;

  const settings = dbStore.getAppSettings();
  const pending = [...settings.telemetryPending].slice(0, 5); // a few per request, no bursts
  if (pending.length === 0) return;

  void (async () => {
    for (const planId of pending) {
      const plan = await dbStore.getPlan(planId);
      if (!plan) {
        // Project deleted locally — stop trying to report it.
        dbStore.markTelemetryReported(planId);
        continue;
      }
      const ok = await postReport(plan);
      if (ok) dbStore.markTelemetryReported(planId);
      else break; // still offline; leave the rest queued
    }
  })();
}
