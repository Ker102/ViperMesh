import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

// ── GET — Load studio session steps ──────────────────────────────

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id, isDeleted: false },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const studioSession = await prisma.studioSession.findUnique({
    where: { projectId },
    select: { steps: true, updatedAt: true },
  })

  return NextResponse.json({
    steps: studioSession?.steps ?? [],
    updatedAt: studioSession?.updatedAt ?? null,
  })
}

// ── PUT — Upsert studio session steps ────────────────────────────

const upsertSchema = z.object({
  projectId: z.string().uuid(),
  steps: z.array(z.record(z.unknown())),
})

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 })
  }
  const { projectId, steps } = parsed.data

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id, isDeleted: false },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const serializedSteps = steps as Prisma.InputJsonValue

  const studioSession = await prisma.studioSession.upsert({
    where: { projectId },
    create: { projectId, steps: serializedSteps },
    update: { steps: serializedSteps },
    select: { id: true, updatedAt: true },
  })

  return NextResponse.json({ ok: true, id: studioSession.id, updatedAt: studioSession.updatedAt })
}

// ── DELETE — Clear studio session ────────────────────────────────

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id, isDeleted: false },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  await prisma.studioSession.deleteMany({
    where: { projectId },
  })

  return NextResponse.json({ ok: true })
}
