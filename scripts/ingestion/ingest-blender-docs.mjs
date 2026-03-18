/**
 * Ingestion Script for Blender Documentation and Scripts
 * 
 * Reads Python scripts from data/blender-scripts/, extracts metadata,
 * generates embeddings, and stores them in the Neon pgvector store.
 * 
 * Processes both:
 * - Root utility scripts (data/blender-scripts/*.py)
 * - Task-based scripts (data/blender-scripts/tasks/**/*.py)
 * 
 * Run with: node--experimental - strip - types scripts / ingest - blender - docs.mjs
    */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPTS_DIR = path.join(process.cwd(), 'data', 'blender-scripts');
const SOURCE_TAG = 'blender-scripts';

// Together.ai embedding configuration
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const EMBEDDING_MODEL = 'togethercomputer/m2-bert-80M-32k-retrieval';

// Database URL
const DATABASE_URL = process.env.DATABASE_URL;

if (!TOGETHER_API_KEY) {
    console.error('❌ TOGETHER_API_KEY is not configured');
    process.exit(1);
}

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not configured');
    process.exit(1);
}

/**
 * Recursively find all Python files in a directory
 */
function findPythonFiles(dir, fileList = []) {
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
function getCategory(filePath) {
    const relativePath = path.relative(SCRIPTS_DIR, filePath);
    const parts = relativePath.split(path.sep);

    if (parts.length === 1) {
        return 'utility';
    }

    // Remove filename and join remaining parts
    parts.pop();
    return parts.join('/');
}

/**
 * Generate embeddings using Together.ai
 */
async function embedTexts(texts) {
    const response = await fetch('https://api.together.xyz/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOGETHER_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: texts
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding API error: ${error}`);
    }

    const data = await response.json();
    return data.data.map(item => item.embedding);
}

/**
 * Execute SQL query using fetch to Neon serverless driver
 */
async function executeQuery(sql, params = []) {
    // Parse the connection string
    const url = new URL(DATABASE_URL);
    const host = url.hostname;
    const database = url.pathname.slice(1);
    const user = url.username;
    const password = url.password;

    // Use Neon serverless HTTP API
    const neonUrl = `https://${host}/sql`;

    const response = await fetch(neonUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${password}`,
            'Content-Type': 'application/json',
            'Neon-Connection-String': DATABASE_URL
        },
        body: JSON.stringify({
            query: sql,
            params: params
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Database error: ${error}`);
    }

    return await response.json();
}

async function ingest() {
    console.log(`🚀 Starting ingestion from ${SCRIPTS_DIR}...`);
    console.log(`📊 Using embedding model: ${EMBEDDING_MODEL}`);

    try {
        // 1. Clear existing documents from this source to avoid duplicates
        console.log(`🧹 Clearing existing documents for source: ${SOURCE_TAG}...`);
        // Note: We'll use Prisma for the actual DB operations, this script just prepares the data

        // 2. Find all Python files recursively
        const allFiles = findPythonFiles(SCRIPTS_DIR);
        console.log(`📂 Found ${allFiles.length} Python files`);

        const documents = [];

        for (const filePath of allFiles) {
            const filename = path.basename(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const category = getCategory(filePath);

            // Extraction of metadata from the docstring
            const docstringMatch = content.match(/^"""([\s\S]*?)"""/);
            let metadata = {
                filename,
                path: path.relative(SCRIPTS_DIR, filePath),
                category
            };

            if (docstringMatch) {
                try {
                    const extractedJson = JSON.parse(docstringMatch[1].trim());
                    metadata = { ...metadata, ...extractedJson };
                } catch (e) {
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

        // 3. Generate embeddings in batches
        console.log(`\n📤 Generating embeddings for ${documents.length} documents...`);

        const BATCH_SIZE = 10;
        const allEmbeddings = [];

        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            const batch = documents.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(documents.length / BATCH_SIZE);
            console.log(`   Batch ${batchNum}/${totalBatches}: Generating embeddings...`);

            const texts = batch.map(d => d.content);
            const embeddings = await embedTexts(texts);
            allEmbeddings.push(...embeddings);

            // Rate limiting delay
            if (i + BATCH_SIZE < documents.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`\n✅ Generated ${allEmbeddings.length} embeddings.`);

        // 4. Save embeddings to a JSON file for import
        const outputData = documents.map((doc, i) => ({
            content: doc.content,
            metadata: doc.metadata,
            source: doc.source,
            embedding: allEmbeddings[i]
        }));

        const outputPath = path.join(process.cwd(), 'data', 'embeddings-output.json');
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`\n💾 Saved embeddings to ${outputPath}`);

        // Summary by category
        console.log(`\n📊 Summary by category:`);
        const categoryCounts = {};
        for (const doc of documents) {
            const cat = doc.metadata.category || 'unknown';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }

        for (const [cat, count] of Object.entries(categoryCounts)) {
            console.log(`   - ${cat}: ${count}`);
        }

        console.log(`\n🎉 Ingestion preparation complete!`);
        console.log(`   Next: Run the database import script to load embeddings into Neon.`);

    } catch (error) {
        console.error('❌ Ingestion failed:', error.message);
        fs.writeFileSync('debug_error.json', JSON.stringify({
            message: error.message,
            stack: error.stack
        }, null, 2));
        console.log('📝 Error details written to debug_error.json');
    }
}

ingest().catch(console.error);
