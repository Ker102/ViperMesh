import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getViewerSampleModel, listViewerSampleModels } from "@/lib/generation/sample-models";

function toSampleUrl(id: string): string {
    return `/api/generate/3d/samples?id=${encodeURIComponent(id)}`;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
        const samples = await listViewerSampleModels();
        return NextResponse.json({
            samples: samples.map(({ filePath: _filePath, ...sample }) => ({
                ...sample,
                url: toSampleUrl(sample.id),
            })),
        });
    }

    const sample = await getViewerSampleModel(id);
    if (!sample) {
        return NextResponse.json({ error: "Sample model not found" }, { status: 404 });
    }

    let buffer: Buffer
    try {
        buffer = await readFile(sample.filePath)
    } catch {
        return NextResponse.json({ error: "Sample model not found" }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "model/gltf-binary",
            "Content-Disposition": `inline; filename="${path.basename(sample.filePath)}"`,
            "Cache-Control": "no-store",
        },
    });
}
