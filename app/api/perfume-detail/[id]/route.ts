import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // RapidAPI returns all data in search, no separate detail endpoint needed
  return NextResponse.json(
    { error: "Detail endpoint not needed with RapidAPI - all data in search" },
    { status: 404 },
  );
}