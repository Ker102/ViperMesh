// Ingestion Script for Blender Documentation and Scripts
//
// Reads Python scripts from data/blender-scripts/, extracts metadata,
// generates embeddings, and stores them in the Neon pgvector store.
//
// Processes both root utility scripts and task-based scripts.

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { addDocuments, deleteBySource } from '../lib/ai/vectorstore';

// Load environment variables from .env
dotenv.config();

const SCRIPTS_DIR = path.join(process.cwd(), 'data', 'blender-scripts');
const SOURCE_TAG = 'blender-scripts';

/**
 * Recursively find all Python files in a directory
 */
function findPythonFiles(dir: string, fileList: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            findPythonFiles(fullPath, fileList);
        } else if (entry.isFile() && entry.name.endsWith('.py')) {
            fileList.push(fullPath);
        }
    }

    return fileList;
}

/**
 * Extract relative path category from file path
 */
function getCategory(filePath: string): string {
    const relativePath = path.relative(SCRIPTS_DIR, filePath);
    const parts = relativePath.split(path.sep);

    if (parts.length === 1) {
        return 'utility';
    }

    // Remove filename and join remaining parts
    parts.pop();
    return parts.join('/');
}

async function ingest() {
    console.log(`🚀 Starting ingestion from ${SCRIPTS_DIR}...`);

    try {
        // 1. Clear existing documents from this source to avoid duplicates
        console.log(`🧹 Clearing existing documents for source: ${SOURCE_TAG}...`);
        await deleteBySource(SOURCE_TAG);

        // 2. Find all Python files recursively
        const allFiles = findPythonFiles(SCRIPTS_DIR);
        console.log(`📂 Found ${allFiles.length} Python files`);

        const documents = [];

        for (const filePath of allFiles) {
            const filename = path.basename(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const category = getCategory(filePath);

            // Extraction of metadata from the docstring
            // Expecting format: """ { "json": "metadata" } """ at the start of the file
            const docstringMatch = content.match(/^"""([\s\S]*?)"""/);
            let metadata: Record<string, unknown> = {
                filename,
                path: path.relative(SCRIPTS_DIR, filePath),
                category
            };

            if (docstringMatch) {
                try {
                    const extractedJson = JSON.parse(docstringMatch[1].trim());
                    metadata = { ...metadata, ...extractedJson };
                } catch (e: any) {
                    console.warn(`⚠️ Could not parse metadata in ${filename}: ${e.message}`);
                }
            }

            documents.push({
                content: content,
                metadata: metadata,
                source: SOURCE_TAG
            });
            console.log(`📄 Prepared: ${metadata.path} (${metadata.title || 'Untitled'}) [${category}]`);
        }

        if (documents.length === 0) {
            console.log('🛑 No documents found to ingest.');
            return;
        }

        // 3. Add to vector store in batches (handles embedding generation via Together.ai)
        console.log(`📤 Ingesting ${documents.length} documents...`);

        const BATCH_SIZE = 10;
        const allIds: string[] = [];

        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            const batch = documents.slice(i, i + BATCH_SIZE);
            console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}...`);

            const ids = await addDocuments(batch);
            allIds.push(...ids);

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < documents.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`✅ Successfully ingested ${allIds.length} documents.`);
        console.log(`   📊 Summary:`);

        // Count by category
        const categoryCounts: Record<string, number> = {};
        for (const doc of documents) {
            const cat = (doc.metadata.category as string) || 'unknown';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }

        for (const [cat, count] of Object.entries(categoryCounts)) {
            console.log(`      - ${cat}: ${count}`);
        }

    } catch (error: any) {
        console.error('❌ Ingestion failed:');
        const errorData = {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack,
            error: error
        };
        fs.writeFileSync('debug_error.json', JSON.stringify(errorData, null, 2));
        console.log('📝 Error details written to debug_error.json');
    }
}

ingest().catch(console.error);
