// SmartSpec AI - Frontend Application Logic
class SmartSpecApp {
    constructor() {
        this.testCases = [];
        this.validationResults = [];
        this.mappingResults = [];
        this.traceabilityMatrix = null;
        this.loadingModal = null;
        this.init();
    }

    init() {
        this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        this.setupEventListeners();
        this.updateUIState();
    }

    setupEventListeners() {
        // File upload handlers
        this.setupFileUpload('srs', 'srs-upload-btn', 'srs-file-input', 'srs-upload-status', '/upload');
        this.setupFileUpload('tc', 'tc-upload-btn', 'tc-file-input', 'tc-upload-status', '/upload_testcases');

        // Query and generation
        document.getElementById('query-btn').addEventListener('click', () => this.generateTestCases());
        document.getElementById('query-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateTestCases();
        });

        // Validation and mapping
        document.getElementById('validate-btn').addEventListener('click', () => this.validateTestCases());
        document.getElementById('map-btn').addEventListener('click', () => this.mapTestCases());
        document.getElementById('traceability-btn').addEventListener('click', () => this.generateTraceabilityMatrix());

        // Export handlers
        document.getElementById('export-testcases-pdf').addEventListener('click', () => this.exportReport('test_cases'));
        document.getElementById('export-validation-pdf').addEventListener('click', () => this.exportReport('validation'));
        document.getElementById('export-traceability-pdf').addEventListener('click', () => this.exportReport('traceability'));
        document.getElementById('export-traceability-excel').addEventListener('click', () => this.exportExcel());

