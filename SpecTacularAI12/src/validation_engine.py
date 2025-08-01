import re
from datetime import datetime

class ValidationEngine:
    def __init__(self):
        self.validation_rules = {
            'has_title': self._check_title,
            'has_description': self._check_description,
            'has_steps': self._check_steps,
            'has_expected_result': self._check_expected_result,
            'has_test_data': self._check_test_data,
            'has_priority': self._check_priority,
            'has_requirement_mapping': self._check_requirement_mapping,
            'step_clarity': self._check_step_clarity,
            'result_measurable': self._check_measurable_result
        }
    
    def validate_test_cases(self, test_cases, requirements=None):
        """
        Validate all test cases against defined rules.
        """
        validation_results = []
        
        for test_case in test_cases:
            result = self._validate_single_test_case(test_case, requirements)
            validation_results.append(result)
        
        return validation_results
    
    def _validate_single_test_case(self, test_case, requirements=None):
        """
        Validate a single test case.
        """
        validation_result = {
            'test_case_id': test_case.get('id', 'Unknown'),
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'score': 0,
            'details': {}
        }
        
        total_rules = len(self.validation_rules)
        passed_rules = 0
        
        for rule_name, rule_func in self.validation_rules.items():
            try:
                rule_result = rule_func(test_case, requirements)
                validation_result['details'][rule_name] = rule_result
                
                if rule_result['passed']:
                    passed_rules += 1
                else:
                    validation_result['errors'].extend(rule_result.get('errors', []))
                    validation_result['warnings'].extend(rule_result.get('warnings', []))
                    
                    # Critical rules that make test case invalid
                    if rule_name in ['has_title', 'has_steps', 'has_expected_result']:
                        validation_result['is_valid'] = False
                        
            except Exception as e:
                validation_result['errors'].append(f"Validation rule '{rule_name}' failed: {str(e)}")
                validation_result['is_valid'] = False
        
        # Calculate quality score (0-100)
        validation_result['score'] = int((passed_rules / total_rules) * 100)
        
        return validation_result
    
    def _check_title(self, test_case, requirements=None):
        """Check if test case has a meaningful title."""
        title = test_case.get('title', '').strip()
        
        if not title:
            return {
                'passed': False,
                'errors': ['Test case must have a title'],
                'warnings': []
            }
        
        if len(title) < 10:
            return {
                'passed': False,
                'errors': ['Title too short - should be descriptive'],
                'warnings': []
            }
        
        if title.lower() in ['test case', 'test', 'untitled']:
            return {
                'passed': False,
                'errors': ['Title is too generic - should describe what is being tested'],
                'warnings': []
            }
        
        return {'passed': True, 'errors': [], 'warnings': []}
    
    def _check_description(self, test_case, requirements=None):
        """Check if test case has a clear description."""
        description = test_case.get('description', '').strip()
        
        if not description:
            return {
                'passed': False,
                'errors': ['Test case should have a description'],
                'warnings': []
            }
        
        if len(description) < 20:
            return {
                'passed': False,
                'warnings': ['Description might be too brief'],
                'errors': []
            }
        
        return {'passed': True, 'errors': [], 'warnings': []}
    
    def _check_steps(self, test_case, requirements=None):
        """Check if test case has clear, actionable steps."""
        steps = test_case.get('steps', '').strip()
        
        if not steps:
            return {
                'passed': False,
                'errors': ['Test case must have execution steps'],
                'warnings': []
            }
        
        # Check if steps are numbered or structured
        step_patterns = [r'^\d+\.', r'^Step \d+', r'^\w+\)', r'^\-', r'^\*']
        has_structure = any(re.search(pattern, line.strip(), re.MULTILINE) 
                           for pattern in step_patterns 
                           for line in steps.split('\n') if line.strip())
        
        warnings = []
        if not has_structure:
            warnings.append('Steps should be numbered or structured for clarity')
        
        # Check for action verbs
        action_verbs = ['click', 'enter', 'select', 'verify', 'check', 'navigate', 'input', 'submit']
        has_action_verbs = any(verb in steps.lower() for verb in action_verbs)
        
        if not has_action_verbs:
            warnings.append('Steps should contain clear action verbs (click, enter, verify, etc.)')
        
        return {'passed': True, 'errors': [], 'warnings': warnings}
    
    def _check_expected_result(self, test_case, requirements=None):
        """Check if test case has clear expected results."""
        expected = test_case.get('expected', '').strip()
        
        if not expected:
            return {
                'passed': False,
                'errors': ['Test case must have expected results'],
                'warnings': []
            }
        
        if len(expected) < 10:
            return {
                'passed': False,
                'warnings': ['Expected result should be more detailed'],
                'errors': []
            }
        
        # Check for vague language
        vague_terms = ['should work', 'works correctly', 'functions properly', 'behaves as expected']
        if any(term in expected.lower() for term in vague_terms):
            return {
                'passed': False,
                'warnings': ['Expected result is too vague - be more specific'],
                'errors': []
            }
        
        return {'passed': True, 'errors': [], 'warnings': []}
    
    def _check_test_data(self, test_case, requirements=None):
        """Check if test case specifies required test data."""
        steps = test_case.get('steps', '').lower()
        description = test_case.get('description', '').lower()
        
        # Look for data-related keywords
        data_keywords = ['username', 'password', 'email', 'data', 'input', 'value', 'credentials']
        needs_test_data = any(keyword in steps + description for keyword in data_keywords)
        
        has_test_data = test_case.get('test_data') or 'test data' in (steps + description)
        
        warnings = []
        if needs_test_data and not has_test_data:
            warnings.append('Consider specifying test data requirements')
        
        return {'passed': True, 'errors': [], 'warnings': warnings}
    
    def _check_priority(self, test_case, requirements=None):
        """Check if test case has priority assigned."""
        priority = test_case.get('priority', '').strip()
        
        valid_priorities = ['high', 'medium', 'low', 'critical', 'normal']
        
        if not priority:
            return {
                'passed': False,
                'warnings': ['Test case should have priority assigned'],
                'errors': []
            }
        
        if priority.lower() not in valid_priorities:
            return {
                'passed': False,
                'warnings': [f'Priority should be one of: {", ".join(valid_priorities)}'],
                'errors': []
            }
        
        return {'passed': True, 'errors': [], 'warnings': []}
    
    def _check_requirement_mapping(self, test_case, requirements=None):
        """Check if test case is mapped to requirements."""
        req_id = test_case.get('requirement_id')
        
        if not req_id:
            return {
                'passed': False,
                'warnings': ['Test case should be mapped to a requirement'],
                'errors': []
            }
        
        # If requirements are provided, check if mapping is valid
        if requirements:
            req_ids = [req.get('id') for req in requirements if req.get('id')]
            if req_id not in req_ids:
                return {
                    'passed': False,
                    'warnings': [f'Requirement ID {req_id} not found in SRS document'],
                    'errors': []
                }
        
        return {'passed': True, 'errors': [], 'warnings': []}
    
    def _check_step_clarity(self, test_case, requirements=None):
        """Check if steps are clear and unambiguous."""
        steps = test_case.get('steps', '')
        
        # Check for ambiguous language
        ambiguous_terms = ['might', 'could', 'maybe', 'possibly', 'probably', 'seems']
        has_ambiguous = any(term in steps.lower() for term in ambiguous_terms)
        
        warnings = []
        if has_ambiguous:
            warnings.append('Steps contain ambiguous language - be more definitive')
        
        # Check for passive voice (simple check)
        passive_indicators = ['is done', 'are performed', 'will be', 'should be']
        has_passive = any(indicator in steps.lower() for indicator in passive_indicators)
        
        if has_passive:
            warnings.append('Consider using active voice in test steps')
        
        return {'passed': True, 'errors': [], 'warnings': warnings}
    
    def _check_measurable_result(self, test_case, requirements=None):
        """Check if expected result is measurable/verifiable."""
        expected = test_case.get('expected', '').lower()
        
        # Look for measurable criteria
        measurable_indicators = [
            'displays', 'shows', 'appears', 'contains', 'equals', 'returns',
            'status code', 'message', 'error', 'success', 'redirects', 'loads'
        ]
        
        has_measurable = any(indicator in expected for indicator in measurable_indicators)
        
        warnings = []
        if not has_measurable:
            warnings.append('Expected result should be measurable and verifiable')
        
        return {'passed': True, 'errors': [], 'warnings': warnings}
    
    def generate_validation_summary(self, validation_results):
        """Generate a summary of validation results."""
        total_tests = len(validation_results)
        valid_tests = sum(1 for result in validation_results if result['is_valid'])
        
        total_errors = sum(len(result['errors']) for result in validation_results)
        total_warnings = sum(len(result['warnings']) for result in validation_results)
        
        avg_score = sum(result['score'] for result in validation_results) / total_tests if total_tests > 0 else 0
        
        return {
            'total_test_cases': total_tests,
            'valid_test_cases': valid_tests,
            'invalid_test_cases': total_tests - valid_tests,
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'average_quality_score': round(avg_score, 2),
            'validation_date': datetime.now().isoformat()
        }
