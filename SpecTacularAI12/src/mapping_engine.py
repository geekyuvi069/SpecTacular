import re
from datetime import datetime
from src.semantic_search import get_similarity_scores

class MappingEngine:
    def __init__(self):
        self.requirement_patterns = {
            'functional': [
                r'(?i)(?:FR|functional requirement)[_\-\s]*(\d+)',
                r'(?i)(?:req|requirement)[_\-\s]*(\d+)',
                r'(?i)the system shall[_\-\s]*(\d+)',
                r'(?i)function[_\-\s]*(\d+)'
            ],
            'non_functional': [
                r'(?i)(?:NFR|non.?functional requirement)[_\-\s]*(\d+)',
                r'(?i)(?:performance|security|usability)[_\-\s]*(\d+)',
                r'(?i)(?:quality)[_\-\s]*(\d+)'
            ],
            'user_story': [
                r'(?i)(?:US|user story)[_\-\s]*(\d+)',
                r'(?i)as a .* I want .* so that',
                r'(?i)story[_\-\s]*(\d+)'
            ]
        }
    
    def extract_requirements(self, text_chunks):
        """
        Extract requirements from text chunks with IDs and types.
        """
        requirements = []
        processed_content = set()  # Track processed content to avoid duplicates
        
        # Enhanced patterns for better requirement detection
        enhanced_patterns = {
            'functional': [
                r'(?i)(?:FR|functional requirement|requirement)[_\-\s]*(\d+\.?\d*)',
                r'(?i)(?:REQ|requirement)[_\-\s]*(\d+\.?\d*)',
                r'(?i)the system shall[_\-\s]*(\d+\.?\d*)?',
                r'(?i)the system must[_\-\s]*(\d+\.?\d*)?',
                r'(?i)function[_\-\s]*(\d+\.?\d*)'
            ],
            'non_functional': [
                r'(?i)(?:NFR|non.?functional)[_\-\s]*(\d+\.?\d*)',
                r'(?i)(?:performance|security|usability)[_\-\s]*(\d+\.?\d*)',
                r'(?i)(?:quality|reliability)[_\-\s]*(\d+\.?\d*)'
            ],
            'user_story': [
                r'(?i)(?:US|user story)[_\-\s]*(\d+\.?\d*)',
                r'(?i)as a .* I want .* so that',
                r'(?i)story[_\-\s]*(\d+\.?\d*)'
            ]
        }
        
        for chunk_idx, chunk in enumerate(text_chunks):
            # Skip very short chunks
            if len(chunk.strip()) < 50:
                continue
                
            # Extract requirement IDs and types with enhanced patterns
            extracted_reqs = self._extract_requirements_from_chunk_enhanced(
                chunk, chunk_idx, enhanced_patterns, processed_content
            )
            requirements.extend(extracted_reqs)
        
        # Sort by requirement ID for better organization
        requirements.sort(key=lambda x: x['id'])
        
        return requirements
    
    def _extract_requirements_from_chunk_enhanced(self, chunk, chunk_idx, patterns, processed_content):
        """
        Enhanced requirement extraction with better pattern matching.
        """
        requirements = []
        
        # Try enhanced requirement patterns
        for req_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                matches = re.finditer(pattern, chunk, re.MULTILINE | re.IGNORECASE)
                
                for match in matches:
                    # Extract requirement ID
                    req_id = None
                    if match.groups() and match.group(1):
                        req_id = f"{req_type.upper()}_{match.group(1)}"
                    else:
                        req_id = f"{req_type.upper()}_{chunk_idx}_{len(requirements)}"
                    
                    # Extract content with better context
                    content = self._extract_requirement_content_enhanced(chunk, match.start(), match.end())
                    
                    # Skip if already processed
                    content_hash = hash(content.strip()[:100]) if content.strip() else hash("")
                    if content_hash in processed_content:
                        continue
                    processed_content.add(content_hash)
                    
                    requirements.append({
                        'id': req_id,
                        'type': req_type,
                        'content': content.strip(),
                        'chunk_index': chunk_idx,
                        'priority': self._determine_priority(content),
                        'category': self._categorize_requirement(content),
                        'validation_status': 'pending'
                    })
        
        # If no specific patterns found, create generic requirements
        if not requirements:
            sentences = self._split_into_sentences(chunk)
            for i, sentence in enumerate(sentences):
                if len(sentence.strip()) > 60:  # Only meaningful sentences
                    content_hash = hash(sentence.strip()[:100]) if sentence.strip() else hash("")
                    if content_hash not in processed_content:
                        processed_content.add(content_hash)
                        requirements.append({
                            'id': f'REQ_{chunk_idx}_{i}',
                            'type': 'general',
                            'content': sentence.strip(),
                            'chunk_index': chunk_idx,
                            'priority': 'medium',
                            'category': 'general',
                            'validation_status': 'pending'
                        })
        
        return requirements
    
    def _extract_requirement_content_enhanced(self, text, start, end):
        """
        Extract better context around requirement matches.
        """
        # Find sentence boundaries with better logic
        sentences = re.split(r'[.!?]+', text)
        target_pos = start
        
        # Find which sentence contains the match
        current_pos = 0
        for i, sentence in enumerate(sentences):
            sentence_len = len(sentence) + 1  # +1 for delimiter
            if current_pos <= target_pos <= current_pos + sentence_len:
                # Include neighboring sentences for context
                context_sentences = []
                if i > 0:
                    context_sentences.append(sentences[i-1].strip())
                context_sentences.append(sentence.strip())
                if i < len(sentences) - 1:
                    context_sentences.append(sentences[i+1].strip())
                
                return '. '.join(context_sentences)
            current_pos += sentence_len
        
        # Fallback: return expanded context
        context_start = max(0, start - 150)
        context_end = min(len(text), end + 150)
        return text[context_start:context_end]

    def _extract_requirements_from_chunk(self, chunk, chunk_idx):
        """
        Extract individual requirements from a text chunk.
        """
        requirements = []
        
        # Try to match requirement patterns
        for req_type, patterns in self.requirement_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, chunk, re.MULTILINE | re.IGNORECASE)
                
                for match in matches:
                    req_id = None
                    if match.groups():
                        req_id = f"{req_type.upper()}_{match.group(1)}"
                    else:
                        # Generate ID if no number found
                        req_id = f"{req_type.upper()}_{chunk_idx}_{len(requirements)}"
                    
                    # Extract the full sentence or paragraph containing the requirement
                    content = self._extract_requirement_content(chunk, match.start(), match.end())
                    
                    requirements.append({
                        'id': req_id,
                        'type': req_type,
                        'content': content.strip(),
                        'chunk_index': chunk_idx,
                        'priority': self._determine_priority(content),
                        'category': self._categorize_requirement(content)
                    })
        
        # If no specific patterns found, create generic requirements from sentences
        if not requirements:
            sentences = self._split_into_sentences(chunk)
            for i, sentence in enumerate(sentences):
                if len(sentence.strip()) > 50:  # Only meaningful sentences
                    requirements.append({
                        'id': f'REQ_{chunk_idx}_{i}',
                        'type': 'general',
                        'content': sentence.strip(),
                        'chunk_index': chunk_idx,
                        'priority': 'medium',
                        'category': 'general'
                    })
        
        return requirements
    
    def _extract_requirement_content(self, text, start, end):
        """
        Extract the full context around a requirement match.
        """
        # Find sentence boundaries
        sentences = text.split('.')
        target_pos = start
        
        # Find which sentence contains the match
        current_pos = 0
        for sentence in sentences:
            if current_pos <= target_pos <= current_pos + len(sentence):
                return sentence.strip()
            current_pos += len(sentence) + 1
        
        # Fallback: return the match with some context
        context_start = max(0, start - 100)
        context_end = min(len(text), end + 100)
        return text[context_start:context_end]
    
    def _split_into_sentences(self, text):
        """
        Split text into sentences.
        """
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _determine_priority(self, content):
        """
        Determine requirement priority based on content keywords.
        """
        content_lower = content.lower()
        
        high_priority_keywords = ['critical', 'essential', 'must', 'required', 'mandatory', 'shall']
        medium_priority_keywords = ['should', 'important', 'recommended']
        low_priority_keywords = ['may', 'could', 'optional', 'nice to have']
        
        if any(keyword in content_lower for keyword in high_priority_keywords):
            return 'high'
        elif any(keyword in content_lower for keyword in medium_priority_keywords):
            return 'medium'
        elif any(keyword in content_lower for keyword in low_priority_keywords):
            return 'low'
        else:
            return 'medium'  # Default
    
    def _categorize_requirement(self, content):
        """
        Categorize requirement based on content.
        """
        content_lower = content.lower()
        
        categories = {
            'authentication': ['login', 'password', 'authentication', 'credential', 'user access'],
            'validation': ['validate', 'validation', 'verify', 'check', 'ensure'],
            'interface': ['display', 'show', 'interface', 'ui', 'user interface', 'screen'],
            'data': ['data', 'database', 'store', 'save', 'retrieve', 'record'],
            'security': ['security', 'secure', 'permission', 'authorization', 'access control'],
            'performance': ['performance', 'speed', 'response time', 'load', 'scalability'],
            'integration': ['integration', 'api', 'external', 'third party', 'interface']
        }
        
        for category, keywords in categories.items():
            if any(keyword in content_lower for keyword in keywords):
                return category
        
        return 'general'
    
    def map_test_cases_to_requirements(self, test_cases, requirements):
        """
        Map test cases to requirements using semantic similarity.
        """
        mapping_results = []
        
        # Ensure test_cases is a list of dictionaries
        if not isinstance(test_cases, list):
            test_cases = []
        
        valid_test_cases = [tc for tc in test_cases if isinstance(tc, dict)]
        
        for test_case in valid_test_cases:
            mapped_requirements = self._find_matching_requirements(test_case, requirements)
            
            mapping_result = {
                'test_case_id': test_case.get('id'),
                'test_case_title': test_case.get('title'),
                'mapped_requirements': mapped_requirements,
                'mapping_confidence': self._calculate_mapping_confidence(test_case, mapped_requirements, requirements),
                'mapping_method': 'semantic_similarity',
                'mapping_date': datetime.now().isoformat()
            }
            
            mapping_results.append(mapping_result)
        
        return mapping_results
    
    def _find_matching_requirements(self, test_case, requirements, threshold=0.3):
        """
        Find requirements that match a test case using semantic similarity.
        """
        if not requirements or not isinstance(test_case, dict):
            return []
        
        # Safely extract test case content
        test_content_parts = []
        for field in ['title', 'description', 'steps', 'query']:
            value = test_case.get(field, '')
            if isinstance(value, str):
                test_content_parts.append(value)
            elif isinstance(value, list):
                test_content_parts.append(' '.join(str(v) for v in value))
            else:
                test_content_parts.append(str(value) if value else '')
        
        test_content = " ".join(test_content_parts).strip()
        
        if not test_content:
            return []
        
        matched_requirements = []
        
        # Use semantic search if available
        try:
            # Get similarity scores for requirement contents
            req_contents = [req['content'] for req in requirements]
            similarity_results = get_similarity_scores(test_content, top_k=len(req_contents))
            
            for i, sim_result in enumerate(similarity_results):
                if sim_result['similarity'] > threshold:
                    # Find the corresponding requirement
                    chunk_content = sim_result['chunk']
                    for req in requirements:
                        if req['content'] in chunk_content or chunk_content in req['content']:
                            matched_requirements.append({
                                'requirement_id': req['id'],
                                'similarity_score': sim_result['similarity'],
                                'content': req['content'][:200] + "..." if len(req['content']) > 200 else req['content']
                            })
                            break
        
        except Exception as e:
            print(f"Semantic matching failed, using keyword matching: {e}")
            # Fallback to keyword-based matching
            matched_requirements = self._keyword_based_matching(test_case, requirements, threshold)
        
        # Remove duplicates and sort by similarity
        unique_matches = {}
        for match in matched_requirements:
            req_id = match['requirement_id']
            if req_id not in unique_matches or match['similarity_score'] > unique_matches[req_id]['similarity_score']:
                unique_matches[req_id] = match
        
        # Sort by similarity score (descending)
        sorted_matches = sorted(unique_matches.values(), key=lambda x: x['similarity_score'], reverse=True)
        
        # Return top 3 matches
        return sorted_matches[:3]
    
    def _keyword_based_matching(self, test_case, requirements, threshold=0.3):
        """
        Fallback keyword-based matching for requirements.
        """
        test_content = " ".join([
            test_case.get('title', ''),
            test_case.get('description', ''),
            test_case.get('steps', ''),
            test_case.get('query', '')
        ]).lower()
        
        test_keywords = set(re.findall(r'\b\w+\b', test_content))
        matched_requirements = []
        
        for req in requirements:
            req_keywords = set(re.findall(r'\b\w+\b', req['content'].lower()))
            
            # Calculate Jaccard similarity
            intersection = test_keywords.intersection(req_keywords)
            union = test_keywords.union(req_keywords)
            
            if union:
                similarity = len(intersection) / len(union)
                
                if similarity > threshold:
                    matched_requirements.append({
                        'requirement_id': req['id'],
                        'similarity_score': similarity,
                        'content': req['content'][:200] + "..." if len(req['content']) > 200 else req['content']
                    })
        
        return matched_requirements
    
    def _calculate_mapping_confidence(self, test_case, mapped_requirements, all_requirements):
        """
        Calculate confidence score for the mapping.
        """
        if not mapped_requirements:
            return 0.0
        
        # Base confidence on highest similarity score
        max_similarity = max(req['similarity_score'] for req in mapped_requirements)
        
        # Boost confidence if explicit requirement ID is present
        explicit_req_id = test_case.get('requirement_id')
        if explicit_req_id and any(req['requirement_id'] == explicit_req_id for req in mapped_requirements):
            max_similarity = min(1.0, max_similarity + 0.2)
        
        # Reduce confidence if too many matches (indicates generic content)
        if len(mapped_requirements) > 2:
            max_similarity *= 0.8
        
        return round(max_similarity, 3)
    
    def generate_coverage_report(self, requirements, test_cases, mapping_results):
        """
        Generate requirement coverage report.
        """
        covered_requirements = set()
        for mapping in mapping_results:
            mapped_reqs = mapping.get('mapped_requirements', [])
            if isinstance(mapped_reqs, list):
                for req in mapped_reqs:
                    if isinstance(req, dict) and 'requirement_id' in req:
                        covered_requirements.add(req['requirement_id'])
        
        total_requirements = len(requirements)
        covered_count = len(covered_requirements)
        uncovered_requirements = [req for req in requirements if req['id'] not in covered_requirements]
        
        coverage_by_category = {}
        for req in requirements:
            category = req.get('category', 'general')
            if category not in coverage_by_category:
                coverage_by_category[category] = {'total': 0, 'covered': 0}
            
            coverage_by_category[category]['total'] += 1
            if req['id'] in covered_requirements:
                coverage_by_category[category]['covered'] += 1
        
        return {
            'total_requirements': total_requirements,
            'covered_requirements': covered_count,
            'uncovered_requirements': len(uncovered_requirements),
            'coverage_percentage': round((covered_count / total_requirements * 100) if total_requirements > 0 else 0, 2),
            'uncovered_list': [{'id': req['id'], 'content': req['content'][:100] + "..."} for req in uncovered_requirements[:10]],
            'coverage_by_category': {
                cat: {
                    'total': data['total'],
                    'covered': data['covered'],
                    'percentage': round((data['covered'] / data['total'] * 100) if data['total'] > 0 else 0, 2)
                }
                for cat, data in coverage_by_category.items()
            },
            'report_date': datetime.now().isoformat()
        }
