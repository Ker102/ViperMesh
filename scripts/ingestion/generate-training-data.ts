/**
 * Generate Training Data for Blender Code Generation Fine-Tuning
 *
 * Reads all 124 RAG scripts from data/blender-scripts/,
 * extracts function-level code blocks, and generates
 * instruction→output training pairs in JSONL format.
 *
 * Output: training/training_data.jsonl
 *
 * Usage: npx tsx scripts/generate-training-data.ts
 */

import fs from "fs";
import path from "path";

const SCRIPTS_DIR = path.join(process.cwd(), "data", "blender-scripts");
const OUTPUT_FILE = path.join(process.cwd(), "training", "training_data.jsonl");

interface TrainingPair {
    instruction: string;
    output: string;
    category: string;
    source_file: string;
    pair_type: "function" | "full_script" | "pattern" | "pitfall";
}

// ─── Recursive file walker ─────────────────────────────
function findPyFiles(dir: string, files: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) findPyFiles(full, files);
        else if (entry.name.endsWith(".py")) files.push(full);
    }
    return files;
}

// ─── Extract category from file path ───────────────────
function getCategory(filePath: string): string {
    const rel = path.relative(SCRIPTS_DIR, filePath);
    const parts = rel.split(path.sep);
    if (parts.length === 1) return "utility";
    parts.pop();
    return parts.join("/");
}

// ─── Parse module-level docstring ──────────────────────
function parseModuleDocstring(content: string): {
    title: string;
    description: string;
    rawDocstring: string;
} {
    const match = content.match(/^"""([\s\S]*?)"""/);
    if (!match) return { title: "", description: "", rawDocstring: "" };

    const raw = match[1].trim();

    // Try JSON metadata format (task scripts)
    try {
        const json = JSON.parse(raw);
        return {
            title: json.title || "",
            description: json.description || "",
            rawDocstring: raw,
        };
    } catch {
        // Plain text docstring (utility scripts)
        const lines = raw.split("\n").map((l) => l.trim());
        const title = lines[0]?.replace(/[=\-─]/g, "").trim() || "";
        const descLines = lines.filter(
            (l) =>
                l &&
                !l.startsWith("Category:") &&
                !l.startsWith("Blender:") &&
                !l.startsWith("Source:") &&
                !l.startsWith("===") &&
                !l.startsWith("---") &&
                l !== title
        );
        return {
            title,
            description: descLines.slice(0, 3).join(" "),
            rawDocstring: raw,
        };
    }
}

// ─── Extract Python functions with docstrings ──────────
interface FunctionBlock {
    name: string;
    signature: string;
    docstring: string;
    body: string;
    fullCode: string;
}

function extractFunctions(content: string): FunctionBlock[] {
    const functions: FunctionBlock[] = [];
    const lines = content.split("\n");

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const defMatch = line.match(/^def\s+(\w+)\s*\(([\s\S]*?)(?:\).*:)/);

        if (defMatch) {
            const name = defMatch[1];

            // Collect full signature (may span lines)
            let sigLines = [line];
            let j = i;
            if (!line.includes("):")) {
                while (j + 1 < lines.length && !lines[j].includes("):")) {
                    j++;
                    sigLines.push(lines[j]);
                }
            }
            const signature = sigLines.join("\n").trim();

            // Collect function body (indented lines after def)
            const bodyStart = j + 1;
            let bodyEnd = bodyStart;
            while (
                bodyEnd < lines.length &&
                (lines[bodyEnd].match(/^\s+/) || lines[bodyEnd].trim() === "")
            ) {
                bodyEnd++;
                if (
                    bodyEnd < lines.length &&
                    lines[bodyEnd].match(/^(def |class |if __name__)/)
                )
                    break;
            }

            const bodyLines = lines.slice(bodyStart, bodyEnd);
            const body = bodyLines.join("\n");

            // Extract docstring from body
            const bodyText = body.trim();
            const docMatch = bodyText.match(/^"""([\s\S]*?)"""/);
            const docstring = docMatch ? docMatch[1].trim() : "";

            const fullCode = [signature, ...bodyLines].join("\n").trimEnd();

            if (name !== "__main__" && !name.startsWith("_")) {
                functions.push({ name, signature, docstring, body, fullCode });
            }

            i = bodyEnd;
        } else {
            i++;
        }
    }

    return functions;
}

