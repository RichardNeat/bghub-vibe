import { NextRequest, NextResponse } from "next/server";

function decodeXmlEntities(str: string) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const token = process.env.BGG_TOKEN;
  if (!token) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      }
    );
    const xml = await res.text();

    const results: { id: string; name: string; year: string | null }[] = [];
    const itemRegex = /<item[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && results.length < 10) {
      const [, id, inner] = match;
      const nameMatch = inner.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/);
      const yearMatch = inner.match(/<yearpublished[^>]*value="(\d+)"/);
      if (nameMatch) {
        results.push({
          id,
          name: decodeXmlEntities(nameMatch[1]),
          year: yearMatch?.[1] ?? null,
        });
      }
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
