"""
Simplified encoder module without torch dependencies.
This provides a simplified text encoding for test case generation.
"""

import re
import json
from typing import List, Dict, Any

class SimpleEncoder:
    """A simplified encoder for text processing without ML dependencies."""
    
    def __init__(self, max_seq_length=512):
        self.max_seq_length = max_seq_length
        
    def encode_text(self, text: str) -> Dict[str, Any]:
        """
        Encode text into a simple representation.
        
        Args:
            text: Input text to encode
            
        Returns:
            Dictionary with encoded text features
        """
        # Basic text processing
        sentences = self._split_sentences(text)
        words = self._extract_words(text)
        
        return {
            'text': text,
            'sentences': sentences,
            'words': words,
            'word_count': len(words),
            'sentence_count': len(sentences),
            'features': self._extract_features(text)
        }
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _extract_words(self, text: str) -> List[str]:
        """Extract words from text."""
        words = re.findall(r'\b\w+\b', text.lower())
        return words[:self.max_seq_length]  # Limit sequence length
    
    def _extract_features(self, text: str) -> Dict[str, Any]:
        """Extract basic text features."""
        words = self._extract_words(text)
        
        # Count different types of keywords
        requirement_keywords = ['shall', 'must', 'should', 'will', 'require', 'need']
        test_keywords = ['test', 'verify', 'validate', 'check', 'ensure', 'confirm']
        
        req_count = sum(1 for word in words if word in requirement_keywords)
        test_count = sum(1 for word in words if word in test_keywords)
        
        return {
            'requirement_indicators': req_count,
            'test_indicators': test_count,
            'avg_word_length': sum(len(w) for w in words) / len(words) if words else 0,
            'unique_words': len(set(words)),
            'has_numbers': bool(re.search(r'\d', text)),
            'has_technical_terms': bool(re.search(r'\b(API|URL|HTTP|JSON|XML|database|server|client)\b', text.lower()))
        }

def create_encoder(vocab_size=None, embed_dim=None, num_heads=None, num_layers=None):
    """Create a simple encoder (compatibility function)."""
    return SimpleEncoder()