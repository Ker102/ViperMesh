"""
Database Import Script
Loads embeddings from JSON file into Neon PostgreSQL pgvector.

Usage: py -3 scripts/import-embeddings-to-db.py
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values
import uuid

# Load environment variables
load_dotenv()

INPUT_FILE = Path("data/embeddings-output.json")
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL is not configured in .env")
    exit(1)


def format_vector(embedding: list) -> str:
    """Format embedding as PostgreSQL vector string."""
    return f"[{','.join(map(str, embedding))}]"


def main():
    print(f"📥 Loading embeddings from {INPUT_FILE}...")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        documents = json.load(f)
    
    print(f"📊 Loaded {len(documents)} documents with embeddings")
    
    # Connect to database
    print(f"🔌 Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()
    
    try:
        # Delete existing documents from this source
        source_tag = documents[0]["source"] if documents else "blender-scripts"
        print(f"🧹 Clearing existing documents for source: {source_tag}...")
        
        cur.execute(
            'DELETE FROM document_embeddings WHERE source = %s',
            (source_tag,)
        )
        deleted = cur.rowcount
        print(f"   Deleted {deleted} existing documents")
        conn.commit()
        
        # Insert documents in batches
        print(f"📤 Inserting {len(documents)} documents...")
        
        BATCH_SIZE = 20
        total_inserted = 0
        
        for i in range(0, len(documents), BATCH_SIZE):
            batch = documents[i:i + BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1
            total_batches = (len(documents) + BATCH_SIZE - 1) // BATCH_SIZE
            
            values = []
            for doc in batch:
                doc_id = str(uuid.uuid4())
                content = doc["content"]
                metadata = json.dumps(doc["metadata"])
                source = doc["source"]
                embedding = format_vector(doc["embedding"])
                values.append((doc_id, content, embedding, metadata, source))
            
            # Use individual INSERTs for vector type compatibility
            for val in values:
                cur.execute("""
                    INSERT INTO document_embeddings (id, content, embedding, metadata, source, "createdAt")
                    VALUES (%s, %s, %s::vector(768), %s::jsonb, %s, NOW())
                """, val)
            
            conn.commit()
            total_inserted += len(batch)
            print(f"   Batch {batch_num}/{total_batches}: Inserted {len(batch)} documents ({total_inserted}/{len(documents)})")
        
        print(f"\n✅ Successfully inserted {total_inserted} documents into database!")
        
        # Verify count
        cur.execute("SELECT COUNT(*) FROM document_embeddings WHERE source = %s", (source_tag,))
        count = cur.fetchone()[0]
        print(f"📊 Verified: {count} documents in database for source '{source_tag}'")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()
    
    print("\n🎉 Import complete!")


if __name__ == "__main__":
    main()
