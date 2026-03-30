import { promises as fs } from "node:fs";
import path from "node:path";

export interface ViewerSampleModel {
    id: string;
    name: string;
    source: string;
    filePath: string;
}

const SAMPLE_ROOTS = [
    {
        source: "Neural Output",
        rootPath: path.join(process.cwd(), "tmp", "neural-output"),
    },
    {
        source: "Local Asset Test",
        rootPath: path.join(process.cwd(), "tmp", "local-assets-test", "props"),
    },
] as const;

const GLB_MAGIC = "glTF";
const MIN_SAMPLE_GLB_BYTES = 4096;

function humanizeName(fileName: string): string {
    return fileName
        .replace(/\.glb$/i, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

async function collectGlbFiles(rootPath: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(rootPath, { withFileTypes: true });
        const results = await Promise.all(
            entries.map(async (entry) => {
                const fullPath = path.join(rootPath, entry.name);

                if (entry.isDirectory()) {
                    return collectGlbFiles(fullPath);
                }

                return entry.isFile() && entry.name.toLowerCase().endsWith(".glb")
                    ? [fullPath]
                    : [];
            })
        );

        return results.flat();
    } catch {
        return [];
    }
}

async function isUsableGlb(filePath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size < MIN_SAMPLE_GLB_BYTES) {
            return false;
        }

        const handle = await fs.open(filePath, "r");
        try {
            const header = Buffer.alloc(4);
            await handle.read(header, 0, header.length, 0);
            return header.toString("utf8") === GLB_MAGIC;
        } finally {
            await handle.close();
        }
    } catch {
        return false;
    }
}

export async function listViewerSampleModels(): Promise<ViewerSampleModel[]> {
    const groups = await Promise.all(
        SAMPLE_ROOTS.map(async ({ source, rootPath }) => {
            const files = await collectGlbFiles(rootPath);
            const validFlags = await Promise.all(files.map((filePath) => isUsableGlb(filePath)));

            return files.flatMap((filePath, index) => {
                if (!validFlags[index]) {
                    return [];
                }

                const relativePath = path.relative(rootPath, filePath).replace(/\\/g, "/");
                return [{
                    id: `${source.toLowerCase().replace(/\s+/g, "-")}:${relativePath}`,
                    name: humanizeName(path.basename(filePath)),
                    source,
                    filePath,
                }];
            });
        })
    );

    return groups
        .flat()
        .sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name));
}

export async function getViewerSampleModel(id: string): Promise<ViewerSampleModel | null> {
    const samples = await listViewerSampleModels();
    return samples.find((sample) => sample.id === id) ?? null;
}
