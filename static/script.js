document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const fileListBody = document.getElementById('file-list-body');
    const emptyRow = document.getElementById('empty-row');

    const promptInput = document.getElementById('prompt-input');
    const enhanceBtn = document.getElementById('enhance-btn');
    const enhanceSpinner = document.getElementById('enhance-spinner');
    const presetDropdown = document.getElementById('preset-dropdown');
    const presetDropdownToggle = document.getElementById('preset-dropdown-toggle');
    const presetDropdownLabel = document.getElementById('preset-dropdown-label');
    const presetDropdownMenu = document.getElementById('preset-dropdown-menu');
    const savePresetBtn = document.getElementById('save-preset-btn');
    const deletePresetBtn = document.getElementById('delete-preset-btn');

    const runBtn = document.getElementById('run-btn');
    const runSpinner = document.getElementById('run-spinner');
    const cancelBtn = document.getElementById('cancel-btn');
    const progressStatus = document.getElementById('progress-status');

    const outputBody = document.getElementById('output-body');
    const copyBtn = document.getElementById('copy-btn');
    const exportMDBtn = document.getElementById('export-md-btn');
    const exportPDFBtn = document.getElementById('export-pdf-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportWordBtn = document.getElementById('export-word-btn');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalInput = document.getElementById('modal-input');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginSpinner = document.getElementById('login-spinner');
    const appMain = document.getElementById('app-main');
    const headerUser = document.getElementById('header-user');
    const headerUsername = document.getElementById('header-username');
    const logoutBtn = document.getElementById('logout-btn');
    const adminPanelLink = document.getElementById('admin-panel-link');

    // State variables
    let uploadedFiles = [];
    let savedPresets = []; // [{name, prompt}, ...] - server is the source of truth
    let currentPresetName = "";
    let presetMenuOpen = false;
    let accumulatedOutput = "";
    let currentAbortController = null;
    let renderScheduled = false;
    let pendingRenderFrame = null;

    // Progress bars. Upload has a real, measurable percentage (bytes sent /
    // total, via XMLHttpRequest). Enhance and generation are single/streamed
    // LLM calls with no knowable total size or duration up front, so those use
    // a "trickle" heuristic: the bar eases toward a ceiling over time and,
    // for the streaming case, gets nudged forward by each real chunk that
    // arrives - it is a progress *indicator*, not an exact completion percentage.
    function createProgressController(containerEl, fillEl, labelEl) {
        let current = 0;
        let ceiling = 100;
        let intervalId = null;
        let hideTimeoutId = null;

        function render() {
            const clamped = Math.min(current, 100);
            fillEl.style.width = `${clamped.toFixed(1)}%`;
            labelEl.textContent = `${Math.round(clamped)}%`;
        }

        function stopTrickle() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            if (hideTimeoutId) {
                clearTimeout(hideTimeoutId);
                hideTimeoutId = null;
            }
        }

        function setReal(pct) {
            stopTrickle();
            current = pct;
            containerEl.classList.remove('hidden');
            render();
        }

        function trickleTo(newCeiling) {
            stopTrickle();
            ceiling = newCeiling;
            containerEl.classList.remove('hidden');
            intervalId = setInterval(() => {
                const remaining = ceiling - current;
                current += remaining * 0.06;
                render();
            }, 150);
        }

        function nudge(amount) {
            current = Math.min(current + amount, ceiling);
            render();
        }

        function complete() {
            stopTrickle();
            current = 100;
            render();
            hideTimeoutId = setTimeout(() => containerEl.classList.add('hidden'), 500);
        }

        function reset() {
            stopTrickle();
            current = 0;
            render();
            containerEl.classList.add('hidden');
        }

        return { setReal, trickleTo, nudge, complete, reset };
    }

    const uploadProgress = createProgressController(
        document.getElementById('upload-progress-container'),
        document.getElementById('upload-progress-fill'),
        document.getElementById('upload-progress-label'),
    );
    const enhanceProgress = createProgressController(
        document.getElementById('enhance-progress-container'),
        document.getElementById('enhance-progress-fill'),
        document.getElementById('enhance-progress-label'),
    );
    const runProgress = createProgressController(
        document.getElementById('run-progress-container'),
        document.getElementById('run-progress-fill'),
        document.getElementById('run-progress-label'),
    );
    // Export buttons share a single progress bar - only one export can run
    // at a time anyway (the other buttons are disabled while one is active).
    const exportProgress = createProgressController(
        document.getElementById('export-progress-container'),
        document.getElementById('export-progress-fill'),
        document.getElementById('export-progress-label'),
    );

    // Generic in-app modal - replaces browser-native confirm()/prompt() so
    // both confirmations and text input stay inside the app's own UI.
    // Resolves to `true`/`false` for a plain confirmation, or the entered
    // string / `null` when `showInput` is used (Cancel, overlay click, and
    // Escape all resolve to the "negative" outcome).
    let activeModalCleanup = null;
    function showModal({ title, message, showInput = false, inputValue = "", confirmText = "Confirm", danger = false }) {
        if (activeModalCleanup) activeModalCleanup();
        return new Promise((resolve) => {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalConfirmBtn.textContent = confirmText;
            modalConfirmBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

            if (showInput) {
                modalInput.classList.remove('hidden');
                modalInput.value = inputValue;
            } else {
                modalInput.classList.add('hidden');
            }

            modalOverlay.classList.remove('hidden');
            if (showInput) {
                modalInput.focus();
                modalInput.select();
            } else {
                modalConfirmBtn.focus();
            }

            function cleanup() {
                modalOverlay.classList.add('hidden');
                modalConfirmBtn.removeEventListener('click', onConfirm);
                modalCancelBtn.removeEventListener('click', onCancel);
                modalOverlay.removeEventListener('mousedown', onOverlayClick);
                document.removeEventListener('keydown', onKeydown);
                activeModalCleanup = null;
            }

            activeModalCleanup = () => { cleanup(); resolve(showInput ? null : false); };

            function onConfirm() {
                cleanup();
                resolve(showInput ? modalInput.value : true);
            }

            function onCancel() {
                cleanup();
                resolve(showInput ? null : false);
            }

            function onOverlayClick(e) {
                if (e.target === modalOverlay) onCancel();
            }

            function onKeydown(e) {
                if (e.key === 'Escape') onCancel();
                if (e.key === 'Enter' && showInput) onConfirm();
            }

            modalConfirmBtn.addEventListener('click', onConfirm);
            modalCancelBtn.addEventListener('click', onCancel);
            modalOverlay.addEventListener('mousedown', onOverlayClick);
            document.addEventListener('keydown', onKeydown);
        });
    }

    function showConfirmModal(message, { title = "Confirm", confirmText = "Delete", danger = true } = {}) {
        return showModal({ title, message, showInput: false, confirmText, danger });
    }

    function showPromptModal(message, { title = "Save Preset", inputValue = "" } = {}) {
        return showModal({ title, message, showInput: true, inputValue, confirmText: "Save", danger: false });
    }

    // ── Per-format Export Instructions modal ─────────────────────────
    //
    // Three sub-tabs (PDF / Excel / Word), each a self-contained preset editor
    // matching the Analysis Query preset UX: textarea + AI Enhance + preset
    // dropdown + optional template file + Export button. The modal does NOT
    // clear per-tab state when closed - it's a workspace the user re-opens,
    // not a one-shot dialog.

    const exportInstructionsOverlay = document.getElementById('export-instructions-overlay');
    const exportInstructionsCloseBtn = document.getElementById('export-instructions-close-btn');
    const exportTabsContainer = document.getElementById('export-tabs');

    // One state object per format. Templates and selected preset names live
    // here, NOT in DOM, so closing/reopening the modal preserves work-in-progress.
    const EXPORT_FORMATS = ["pdf", "excel", "word"];
    const exportState = {};
    for (const fmt of EXPORT_FORMATS) {
        exportState[fmt] = {
            instructions: "",
            templateFilename: null,
            templateOriginalName: null,
            presets: [],            // server-side list, filtered to this format
            currentPresetName: "",
            menuOpen: false,
            loaded: false,
        };
    }
    let activeExportFormat = "pdf";

    function getExportState(fmt) {
        return exportState[fmt];
    }

    function openExportModal(fmt) {
        exportInstructionsOverlay.classList.remove('hidden');
        switchExportTab(fmt || activeExportFormat);
        // Lazy-load presets the first time the modal opens per format.
        for (const f of EXPORT_FORMATS) {
            if (!exportState[f].loaded) {
                fetchExportPresets(f);
            }
        }
    }

    function closeExportModal() {
        exportInstructionsOverlay.classList.add('hidden');
        // Close any open per-tab dropdown so it doesn't get stranded visible.
        for (const fmt of EXPORT_FORMATS) {
            if (exportState[fmt].menuOpen) closeExportPresetMenu(fmt);
        }
    }

    function switchExportTab(fmt) {
        activeExportFormat = fmt;
        exportTabsContainer.querySelectorAll('.export-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === fmt);
        });
        document.querySelectorAll('.export-tab-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.dataset.format !== fmt);
        });
    }

    // Per-tab preset rendering + select/save/delete - mirrors the existing
    // fetchPresets/renderPresetOptions pattern in the analysis-query preset
    // dropdown but scoped to one format's presets.
    async function fetchExportPresets(fmt) {
        try {
            const response = await apiFetch('/api/export-presets');
            if (!response.ok) throw new Error("Failed to fetch export presets");
            const all = await response.json();
            exportState[fmt].presets = all.filter(p => p.format === fmt);
            exportState[fmt].loaded = true;
            renderExportPresetOptions(fmt);
        } catch (error) {
            console.error(`Error loading ${fmt} export presets:`, error);
        }
    }

    function renderExportPresetOptions(fmt) {
        const state = exportState[fmt];
        const label = document.getElementById(`export-preset-dropdown-label-${fmt}`);
        const deleteBtn = document.getElementById(`export-delete-preset-btn-${fmt}`);
        const menu = document.getElementById(`export-preset-dropdown-menu-${fmt}`);

        menu.innerHTML = "";
        if (state.presets.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'preset-dropdown-empty';
            empty.textContent = `No saved ${fmt.toUpperCase()} presets`;
            menu.appendChild(empty);
        } else {
            state.presets.forEach(preset => {
                const item = document.createElement('div');
                item.className = 'preset-dropdown-item' + (preset.name === state.currentPresetName ? ' active' : '');
                item.textContent = preset.name;
                item.addEventListener('click', () => selectExportPreset(fmt, preset.name));
                menu.appendChild(item);
            });
        }
        label.textContent = state.currentPresetName || `Load ${fmt.toUpperCase()} preset`;
        deleteBtn.disabled = !state.currentPresetName;
    }

    function selectExportPreset(fmt, name) {
        const state = exportState[fmt];
        const preset = state.presets.find(p => p.name === name);
        if (!preset) return;
        state.currentPresetName = name;
        state.instructions = preset.instructions || "";
        state.templateFilename = preset.template_filename || null;
        state.templateOriginalName = preset.template_original_name || null;
        document.getElementById(`export-instructions-${fmt}`).value = state.instructions;
        updateExportTemplateDisplay(fmt);
        renderExportPresetOptions(fmt);
        closeExportPresetMenu(fmt);
        showOutputMessage(`[SYSTEM] Loaded ${fmt.toUpperCase()} preset: ${preset.name}`);
    }

    function openExportPresetMenu(fmt) {
        const state = exportState[fmt];
        const toggle = document.getElementById(`export-preset-dropdown-toggle-${fmt}`);
        const menu = document.getElementById(`export-preset-dropdown-menu-${fmt}`);
        const rect = toggle.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.minWidth = `${rect.width}px`;
        menu.classList.remove('hidden');
        menu.closest('.preset-dropdown').classList.add('open');
        state.menuOpen = true;
    }

    function closeExportPresetMenu(fmt) {
        const state = exportState[fmt];
        const menu = document.getElementById(`export-preset-dropdown-menu-${fmt}`);
        if (!menu) return;
        menu.classList.add('hidden');
        menu.closest('.preset-dropdown').classList.remove('open');
        state.menuOpen = false;
    }

    async function saveExportPreset(fmt) {
        const state = exportState[fmt];
        const instructions = document.getElementById(`export-instructions-${fmt}`).value;
        state.instructions = instructions;
        if (!instructions.trim() && !state.templateFilename) {
            showOutputMessage(`[PRESET ERROR] Add instructions or upload a template before saving.`, true);
            return;
        }
        const name = await showPromptModal(`Enter a name for this ${fmt.toUpperCase()} export preset:`, { title: "Save Export Preset" });
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        try {
            const response = await apiFetch('/api/export-presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: trimmedName,
                    format: fmt,
                    instructions: instructions,
                    template_filename: state.templateFilename,
                    template_original_name: state.templateOriginalName,
                })
            });
            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || "Failed to save export preset");
            }
            await fetchExportPresets(fmt);
            exportState[fmt].currentPresetName = trimmedName;
            renderExportPresetOptions(fmt);
            showOutputMessage(`[SYSTEM] ${fmt.toUpperCase()} preset saved: ${trimmedName}`);
        } catch (error) {
            console.error("Error saving export preset:", error);
            showOutputMessage(`[PRESET ERROR] Failed to save export preset: ${error.message}`, true);
        }
    }

    async function deleteSelectedExportPreset(fmt) {
        const state = exportState[fmt];
        const name = state.currentPresetName;
        if (!name) return;
        const confirmed = await showConfirmModal(
            `Delete ${fmt.toUpperCase()} preset "${name}"? This cannot be undone.`,
            { title: "Delete Export Preset" }
        );
        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/export-presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
            if (!response.ok) {
                let detail = "Delete failed on server";
                try { const err = await response.json(); detail = err.detail || detail; } catch (e) {}
                throw new Error(detail);
            }
            state.currentPresetName = "";
            await fetchExportPresets(fmt);
            renderExportPresetOptions(fmt);
            showOutputMessage(`[SYSTEM] Deleted ${fmt.toUpperCase()} preset: ${name}`);
        } catch (error) {
            console.error("Error deleting export preset:", error);
            showOutputMessage(`[PRESET ERROR] Failed to delete export preset: ${error.message}`, true);
        }
    }

    async function enhanceExportInstructions(fmt) {
        const instructions = document.getElementById(`export-instructions-${fmt}`).value.trim();
        if (!instructions) {
            showOutputMessage(`[ENHANCE ERROR] Write some instructions first, then click enhance.`, true);
            return;
        }
        const enhanceBtn = document.getElementById(`export-enhance-btn-${fmt}`);
        const spinner = document.getElementById(`export-enhance-spinner-${fmt}`);
        enhanceBtn.disabled = true;
        spinner.classList.remove('hidden');

        try {
            const response = await apiFetch('/api/enhance-instructions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: fmt, instructions: instructions })
            });
            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || "Enhancement failed");
            }
            const data = await response.json();
            document.getElementById(`export-instructions-${fmt}`).value = data.enhanced_instructions;
            exportState[fmt].instructions = data.enhanced_instructions;
            showOutputMessage(`[AI] ${fmt.toUpperCase()} export instructions enhanced.`);
        } catch (error) {
            console.error("Error enhancing export instructions:", error);
            showOutputMessage(`[ENHANCE ERROR] ${error.message}`, true);
        } finally {
            enhanceBtn.disabled = false;
            spinner.classList.add('hidden');
        }
    }

    // Reuses the existing XMLHttpRequest-with-progress pattern that the main
    // file upload uses (uploadFileWithProgress), so a real upload progress bar
    // is shown to the user while the template is being POSTed. Falls back to
    // a plain fetch if the form is in some other state.
    function uploadExportTemplate(fmt, file) {
        if (!file) return;
        const state = exportState[fmt];
        const browseBtn = document.querySelector(`.export-template-browse-btn[data-format="${fmt}"]`);
        const clearBtn = document.querySelector(`.export-template-clear-btn[data-format="${fmt}"]`);
        if (browseBtn) browseBtn.disabled = true;
        if (clearBtn) clearBtn.disabled = true;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/export-templates');
        xhr.upload.onprogress = () => {
            // No dedicated template-upload progress bar in the modal; the
            // modal's progress-status text doubles as the upload indicator.
        };
        xhr.onload = () => {
            if (browseBtn) browseBtn.disabled = false;
            if (clearBtn) clearBtn.disabled = false;
            if (xhr.status === 401) {
                showLoginOverlay('Your session expired. Please log in again.');
                return;
            }
            try {
                if (xhr.status < 200 || xhr.status >= 300) {
                    let detail = "Template upload failed";
                    try { detail = JSON.parse(xhr.responseText).detail || detail; } catch (e) {}
                    throw new Error(detail);
                }
                const data = JSON.parse(xhr.responseText);
                state.templateFilename = data.filename;
                state.templateOriginalName = data.original_name;
                updateExportTemplateDisplay(fmt);
                showOutputMessage(`[SYSTEM] ${fmt.toUpperCase()} template uploaded: ${data.original_name}`);
            } catch (error) {
                console.error("Error uploading template:", error);
                showOutputMessage(`[TEMPLATE ERROR] ${error.message}`, true);
            }
        };
        xhr.onerror = () => {
            if (browseBtn) browseBtn.disabled = false;
            if (clearBtn) clearBtn.disabled = false;
            showOutputMessage(`[TEMPLATE ERROR] Network error uploading template.`, true);
        };
        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
    }

    function updateExportTemplateDisplay(fmt) {
        const state = exportState[fmt];
        const nameEl = document.querySelector(`.export-template-name[data-format="${fmt}"]`);
        const clearBtn = document.querySelector(`.export-template-clear-btn[data-format="${fmt}"]`);
        if (state.templateFilename) {
            nameEl.textContent = state.templateOriginalName || state.templateFilename;
            clearBtn.classList.remove('hidden');
        } else {
            nameEl.textContent = 'No template selected';
            clearBtn.classList.add('hidden');
        }
    }

    function clearExportTemplate(fmt) {
        const state = exportState[fmt];
        state.templateFilename = null;
        state.templateOriginalName = null;
        updateExportTemplateDisplay(fmt);
    }

    // Convert internal format key -> API endpoint path. Kept tiny on purpose -
    // if a new format is ever added, this is the one place to update.
    const EXPORT_ENDPOINTS = {
        pdf:   '/api/export-pdf',
        excel: '/api/export-excel',
        word:  '/api/export-word',
    };

    async function runExportFromModal(fmt) {
        if (!accumulatedOutput) {
            showOutputMessage(`[EXPORT ERROR] Run the analysis first to produce a report.`, true);
            return;
        }
        const state = exportState[fmt];
        const instructions = document.getElementById(`export-instructions-${fmt}`).value;
        state.instructions = instructions;
        await runSkillExport({
            endpoint: EXPORT_ENDPOINTS[fmt],
            button: document.querySelector(`.export-from-modal-btn[data-format="${fmt}"]`),
            label: fmt.toUpperCase(),
            filename: `document_analysis_report.${fmt === 'excel' ? 'xlsx' : fmt === 'word' ? 'docx' : 'pdf'}`,
            extraBody: {
                instructions: instructions,
                template_filename: state.templateFilename,
            },
        });
    }

    // ── Authentication ────────────────────────────────────────────────
    //
    // Every /api/* route except /api/login and /api/logout requires a valid
    // session cookie (see app.py's get_current_user dependency). checkAuth()
    // gates the whole app behind that: the login overlay is visible by
    // default in the HTML, and the main app + header user info stay hidden
    // (also default-hidden in HTML) until a session is confirmed.

    // Wraps fetch() for every existing API call site (see the bulk
    // fetch->apiFetch rename above) so a session expiring mid-use - not just
    // "never logged in" - centrally re-shows the login screen instead of 15
    // separate ad hoc error messages. Deliberately NOT used by the login
    // form's own request or checkAuth()'s initial probe, since a 401 there
    // is the normal/expected "not logged in yet" case, not a surprise.
    async function apiFetch(url, options = {}) {
        const response = await fetch(url, options);
        if (response.status === 401) {
            showLoginOverlay('Your session expired. Please log in again.');
            throw new Error('Session expired');
        }
        return response;
    }

    function showLoginOverlay(message) {
        loginOverlay.classList.remove('hidden');
        appMain.classList.add('hidden');
        headerUser.classList.add('hidden');
        if (message) {
            loginError.textContent = message;
            loginError.classList.remove('hidden');
        }
    }

    function showApp(username, isAdmin) {
        loginOverlay.classList.add('hidden');
        appMain.classList.remove('hidden');
        headerUser.classList.remove('hidden');
        headerUsername.textContent = username;
        adminPanelLink.classList.toggle('hidden', !isAdmin);
        loginError.classList.add('hidden');
        loginForm.reset();
    }

    async function checkAuth() {
        try {
            const response = await fetch('/api/me');
            if (response.ok) {
                const data = await response.json();
                showApp(data.username, data.is_admin);
                // Only load app data once a session is actually confirmed -
                // these used to run unconditionally on every page load.
                fetchUploadedFiles();
                fetchPresets();
            } else {
                showLoginOverlay();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            showLoginOverlay();
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value;
        if (!username || !password) return;

        loginSubmitBtn.disabled = true;
        loginSpinner.classList.remove('hidden');
        loginError.classList.add('hidden');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || 'Login failed');
            }
            const data = await response.json();
            showApp(data.username, data.is_admin);
            fetchUploadedFiles();
            fetchPresets();
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
        } finally {
            loginSubmitBtn.disabled = false;
            loginSpinner.classList.add('hidden');
        }
    });

    // ── Theme Toggle Logic ──
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    const sunIcon = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;

    function initThemeIcon() {
        if (document.documentElement.classList.contains('dark')) {
            themeToggleIcon.innerHTML = sunIcon;
        } else {
            themeToggleIcon.innerHTML = moonIcon;
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                themeToggleIcon.innerHTML = moonIcon;
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                themeToggleIcon.innerHTML = sunIcon;
            }
        });
        initThemeIcon();
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        // Clear in-memory app state so a re-login (possibly as a different
        // user) never shows a flash of the previous session's data.
        uploadedFiles = [];
        savedPresets = [];
        accumulatedOutput = '';
        promptInput.value = '';
        
        // Reset export modal state per format
        for (const fmt of EXPORT_FORMATS) {
            exportState[fmt].instructions = '';
            exportState[fmt].templateFilename = null;
            exportState[fmt].templateOriginalName = null;
            exportState[fmt].presets = [];
            exportState[fmt].currentPresetName = '';
            exportState[fmt].menuOpen = false;
            exportState[fmt].loaded = false;
            updateExportTemplateDisplay(fmt);
            const textarea = document.getElementById(`export-instructions-${fmt}`);
            if (textarea) textarea.value = '';
        }
        currentPresetName = '';
        
        // Reset DOM elements and buttons
        outputBody.innerHTML = '<div class="output-placeholder">AI analysis output will appear here...</div>';
        const rows = fileListBody.querySelectorAll('tr:not(#empty-row)');
        rows.forEach(r => r.remove());
        const emptyRow = document.getElementById('empty-row');
        if (emptyRow) emptyRow.classList.remove('hidden');
        if (modalOverlay) modalOverlay.classList.add('hidden');
        if (exportInstructionsOverlay) exportInstructionsOverlay.classList.add('hidden');
        updateRunButtonState();
        updateEnhanceButtonState();
        updateExportButtonsState();
        
        showLoginOverlay();
    });

    // Initial load - gated behind auth, not unconditional.
    checkAuth();

    // Event Listeners for File Upload
    uploadZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // Event Listeners for Prompt Actions
    enhanceBtn.addEventListener('click', enhanceUserPrompt);

    promptInput.addEventListener('input', () => {
        updateRunButtonState();
        updateEnhanceButtonState();
    });

    runBtn.addEventListener('click', executeParsingAction);
    cancelBtn.addEventListener('click', () => currentAbortController?.abort());

    presetDropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        for (const f of EXPORT_FORMATS) closeExportPresetMenu(f);
        presetMenuOpen ? closePresetMenu() : openPresetMenu();
    });
    document.addEventListener('click', (e) => {
        if (presetMenuOpen && !presetDropdown.contains(e.target)) closePresetMenu();
        for (const f of EXPORT_FORMATS) {
            const toggle = document.getElementById(`export-preset-dropdown-toggle-${f}`);
            const menu = document.getElementById(`export-preset-dropdown-menu-${f}`);
            if (exportState[f].menuOpen && toggle && !toggle.contains(e.target) && menu && !menu.contains(e.target)) {
                closeExportPresetMenu(f);
            }
        }
    });
    window.addEventListener('resize', () => {
        if (presetMenuOpen) closePresetMenu();
        for (const f of EXPORT_FORMATS) {
            if (exportState[f].menuOpen) closeExportPresetMenu(f);
        }
    });
    savePresetBtn.addEventListener('click', savePromptAsPreset);
    deletePresetBtn.addEventListener('click', deleteSelectedPreset);

    copyBtn.addEventListener('click', copyOutputToClipboard);
    exportMDBtn.addEventListener('click', exportToMarkdown);
    exportPDFBtn.addEventListener('click', exportToPDF);
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportWordBtn.addEventListener('click', exportToWord);

    // Helpers
    function updateRunButtonState() {
        const hasFiles = uploadedFiles.length > 0;
        const hasPrompt = promptInput.value.trim().length > 0;
        runBtn.disabled = !(hasFiles && hasPrompt);
    }

    function updateEnhanceButtonState() {
        enhanceBtn.disabled = promptInput.value.trim().length === 0;
    }

    function updateExportButtonsState() {
        const hasOutput = accumulatedOutput.trim().length > 0;
        exportMDBtn.disabled = !hasOutput;
        exportPDFBtn.disabled = !hasOutput;
        exportExcelBtn.disabled = !hasOutput;
        exportWordBtn.disabled = !hasOutput;
        document.querySelectorAll('.export-from-modal-btn').forEach(btn => {
            btn.disabled = !hasOutput;
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // API Calls
    async function fetchUploadedFiles() {
        try {
            const response = await apiFetch('/api/files');
            if (!response.ok) throw new Error("Failed to fetch file list");
            uploadedFiles = await response.json();
            renderFileList();
            updateRunButtonState();
        } catch (error) {
            console.error("Error loading files:", error);
            showOutputMessage(`[SYSTEM ERROR] Failed to fetch file list from server: ${error.message}`, true);
        }
    }

    function renderFileList() {
        // Clear existing dynamic rows
        const rows = fileListBody.querySelectorAll('tr:not(#empty-row)');
        rows.forEach(r => r.remove());

        if (uploadedFiles.length === 0) {
            emptyRow.classList.remove('hidden');
            return;
        }

        emptyRow.classList.add('hidden');

        uploadedFiles.forEach(file => {
            const tr = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.textContent = file.filename;
            tr.appendChild(nameTd);

            const sizeTd = document.createElement('td');
            sizeTd.textContent = formatBytes(file.size);
            tr.appendChild(sizeTd);

            const statusTd = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = `status-badge ${file.status}`;
            badge.textContent = file.status.toUpperCase();
            statusTd.appendChild(badge);
            tr.appendChild(statusTd);

            const actionTd = document.createElement('td');
            actionTd.className = 'text-right';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteFile(file.filename));
            actionTd.appendChild(deleteBtn);
            tr.appendChild(actionTd);

            fileListBody.appendChild(tr);
        });
    }

    async function fetchPresets() {
        try {
            const response = await apiFetch('/api/presets');
            if (!response.ok) throw new Error("Failed to fetch presets");
            savedPresets = await response.json();
            renderPresetOptions();
        } catch (error) {
            console.error("Error loading presets:", error);
            showOutputMessage(`[SYSTEM ERROR] Failed to fetch saved presets: ${error.message}`, true);
        }
    }

    function renderPresetOptions(selectedName = "") {
        currentPresetName = selectedName;

        presetDropdownMenu.innerHTML = "";
        if (savedPresets.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'preset-dropdown-empty';
            empty.textContent = 'No saved presets';
            presetDropdownMenu.appendChild(empty);
        } else {
            savedPresets.forEach(preset => {
                const item = document.createElement('div');
                item.className = 'preset-dropdown-item' + (preset.name === selectedName ? ' active' : '');
                item.textContent = preset.name;
                item.addEventListener('click', () => selectPreset(preset.name));
                presetDropdownMenu.appendChild(item);
            });
        }

        presetDropdownLabel.textContent = selectedName || 'Load preset';
        deletePresetBtn.disabled = !selectedName;
    }

    function selectPreset(name) {
        const preset = savedPresets.find(p => p.name === name);
        if (!preset) return;
        promptInput.value = preset.prompt;
        updateRunButtonState();
        updateEnhanceButtonState();
        renderPresetOptions(name);
        closePresetMenu();
        showOutputMessage(`[SYSTEM] Loaded preset: ${preset.name}`);
    }

    function openPresetMenu() {
        const rect = presetDropdownToggle.getBoundingClientRect();
        presetDropdownMenu.style.top = `${rect.bottom + 4}px`;
        presetDropdownMenu.style.left = `${rect.left}px`;
        presetDropdownMenu.style.minWidth = `${rect.width}px`;
        presetDropdownMenu.classList.remove('hidden');
        presetDropdown.classList.add('open');
        presetMenuOpen = true;
    }

    function closePresetMenu() {
        presetDropdownMenu.classList.add('hidden');
        presetDropdown.classList.remove('open');
        presetMenuOpen = false;
    }

    async function savePromptAsPreset() {
        const promptText = promptInput.value.trim();
        if (!promptText) {
            showOutputMessage('[PRESET ERROR] Write a prompt before saving it as a preset.', true);
            return;
        }

        const name = await showPromptModal("Enter a name for this preset:", { title: "Save Preset" });
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();

        try {
            const response = await apiFetch('/api/presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName, prompt: promptText })
            });
            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || "Failed to save preset");
            }
            await fetchPresets();
            renderPresetOptions(trimmedName);
            showOutputMessage(`[SYSTEM] Preset saved: ${trimmedName}`);
        } catch (error) {
            console.error("Error saving preset:", error);
            showOutputMessage(`[PRESET ERROR] Failed to save preset: ${error.message}`, true);
        }
    }

    async function deleteSelectedPreset() {
        const name = currentPresetName;
        if (!name) return;

        const confirmed = await showConfirmModal(`Delete preset "${name}"? This cannot be undone.`, { title: "Delete Preset" });
        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
            if (!response.ok) {
                let detail = "Delete failed on server";
                try { const err = await response.json(); detail = err.detail || detail; } catch (e) {}
                throw new Error(detail);
            }
            await fetchPresets();
            showOutputMessage(`[SYSTEM] Deleted preset: ${name}`);
        } catch (error) {
            console.error("Error deleting preset:", error);
            showOutputMessage(`[PRESET ERROR] Failed to delete preset: ${error.message}`, true);
        }
    }

    function uploadFileWithProgress(file) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');

            // Real percentage: bytes actually sent, mapped to the first half
            // of the bar so there's room left for the server-side parse phase
            // (which has no progress signal of its own).
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    uploadProgress.setReal((e.loaded / e.total) * 50);
                }
            };
            xhr.upload.onload = () => {
                // Transfer complete; server is now parsing with no signal
                // back to us until the response arrives - trickle the rest.
                uploadProgress.trickleTo(95);
            };

            xhr.onload = () => {
                if (xhr.status === 401) {
                    showLoginOverlay('Your session expired. Please log in again.');
                    reject(new Error('Session expired'));
                    return;
                }
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    let detail = "Server error";
                    try { detail = JSON.parse(xhr.responseText).detail || detail; } catch (e) { /* not JSON */ }
                    reject(new Error(detail));
                }
            };
            xhr.onerror = () => reject(new Error("Network error during upload"));

            const formData = new FormData();
            formData.append('file', file);
            xhr.send(formData);
        });
    }

    // Kept in sync with app.py's VIDEO_EXTENSIONS - this is just a fast
    // client-side rejection to skip a wasted upload; the server enforces it
    // for real.
    const VIDEO_EXTENSIONS = new Set([
        '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v',
        '.mpg', '.mpeg', '.3gp', '.ts', '.ogv', '.m2ts', '.vob',
    ]);

    function isVideoFile(filename) {
        const dot = filename.lastIndexOf('.');
        if (dot === -1) return false;
        return VIDEO_EXTENSIONS.has(filename.slice(dot).toLowerCase());
    }

    async function handleFiles(files) {
        if (files.length === 0) return;

        progressStatus.textContent = "Uploading files...";

        for (let file of files) {
            if (isVideoFile(file.name)) {
                showOutputMessage(`[UPLOAD ERROR] Video files are not supported: ${file.name}`, true);
                continue;
            }

            progressStatus.textContent = `Uploading ${file.name}...`;
            uploadProgress.reset();

            try {
                const result = await uploadFileWithProgress(file);
                uploadProgress.complete();
                if (result.status === 'error') {
                    showOutputMessage(`[WARNING] Uploaded but no usable text could be extracted from ${file.name} - see its status in the file list.`, true);
                } else {
                    showOutputMessage(`[SUCCESS] File uploaded and parsed: ${file.name}`);
                }
            } catch (error) {
                uploadProgress.reset();
                console.error("Error uploading file:", error);
                showOutputMessage(`[UPLOAD ERROR] Failed to upload ${file.name}: ${error.message}`, true);
            }
        }

        progressStatus.textContent = "Ready.";
        fetchUploadedFiles();
    }

    async function deleteFile(filename) {
        const confirmed = await showConfirmModal(`Delete "${filename}"? This cannot be undone.`, { title: "Delete File" });
        if (!confirmed) return;

        progressStatus.textContent = `Deleting ${filename}...`;
        try {
            const response = await apiFetch(`/api/files/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("Delete failed on server");
            showOutputMessage(`[SYSTEM] Deleted file: ${filename}`);
            fetchUploadedFiles();
        } catch (error) {
            console.error("Error deleting file:", error);
            showOutputMessage(`[DELETE ERROR] Failed to delete ${filename}: ${error.message}`, true);
        } finally {
            progressStatus.textContent = "Ready.";
        }
    }

    async function enhanceUserPrompt() {
        const promptText = promptInput.value.trim();
        if (!promptText) return;

        // UI State: Loading
        enhanceBtn.disabled = true;
        enhanceSpinner.classList.remove('hidden');
        progressStatus.textContent = "AI Enhancing prompt using minimax-m3:cloud...";
        // Non-streaming single response - no real signal until it's done, so
        // trickle toward a ceiling and snap to 100% on completion.
        enhanceProgress.trickleTo(92);

        try {
            const response = await apiFetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText })
            });

            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || "Refinement failed");
            }

            const data = await response.json();
            promptInput.value = data.enhanced_prompt;
            enhanceProgress.complete();
            showOutputMessage("[AI] Prompt enhanced successfully.");
            updateRunButtonState();
            updateEnhanceButtonState();
        } catch (error) {
            enhanceProgress.reset();
            console.error("Error enhancing prompt:", error);
            showOutputMessage(`[ENHANCE ERROR] Prompt enhancement failed: ${error.message}`, true);
        } finally {
            updateEnhanceButtonState();
            enhanceSpinner.classList.add('hidden');
            progressStatus.textContent = "Ready.";
        }
    }

    async function executeParsingAction() {
        const promptText = promptInput.value.trim();
        if (!promptText || uploadedFiles.length === 0) return;

        // UI State: Loading
        runBtn.disabled = true;
        runSpinner.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
        exportMDBtn.disabled = true;
        exportPDFBtn.disabled = true;
        exportExcelBtn.disabled = true;
        exportWordBtn.disabled = true;
        // Also the export buttons inside the instructions modal - if it's
        // left open from a previous run, they must not export the new run's
        // partial, still-streaming output as if it were final.
        document.querySelectorAll('.export-from-modal-btn').forEach(b => { b.disabled = true; });
        progressStatus.textContent = "Streaming document parsing results...";
        // No knowable total length up front (no chunking/token budget by
        // design - see CLAUDE.md) - trickle toward a ceiling, nudged forward
        // by each real chunk received so it tracks actual stream activity.
        runProgress.trickleTo(85);

        // Clear Output
        outputBody.innerHTML = "";
        accumulatedOutput = "";
        // Cancel any stale pending frame from a previous run
        if (pendingRenderFrame) cancelAnimationFrame(pendingRenderFrame);
        renderScheduled = false;
        pendingRenderFrame = null;

        currentAbortController = new AbortController();

        try {
            const response = await apiFetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText }),
                signal: currentAbortController.signal
            });

            if (!response.ok) {
                const errDetail = await response.json();
                throw new Error(errDetail.detail || "Stream execution failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE lines
                let lines = buffer.split("\n\n");
                buffer = lines.pop(); // save incomplete line

                for (let line of lines) {
                    if (line.trim().startsWith("data: ")) {
                        const jsonStr = line.replace("data: ", "").trim();
                        try {
                            const data = JSON.parse(jsonStr);

                            if (data.error) {
                                showOutputMessage(`[PROCESSING ERROR] ${data.error}`, true);
                            } else if (data.content) {
                                accumulatedOutput += data.content;
                                runProgress.nudge(1);
                                scheduleRender();
                            }

                            if (data.done) {
                                progressStatus.textContent = "Execution completed successfully.";
                            }
                        } catch (e) {
                            console.error("Failed to parse SSE JSON chunk:", e, line);
                        }
                    }
                }
            }

            // Render any remaining buffer
            if (buffer.trim().startsWith("data: ")) {
                const jsonStr = buffer.replace("data: ", "").trim();
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.content) {
                        accumulatedOutput += data.content;
                    }
                } catch(e) {}
            }

            // Flush unconditionally so the final chunk is never dropped by a
            // still-pending animation frame.
            if (pendingRenderFrame) cancelAnimationFrame(pendingRenderFrame);
            pendingRenderFrame = null;
            renderAccumulatedMarkdown();
            runProgress.complete();

        } catch (error) {
            runProgress.reset();
            if (error.name === 'AbortError') {
                showOutputMessage('[CANCELLED] Analysis cancelled by user.');
            } else {
                console.error("Error executing query:", error);
                showOutputMessage(`[STREAM ERROR] ${error.message}`, true);
            }
        } finally {
            runBtn.disabled = false;
            runSpinner.classList.add('hidden');
            cancelBtn.classList.add('hidden');
            currentAbortController = null;
            updateRunButtonState();
            updateExportButtonsState();
        }
    }

    function scheduleRender() {
        if (renderScheduled) return;
        renderScheduled = true;
        pendingRenderFrame = requestAnimationFrame(() => {
            renderScheduled = false;
            pendingRenderFrame = null;
            renderAccumulatedMarkdown();
        });
    }

    function renderAccumulatedMarkdown() {
        // Fail closed: rich rendering requires BOTH marked and DOMPurify.
        // The model can echo uploaded-document content verbatim, so the
        // parsed HTML is untrusted - never innerHTML it unsanitized.
        if (window.marked && window.DOMPurify) {
            const parsed = window.marked.parse(accumulatedOutput);
            outputBody.innerHTML = window.DOMPurify.sanitize(parsed);
        } else {
            outputBody.textContent = accumulatedOutput;
        }
        outputBody.scrollTop = outputBody.scrollHeight;
    }

    function showOutputMessage(msg, isError = false) {
        if (msg && msg.includes('Session expired')) return;
        const p = document.createElement('p');
        p.style.color = isError ? '#dc2626' : '#2563eb';
        p.style.margin = '0.5rem 0';
        p.style.fontWeight = '500';
        p.textContent = msg;

        const placeholder = outputBody.querySelector('.output-placeholder');
        if (placeholder) placeholder.remove();

        outputBody.appendChild(p);
        outputBody.scrollTop = outputBody.scrollHeight;
    }

    function copyOutputToClipboard() {
        const textToCopy = accumulatedOutput || outputBody.innerText;
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const origText = progressStatus.textContent;
                progressStatus.textContent = "Copied output to clipboard!";
                setTimeout(() => {
                    progressStatus.textContent = origText;
                }, 2000);
            })
            .catch(err => {
                console.error("Failed to copy text: ", err);
                showOutputMessage("[SYSTEM ERROR] Failed to copy output to clipboard.", true);
            });
    }

    function exportToMarkdown() {
        if (!accumulatedOutput) return;
        const blob = new Blob([accumulatedOutput], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'document_analysis_report.md');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // Guards against two runSkillExport() calls running concurrently (e.g.
    // starting a PDF export, switching to the Excel tab, starting a second).
    let exportInFlight = false;

    // Streamed export: all three AI-driven exports (PDF/Excel/Word) hit a
    // shared SSE endpoint that pushes real per-stage progress (model prompt
    // -> model generate -> validate script -> run in sandbox -> download)
    // instead of one static "this can take a minute" message. The actual
    // download lands as the terminal event with a base64 file body.
    async function runSkillExport({ endpoint, button, label, filename, extraBody = {} }) {
        if (!accumulatedOutput) return;
        // Only one export at a time - switching modal tabs mid-run must not
        // let a second concurrent export race the shared progress bar and
        // button state.
        if (exportInFlight) return;
        exportInFlight = true;

        // Disable all export buttons during the run - only one can be active
        // at a time and the others shouldn't be clickable while we're mid-flight.
        exportMDBtn.disabled = true;
        exportPDFBtn.disabled = true;
        exportExcelBtn.disabled = true;
        exportWordBtn.disabled = true;
        document.querySelectorAll('.export-from-modal-btn').forEach(b => { b.disabled = true; });
        button.disabled = true;

        progressStatus.textContent = `AI is designing your ${label}...`;
        exportProgress.trickleTo(15);

        try {
            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markdown: accumulatedOutput, ...extraBody })
            });

            if (!response.ok || !response.body) {
                let errText = `${label} generation failed`;
                try {
                    const errDetail = await response.json();
                    errText = errDetail.detail || errText;
                } catch(e) {}
                throw new Error(errText);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let lastMessage = "";

            // SSE chunked read - same parsing pattern as the /api/process
            // streaming endpoint, just looking for our custom {stage, message,
            // pct, file_b64, ...} event shape.
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split("\n\n");
                buffer = lines.pop();

                for (let line of lines) {
                    if (!line.trim().startsWith("data: ")) continue;
                    const jsonStr = line.replace("data: ", "").trim();
                    let evt;
                    try { evt = JSON.parse(jsonStr); }
                    catch (e) { console.error("Bad SSE event:", e, line); continue; }

                    if (evt.error) throw new Error(evt.error);

                    // Snap the bar to the new milestone (server-sent pct is
                    // authoritative for known stages), then trickle a little
                    // beyond it so the bar still moves while we wait for the
                    // next event. The trickle is reset on every event.
                    if (typeof evt.pct === "number") {
                        exportProgress.trickleTo(Math.min(evt.pct + 2, 95));
                    }
                    if (evt.stage === "file") {
                        exportProgress.complete();
                        // Decode the base64 payload and trigger a browser download.
                        const bytes = Uint8Array.from(atob(evt.file_b64), c => c.charCodeAt(0));
                        const blob = new Blob([bytes], { type: evt.mime_type });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.href = url;
                        link.setAttribute('download', evt.filename || filename);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                        showOutputMessage(evt.ai_generated
                            ? `[SYSTEM] ${label} file exported successfully (AI-designed layout).`
                            : `[SYSTEM] ${label} file exported successfully (AI layout unavailable, used standard formatting).`);
                        progressStatus.textContent = "Ready.";
                        return;
                    }
                    if (evt.stage === "error") {
                        throw new Error(evt.message || `${label} generation failed`);
                    }
                    if (evt.message) {
                        lastMessage = evt.message;
                        progressStatus.textContent = evt.message;
                    }
                }
            }

            if (buffer.trim().startsWith("data: ")) {
                const jsonStr = buffer.replace("data: ", "").trim();
                try {
                    const evt = JSON.parse(jsonStr);
                    if (evt.stage === "file") {
                        exportProgress.complete();
                        const bytes = Uint8Array.from(atob(evt.file_b64), c => c.charCodeAt(0));
                        const blob = new Blob([bytes], { type: evt.mime_type });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.href = url;
                        link.setAttribute('download', evt.filename || filename);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                        showOutputMessage(evt.ai_generated
                            ? `[SYSTEM] ${label} file exported successfully (AI-designed layout).`
                            : `[SYSTEM] ${label} file exported successfully (AI layout unavailable, used standard formatting).`);
                        progressStatus.textContent = "Ready.";
                        return;
                    }
                } catch (e) {}
            }

            // Stream ended without a "file" event - treat as failure.
            throw new Error(lastMessage || `${label} generation ended without producing a file`);
        } catch (error) {
            console.error(`Error exporting ${label}:`, error);
            exportProgress.reset();
            showOutputMessage(`[EXPORT ERROR] ${error.message}`, true);
            progressStatus.textContent = "Ready.";
        } finally {
            exportInFlight = false;
            exportMDBtn.disabled = false;
            exportPDFBtn.disabled = false;
            exportExcelBtn.disabled = false;
            exportWordBtn.disabled = false;
            if (button) button.disabled = false;
            updateExportButtonsState();
        }
    }

    // The panel-3 Export PDF/Excel/Word buttons are merged with the Export
    // Instructions modal: clicking one opens the same instructions UI landed
    // on that format's tab, rather than firing an export immediately. If the
    // user doesn't type instructions or attach a template, clicking "Export
    // as <format>" inside the modal still falls back to exactly the old
    // one-click behavior (empty instructions/no template = script pipeline) -
    // nothing about the actual export logic changed, only how you get there.
    function exportToExcel() {
        openExportModal('excel');
    }

    function exportToPDF() {
        openExportModal('pdf');
    }

    function exportToWord() {
        openExportModal('word');
    }

    // ── Export Instructions modal: wiring ────────────────────────────
    exportInstructionsCloseBtn.addEventListener('click', closeExportModal);
    // Overlay click closes the modal (clicking *inside* the box must not).
    exportInstructionsOverlay.addEventListener('click', (e) => {
        if (e.target === exportInstructionsOverlay) closeExportModal();
    });
    // Escape key closes the modal.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !exportInstructionsOverlay.classList.contains('hidden')) {
            closeExportModal();
        }
    });

    exportTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.export-tab');
        if (btn) switchExportTab(btn.dataset.format);
    });

    // Click-outside on the document closes any open export preset dropdown.
    document.addEventListener('click', (e) => {
        for (const fmt of EXPORT_FORMATS) {
            const state = exportState[fmt];
            if (!state.menuOpen) continue;
            const dd = document.getElementById(`export-preset-dropdown-${fmt}`);
            if (dd && !dd.contains(e.target)) closeExportPresetMenu(fmt);
        }
    });

    // Per-format listeners (3x: dropdown toggle, save, delete, enhance, template
    // browse/clear, textarea input capture, Export button).
    for (const fmt of EXPORT_FORMATS) {
        const toggle = document.getElementById(`export-preset-dropdown-toggle-${fmt}`);
        const saveBtn = document.getElementById(`export-save-preset-btn-${fmt}`);
        const deleteBtn = document.getElementById(`export-delete-preset-btn-${fmt}`);
        const enhanceBtn = document.getElementById(`export-enhance-btn-${fmt}`);
        const exportBtn = document.querySelector(`.export-from-modal-btn[data-format="${fmt}"]`);
        const textarea = document.getElementById(`export-instructions-${fmt}`);
        const browseBtn = document.querySelector(`.export-template-browse-btn[data-format="${fmt}"]`);
        const fileInputEl = document.querySelector(`.export-template-input[data-format="${fmt}"]`);
        const clearBtn = document.querySelector(`.export-template-clear-btn[data-format="${fmt}"]`);

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (presetMenuOpen) closePresetMenu();
            for (const f of EXPORT_FORMATS) if (f !== fmt) closeExportPresetMenu(f);
            const state = exportState[fmt];
            if (state.menuOpen) closeExportPresetMenu(fmt);
            else openExportPresetMenu(fmt);
        });
        saveBtn.addEventListener('click', () => saveExportPreset(fmt));
        deleteBtn.addEventListener('click', () => deleteSelectedExportPreset(fmt));
        enhanceBtn.addEventListener('click', () => enhanceExportInstructions(fmt));
        exportBtn.addEventListener('click', () => runExportFromModal(fmt));
        textarea.addEventListener('input', () => { exportState[fmt].instructions = textarea.value; });
        // Hidden file input - "Choose file" button triggers it; the change handler
        // pushes the actual upload.
        browseBtn.addEventListener('click', () => fileInputEl.click());
        fileInputEl.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) uploadExportTemplate(fmt, e.target.files[0]);
            e.target.value = ''; // allow re-uploading the same file
        });
        clearBtn.addEventListener('click', () => clearExportTemplate(fmt));
    }
});