        // Clear data
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAllData());
    }

    setupFileUpload(type, btnId, inputId, statusId, endpoint) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        const uploadArea = document.getElementById(`${type}-upload-area`);

        btn.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0], endpoint, status, type);
            }
        });

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                this.uploadFile(files[0], endpoint, status, type);
            }
        });
    }

    async uploadFile(file, endpoint, statusElement, type) {
        const formData = new FormData();
        formData.append('file', file);

        this.updateStatus(statusElement, 'Uploading...', 'info');
        this.showLoading('Uploading and processing document...');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (type === 'srs') {
                    this.updateStatus(statusElement, 
                        `✅ Upload successful! ${data.chunks} chunks processed, ${data.requirements || 0} requirements extracted.`, 
                        'success');
                    this.updateProcessSteps();
                    this.enableActions();
                } else {
                    this.updateStatus(statusElement, 
                        `✅ Test cases uploaded! ${data.total_test_cases} total test cases.`, 
                        'success');
                }
            } else {
                this.updateStatus(statusElement, `❌ Error: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.updateStatus(statusElement, `❌ Upload failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async generateTestCases() {
        const query = document.getElementById('query-input').value.trim();
        const queryStatus = document.getElementById('query-status');

        if (!query) {
            this.updateStatus(queryStatus, 'Please enter a query.', 'warning');
            return;
        }

        this.showLoading('Generating test cases...');
        this.updateStatus(queryStatus, 'Generating test cases...', 'info');

        try {
            const response = await fetch('/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            if (response.ok) {
                this.testCases = this.testCases.concat(data.testCases);
                this.displayTestCases();
                this.updateStatus(queryStatus, `✅ Generated ${data.testCases.length} test cases.`, 'success');
                document.getElementById('results-section').style.display = 'block';
                document.getElementById('actions-panel').style.display = 'block';
                this.enableValidationButtons();
            } else {
                this.updateStatus(queryStatus, `❌ Error: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.updateStatus(queryStatus, `❌ Generation failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async validateTestCases() {
        if (this.testCases.length === 0) {
            this.showAlert('No test cases to validate.', 'warning');
            return;
        }

        this.showLoading('Validating test cases...');

        try {
            const response = await fetch('/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                this.validationResults = data.validation_results;
                this.displayValidationResults(data);
                document.getElementById('validation-section').style.display = 'block';
                this.updateTestCaseValidationStatus();
            } else {
                this.showAlert(`Validation failed: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showAlert(`Validation failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async mapTestCases() {
        if (this.testCases.length === 0) {
            this.showAlert('No test cases to map.', 'warning');
            return;
        }

        this.showLoading('Mapping test cases to requirements...');

        try {
            const response = await fetch('/map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                this.mappingResults = data.mapping_results;
                this.displayMappingResults(data);
                document.getElementById('mapping-section').style.display = 'block';
            } else {
                this.showAlert(`Mapping failed: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showAlert(`Mapping failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async generateTraceabilityMatrix() {
        this.showLoading('Generating traceability matrix...');

        try {
            const response = await fetch('/traceability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                this.traceabilityMatrix = data.matrix;
                this.displayTraceabilityMatrix(data);
                document.getElementById('traceability-section').style.display = 'block';
            } else {
                this.showAlert(`Traceability matrix generation failed: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showAlert(`Traceability matrix generation failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    displayTestCases(filter = 'all') {
        const container = document.getElementById('test-cases-container');
        const countBadge = document.getElementById('test-cases-count');
        
        // Add filter controls if not exists
        this.addFilterControls(container);
        
        // Filter test cases based on validation status
        let filteredTestCases = this.testCases;
        if (filter !== 'all') {
            filteredTestCases = this.testCases.filter(tc => {
                const validation = this.validationResults.find(v => v.test_case_id === tc.id);
                if (filter === 'passed') {
                    return validation && validation.is_valid;
                } else if (filter === 'failed') {
                    return validation && !validation.is_valid;
                } else if (filter === 'pending') {
                    return !validation;
                }
                return true;
            });
        }
        
        countBadge.textContent = filteredTestCases.length;
        
        // Clear existing test cases
        const existingCards = container.querySelectorAll('.test-case-card');
        existingCards.forEach(card => card.remove());

        filteredTestCases.forEach((tc, index) => {
            const card = this.createTestCaseCard(tc, index);
            container.appendChild(card);
        });
    }

    addFilterControls(container) {
        // Check if filter controls already exist
        if (container.querySelector('.test-case-filters')) {
            return;
        }

        const filterDiv = document.createElement('div');
        filterDiv.className = 'test-case-filters mb-3';
        filterDiv.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-6">
                    <label class="form-label">Filter by Validation Status:</label>
                    <select class="form-select" id="test-case-filter">
                        <option value="all">All Test Cases</option>
                        <option value="passed">Passed Only</option>
                        <option value="failed">Failed Only</option>
                        <option value="pending">Pending Validation</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="validation-summary-mini">
                        <span class="badge bg-success me-2" id="passed-count">0 Passed</span>
                        <span class="badge bg-danger me-2" id="failed-count">0 Failed</span>
                        <span class="badge bg-secondary" id="pending-count">0 Pending</span>
                    </div>
                </div>
            </div>
        `;
        
        container.insertBefore(filterDiv, container.firstChild);
        
        // Add event listener for filter
        document.getElementById('test-case-filter').addEventListener('change', (e) => {
            this.displayTestCases(e.target.value);
        });
        
        // Update summary counts
        this.updateValidationSummary();
    }

    updateValidationSummary() {
        const passedCount = this.validationResults.filter(v => v.is_valid).length;
        const failedCount = this.validationResults.filter(v => !v.is_valid).length;
        const pendingCount = this.testCases.length - this.validationResults.length;
        
        const passedBadge = document.getElementById('passed-count');
        const failedBadge = document.getElementById('failed-count');
        const pendingBadge = document.getElementById('pending-count');
        
        if (passedBadge) passedBadge.textContent = `${passedCount} Passed`;
        if (failedBadge) failedBadge.textContent = `${failedCount} Failed`;
        if (pendingBadge) pendingBadge.textContent = `${pendingCount} Pending`;
    }

    createTestCaseCard(testCase, index) {
        const card = document.createElement('div');
        card.className = 'test-case-card fade-in-up';
        
        const validationStatus = this.getValidationStatus(testCase.id);
        const mappingInfo = this.getMappingInfo(testCase.id);

        card.innerHTML = `
            <div class="test-case-header">
                <h6 class="test-case-title">${testCase.title}</h6>
                <div class="d-flex gap-2">
                    ${validationStatus}
                    <span class="badge bg-secondary">${testCase.type}</span>
                    <span class="badge bg-info">${testCase.priority}</span>
                </div>
            </div>
            
            <div class="test-case-meta">
                <span><strong>ID:</strong> ${testCase.id}</span>
                <span><strong>Status:</strong> ${testCase.status}</span>
                ${testCase.requirement_id ? `<span><strong>Req ID:</strong> ${testCase.requirement_id}</span>` : ''}
            </div>

            <div class="mb-2">
                <strong>Description:</strong>
                <p class="text-muted mb-2">${testCase.description}</p>
            </div>

            <div class="mb-2">
                <strong>Test Steps:</strong>
                <div class="test-case-steps">${testCase.steps}</div>
            </div>

            <div class="mb-2">
                <strong>Expected Result:</strong>
                <p class="text-muted">${testCase.expected}</p>
            </div>

            ${mappingInfo}
        `;

        return card;
    }

    getValidationStatus(testCaseId) {
        const validation = this.validationResults.find(v => v.test_case_id === testCaseId);
        
        if (!validation) {
            return '<span class="validation-status pending"><i class="fas fa-clock me-1"></i>Pending</span>';
        }

        if (validation.is_valid) {
            return `<span class="validation-status valid"><i class="fas fa-check me-1"></i>Valid (${validation.score}%)</span>`;
        } else {
            return `<span class="validation-status invalid"><i class="fas fa-times me-1"></i>Invalid (${validation.score}%)</span>`;
        }
    }

    getMappingInfo(testCaseId) {
        const mapping = this.mappingResults.find(m => m.test_case_id === testCaseId);
        
        if (!mapping || mapping.mapped_requirements.length === 0) {
            return '';
        }

        const requirements = mapping.mapped_requirements.map(req => {
            const confidence = req.similarity_score;
            let confidenceClass = 'low-confidence';
            if (confidence > 0.7) confidenceClass = 'high-confidence';
            else if (confidence > 0.4) confidenceClass = 'medium-confidence';

            return `<span class="mapping-indicator ${confidenceClass}">${req.requirement_id} (${(confidence * 100).toFixed(0)}%)</span>`;
        }).join('');

        return `
            <div class="mt-2">
                <strong>Mapped Requirements:</strong>
                <div class="mt-1">${requirements}</div>
            </div>
        `;
    }

    displayValidationResults(data) {
        const summaryDiv = document.getElementById('validation-summary');
        const detailsDiv = document.getElementById('validation-details');

        // Summary with filter options
        const summary = data.summary;
        summaryDiv.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card bg-primary">
                        <div class="stat-number">${summary.total}</div>
                        <div class="stat-label">Total Test Cases</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-success">
                        <div class="stat-number">${summary.valid}</div>
                        <div class="stat-label">Valid Test Cases</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-danger">
                        <div class="stat-number">${summary.invalid}</div>
                        <div class="stat-label">Invalid Test Cases</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-info">
                        <div class="stat-number">${((summary.valid / summary.total) * 100).toFixed(1)}%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">Filter Validation Results:</label>
                    <select class="form-select" id="validation-filter">
                        <option value="all">All Test Cases</option>
                        <option value="valid">Valid Only</option>
                        <option value="invalid">Invalid Only</option>
                        <option value="high-score">High Score (>80%)</option>
                        <option value="low-score">Low Score (<60%)</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="d-flex align-items-end h-100">
                        <button class="btn btn-outline-primary btn-sm" id="toggle-validation-details">
                            <i class="fas fa-eye"></i> Toggle Details
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Generate validation table with filter capability
        this.generateValidationTable(data.validation_results, detailsDiv, 'all');
        
        // Add event listeners
        document.getElementById('validation-filter').addEventListener('change', (e) => {
            this.generateValidationTable(data.validation_results, detailsDiv, e.target.value);
        });
        
        document.getElementById('toggle-validation-details').addEventListener('click', () => {
            detailsDiv.classList.toggle('compact-view');
        });
    }

    generateValidationTable(validationResults, container, filter = 'all') {
        // Filter validation results based on selection
        let filteredResults = validationResults;
        if (filter === 'valid') {
            filteredResults = validationResults.filter(result => result.is_valid);
        } else if (filter === 'invalid') {
            filteredResults = validationResults.filter(result => !result.is_valid);
        } else if (filter === 'high-score') {
            filteredResults = validationResults.filter(result => result.score > 80);
        } else if (filter === 'low-score') {
            filteredResults = validationResults.filter(result => result.score < 60);
        }
        
        let detailsHtml = '<div class="accordion validation-table" id="validationAccordion">';
        
        filteredResults.forEach((result, index) => {
            const statusClass = result.is_valid ? 'text-success' : 'text-danger';
            const statusIcon = result.is_valid ? 'fa-check-circle' : 'fa-times-circle';
            const scoreClass = result.score > 80 ? 'bg-success' : result.score > 60 ? 'bg-warning' : 'bg-danger';
            
            detailsHtml += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#collapse${index}">
                            <i class="fas ${statusIcon} ${statusClass} me-2"></i>
                            ${result.test_case_id} - Score: 
                            <span class="badge ${scoreClass} ms-2">${result.score}%</span>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse" data-bs-parent="#validationAccordion">
                        <div class="accordion-body">
                            <div class="details-column">
                                <small class="text-muted">
                                    Errors: ${result.errors.length} | Warnings: ${result.warnings.length}
                                </small>
                            </div>
                            
                            ${result.errors.length > 0 ? `
                                <div class="error-message mt-2">
                                    <strong>Errors:</strong>
                                    <ul class="mb-0">
                                        ${result.errors.map(error => `<li>${error}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${result.warnings.length > 0 ? `
                                <div class="warning-message mt-2">
                                    <strong>Warnings:</strong>
                                    <ul class="mb-0">
                                        ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${result.errors.length === 0 && result.warnings.length === 0 ? `
                                <div class="success-message mt-2">
                                    ✅ Test case passes all validation checks!
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        detailsHtml += `
            </div>
            <div class="mt-2 text-muted">
                Showing ${filteredResults.length} of ${validationResults.length} validation results
            </div>
        `;
        
        container.innerHTML = detailsHtml;
    }

    displayMappingResults(data) {
        const summaryDiv = document.getElementById('mapping-summary');
        const detailsDiv = document.getElementById('mapping-details');

        // Summary with filter options
        const summary = data.summary;
        summaryDiv.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card bg-primary">
                        <div class="stat-number">${summary.total_test_cases}</div>
                        <div class="stat-label">Total Test Cases</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-success">
                        <div class="stat-number">${summary.mapped_test_cases}</div>
                        <div class="stat-label">Mapped Test Cases</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-info">
                        <div class="stat-number">${summary.total_requirements}</div>
                        <div class="stat-label">Total Requirements</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-warning">
                        <div class="stat-number">${summary.covered_requirements}</div>
                        <div class="stat-label">Covered Requirements</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">Filter Test Cases:</label>
                    <select class="form-select" id="mapping-filter">
                        <option value="all">All Test Cases</option>
                        <option value="mapped">Mapped Only</option>
                        <option value="unmapped">Unmapped Only</option>
                        <option value="high-confidence">High Confidence</option>
                        <option value="low-confidence">Low Confidence</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="d-flex align-items-end h-100">
                        <button class="btn btn-outline-primary btn-sm" id="toggle-mapping-details">
                            <i class="fas fa-eye"></i> Toggle Details
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Generate mapping table with filter capability
        this.generateMappingTable(data.mapping_results, detailsDiv, 'all');
        
        // Add event listeners
        document.getElementById('mapping-filter').addEventListener('change', (e) => {
            this.generateMappingTable(data.mapping_results, detailsDiv, e.target.value);
        });
        
        document.getElementById('toggle-mapping-details').addEventListener('click', () => {
            detailsDiv.classList.toggle('compact-view');
        });
    }

    generateMappingTable(mappingResults, container, filter = 'all') {
        // Filter mapping results based on selection
        let filteredResults = mappingResults;
        if (filter === 'mapped') {
            filteredResults = mappingResults.filter(mapping => mapping.mapped_requirements.length > 0);
        } else if (filter === 'unmapped') {
            filteredResults = mappingResults.filter(mapping => mapping.mapped_requirements.length === 0);
        } else if (filter === 'high-confidence') {
            filteredResults = mappingResults.filter(mapping => mapping.mapping_confidence > 0.7);
        } else if (filter === 'low-confidence') {
            filteredResults = mappingResults.filter(mapping => mapping.mapping_confidence <= 0.4);
        }
        
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped mapping-table">
                    <thead>
                        <tr>
                            <th>Test Case ID</th>
                            <th>Test Case Title</th>
                            <th>Mapped Requirements</th>
                            <th>Confidence</th>
                            <th class="details-column">Mapping Details</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filteredResults.forEach(mapping => {
            const requirements = mapping.mapped_requirements.map(req => {
                const confidence = (req.similarity_score * 100).toFixed(0);
                return `${req.requirement_id} (${confidence}%)`;
            }).join(', ') || 'None';

            const confidenceClass = mapping.mapping_confidence > 0.7 ? 'high-confidence' : 
                                   mapping.mapping_confidence > 0.4 ? 'medium-confidence' : 'low-confidence';

            tableHtml += `
                <tr class="${mapping.mapped_requirements.length > 0 ? 'mapped' : 'unmapped'}-row">
                    <td><code>${mapping.test_case_id}</code></td>
                    <td>${mapping.test_case_title}</td>
                    <td>${requirements}</td>
                    <td>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${confidenceClass}" role="progressbar" 
                                 style="width: ${(mapping.mapping_confidence * 100).toFixed(0)}%">
                                ${(mapping.mapping_confidence * 100).toFixed(0)}%
                            </div>
                        </div>
                    </td>
                    <td class="details-column">
                        <div class="content-preview">
                            Method: ${mapping.mapping_method}<br>
                            Date: ${new Date(mapping.mapping_date).toLocaleDateString()}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
            <div class="mt-2 text-muted">
                Showing ${filteredResults.length} of ${mappingResults.length} test cases
            </div>
        `;
        
        container.innerHTML = tableHtml;
    }

    displayTraceabilityMatrix(data) {
        const summaryDiv = document.getElementById('traceability-summary');
        const matrixDiv = document.getElementById('traceability-matrix');

        // Coverage summary with filter options
        const coverage = data.coverage_stats.overall_coverage;
        summaryDiv.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card bg-primary">
                        <div class="stat-number">${coverage.total_requirements}</div>
                        <div class="stat-label">Total Requirements</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-success">
                        <div class="stat-number">${coverage.covered_requirements}</div>
                        <div class="stat-label">Covered Requirements</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-danger">
                        <div class="stat-number">${coverage.uncovered_requirements}</div>
                        <div class="stat-label">Uncovered Requirements</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-info">
                        <div class="stat-number">${coverage.coverage_percentage}%</div>
                        <div class="stat-label">Coverage Percentage</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">Filter Requirements:</label>
                    <select class="form-select" id="matrix-filter">
                        <option value="all">All Requirements</option>
                        <option value="covered">Covered Only</option>
                        <option value="uncovered">Uncovered Only</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="d-flex align-items-end h-100">
                        <button class="btn btn-outline-primary btn-sm" id="toggle-matrix-details">
                            <i class="fas fa-eye"></i> Toggle Details
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Generate matrix table with filter capability
        this.generateMatrixTable(data.matrix, matrixDiv, 'all');
        
        // Add event listeners
        document.getElementById('matrix-filter').addEventListener('change', (e) => {
            this.generateMatrixTable(data.matrix, matrixDiv, e.target.value);
        });
        
        document.getElementById('toggle-matrix-details').addEventListener('click', () => {
            matrixDiv.classList.toggle('compact-view');
        });
    }

    generateMatrixTable(matrix, container, filter = 'all') {
        // Filter requirements based on selection
        let filteredReqs = matrix.requirements;
        if (filter === 'covered') {
            filteredReqs = matrix.requirements.filter(req => req.covered);
        } else if (filter === 'uncovered') {
            filteredReqs = matrix.requirements.filter(req => !req.covered);
        }
        
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-sm traceability-table">
                    <thead>
                        <tr>
                            <th>Requirement ID</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Coverage Status</th>
                            <th>Test Cases</th>
                            <th class="details-column">Content Preview</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        filteredReqs.forEach(req => {
            const statusClass = req.covered ? 'mapped' : 'unmapped';
            const statusText = req.covered ? 'Covered' : 'Not Covered';
            const statusIcon = req.covered ? 'fa-check' : 'fa-times';
            const priorityClass = req.priority === 'high' ? 'bg-danger' : 
                                 req.priority === 'medium' ? 'bg-warning' : 'bg-info';
            
            tableHtml += `
                <tr class="${statusClass}-row">
                    <td><code>${req.id}</code></td>
                    <td><span class="badge bg-secondary">${req.type}</span></td>
                    <td><span class="badge ${priorityClass}">${req.priority}</span></td>
                    <td class="${statusClass}">
                        <i class="fas ${statusIcon} me-1"></i>${statusText}
                    </td>
                    <td>
                        <span class="badge bg-primary">${req.test_case_count}</span>
                    </td>
                    <td class="details-column">
                        <div class="content-preview" title="${req.content}">
                            ${req.content.substring(0, 80)}${req.content.length > 80 ? '...' : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableHtml += `
                    </tbody>
                </table>
            </div>
            <div class="mt-2 text-muted">
                Showing ${filteredReqs.length} of ${matrix.requirements.length} requirements
            </div>
        `;
        
        container.innerHTML = tableHtml;
    }

    async exportReport(type) {
        this.showLoading(`Generating ${type} report...`);

        try {
            const response = await fetch('/export/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            const data = await response.json();

            if (response.ok) {
                // Create download link
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = true;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showAlert('Report generated successfully!', 'success');
            } else {
                this.showAlert(`Export failed: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showAlert(`Export failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async exportExcel() {
        this.showLoading('Generating Excel report...');

        try {
            const response = await fetch('/export/excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                // Create download link
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = true;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showAlert('Excel report generated successfully!', 'success');
            } else {
                this.showAlert(`Export failed: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showAlert(`Export failed: ${error.message}`, 'danger');
        } finally {
            this.hideLoading();
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.testCases = [];
            this.validationResults = [];
            this.mappingResults = [];
            this.traceabilityMatrix = null;
            
            // Reset UI
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('actions-panel').style.display = 'none';
            document.getElementById('validation-section').style.display = 'none';
            document.getElementById('mapping-section').style.display = 'none';
            document.getElementById('traceability-section').style.display = 'none';
            
            // Clear status messages
            document.getElementById('srs-upload-status').innerHTML = '';
            document.getElementById('tc-upload-status').innerHTML = '';
            document.getElementById('query-status').innerHTML = '';
            document.getElementById('query-input').value = '';
            
            // Reset process steps
            this.resetProcessSteps();
            this.updateUIState();
            
            this.showAlert('All data cleared successfully.', 'info');
        }
    }

    updateProcessSteps() {
        const steps = ['step-upload', 'step-extract', 'step-analyze', 'step-ready'];
        
        steps.forEach((stepId, index) => {
            setTimeout(() => {
                const step = document.getElementById(stepId);
                step.classList.add('completed');
                const icon = step.querySelector('.step-icon i');
                icon.className = 'fas fa-check';
            }, index * 500);
        });
    }

    resetProcessSteps() {
        const steps = ['step-upload', 'step-extract', 'step-analyze', 'step-ready'];
        const icons = ['fa-upload', 'fa-file-alt', 'fa-brain', 'fa-check'];
        
        steps.forEach((stepId, index) => {
            const step = document.getElementById(stepId);
            step.classList.remove('completed');
            const icon = step.querySelector('.step-icon i');
            icon.className = `fas ${icons[index]}`;
        });
    }

    updateTestCaseValidationStatus() {
        // Update validation summary
        this.updateValidationSummary();
        // Re-render test cases with current filter
        const currentFilter = document.getElementById('test-case-filter');
        const filterValue = currentFilter ? currentFilter.value : 'all';
        this.displayTestCases(filterValue);
    }

    enableActions() {
        document.getElementById('query-btn').disabled = false;
    }

    enableValidationButtons() {
        document.getElementById('validate-btn').disabled = false;
        document.getElementById('map-btn').disabled = false;
    }

    updateUIState() {
        const hasTestCases = this.testCases.length > 0;
        document.getElementById('validate-btn').disabled = !hasTestCases;
        document.getElementById('map-btn').disabled = !hasTestCases;
    }

    showLoading(message = 'Processing...') {
        document.getElementById('loading-text').textContent = message;
        this.loadingModal.show();
    }

    hideLoading() {
        this.loadingModal.hide();
    }

    updateStatus(element, message, type) {
        element.innerHTML = `<div class="alert alert-${type} py-2 mb-0">${message}</div>`;
    }

    showAlert(message, type) {
        // Create and show a toast notification
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartSpecApp();
});
