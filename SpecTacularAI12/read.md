# SmartSpec AI (SpecTacular.AI) - Replit Guide

## Overview

SmartSpec AI is an intelligent, web-based offline AI system for automated software test case generation from Software Requirements Specification (SRS) documents. The system uses Transformer-based models and semantic search to generate, validate, and trace test cases while maintaining complete offline functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture Pattern
The application follows a modular Flask-based architecture with clear separation of concerns:
- **Frontend**: Single-page web application using Bootstrap and vanilla JavaScript
- **Backend**: Flask REST API with modular Python components
- **AI Engine**: Transformer-based encoder-decoder architecture with FAISS semantic search
- **Processing Pipeline**: Document → Semantic Search → Test Case Generation → Validation → Export

### Key Design Decisions
1. **Offline-First**: No external API dependencies - all AI processing runs locally
2. **Modular Design**: Each major function (preprocessing, semantic search, validation, etc.) is isolated in separate modules
3. **File-Based Storage**: Uses local file system with date-based organization instead of database
4. **Transformer Architecture**: Custom encoder-decoder implementation alongside SentenceTransformers for semantic search

## Key Components

### Backend Components (`src/` directory)
- **preprocessing.py**: PDF text extraction and chunking using PyPDF2
- **semantic_search.py**: FAISS-based similarity search with SentenceTransformers embeddings
- **encoder.py/decoder.py**: Custom Transformer encoder-decoder models with positional encoding
- **validation_engine.py**: Rule-based test case validation with scoring system
- **mapping_engine.py**: Requirement-to-test-case mapping with pattern matching
- **traceability_matrix.py**: Excel-based traceability matrix generation
- **pdf_generator.py**: ReportLab-based PDF export functionality
- **vocabulary.py**: Custom vocabulary management for Transformer models
- **training.py**: Training utilities for the Transformer models
- **interactive_qa.py**: CLI interface for query-based test case generation

### Frontend Components (`web/` directory)
- **index.html**: Main SPA interface with Bootstrap UI components
- **static/css/styles.css**: Custom styling with CSS variables and enhanced UX
- **static/js/app.js**: JavaScript application logic with file upload, API calls, and UI management

### Main Application Files
- **app.py**: Flask application with all API endpoints and global state management
- **main.py**: Application entry point

## Data Flow

1. **Document Upload**: PDF files uploaded via web interface, stored in date-based folders
2. **Text Processing**: PDF text extraction → cleaning → chunking into 200-word segments
3. **Semantic Indexing**: Text chunks embedded using SentenceTransformers → FAISS index creation
4. **Query Processing**: User queries → semantic search → context retrieval
5. **Test Case Generation**: Context + query → Transformer decoder → structured test cases
6. **Validation**: Generated test cases → rule-based validation → scoring and feedback
7. **Mapping**: Requirements extraction → test case mapping → coverage analysis
8. **Export**: Multiple formats (PDF, Excel) for test cases, validation reports, and traceability matrices

## External Dependencies

### Core Libraries
- **Flask**: Web framework with CORS support
- **PyTorch**: Deep learning framework for Transformer models
- **SentenceTransformers**: Pre-trained embedding models (all-MiniLM-L6-v2)
- **FAISS**: Vector similarity search (CPU version for offline operation)
- **PyPDF2**: PDF text extraction
- **ReportLab**: PDF generation
- **OpenPyXL**: Excel file generation
- **Bootstrap 5**: Frontend UI framework
- **Font Awesome**: Icon library

### Model Dependencies
- Uses `all-MiniLM-L6-v2` from SentenceTransformers for semantic embeddings
- Custom Transformer encoder-decoder models built with PyTorch
- No cloud API dependencies - fully self-contained

## Deployment Strategy

### Local Development
- Flask development server on port 5000
- File-based storage in `data/` directory with date-based organization
- Static files served from `web/` directory
- Environment variables for configuration (SESSION_SECRET)

### Production Considerations
- Designed for offline deployment scenarios
- No database required - uses file system for persistence
- All AI models can be pre-downloaded and cached locally
- Session management with configurable secret keys
- Date-based file organization for easy maintenance

### File Structure
```
data/
├── YYYY-MM-DD/
│   ├── uploaded_srs.pdf
│   └── uploaded_testcases.json
web/
├── index.html
├── static/
│   ├── css/styles.css
│   └── js/app.js
src/
├── [AI and processing modules]
```

### Scalability Notes
- FAISS indexing scales well with document size
- Chunk-based processing allows handling large documents
- Modular architecture enables easy feature additions
- Stateless API design supports horizontal scaling if needed

The system is specifically designed for environments requiring complete offline operation, such as secure enterprise environments or locations with limited internet connectivity.
