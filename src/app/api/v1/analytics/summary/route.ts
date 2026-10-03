import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ period: "2026-09", currency: "MDL", revenue: "126800.00", expenses: "84320.00", documents_processed: 24, automation_rate: "0.87", review_queue: 3, generated_at: "2026-10-03T12:00:00Z" });
}
