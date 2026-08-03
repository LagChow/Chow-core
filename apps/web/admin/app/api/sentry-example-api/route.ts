import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import * as Sentry from "@sentry/nextjs";

export function GET() {
  const err = new Error("Sentry Example API Route Error (Explicit)");
  Sentry.captureException(err);
  throw err;
}