// ─── Build instruction from function context ───────────
function buildInstruction(
    fn: FunctionBlock,
    moduleTitle: string,
    category: string
): string {
    if (fn.docstring) {
        return `Write a Blender Python function to: ${fn.docstring}`;
    }

    // Derive instruction from function name
    const readable = fn.name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return `Write a Blender Python function: ${readable}. Category: ${category}`;
}

// ─── Build full-script training pair ───────────────────
function buildScriptPair(
    content: string,
    meta: { title: string; description: string },
    category: string,
    filename: string
): TrainingPair | null {
    if (!meta.title && !meta.description) return null;

    // Strip the module docstring for the output
    const codeBody = content
        .replace(/^"""[\s\S]*?"""/, "")
        .trim();

    if (codeBody.length < 50) return null;

    const instruction = meta.description
        ? `Write a complete Blender Python script: ${meta.title}. ${meta.description}`
        : `Write a complete Blender Python script: ${meta.title}`;

    return {
        instruction,
        output: codeBody,
        category,
        source_file: filename,
        pair_type: "full_script",
    };
}

// ─── Main ──────────────────────────────────────────────
function main() {
    console.log("🚀 Generating training data from RAG scripts...\n");

    const allFiles = findPyFiles(SCRIPTS_DIR);
    console.log(`📂 Found ${allFiles.length} Python files\n`);

    const pairs: TrainingPair[] = [];
    const stats = {
        files: 0,
        functions: 0,
        fullScripts: 0,
        skipped: 0,
    };

    for (const filePath of allFiles) {
        const filename = path.relative(SCRIPTS_DIR, filePath);
        const content = fs.readFileSync(filePath, "utf-8");
        const category = getCategory(filePath);
        const meta = parseModuleDocstring(content);

        stats.files++;

        // 1. Full-script training pair
        const scriptPair = buildScriptPair(content, meta, category, filename);
        if (scriptPair) {
            pairs.push(scriptPair);
            stats.fullScripts++;
        }

        // 2. Function-level training pairs
        const functions = extractFunctions(content);
        for (const fn of functions) {
            if (fn.fullCode.length < 30) {
                stats.skipped++;
                continue;
            }

            const instruction = buildInstruction(fn, meta.title, category);

            pairs.push({
                instruction,
                output: `import bpy\n\n${fn.fullCode}`,
                category,
                source_file: filename,
                pair_type: "function",
            });
            stats.functions++;
        }
    }

    // Write JSONL
    const jsonlContent = pairs
        .map((p) => JSON.stringify(p))
        .join("\n");

    fs.writeFileSync(OUTPUT_FILE, jsonlContent + "\n", "utf-8");

    // Summary
    console.log("✅ Training data generated!\n");
    console.log(`   📊 Summary:`);
    console.log(`      Files processed:   ${stats.files}`);
    console.log(`      Full-script pairs: ${stats.fullScripts}`);
    console.log(`      Function pairs:    ${stats.functions}`);
    console.log(`      Skipped (tiny):    ${stats.skipped}`);
    console.log(`      Total pairs:       ${pairs.length}`);
    console.log(`\n   📁 Output: ${OUTPUT_FILE}`);

    // Category breakdown
    const catCounts: Record<string, number> = {};
    for (const p of pairs) {
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    }
    console.log(`\n   📋 By category:`);
    for (const [cat, count] of Object.entries(catCounts).sort(
        (a, b) => b[1] - a[1]
    )) {
        console.log(`      ${cat}: ${count}`);
    }
}

main();
