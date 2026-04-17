import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();
  if (!address) return new NextResponse(null, { status: 400 });

  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return new NextResponse(null, { status: 503 });

  const params = new URLSearchParams({
    center: address,
    zoom: "14",
    size: "640x200",
    scale: "2",
    markers: `color:red|${address}`,
    key,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/staticmap?${params}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return new NextResponse(null, { status: res.status });

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
