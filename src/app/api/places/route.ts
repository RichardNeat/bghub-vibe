import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return NextResponse.json([]);

  const params = new URLSearchParams({ input: q, key });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return NextResponse.json([]);

    const suggestions: string[] = (data.predictions ?? [])
      .slice(0, 6)
      .map((p: { description: string }) => p.description);

    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}
