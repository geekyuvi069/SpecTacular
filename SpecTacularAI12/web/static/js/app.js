// SmartSpec AI - Frontend Application Logic (NeoBrutalist Edition)
class SmartSpecApp {
    constructor() {
        this.testCases = [];
        this.validationResults = [];
        this.mappingResults = [];
        this.traceabilityMatrix = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCursor();
        this.setupScrollReveal();
        this.setupScrollProgress();
        this.setupExportDropdown();
        this.updateUIState();
    }

    // ─── Custom Cursor ───
    setupCursor() {
        const cursor = document.getElementById('cursor');
        if (!cursor) return;
        const hoverElements = document.querySelectorAll('.cursor-hover, a, button, input, textarea, select');

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursor.style.transform = `translate(-50%, -50%)`;
        });

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.width = '60px';
                cursor.style.height = '60px';
                cursor.style.backgroundColor = '#FBFF48';
                cursor.style.mixBlendMode = 'normal';
                cursor.style.border = '2px solid black';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.width = '24px';
                cursor.style.height = '24px';
                cursor.style.backgroundColor = '#fff';
                cursor.style.mixBlendMode = 'difference';
                cursor.style.border = '2px solid black';
            });
        });
    }

    // ─── Scroll Reveal ───
    setupScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ─── Scroll Progress Bar ───
    setupScrollProgress() {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            const bar = document.getElementById('progressBar');
            if (bar) bar.style.width = scrolled + '%';
        });
    }

    // ─── Export Dropdown ───
    setupExportDropdown() {
        const btn = document.getElementById('export-dropdown-btn');
        const dropdown = document.querySelector('.export-dropdown');
        if (!btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
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
        document.getElementById('export-testcases-pdf').addEventListener('click', (e) => { e.preventDefault(); this.exportReport('test_cases'); });
        document.getElementById('export-validation-pdf').addEventListener('click', (e) => { e.preventDefault(); this.exportReport('validation'); });
        document.getElementById('export-traceability-pdf').addEventListener('click', (e) => { e.preventDefault(); this.exportReport('traceability'); });
        document.getElementById('export-traceability-excel').addEventListener('click', (e) => { e.preventDefault(); this.exportExcel(); });

        // Clear data
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAllData());
    }

    setupFileUpload(type, btnId, inputId, statusId, endpoint) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        const uploadArea = document.getElementById(`${type}-upload-area`);

        btn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
        uploadArea.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFile(e.target.files[0], endpoint, status, type);
            }
        });

        // Drag and drop
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
                document.getElementById('results-section').classList.remove('hidden');
                document.getElementById('actions-panel').style.display = 'block';
                document.getElementById('actions-panel').classList.remove('hidden');
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
                document.getElementById('validation-section').classList.remove('hidden');
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
                document.getElementById('mapping-section').classList.remove('hidden');
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
                document.getElementById('traceability-section').classList.remove('hidden');
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

        this.addFilterControls(container);

        let filteredTestCases = this.testCases;
        if (filter !== 'all') {
            filteredTestCases = this.testCases.filter(tc => {
                const validation = this.validationResults.find(v => v.test_case_id === tc.id);
                if (filter === 'passed') return validation && validation.is_valid;
                else if (filter === 'failed') return validation && !validation.is_valid;
                else if (filter === 'pending') return !validation;
                return true;
            });
        }

        countBadge.textContent = filteredTestCases.length;

        const existingCards = container.querySelectorAll('.test-case-card');
        existingCards.forEach(card => card.remove());

        filteredTestCases.forEach((tc, index) => {
            const card = this.createTestCaseCard(tc, index);
            container.appendChild(card);
        });
    }

    addFilterControls(container) {
        if (container.querySelector('.test-case-filters')) return;

        const filterDiv = document.createElement('div');
        filterDiv.className = 'test-case-filters mb-3';
        filterDiv.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-6">
                    <label class="form-label">FILTER BY STATUS:</label>
                    <select class="form-select" id="test-case-filter">
                        <option value="all">All Test Cases</option>
                        <option value="passed">Passed Only</option>
                        <option value="failed">Failed Only</option>
                        <option value="pending">Pending Validation</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="validation-summary-mini" style="margin-top:1.5rem;">
                        <span class="badge bg-success me-2" id="passed-count">0 Passed</span>
                        <span class="badge bg-danger me-2" id="failed-count">0 Failed</span>
                        <span class="badge bg-secondary" id="pending-count">0 Pending</span>
                    </div>
                </div>
            </div>
        `;

        container.insertBefore(filterDiv, container.firstChild);

        document.getElementById('test-case-filter').addEventListener('change', (e) => {
            this.displayTestCases(e.target.value);
        });

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
                <h6 class="test-case-title glitch-hover">${testCase.title}</h6>
                <div class="d-flex gap-2" style="flex-wrap:wrap;">
                    ${validationStatus}
                    <span class="badge bg-secondary">${testCase.type}</span>
                    <span class="badge bg-info">${testCase.priority}</span>
                </div>
            </div>

            <div class="test-case-meta">
                <span><strong>ID:</strong> ${testCase.id}</span>
                <span><strong>STATUS:</strong> ${testCase.status}</span>
                ${testCase.requirement_id ? `<span><strong>REQ:</strong> ${testCase.requirement_id}</span>` : ''}
            </div>

            <div class="mb-2">
                <strong style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-transform:uppercase;">Description:</strong>
                <p class="text-muted" style="margin-top:0.25rem;">${testCase.description}</p>
            </div>

            <div class="mb-2">
                <strong style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-transform:uppercase;">Test Steps:</strong>
                <div class="test-case-steps">${testCase.steps}</div>
            </div>

            <div class="mb-2">
                <strong style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-transform:uppercase;">Expected Result:</strong>
                <p class="text-muted" style="margin-top:0.25rem;">${testCase.expected}</p>
            </div>

            ${mappingInfo}
        `;

        return card;
    }

    getValidationStatus(testCaseId) {
        const validation = this.validationResults.find(v => v.test_case_id === testCaseId);

        if (!validation) {
            return '<span class="validation-status pending">⏳ PENDING</span>';
        }

        if (validation.is_valid) {
            return `<span class="validation-status valid">✓ VALID (${validation.score}%)</span>`;
        } else {
            return `<span class="validation-status invalid">✗ INVALID (${validation.score}%)</span>`;
        }
    }

    getMappingInfo(testCaseId) {
        const mapping = this.mappingResults.find(m => m.test_case_id === testCaseId);

        if (!mapping || mapping.mapped_requirements.length === 0) return '';

        const requirements = mapping.mapped_requirements.map(req => {
            const confidence = req.similarity_score;
            let confidenceClass = 'low-confidence';
            if (confidence > 0.7) confidenceClass = 'high-confidence';
            else if (confidence > 0.4) confidenceClass = 'medium-confidence';

            return `<span class="mapping-indicator ${confidenceClass}">${req.requirement_id} (${(confidence * 100).toFixed(0)}%)</span>`;
        }).join('');

        return `
            <div class="mt-2">
                <strong style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-transform:uppercase;">Mapped Requirements:</strong>
                <div class="mt-1">${requirements}</div>
            </div>
        `;
    }

    displayValidationResults(data) {
        const summaryDiv = document.getElementById('validation-summary');
        const detailsDiv = document.getElementById('validation-details');

        const summary = data.summary;
        summaryDiv.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card bg-primary">
                        <div class="stat-number">${summary.total}</div>
                        <div class="stat-label">TOTAL</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-success">
                        <div class="stat-number">${summary.valid}</div>
                        <div class="stat-label">VALID</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-danger">
                        <div class="stat-number">${summary.invalid}</div>
                        <div class="stat-label">INVALID</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-info">
                        <div class="stat-number">${((summary.valid / summary.total) * 100).toFixed(1)}%</div>
                        <div class="stat-label">SUCCESS RATE</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">FILTER VALIDATION:</label>
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
                            <i class="ri-eye-line"></i> TOGGLE DETAILS
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.generateValidationTable(data.validation_results, detailsDiv, 'all');

        document.getElementById('validation-filter').addEventListener('change', (e) => {
            this.generateValidationTable(data.validation_results, detailsDiv, e.target.value);
        });

        document.getElementById('toggle-validation-details').addEventListener('click', () => {
            detailsDiv.classList.toggle('compact-view');
        });
    }

    generateValidationTable(validationResults, container, filter = 'all') {
        let filteredResults = validationResults;
        if (filter === 'valid') filteredResults = validationResults.filter(r => r.is_valid);
        else if (filter === 'invalid') filteredResults = validationResults.filter(r => !r.is_valid);
        else if (filter === 'high-score') filteredResults = validationResults.filter(r => r.score > 80);
        else if (filter === 'low-score') filteredResults = validationResults.filter(r => r.score < 60);

        let detailsHtml = '<div class="accordion validation-table" id="validationAccordion">';

        filteredResults.forEach((result, index) => {
            const statusClass = result.is_valid ? 'text-success' : 'text-danger';
            const statusIcon = result.is_valid ? '✓' : '✗';
            const scoreClass = result.score > 80 ? 'bg-success' : result.score > 60 ? 'bg-warning' : 'bg-danger';

            detailsHtml += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button collapsed" type="button" onclick="this.classList.toggle('collapsed');document.getElementById('collapse${index}').style.display=document.getElementById('collapse${index}').style.display==='none'?'block':'none';">
                            <span class="${statusClass}" style="margin-right:0.5rem;font-weight:800;">${statusIcon}</span>
                            ${result.test_case_id} — Score:
                            <span class="badge ${scoreClass} ms-2">${result.score}%</span>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse" style="display:none;">
                        <div class="accordion-body">
                            <div class="details-column">
                                <small class="text-muted">
                                    Errors: ${result.errors.length} | Warnings: ${result.warnings.length}
                                </small>
                            </div>

                            ${result.errors.length > 0 ? `
                                <div class="error-message mt-2">
                                    <strong>ERRORS:</strong>
                                    <ul style="margin:0.5rem 0 0 1rem;">
                                        ${result.errors.map(error => `<li>${error}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            ${result.warnings.length > 0 ? `
                                <div class="warning-message mt-2">
                                    <strong>WARNINGS:</strong>
                                    <ul style="margin:0.5rem 0 0 1rem;">
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
            <div class="mt-2 text-muted" style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;">
                Showing ${filteredResults.length} of ${validationResults.length} validation results
            </div>
        `;

        container.innerHTML = detailsHtml;
    }

    displayMappingResults(data) {
        const summaryDiv = document.getElementById('mapping-summary');
        const detailsDiv = document.getElementById('mapping-details');

        const summary = data.summary;
        summaryDiv.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card bg-primary">
                        <div class="stat-number">${summary.total_test_cases}</div>
                        <div class="stat-label">TOTAL TESTS</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-success">
                        <div class="stat-number">${summary.mapped_test_cases}</div>
                        <div class="stat-label">MAPPED</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-info">
                        <div class="stat-number">${summary.total_requirements}</div>
                        <div class="stat-label">TOTAL REQS</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-warning">
                        <div class="stat-number">${summary.covered_requirements}</div>
                        <div class="stat-label">COVERED</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">FILTER TEST CASES:</label>
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
                            <i class="ri-eye-line"></i> TOGGLE DETAILS
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.generateMappingTable(data.mapping_results, detailsDiv, 'all');

        document.getElementById('mapping-filter').addEventListener('change', (e) => {
            this.generateMappingTable(data.mapping_results, detailsDiv, e.target.value);
        });

        document.getElementById('toggle-mapping-details').addEventListener('click', () => {
            detailsDiv.classList.toggle('compact-view');
        });
    }

    generateMappingTable(mappingResults, container, filter = 'all') {
        let filteredResults = mappingResults;
        if (filter === 'mapped') filteredResults = mappingResults.filter(m => m.mapped_requirements.length > 0);
        else if (filter === 'unmapped') filteredResults = mappingResults.filter(m => m.mapped_requirements.length === 0);
        else if (filter === 'high-confidence') filteredResults = mappingResults.filter(m => m.mapping_confidence > 0.7);
        else if (filter === 'low-confidence') filteredResults = mappingResults.filter(m => m.mapping_confidence <= 0.4);

        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped mapping-table">
                    <thead>
                        <tr>
                            <th>TEST CASE ID</th>
                            <th>TITLE</th>
                            <th>MAPPED REQUIREMENTS</th>
                            <th>CONFIDENCE</th>
                            <th class="details-column">DETAILS</th>
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
            <div class="mt-2 text-muted" style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;">
                Showing ${filteredResults.length} of ${mappingResults.length} test cases
            </div>
        `;

        container.innerHTML = tableHtml;
    }

    displayTraceabilityMatrix(data) {
        const summaryDiv = document.getElementById('traceability-summary');
        const matrixDiv = document.getElementById('traceability-matrix');

        const coverage = data.coverage_stats.overall_coverage;
        summaryDiv.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card bg-primary">
                        <div class="stat-number">${coverage.total_requirements}</div>
                        <div class="stat-label">TOTAL REQS</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-success">
                        <div class="stat-number">${coverage.covered_requirements}</div>
                        <div class="stat-label">COVERED</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-danger">
                        <div class="stat-number">${coverage.uncovered_requirements}</div>
                        <div class="stat-label">UNCOVERED</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card bg-info">
                        <div class="stat-number">${coverage.coverage_percentage}%</div>
                        <div class="stat-label">COVERAGE</div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">FILTER REQUIREMENTS:</label>
                    <select class="form-select" id="matrix-filter">
                        <option value="all">All Requirements</option>
                        <option value="covered">Covered Only</option>
                        <option value="uncovered">Uncovered Only</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="d-flex align-items-end h-100">
                        <button class="btn btn-outline-primary btn-sm" id="toggle-matrix-details">
                            <i class="ri-eye-line"></i> TOGGLE DETAILS
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.generateMatrixTable(data.matrix, matrixDiv, 'all');

        document.getElementById('matrix-filter').addEventListener('change', (e) => {
            this.generateMatrixTable(data.matrix, matrixDiv, e.target.value);
        });

        document.getElementById('toggle-matrix-details').addEventListener('click', () => {
            matrixDiv.classList.toggle('compact-view');
        });
    }

    generateMatrixTable(matrix, container, filter = 'all') {
        let filteredReqs = matrix.requirements;
        if (filter === 'covered') filteredReqs = matrix.requirements.filter(req => req.covered);
        else if (filter === 'uncovered') filteredReqs = matrix.requirements.filter(req => !req.covered);

        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-sm traceability-table">
                    <thead>
                        <tr>
                            <th>REQ ID</th>
                            <th>TYPE</th>
                            <th>PRIORITY</th>
                            <th>STATUS</th>
                            <th>TESTS</th>
                            <th class="details-column">CONTENT</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filteredReqs.forEach(req => {
            const statusClass = req.covered ? 'mapped' : 'unmapped';
            const statusText = req.covered ? '✓ COVERED' : '✗ NOT COVERED';
            const priorityClass = req.priority === 'high' ? 'bg-danger' :
                                 req.priority === 'medium' ? 'bg-warning' : 'bg-info';

            tableHtml += `
                <tr class="${statusClass}-row">
                    <td><code>${req.id}</code></td>
                    <td><span class="badge bg-secondary">${req.type}</span></td>
                    <td><span class="badge ${priorityClass}">${req.priority}</span></td>
                    <td class="${statusClass}">${statusText}</td>
                    <td><span class="badge bg-primary">${req.test_case_count}</span></td>
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
            <div class="mt-2 text-muted" style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;">
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
        if (confirm('⚠️ CLEAR ALL DATA? This action cannot be undone.')) {
            this.testCases = [];
            this.validationResults = [];
            this.mappingResults = [];
            this.traceabilityMatrix = null;

            // Reset UI
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('results-section').classList.add('hidden');
            document.getElementById('actions-panel').style.display = 'none';
            document.getElementById('actions-panel').classList.add('hidden');
            document.getElementById('validation-section').style.display = 'none';
            document.getElementById('validation-section').classList.add('hidden');
            document.getElementById('mapping-section').style.display = 'none';
            document.getElementById('mapping-section').classList.add('hidden');
            document.getElementById('traceability-section').style.display = 'none';
            document.getElementById('traceability-section').classList.add('hidden');

            document.getElementById('srs-upload-status').innerHTML = '';
            document.getElementById('tc-upload-status').innerHTML = '';
            document.getElementById('query-status').innerHTML = '';
            document.getElementById('query-input').value = '';

            this.resetProcessSteps();
            this.updateUIState();

            this.showAlert('All data cleared.', 'info');
        }
    }

    updateProcessSteps() {
        const steps = ['step-upload', 'step-extract', 'step-analyze', 'step-ready'];

        steps.forEach((stepId, index) => {
            setTimeout(() => {
                const step = document.getElementById(stepId);
                step.classList.add('completed');
                const icon = step.querySelector('.step-icon i');
                icon.className = 'ri-check-line';
            }, index * 500);
        });
    }

    resetProcessSteps() {
        const steps = ['step-upload', 'step-extract', 'step-analyze', 'step-ready'];
        const icons = ['ri-upload-2-line', 'ri-file-text-line', 'ri-brain-line', 'ri-check-line'];

        steps.forEach((stepId, index) => {
            const step = document.getElementById(stepId);
            step.classList.remove('completed');
            const icon = step.querySelector('.step-icon i');
            icon.className = icons[index];
        });
    }

    updateTestCaseValidationStatus() {
        this.updateValidationSummary();
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

    // ─── Loading Overlay (replaces Bootstrap modal) ───
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        document.getElementById('loading-text').textContent = message;
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

    updateStatus(element, message, type) {
        const colorMap = {
            'success': 'alert-success',
            'danger': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        };
        element.innerHTML = `<div class="alert ${colorMap[type] || 'alert-info'} py-2 mb-0">${message}</div>`;
    }

    showAlert(message, type) {
        const colorMap = {
            'success': { bg: '#33FF57', color: '#121212' },
            'danger': { bg: '#FF2A2A', color: '#fff' },
            'warning': { bg: '#FBFF48', color: '#121212' },
            'info': { bg: '#3B82F6', color: '#fff' }
        };
        const colors = colorMap[type] || colorMap['info'];

        const alertDiv = document.createElement('div');
        alertDiv.className = 'neo-toast';
        alertDiv.style.backgroundColor = colors.bg;
        alertDiv.style.color = colors.color;
        alertDiv.innerHTML = `
            ${message}
            <button onclick="this.parentElement.remove()" style="background:none;border:2px solid currentColor;color:inherit;padding:0 0.4rem;margin-left:1rem;cursor:pointer;float:right;font-weight:800;">✕</button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.transition = 'opacity 0.3s, transform 0.3s';
                alertDiv.style.opacity = '0';
                alertDiv.style.transform = 'translateX(100px)';
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, 4000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new SmartSpecApp();
});
