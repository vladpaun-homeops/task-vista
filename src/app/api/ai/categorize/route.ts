import { NextResponse } from "next/server";

type JsonLike = Record<string, unknown>;

function ensureJsonObject(payload: unknown): JsonLike {
  if (payload && typeof payload === "object") {
    return payload as JsonLike;
  }

  return { value: payload ?? null };
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  let body: JsonLike = {};

  if (contentType.includes("application/json")) {
    const parsed = await req.json();
    body = ensureJsonObject(parsed);
  } else {
    const form = await req.formData();
    body = Object.fromEntries(form.entries());
  }

  const url = process.env.ML_URL ?? "http://localhost:8000";
  const upstreamResponse = await fetch(`${url}/categorize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstreamResponse.ok) {
    return NextResponse.json({ error: "ML service error" }, { status: 502 });
  }

  const data = (await upstreamResponse.json()) as unknown;

  return NextResponse.json(data);
}
