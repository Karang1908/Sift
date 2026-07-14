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
    }
    return response;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str === null || str === undefined ? '' : String(str);
    return div.innerHTML;
}

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleString();
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
    });
});

// ── Users ────────────────────────────────────────────────────────────

async function loadUsers() {
    const response = await apiFetch('/api/admin/users');
    if (!response.ok) return;
    const users = await response.json();

    const usersList = document.getElementById('users-list');
    usersList.innerHTML = users.map((u) => `
        <div class="admin-user-card">
            ${escapeHtml(u.username)}
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
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No activity yet.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((e) => `
        <tr>
            <td>${formatTime(e.ts)}</td>
            <td>${escapeHtml(e.username)}</td>
            <td>${escapeHtml(e.action)}</td>
            <td>${escapeHtml(formatActivityDetails(e))}</td>
        </tr>
    `).join('');
}

document.getElementById('activity-refresh').addEventListener('click', refreshActivity);
document.getElementById('activity-user-filter').addEventListener('change', refreshActivity);
document.getElementById('activity-action-filter').addEventListener('change', refreshActivity);

// ── Uploads ──────────────────────────────────────────────────────────

async function refreshUploads() {
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
            <td>${formatTime(e.ts)}</td>
            <td>${escapeHtml(e.username)}</td>
            <td>${escapeHtml(e.filename)}</td>
            <td>${formatSize(e.size)}</td>
            <td><span class="status-badge ${e.still_live ? 'parsed' : 'pending'}">${e.still_live ? 'live' : 'deleted'}</span></td>
            <td><a class="btn btn-secondary btn-sm" href="/api/admin/uploads/${encodeURIComponent(e.username)}/${encodeURIComponent(e.record_id)}/download">Download</a></td>
        </tr>
    `).join('');
}

document.getElementById('uploads-refresh').addEventListener('click', refreshUploads);
document.getElementById('uploads-user-filter').addEventListener('change', refreshUploads);

// ── Analysis runs ────────────────────────────────────────────────────

async function refreshAnalysis() {
    const username = document.getElementById('analysis-user-filter').value;
    const params = new URLSearchParams();
    if (username) params.set('username', username);

    const tbody = document.getElementById('analysis-tbody');
    const response = await apiFetch(`/api/admin/analysis?${params.toString()}`);
    if (!response.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Failed to load analysis runs.</td></tr>';
        return;
    }
    const entries = await response.json();
    if (entries.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No analysis runs archived yet.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((e) => {
        const prompt = e.prompt || '';
        const truncated = prompt.length > 80 ? `${prompt.slice(0, 80)}…` : prompt;
        return `
        <tr>
            <td>${formatTime(e.ts)}</td>
            <td>${escapeHtml(e.username)}</td>
            <td>${escapeHtml(truncated)}</td>
            <td>${(e.doc_filenames || []).length}</td>
            <td>
                <span class="status-badge ${e.complete ? 'parsed' : 'error'}">${e.complete ? 'complete' : 'incomplete'}</span>
                <button type="button" class="btn btn-secondary btn-sm" data-username="${escapeHtml(e.username)}" data-record="${escapeHtml(e.record_id)}" onclick="viewAnalysis(this)">View</button>
            </td>
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
    document.getElementById('analysis-modal-content').textContent = data.content;
    document.getElementById('analysis-modal-overlay').classList.remove('hidden');
}

document.getElementById('analysis-modal-close').addEventListener('click', () => {
    document.getElementById('analysis-modal-overlay').classList.add('hidden');
});

// ── Exports ──────────────────────────────────────────────────────────

async function refreshExports() {
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
            <td>${formatTime(e.ts)}</td>
            <td>${escapeHtml(e.username)}</td>
            <td>${escapeHtml(e.format)}</td>
            <td>${escapeHtml(e.filename)}</td>
            <td>${e.ai_generated ? 'AI-designed' : 'deterministic'}</td>
            <td><a class="btn btn-secondary btn-sm" href="/api/admin/exports/${encodeURIComponent(e.username)}/${encodeURIComponent(e.record_id)}/download">Download</a></td>
        </tr>
    `).join('');
}

document.getElementById('exports-refresh').addEventListener('click', refreshExports);
document.getElementById('exports-user-filter').addEventListener('change', refreshExports);

checkAuth();
