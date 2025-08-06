import { NextResponse } from "next/server";

export const runtime = "edge";

// Redirect to today's schedule, in [year]/[month]/[date]/page.tsx.
export function GET(req: Request) {
  const [year, month, day] = new Date().toISOString().slice(0, 10).split("-");
  return NextResponse.redirect(req.url + `/${year}/${month}/${day}`);
}
