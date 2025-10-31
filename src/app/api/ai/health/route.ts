import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = process.env.ML_URL ?? "http://ml:8000";
  const r = await fetch(`${url}/health`, { method: "GET", });
  if (!r.ok) {
    return NextResponse.json({ error: "ML service error" }, { status: 502 });
  }
  const data = await r.json();
  return NextResponse.json(data);
}