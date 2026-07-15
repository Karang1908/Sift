// Sift Admin Panel - standalone page, no shared state with script.js.
// Reads only the permanent audit_log archive/activity log (see audit_log.py
// and the /api/admin/* routes in app.py) - never a user's own live
// workspace, so a file a user deleted from their own view still shows up
// here.

const headerUser = document.getElementById('header-user');
const headerUsername = document.getElementById('header-username');
const logoutBtn = document.getElementById('logout-btn');
const deniedEl = document.getElementById('admin-denied');
const mainEl = document.getElementById('admin-main');

const tabs = document.querySelectorAll('.admin-tab');
const sections = document.querySelectorAll('.admin-section');

async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        window.location.href = '/static/index.html';
        throw new Error('Unauthorized');
    }
    return response;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleString(undefined, { hour12: false });
}

function formatSize(bytes) {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Auth ─────────────────────────────────────────────────────────────

async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            window.location.href = '/static/index.html';
            return;
        }
        const data = await response.json();
        headerUser.classList.remove('hidden');
        headerUsername.textContent = data.username;

        if (!data.is_admin) {
            deniedEl.classList.remove('hidden');
            mainEl.classList.add('hidden');
            return;
        }

        deniedEl.classList.add('hidden');
        mainEl.classList.remove('hidden');
        await loadUsers();
        await refreshActivity();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/static/index.html';
    }
}

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
    window.location.href = '/static/index.html';
});

// ── Tabs ─────────────────────────────────────────────────────────────

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        sections.forEach((s) => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        if (tab.dataset.tab === 'uploads') refreshUploads();
        if (tab.dataset.tab === 'analysis') refreshAnalysis();
        if (tab.dataset.tab === 'exports') refreshExports();
        if (tab.dataset.tab === 'presets') refreshPresets();
    });
});

// ── Users ────────────────────────────────────────────────────────────

async function loadUsers() {
    const response = await apiFetch('/api/admin/users');
    if (!response.ok) return;
    const users = await response.json();

    const usersList = document.getElementById('users-list');
    usersList.innerHTML = users.map((u) => `
        <div class="admin-user-card" style="min-width: 200px; flex: 0 1 auto; gap: 0.5rem; flex-direction: row; align-items: center; justify-content: space-between; padding: 0.6rem 1rem;">
            <strong>${escapeHtml(u.username)}</strong>
            ${u.is_admin ? '<span class="role">admin</span>' : ''}
        </div>
    `).join('');

    document.querySelectorAll('.user-filter').forEach((select) => {
        const current = select.value;
        select.innerHTML = '<option value="">All users</option>' +
            users.map((u) => `<option value="${escapeHtml(u.username)}">${escapeHtml(u.username)}</option>`).join('');
        select.value = current;
    });
}

// ── Activity ─────────────────────────────────────────────────────────

function formatActivityDetails(entry) {
    const known = new Set(['ts', 'username', 'action']);
    return Object.keys(entry)
        .filter((key) => !known.has(key))
        .map((key) => `${key}=${entry[key]}`)
        .join(', ');
}

