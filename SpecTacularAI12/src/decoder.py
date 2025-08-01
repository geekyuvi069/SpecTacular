"""
Simplified decoder module for test case generation without torch dependencies.
This provides rule-based test case generation from requirements.
"""

import re
import json
from typing import List, Dict, Any, Optional

class SimpleDecoder:
    """A simplified decoder for test case generation without ML dependencies."""
    
    def __init__(self):
        self.test_case_templates = [
            "Verify that {requirement} functions correctly",
            "Test that {requirement} meets the specified criteria",
            "Validate that {requirement} works as expected",
            "Ensure that {requirement} performs within acceptable limits",
            "Confirm that {requirement} handles edge cases properly"
        ]
        
        self.test_types = [
            "Functional Test",
            "Integration Test", 
            "Unit Test",
            "Performance Test",
            "Security Test",
            "Usability Test"
        ]
    
    def generate_test_cases(self, context: str, query: str = "", num_cases: int = 5) -> List[Dict[str, Any]]:
        """
        Generate test cases based on context and query.
        
        Args:
            context: Context text from requirements
            query: Optional query for specific test generation
            num_cases: Number of test cases to generate
            
        Returns:
            List of generated test cases
        """
        test_cases = []
        requirements = self._extract_requirements(context)
        
        if not requirements:
            # Fallback: generate generic test cases
            requirements = [context[:100] + "..." if len(context) > 100 else context]
        
        for i, req in enumerate(requirements[:num_cases]):
            test_case = self._generate_single_test_case(req, i + 1, query)
            test_cases.append(test_case)
            
        return test_cases
    
    def _extract_requirements(self, text: str) -> List[str]:
        """Extract individual requirements from text."""
        # Split by common requirement indicators
        patterns = [
            r'(\d+\.\d+[^\d]*?)(?=\d+\.\d+|$)',  # Numbered requirements
            r'(The system shall[^.]*\.)',        # "Shall" statements
            r'(The system must[^.]*\.)',         # "Must" statements
            r'([A-Z][^.]{50,200}\.)',           # General sentences
        ]
        
        requirements = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            requirements.extend([match.strip() for match in matches if len(match.strip()) > 20])
            
        # Remove duplicates while preserving order
        seen = set()
        unique_requirements = []
        for req in requirements:
            if req not in seen:
                seen.add(req)
                unique_requirements.append(req)
                
        return unique_requirements[:10]  # Limit to 10 requirements
    
    def _generate_single_test_case(self, requirement: str, case_id: int, query: str = "") -> Dict[str, Any]:
        """Generate a single test case from requirement."""
        
        # Clean requirement text
        clean_req = re.sub(r'^\d+\.\d+\s*', '', requirement)
        clean_req = clean_req.strip()
        
        # Determine test type based on content
        test_type = self._determine_test_type(clean_req, query)
        
        # Generate test description
        template_idx = (case_id - 1) % len(self.test_case_templates)
        description = self.test_case_templates[template_idx].format(requirement=clean_req)
        
        # Generate test steps
        steps = self._generate_test_steps(clean_req, test_type)
        
        # Generate expected result
        expected_result = self._generate_expected_result(clean_req, test_type)
        
        return {
            'id': f"TC_{case_id:03d}",
            'title': f"Test Case {case_id}: {test_type}",
            'description': description,
            'type': test_type,
            'priority': self._determine_priority(clean_req),
            'preconditions': self._generate_preconditions(clean_req),
            'test_steps': steps,
            'expected_result': expected_result,
            'requirement_id': f"REQ_{case_id:03d}",
            'requirement_text': clean_req
        }
    
    def _determine_test_type(self, requirement: str, query: str = "") -> str:
        """Determine appropriate test type based on requirement content."""
        req_lower = requirement.lower()
        query_lower = query.lower()
        
        # Check query first for specific test type requests
        for test_type in self.test_types:
            if test_type.lower() in query_lower:
                return test_type
        
        # Determine based on requirement content
        if any(word in req_lower for word in ['login', 'authentication', 'password', 'security']):
            return "Security Test"
        elif any(word in req_lower for word in ['performance', 'speed', 'time', 'response']):
            return "Performance Test"
        elif any(word in req_lower for word in ['user', 'interface', 'display', 'screen']):
            return "Usability Test"
        elif any(word in req_lower for word in ['integration', 'connect', 'interface', 'api']):
            return "Integration Test"
        elif any(word in req_lower for word in ['function', 'calculate', 'process', 'algorithm']):
            return "Unit Test"
        else:
            return "Functional Test"
    
    def _determine_priority(self, requirement: str) -> str:
        """Determine test priority based on requirement content."""
        req_lower = requirement.lower()
        
        if any(word in req_lower for word in ['critical', 'essential', 'must', 'required']):
            return "High"
        elif any(word in req_lower for word in ['should', 'important', 'recommended']):
            return "Medium"
        else:
            return "Low"
    
    def _generate_preconditions(self, requirement: str) -> List[str]:
        """Generate preconditions for the test case."""
        preconditions = ["System is properly installed and configured"]
        
        req_lower = requirement.lower()
        if 'user' in req_lower:
            preconditions.append("User account exists and is active")
        if 'database' in req_lower:
            preconditions.append("Database is accessible and contains test data")
        if 'network' in req_lower or 'api' in req_lower:
            preconditions.append("Network connectivity is available")
            
        return preconditions
    
    def _generate_test_steps(self, requirement: str, test_type: str) -> List[str]:
        """Generate test steps based on requirement and test type."""
        steps = []
        req_lower = requirement.lower()
        
        # Common starting steps
        steps.append("1. Launch the application")
        steps.append("2. Navigate to the relevant feature/module")
        
        # Add specific steps based on test type
        if test_type == "Security Test":
            steps.extend([
                "3. Attempt to access the feature without proper authentication",
                "4. Verify security measures are in place",
                "5. Test with valid credentials"
            ])
        elif test_type == "Performance Test":
            steps.extend([
                "3. Initiate the process/function",
                "4. Measure response time and resource usage",
                "5. Repeat test under different load conditions"
            ])
        elif test_type == "Usability Test":
            steps.extend([
                "3. Perform typical user actions",
                "4. Evaluate ease of use and user experience",
                "5. Check for clear error messages and feedback"
            ])
        else:
            steps.extend([
                "3. Execute the required functionality",
                "4. Verify the system behavior",
                "5. Check the output/result"
            ])
            
        steps.append("6. Document any issues or observations")
        return steps
    
    def _generate_expected_result(self, requirement: str, test_type: str) -> str:
        """Generate expected result for the test case."""
        if test_type == "Security Test":
            return "System properly authenticates users and protects against unauthorized access"
        elif test_type == "Performance Test":
            return "System meets performance requirements within acceptable time limits"
        elif test_type == "Usability Test":
            return "Interface is user-friendly and provides clear feedback to users"
        else:
            return f"System successfully implements the requirement: {requirement[:100]}{'...' if len(requirement) > 100 else ''}"

def create_decoder(vocab_size=None, embed_dim=None, num_heads=None, num_layers=None):
    """Create a simple decoder (compatibility function)."""
    return SimpleDecoder()