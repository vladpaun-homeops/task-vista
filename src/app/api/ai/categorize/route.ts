import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let body: any;

  if (ct.includes("application/json")) {
    body = await req.json();
  } else {
    // handles application/x-www-form-urlencoded and multipart/form-data
    const form = await req.formData();
    body = Object.fromEntries(form.entries());
  }

  const url = process.env.ML_URL ?? "http://ml:8000";
  const r = await fetch(`${url}/categorize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    return NextResponse.json({ error: "ML service error" }, { status: 502 });
  }

  const data = await r.json();
  return NextResponse.json(data);
}
