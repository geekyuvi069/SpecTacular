import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, red, green, orange
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """
        Setup custom paragraph styles.
        """
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=HexColor('#1f4788'),
            alignment=TA_CENTER
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            textColor=HexColor('#2563eb'),
            alignment=TA_LEFT
        ))
        
        # Test case title style
        self.styles.add(ParagraphStyle(
            name='TestCaseTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=15,
            spaceAfter=10,
            textColor=HexColor('#1f4788'),
            leftIndent=0.25*inch
        ))
        
        # Test case content style
        self.styles.add(ParagraphStyle(
            name='TestCaseContent',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leftIndent=0.5*inch
        ))
    
    def generate_test_cases_pdf(self, test_cases, filename=None):
        """
        Generate PDF document with test cases.
        """
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'test_cases_{timestamp}.pdf'
        
        filepath = os.path.join('data', 'exports', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph("SmartSpec AI - Generated Test Cases", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Metadata
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 
                              self.styles['Normal']))
        story.append(Paragraph(f"Total Test Cases: {len(test_cases)}", self.styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Test cases
        for i, tc in enumerate(test_cases, 1):
            # Test case header
            story.append(Paragraph(f"Test Case {i}: {tc.get('title', 'Untitled')}", 
                                 self.styles['TestCaseTitle']))
            
            # Test case details table
            data = []
            
            # Basic info
            data.append(['ID:', tc.get('id', 'N/A')])
            data.append(['Type:', tc.get('type', 'Functional')])
            data.append(['Priority:', tc.get('priority', 'Medium')])
            data.append(['Status:', tc.get('status', 'Generated')])
            
            if tc.get('requirement_id'):
                data.append(['Requirement ID:', tc.get('requirement_id')])
            
            # Description
            if tc.get('description'):
                data.append(['Description:', tc.get('description')])
            
            # Create table
            table = Table(data, colWidths=[1.5*inch, 4*inch])
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BACKGROUND', (0, 0), (0, -1), HexColor('#f8f9fa'))
            ]))
            
            story.append(table)
            story.append(Spacer(1, 10))
            
            # Test steps
            if tc.get('steps'):
                story.append(Paragraph("<b>Test Steps:</b>", self.styles['TestCaseContent']))
                steps_text = tc.get('steps', '').replace('\n', '<br/>')
                story.append(Paragraph(steps_text, self.styles['TestCaseContent']))
                story.append(Spacer(1, 10))
            
            # Expected result
            if tc.get('expected'):
                story.append(Paragraph("<b>Expected Result:</b>", self.styles['TestCaseContent']))
                story.append(Paragraph(tc.get('expected', ''), self.styles['TestCaseContent']))
            
            # Add some space between test cases
            story.append(Spacer(1, 20))
            
            # Page break every 3 test cases
            if i % 3 == 0 and i < len(test_cases):
                story.append(PageBreak())
        
        doc.build(story)
        return filepath
    
    def generate_validation_pdf(self, validation_results, filename=None):
        """
        Generate PDF with validation results.
        """
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'validation_report_{timestamp}.pdf'
        
        filepath = os.path.join('data', 'exports', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph("SmartSpec AI - Test Case Validation Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Summary statistics
        total_tests = len(validation_results)
        valid_tests = sum(1 for result in validation_results if result['is_valid'])
        avg_score = sum(result['score'] for result in validation_results) / total_tests if total_tests > 0 else 0
        
        story.append(Paragraph("Validation Summary", self.styles['CustomSubtitle']))
        
        summary_data = [
            ['Total Test Cases:', str(total_tests)],
            ['Valid Test Cases:', str(valid_tests)],
            ['Invalid Test Cases:', str(total_tests - valid_tests)],
            ['Average Quality Score:', f"{avg_score:.1f}%"],
            ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, black),
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#e3f2fd'))
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 30))
        
        # Detailed validation results
        story.append(Paragraph("Detailed Validation Results", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 15))
        
        for result in validation_results:
            # Test case header
            tc_id = result['test_case_id']
            is_valid = result['is_valid']
            score = result['score']
            
            status_color = green if is_valid else red
            status_text = "VALID" if is_valid else "INVALID"
            
            story.append(Paragraph(f"<b>{tc_id}</b> - Status: <font color='{status_color.hexval()}'>{status_text}</font> (Score: {score}%)", 
                                 self.styles['TestCaseTitle']))
            
            # Errors
            if result['errors']:
                story.append(Paragraph("<b>Errors:</b>", self.styles['TestCaseContent']))
                for error in result['errors']:
                    story.append(Paragraph(f"• {error}", self.styles['TestCaseContent']))
                story.append(Spacer(1, 5))
            
            # Warnings
            if result['warnings']:
                story.append(Paragraph("<b>Warnings:</b>", self.styles['TestCaseContent']))
                for warning in result['warnings']:
                    story.append(Paragraph(f"• {warning}", self.styles['TestCaseContent']))
                story.append(Spacer(1, 5))
            
            story.append(Spacer(1, 15))
        
        doc.build(story)
        return filepath
    
    def generate_traceability_pdf(self, matrix_data, filename=None):
        """
        Generate PDF with traceability matrix.
        """
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'traceability_matrix_{timestamp}.pdf'
        
        filepath = os.path.join('data', 'exports', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        # Title
        story.append(Paragraph("SmartSpec AI - Requirements Traceability Matrix", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # Coverage statistics
        from src.traceability_matrix import TraceabilityMatrix
        tm = TraceabilityMatrix()
        coverage_stats = tm.calculate_coverage_stats(matrix_data)
        
        story.append(Paragraph("Coverage Overview", self.styles['CustomSubtitle']))
        
        overall = coverage_stats['overall_coverage']
        coverage_data = [
            ['Metric', 'Value'],
            ['Total Requirements', str(overall['total_requirements'])],
            ['Covered Requirements', str(overall['covered_requirements'])],
            ['Uncovered Requirements', str(overall['uncovered_requirements'])],
            ['Coverage Percentage', f"{overall['coverage_percentage']}%"]
        ]
        
        coverage_table = Table(coverage_data, colWidths=[2.5*inch, 1.5*inch])
        coverage_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#366092')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, black)
        ]))
        
        story.append(coverage_table)
        story.append(Spacer(1, 30))
        
        # Requirements coverage details
        story.append(Paragraph("Requirements Coverage Details", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 10))
        
        req_data = [['Requirement ID', 'Type', 'Priority', 'Covered', 'Test Cases']]
        
        for req in matrix_data['requirements']:
            status = "Yes" if req['covered'] else "No"
            req_data.append([
                req['id'],
                req['type'],
                req['priority'],
                status,
                str(req['test_case_count'])
            ])
        
        req_table = Table(req_data, colWidths=[1.2*inch, 1*inch, 0.8*inch, 0.8*inch, 0.8*inch])
        req_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#366092')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        
        # Color-code coverage status
        for row_idx in range(1, len(req_data)):
            status = req_data[row_idx][3]
            if status == "Yes":
                req_table.setStyle([('BACKGROUND', (3, row_idx), (3, row_idx), HexColor('#90EE90'))])
            else:
                req_table.setStyle([('BACKGROUND', (3, row_idx), (3, row_idx), HexColor('#FFB6C1'))])
        
        story.append(req_table)
        story.append(PageBreak())
        
        # Uncovered requirements
        if coverage_stats['uncovered_requirements']:
            story.append(Paragraph("Uncovered Requirements", self.styles['CustomSubtitle']))
            story.append(Spacer(1, 10))
            
            for uncovered in coverage_stats['uncovered_requirements']:
                story.append(Paragraph(f"<b>{uncovered['id']}:</b> {uncovered['content']}", 
                                     self.styles['TestCaseContent']))
                story.append(Spacer(1, 8))
        
        doc.build(story)
        return filepath
