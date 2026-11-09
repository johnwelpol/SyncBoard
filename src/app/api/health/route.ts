import { connection } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Opt out of prerendering: this must hit the DB on every request.
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
