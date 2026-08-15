import { NextResponse } from "next/server";
import { searchPerfumes } from "@/lib/fragrance-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchPerfumes(q, 5);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Fragrance API search error:", err);
    if (err instanceof Error && err.message === "RAPIDAPI_RATE_LIMITED") {
      return NextResponse.json(
        { error: "Osiągnięto limit wyszukiwania. Spróbuj za chwilę." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Nie udało się wyszukać perfum" },
      { status: 502 },
    );
  }
}
