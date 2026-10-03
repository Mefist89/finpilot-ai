import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
  remember: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_INPUT", message: "Enter a valid email address and password." }, { status: 400 });
  }

  if (parsed.data.email !== "admin@finpilot.ai" || parsed.data.password !== "demo2026") {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ code: "INVALID_CREDENTIALS", message: "Incorrect email or password. Try the demo account below." }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: "demo-user-01", name: "Ana Vlas", email: parsed.data.email, role: "Administrator", company: "Nordic Retail SRL" },
  });
}
