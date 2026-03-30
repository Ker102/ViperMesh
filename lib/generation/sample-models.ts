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

export async function listViewerSampleModels(): Promise<ViewerSampleModel[]> {
    const groups = await Promise.all(
        SAMPLE_ROOTS.map(async ({ source, rootPath }) => {
            const files = await collectGlbFiles(rootPath);
            return files.map((filePath) => {
                const relativePath = path.relative(rootPath, filePath).replace(/\\/g, "/");
                return {
                    id: `${source.toLowerCase().replace(/\s+/g, "-")}:${relativePath}`,
                    name: humanizeName(path.basename(filePath)),
                    source,
                    filePath,
                };
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
