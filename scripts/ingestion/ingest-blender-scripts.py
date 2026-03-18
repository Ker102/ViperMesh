"""
Blender Script Ingestion Script
Generates embeddings using Together.ai and saves to JSON for later DB import.

Usage: python scripts/ingest-blender-scripts.py
"""

import os
import json
import re
import time
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

SCRIPTS_DIR = Path("data/blender-scripts")
OUTPUT_FILE = Path("data/embeddings-output.json")
SOURCE_TAG = "blender-scripts"

# Together.ai configuration
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
EMBEDDING_MODEL = "togethercomputer/m2-bert-80M-32k-retrieval"
EMBEDDING_API_URL = "https://api.together.xyz/v1/embeddings"

if not TOGETHER_API_KEY:
    print("❌ TOGETHER_API_KEY is not configured in .env")
    exit(1)


def find_python_files(directory: Path) -> list:
    """Recursively find all Python files."""
    return list(directory.rglob("*.py"))


def get_category(file_path: Path) -> str:
    """Extract category from file path."""
    rel_path = file_path.relative_to(SCRIPTS_DIR)
    parts = rel_path.parts
    
    if len(parts) == 1:
        return "utility"
    
    return "/".join(parts[:-1])


def extract_metadata(content: str, filename: str, rel_path: str, category: str) -> dict:
    """Extract JSON metadata from docstring."""
    metadata = {
        "filename": filename,
        "path": rel_path,
        "category": category
    }
    
    # Match triple-quoted docstring at start
    match = re.match(r'^"""([\s\S]*?)"""', content)
    if match:
        try:
            extracted = json.loads(match.group(1).strip())
            metadata.update(extracted)
        except json.JSONDecodeError as e:
            print(f"  ⚠️ Could not parse metadata in {filename}: {e}")
    
    return metadata


def embed_texts(texts: list) -> list:
    """Generate embeddings using Together.ai API."""
    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": EMBEDDING_MODEL,
        "input": texts
    }
    
    response = requests.post(EMBEDDING_API_URL, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Embedding API error: {response.text}")
    
    data = response.json()
    return [item["embedding"] for item in data["data"]]


def main():
    print(f"🚀 Starting ingestion from {SCRIPTS_DIR}...")
    print(f"📊 Using embedding model: {EMBEDDING_MODEL}")
    
    # Find all Python files
    all_files = find_python_files(SCRIPTS_DIR)
    print(f"📂 Found {len(all_files)} Python files")
    
    documents = []
    
    for file_path in all_files:
        filename = file_path.name
        content = file_path.read_text(encoding="utf-8")
        rel_path = str(file_path.relative_to(SCRIPTS_DIR)).replace("\\", "/")
        category = get_category(file_path)
        
        metadata = extract_metadata(content, filename, rel_path, category)
        
        documents.append({
            "content": content,
            "metadata": metadata,
            "source": SOURCE_TAG
        })
        
        title = metadata.get("title", "Untitled")
        print(f"📄 Prepared: {rel_path} ({title}) [{category}]")
    
    if not documents:
        print("🛑 No documents found to ingest.")
        return
    
    # Generate embeddings in batches
    print(f"\n📤 Generating embeddings for {len(documents)} documents...")
    
    BATCH_SIZE = 10
    all_embeddings = []
    
    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(documents) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"   Batch {batch_num}/{total_batches}: Generating embeddings...")
        
        texts = [d["content"] for d in batch]
        embeddings = embed_texts(texts)
        all_embeddings.extend(embeddings)
        
        # Rate limiting delay
        if i + BATCH_SIZE < len(documents):
            time.sleep(0.5)
    
    print(f"\n✅ Generated {len(all_embeddings)} embeddings.")
    
    # Combine documents with embeddings
    output_data = []
    for i, doc in enumerate(documents):
        output_data.append({
            "content": doc["content"],
            "metadata": doc["metadata"],
            "source": doc["source"],
            "embedding": all_embeddings[i]
        })
    
    # Save to JSON file
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n💾 Saved embeddings to {OUTPUT_FILE}")
    
    # Summary by category
    print("\n📊 Summary by category:")
    category_counts = {}
    for doc in documents:
        cat = doc["metadata"].get("category", "unknown")
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    for cat, count in sorted(category_counts.items()):
        print(f"   - {cat}: {count}")
    
    print(f"\n🎉 Ingestion complete! Total: {len(documents)} documents")
    print("   Next step: Run the database import to load into Neon pgvector")


if __name__ == "__main__":
    main()
