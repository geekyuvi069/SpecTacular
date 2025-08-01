import re
from PyPDF2 import PdfReader

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF file.
    """
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

    return text

def clean_text(text):
    """
    Cleans text by normalizing spaces and removing extra newlines.
    """
    # Replace multiple spaces/newlines with single space
    text = re.sub(r"\s+", " ", text)
    # Remove special characters but keep punctuation
    text = re.sub(r"[^\w\s\.\,\;\:\!\?\-\(\)]", " ", text)
    return text.strip()

def split_into_chunks(text, chunk_size=300):
    """Split text into optimized chunks for faster processing."""
    # Pre-clean text to remove unnecessary whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Split by paragraphs first for better context
    paragraphs = text.split('\n\n')
    chunks = []

    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph or len(paragraph) < 30:
            continue

        if len(paragraph) <= chunk_size:
            chunks.append(paragraph)
        else:
            # Split long paragraphs by sentences
            sentences = re.split(r'[.!?]+', paragraph)
            current_chunk = ""

            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                if len(current_chunk + sentence) > chunk_size:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                        current_chunk = sentence
                    else:
                        # Split very long sentences
                        words = sentence.split()
                        for i in range(0, len(words), chunk_size//10):
                            chunk_words = words[i:i+chunk_size//10]
                            chunks.append(' '.join(chunk_words))
                else:
                    current_chunk += " " + sentence if current_chunk else sentence

            if current_chunk:
                chunks.append(current_chunk.strip())

    return [chunk for chunk in chunks if len(chunk.strip()) > 20]

def extract_requirements_sections(text):
    """
    Extract different sections of requirements from SRS document.
    """
    sections = {
        'functional': [],
        'non_functional': [],
        'user_stories': [],
        'acceptance_criteria': []
    }

    # Simple pattern matching for different requirement types
    functional_patterns = [
        r'(?i)functional\s+requirement[s]?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)',
        r'(?i)FR[_-]?\d+[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)',
        r'(?i)the\s+system\s+shall[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)'
    ]

    non_functional_patterns = [
        r'(?i)non[_-]?functional\s+requirement[s]?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)',
        r'(?i)NFR[_-]?\d+[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)',
        r'(?i)performance\s+requirement[s]?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)'
    ]

    # Extract functional requirements
    for pattern in functional_patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
        sections['functional'].extend([match.strip() for match in matches if match.strip()])

    # Extract non-functional requirements
    for pattern in non_functional_patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
        sections['non_functional'].extend([match.strip() for match in matches if match.strip()])

    return sections