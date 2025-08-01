import re
from collections import Counter
import math

# Initialize global variables
chunks = []

def build_index(text_chunks):
    """Build a simple keyword-based index."""
    global chunks
    
    if not text_chunks:
        raise ValueError("No text chunks provided")
    
    chunks = text_chunks
    print(f"Built keyword index with {len(chunks)} chunks")

def search(query_text, top_k=3):
    """Search most similar chunks using keyword matching."""
    if not chunks:
        raise ValueError("Index not built yet. Please upload a document first.")
    
    try:
        # Simple keyword-based search
        query_words = set(re.findall(r'\b\w+\b', query_text.lower()))
        
        scored_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_words = set(re.findall(r'\b\w+\b', chunk.lower()))
            
            # Calculate similarity using Jaccard similarity
            intersection = query_words.intersection(chunk_words)
            union = query_words.union(chunk_words)
            
            if union:
                similarity = len(intersection) / len(union)
                scored_chunks.append((similarity, i, chunk))
        
        # Sort by similarity score (descending)
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        # Return top-k results
        results = [chunk for _, _, chunk in scored_chunks[:top_k]]
        return results if results else chunks[:top_k]  # Fallback to first chunks
        
    except Exception as e:
        raise Exception(f"Search failed: {str(e)}")

def get_similarity_scores(query_text, top_k=10):
    """Get similarity scores for chunks using keyword matching."""
    if not chunks:
        return []
    
    try:
        query_words = set(re.findall(r'\b\w+\b', query_text.lower()))
        
        results = []
        for i, chunk in enumerate(chunks):
            chunk_words = set(re.findall(r'\b\w+\b', chunk.lower()))
            
            # Calculate similarity
            intersection = query_words.intersection(chunk_words)
            union = query_words.union(chunk_words)
            
            if union:
                similarity = len(intersection) / len(union)
            else:
                similarity = 0.0
            
            results.append({
                'chunk': chunk,
                'similarity': similarity,
                'index': i
            })
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
        
    except Exception as e:
        print(f"Error getting similarity scores: {e}")
        return []

def embed_text(text):
    """Simple text representation (for compatibility)."""
    # This is just for compatibility - not actually used in keyword search
    words = re.findall(r'\b\w+\b', text.lower())
    return hash(' '.join(words)) % 1000  # Simple hash-based representation