async function refreshActivity() {
    await loadUsers();
    const username = document.getElementById('activity-user-filter').value;
    const action = document.getElementById('activity-action-filter').value;
    const params = new URLSearchParams();
    if (username) params.set('username', username);
    if (action) params.set('action', action);

    const tbody = document.getElementById('activity-tbody');
    const response = await apiFetch(`/api/admin/activity?${params.toString()}`);
    if (!response.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Failed to load activity.</td></tr>';
        return;
    }
    const entries = await response.json();
    if (entries.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No activity logged yet.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((e) => `
        <tr>
            <td class="col-time">${formatTime(e.ts)}</td>
            <td class="col-user">${escapeHtml(e.username)}</td>
            <td class="col-action-type"><span class="status-badge pending" style="width: 100%; text-align: center; box-sizing: border-box;">${escapeHtml(e.action)}</span></td>
            <td class="col-text-wrap">${escapeHtml(formatActivityDetails(e))}</td>
        </tr>
    `).join('');
}

document.getElementById('activity-refresh').addEventListener('click', refreshActivity);
document.getElementById('activity-user-filter').addEventListener('change', refreshActivity);
document.getElementById('activity-action-filter').addEventListener('change', refreshActivity);

// ── Uploads ──────────────────────────────────────────────────────────

async function refreshUploads() {
    await loadUsers();
    const username = document.getElementById('uploads-user-filter').value;
    const params = new URLSearchParams();
    if (username) params.set('username', username);

    const tbody = document.getElementById('uploads-tbody');
    const response = await apiFetch(`/api/admin/uploads?${params.toString()}`);
    if (!response.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Failed to load uploads.</td></tr>';
        return;
    }
    const entries = await response.json();
    if (entries.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No uploads archived yet.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((e) => `
        <tr>
            <td class="col-time">${formatTime(e.ts)}</td>
            <td class="col-user">${escapeHtml(e.username)}</td>
            <td class="col-text" title="${escapeHtml(e.filename)}">${escapeHtml(e.filename)}</td>
            <td class="col-number">${formatSize(e.size)}</td>
            <td class="col-action-type"><span class="status-badge ${e.still_live ? 'parsed' : 'pending'}" style="width: 100%; text-align: center; box-sizing: border-box;">${e.still_live ? 'live' : 'deleted'}</span></td>
            <td class="col-btn"><a class="btn btn-secondary btn-sm" href="/api/admin/uploads/${encodeURIComponent(e.username)}/${encodeURIComponent(e.record_id)}/download" style="padding: 2px 8px; font-size: 0.75rem;">Download</a></td>
        </tr>
    `).join('');
}

document.getElementById('uploads-refresh').addEventListener('click', refreshUploads);
document.getElementById('uploads-user-filter').addEventListener('change', refreshUploads);

// ── Analysis runs ────────────────────────────────────────────────────

async function refreshAnalysis() {
    await loadUsers();
    const username = document.getElementById('analysis-user-filter').value;
    const params = new URLSearchParams();
    if (username) params.set('username', username);

    const tbody = document.getElementById('analysis-tbody');
    const response = await apiFetch(`/api/admin/analysis?${params.toString()}`);
    if (!response.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Failed to load analysis runs.</td></tr>';
        return;
    }
    const entries = await response.json();
    if (entries.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No analysis runs archived yet.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((e) => {
        const prompt = e.prompt || '';
        const truncated = prompt.length > 80 ? `${prompt.slice(0, 80)}…` : prompt;
        return `
        <tr>
            <td class="col-time">${formatTime(e.ts)}</td>
            <td class="col-user">${escapeHtml(e.username)}</td>
            <td class="col-text" title="${escapeHtml(prompt)}">${escapeHtml(truncated)}</td>
            <td class="col-number">${(e.doc_filenames || []).length}</td>
            <td class="col-action-type"><span class="status-badge ${e.complete ? 'parsed' : 'error'}" style="width: 100%; text-align: center; box-sizing: border-box;">${e.complete ? 'complete' : 'incomplete'}</span></td>
            <td class="col-btn"><button type="button" class="btn btn-secondary btn-sm" data-username="${escapeHtml(e.username)}" data-record="${escapeHtml(e.record_id)}" onclick="viewAnalysis(this)" style="padding: 2px 8px; font-size: 0.75rem;">View</button></td>
        </tr>
        `;
    }).join('');
}

document.getElementById('analysis-refresh').addEventListener('click', refreshAnalysis);
document.getElementById('analysis-user-filter').addEventListener('change', refreshAnalysis);

async function viewAnalysis(btn) {
    const username = btn.dataset.username;
    const recordId = btn.dataset.record;
    const response = await apiFetch(`/api/admin/analysis/${encodeURIComponent(username)}/${encodeURIComponent(recordId)}`);
    if (!response.ok) return;
    const data = await response.json();
    document.getElementById('analysis-modal-title').textContent = `${username} — ${formatTime(data.ts)}`;
    document.getElementById('analysis-modal-prompt').textContent = `Prompt: ${data.prompt}`;
    document.getElementById('analysis-modal-content').textContent = data.content || '(No output content generated)';
    document.getElementById('analysis-modal-overlay').classList.remove('hidden');
}

document.getElementById('analysis-modal-close').addEventListener('click', () => {
    document.getElementById('analysis-modal-overlay').classList.add('hidden');
});

// ── Exports ──────────────────────────────────────────────────────────

async function refreshExports() {
    await loadUsers();
    const username = document.getElementById('exports-user-filter').value;
    const params = new URLSearchParams();
    if (username) params.set('username', username);

    const tbody = document.getElementById('exports-tbody');
    const response = await apiFetch(`/api/admin/exports?${params.toString()}`);
    if (!response.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Failed to load exports.</td></tr>';
        return;
    }
    const entries = await response.json();
    if (entries.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No exports archived yet.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((e) => `
        <tr>
            <td class="col-time">${formatTime(e.ts)}</td>
            <td class="col-user">${escapeHtml(e.username)}</td>
            <td class="col-action-type"><span class="status-badge parsed" style="width: 100%; text-align: center; box-sizing: border-box;">${escapeHtml(e.format.toUpperCase())}</span></td>
            <td class="col-text" title="${escapeHtml(e.filename)}">${escapeHtml(e.filename)}</td>
            <td class="col-action-type"><span class="status-badge pending" style="width: 100%; text-align: center; box-sizing: border-box; background-color: rgba(193, 95, 60, 0.12); color: #d87757; border-color: rgba(193, 95, 60, 0.25);">${e.ai_generated ? 'AI-designed' : 'deterministic'}</span></td>
            <td class="col-btn"><a class="btn btn-secondary btn-sm" href="/api/admin/exports/${encodeURIComponent(e.username)}/${encodeURIComponent(e.record_id)}/download" style="padding: 2px 8px; font-size: 0.75rem;">Download</a></td>
        </tr>
    `).join('');
}

document.getElementById('exports-refresh').addEventListener('click', refreshExports);
document.getElementById('exports-user-filter').addEventListener('change', refreshExports);

// ── Presets & Templates ──────────────────────────────────────────────

async function refreshPresets() {
    await loadUsers();
    const userFilter = document.getElementById('presets-user-filter').value;
    const tbody = document.getElementById('presets-tbody');
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Loading...</td></tr>';
    
    const response = await apiFetch('/api/admin/users');
    if (!response.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Failed to load presets.</td></tr>';
        return;
    }
    const users = await response.json();
    
    let allPresets = [];
    for (const u of users) {
        if (userFilter && u.username !== userFilter) continue;
        
        // Add prompt presets
        if (u.prompt_presets) {
            u.prompt_presets.forEach((p) => {
                allPresets.push({
                    username: u.username,
                    type: 'Prompt',
                    name: p.name,
                    details: p.prompt,
                    template_filename: null,
                    template_original_name: null
                });
            });
        }
        
        // Add export presets
        if (u.export_presets) {
            u.export_presets.forEach((ep) => {
                allPresets.push({
                    username: u.username,
                    type: `Export (${ep.format.toUpperCase()})`,
                    name: ep.name,
                    details: ep.instructions,
                    template_filename: ep.template_filename,
                    template_original_name: ep.template_original_name
                });
            });
        }
    }
    
    if (allPresets.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No presets found.</td></tr>';
        return;
    }
    
    allPresets.sort((a, b) => {
        if (a.username !== b.username) return a.username.localeCompare(b.username);
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
    });
    
    tbody.innerHTML = allPresets.map((p) => {
        let templateCell = '<span class="empty-value" style="color: #6d6961; font-style: italic;">none</span>';
        if (p.template_filename) {
            const dlName = p.template_original_name || p.template_filename;
            const dlUrl = `/api/admin/export-templates/${encodeURIComponent(p.username)}/${encodeURIComponent(p.template_filename)}/download?original_name=${encodeURIComponent(dlName)}`;
            templateCell = `<a class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 0.75rem; border-radius: 4px; border-color: #3d3932;" href="${dlUrl}" download="${escapeHtml(dlName)}">
                <svg class="icon" style="width: 12px; height: 12px; margin-right: 2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                ${escapeHtml(dlName)}
            </a>`;
        }
        return `
            <tr>
                <td class="col-user"><strong>${escapeHtml(p.username)}</strong></td>
                <td class="col-action-type"><span class="status-badge ${p.type.startsWith('Prompt') ? 'pending' : 'parsed'}" style="width: 100%; text-align: center; box-sizing: border-box; font-size: 0.72rem; padding: 1px 4px;">${escapeHtml(p.type)}</span></td>
                <td class="col-action-type" style="font-weight: 500;">${escapeHtml(p.name)}</td>
                <td class="col-text" title="${escapeHtml(p.details)}">
                    ${escapeHtml(p.details)}
                </td>
                <td class="col-text">${templateCell}</td>
            </tr>
        `;
    }).join('');
}

document.getElementById('presets-refresh').addEventListener('click', refreshPresets);
document.getElementById('presets-user-filter').addEventListener('change', refreshPresets);

checkAuth();
