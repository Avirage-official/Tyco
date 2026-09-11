import { NextResponse } from "next/server";
import { runFeedSync } from "@/lib/feed/run-sync";

// Discovery + chunked classification of a large candidate backlog (see
// classify.ts) can run well past the platform's 10s default — 60s is the
// Hobby-plan ceiling for a serverless function's maxDuration.
export const maxDuration = 60;

/**
 * Protected by CRON_SECRET: Vercel sends `Authorization: Bearer
 * <CRON_SECRET>` automatically on its own scheduled invocations (see
 * vercel.json) once the env var is set, so nobody else can trigger this by
 * finding the URL. The actual sync work lives in runFeedSync() — shared
 * with the "Run sync now" admin action, which reaches it through a
 * different gate (requireAdmin()) rather than this one.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFeedSync();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("feed-sync failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
