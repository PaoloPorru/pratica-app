import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Proxy Google Translate TTS — voce naturale, italiana, gratuita
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const speed = req.nextUrl.searchParams.get("speed") ?? "0.85";

  if (!text) return new NextResponse("Missing text", { status: 400 });
  if (text.length > 500) return new NextResponse("Text too long", { status: 400 });

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=it&client=tw-ob&ttsspeed=${speed}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://translate.google.com/",
        "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) throw new Error(`Google TTS ${res.status}`);

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400", // cache 24h
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    // Fallback: ritorna errore e il client usa Web Speech API
    return new NextResponse("TTS unavailable", { status: 503 });
  }
}
