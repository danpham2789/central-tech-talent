// ===== TRANY CODE CONTEST - Frontend =====
const API = '';
let currentContestId = null;
let currentParticipantId = null;
let currentQuestionId = null;
let contestData = null;
let adminPassword = null;

// ===== UTILITIES =====
function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

async function api(path, options = {}) {
    const headers = { ...options.headers };
    if (adminPassword) headers['x-admin-password'] = adminPassword;
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(API + path, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${id}`).classList.add('active');
    window.scrollTo(0, 0);
}

function goHome() {
    showPage('landing');
    currentContestId = null;
    currentParticipantId = null;
    contestData = null;
    loadContests();
}

// ===== LANDING PAGE =====
async function loadContests() {
    const list = document.getElementById('contests-list');
    try {
        const contests = await api('/api/contests');
        if (!contests.length) {
            list.innerHTML = '<div class="empty-state"><h3>No active contests</h3><p>Check back later for new contests!</p></div>';
            return;
        }
        list.innerHTML = contests.map(c => `
            <div class="contest-card" onclick="selectContest('${c.id}')">
                <h3>${esc(c.title)}</h3>
                <p>${esc(c.description || 'Solve coding challenges and earn points!')}</p>
                <div class="contest-meta">
                    <span>📝 ${c.questionCount} problems</span>
                    <span>⏱ ${c.time_limit_minutes} min</span>
                    <span>👥 ${c.participantCount} joined</span>
                </div>
                <button class="btn btn-primary">Join Contest →</button>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = `<div class="empty-state"><h3>Error loading contests</h3><p>${e.message}</p></div>`;
    }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function selectContest(id) {
    currentContestId = id;
    const cards = document.querySelectorAll('.contest-card');
    // Find the title from the card
    cards.forEach(card => {
        if (card.onclick.toString().includes(id)) {
            document.getElementById('join-contest-title').textContent = card.querySelector('h3').textContent;
        }
    });
    showPage('join');
}

// ===== JOIN CONTEST =====
async function joinContest() {
    const fullName = document.getElementById('join-name').value.trim();
    const email = document.getElementById('join-email').value.trim();
    const phone = document.getElementById('join-phone').value.trim();
    if (!fullName || !email || !phone) { toast('Please fill in all fields', 'error'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast('Please enter a valid email', 'error'); return; }
    try {
        const res = await api('/api/join', { method: 'POST', body: { contestId: currentContestId, fullName, email, phone } });
        currentParticipantId = res.participantId;
        toast(res.message, 'success');
        loadContest();
    } catch (e) { toast(e.message, 'error'); }
}

// ===== LOAD CONTEST =====
async function loadContest() {
    try {
        const data = await api(`/api/contests/${currentContestId}`);
        contestData = data;
        document.getElementById('contest-title-bar').textContent = data.contest.title;
        document.getElementById('participant-name-badge').textContent = document.getElementById('join-name').value.trim() || 'Contestant';
        renderQuestionList(data.questions);
        if (data.questions.length > 0) selectQuestion(data.questions[0].id);
        showPage('contest');
        loadParticipantData();
    } catch (e) { toast(e.message, 'error'); }
}

function renderQuestionList(questions) {
    const list = document.getElementById('question-list');
    list.innerHTML = questions.map((q, i) => `
        <div class="q-item" id="q-item-${q.id}" data-id="${q.id}" onclick="selectQuestion('${q.id}')">
            <div class="q-status"></div>
            <span>${String.fromCharCode(65 + i)}. ${esc(q.title)}</span>
        </div>
    `).join('');
}

async function loadParticipantData() {
    try {
        const data = await api(`/api/participant/${currentParticipantId}`);
        document.getElementById('total-score').textContent = data.participant.total_score;
        // Update question statuses
        if (contestData) {
            contestData.questions.forEach(q => {
                const subs = data.submissions.filter(s => s.question_id === q.id);
                const best = subs.reduce((b, s) => s.score > (b?.score || 0) ? s : b, null);
                const item = document.getElementById(`q-item-${q.id}`);
                if (item) {
                    item.classList.remove('solved', 'partial');
                    if (best) {
                        if (best.score >= q.points) item.classList.add('solved');
                        else if (best.score > 0) item.classList.add('partial');
                    }
                }
            });
        }
    } catch (e) { /* ignore */ }
}

// ===== SELECT QUESTION =====
function selectQuestion(qId) {
    currentQuestionId = qId;
    const q = contestData.questions.find(q => q.id === qId);
    if (!q) return;
    document.querySelectorAll('.q-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`q-item-${qId}`);
    if (activeItem) activeItem.classList.add('active');
    document.getElementById('question-title').textContent = q.title;
    document.getElementById('question-points-badge').textContent = q.points + ' pts';
    document.getElementById('question-description').textContent = q.description || '';
    // PDF
    const pdfSection = document.getElementById('pdf-section');
    if (q.pdf_filename) {
        pdfSection.style.display = 'block';
        document.getElementById('pdf-link').href = `/uploads/${q.pdf_filename}`;
        document.getElementById('pdf-viewer').src = `/uploads/${q.pdf_filename}`;
    } else {
        pdfSection.style.display = 'none';
    }
    // Clear editor and results
    document.getElementById('results-panel').style.display = 'none';
    document.getElementById('past-submissions').style.display = 'none';
    // Load past submissions for this question
    loadQuestionSubmissions(qId);
}

async function loadQuestionSubmissions(qId) {
    try {
        const data = await api(`/api/participant/${currentParticipantId}`);
        const subs = data.submissions.filter(s => s.question_id === qId);
        const panel = document.getElementById('past-submissions');
        const list = document.getElementById('submissions-list');
        if (subs.length > 0) {
            panel.style.display = 'block';
            list.innerHTML = subs.map(s => {
                const date = new Date(s.submitted_at).toLocaleTimeString();
                return `<div class="sub-item">
                    <span>${s.language} — ${date}</span>
                    <span class="sub-status ${s.status}">${s.status.toUpperCase()} (${s.score} pts)</span>
                </div>`;
            }).join('');
        } else { panel.style.display = 'none'; }
    } catch (e) { /* ignore */ }
}

// ===== SUBMIT CODE =====
async function submitCode() {
    const code = document.getElementById('code-editor').value.trim();
    const language = document.getElementById('language-select').value;
    if (!code) { toast('Write some code first!', 'error'); return; }
    if (!currentQuestionId) { toast('Select a question', 'error'); return; }
    const btn = document.getElementById('submit-btn');
    btn.classList.add('loading');
    btn.textContent = 'Judging...';
    try {
        const res = await api('/api/submit', {
            method: 'POST',
            body: { participantId: currentParticipantId, questionId: currentQuestionId, code, language }
        });
        renderTestResults(res);
        loadParticipantData();
        loadQuestionSubmissions(currentQuestionId);
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.textContent = '▶ Submit Code';
    }
}

function renderTestResults(res) {
    const panel = document.getElementById('results-panel');
    const list = document.getElementById('test-results-list');
    const verdict = document.getElementById('submission-verdict');
    panel.style.display = 'block';
    if (res.testResults && res.testResults.length > 0) {
        list.innerHTML = res.testResults.map((tr, i) => `
            <div class="test-result ${tr.passed ? 'passed' : 'failed'}">
                <span class="test-badge ${tr.passed ? 'pass' : 'fail'}">${tr.passed ? 'PASS' : 'FAIL'}</span>
                <div class="test-detail">
                    <div><span class="test-label">Test #${tr.testCase}</span></div>
                    ${tr.input !== 'Hidden' ? `
                        <div class="test-label">Input</div><pre>${esc(tr.input)}</pre>
                        <div class="test-label">Expected</div><pre>${esc(tr.expectedOutput)}</pre>
                        <div class="test-label">Your Output</div><pre>${esc(tr.actualOutput)}</pre>
                    ` : '<div style="color:var(--text-3)">Hidden test case — ' + (tr.passed ? '✅ Passed' : '❌ Failed') + '</div>'}
                    ${tr.error ? `<div class="test-label" style="color:var(--danger)">Error</div><pre style="color:var(--danger)">${esc(tr.error)}</pre>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p style="color:var(--text-3);padding:12px">No test cases for this problem.</p>';
    }
    const verdictClass = res.status === 'accepted' ? 'verdict-accepted' : res.status === 'partial' ? 'verdict-partial' : 'verdict-wrong';
    const verdictText = res.status === 'accepted' ? `✅ Accepted! (+${res.score} pts)` : res.status === 'partial' ? `⚠️ Partial — ${res.passedCount}/${res.totalTests} passed (+${res.score} pts)` : `❌ Wrong Answer — ${res.passedCount || 0}/${res.totalTests || 0} passed`;
    verdict.className = `submission-verdict ${verdictClass}`;
    verdict.textContent = verdictText;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== FINISH CONTEST =====
async function finishContest() {
    if (!confirm('Finish the contest and get your point code? You can still resubmit after.')) return;
    try {
        const res = await api('/api/complete', { method: 'POST', body: { participantId: currentParticipantId } });
        document.getElementById('final-score').textContent = res.totalScore;
        document.getElementById('max-score').textContent = res.maxScore;
        document.getElementById('point-code-value').textContent = res.pointCode;
        document.getElementById('code-in-instructions').textContent = `!redeem ${res.pointCode}`;
        // Show Discord invite link if configured
        const joinSection = document.getElementById('discord-join-section');
        if (res.discordInvite) {
            joinSection.style.display = 'block';
            document.getElementById('discord-join-link').href = res.discordInvite;
        } else {
            joinSection.style.display = 'none';
        }
        showPage('code');
    } catch (e) { toast(e.message, 'error'); }
}

function copyPointCode() {
    const code = document.getElementById('point-code-value').textContent;
    navigator.clipboard.writeText(code).then(() => toast('Point code copied! 📋', 'success'));
}

function copyRedeemCommand() {
    const cmd = document.getElementById('code-in-instructions').textContent;
    navigator.clipboard.writeText(cmd).then(() => toast('Command copied! Paste it in Discord 🎉', 'success'));
}

// ===== ADMIN =====
function showAdminLogin() {
    document.getElementById('admin-login-modal').classList.add('active');
    document.getElementById('admin-password').focus();
}

async function adminLogin() {
    const pw = document.getElementById('admin-password').value;
    try {
        await api('/api/admin/login', { method: 'POST', body: { password: pw } });
        adminPassword = pw;
        document.getElementById('admin-login-modal').classList.remove('active');
        showPage('admin');
        loadAdminData();
    } catch (e) { toast('Wrong password', 'error'); }
}

function showCreateContest() {
    document.getElementById('create-contest-modal').classList.add('active');
}

async function createContest() {
    const title = document.getElementById('cc-title').value.trim();
    const description = document.getElementById('cc-desc').value.trim();
    const timeLimitMinutes = parseInt(document.getElementById('cc-time').value) || 120;
    if (!title) { toast('Enter a title', 'error'); return; }
    try {
        await api('/api/admin/contests', { method: 'POST', body: { title, description, timeLimitMinutes } });
        document.getElementById('create-contest-modal').classList.remove('active');
        toast('Contest created!', 'success');
        loadAdminData();
    } catch (e) { toast(e.message, 'error'); }
}

let activeAdminContestId = null;
async function loadAdminData() {
    try {
        const contests = await api('/api/admin/contests');
        const contestList = document.getElementById('admin-contests-list');
        if (!contests.length) {
            contestList.innerHTML = '<div class="empty-state"><p>No contests yet</p></div>';
        } else {
            contestList.innerHTML = contests.map(c => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${esc(c.title)}</h4>
                        <p>${c.questions.length} questions · ${c.participants.length} participants · ${c.is_active ? '✅ Active' : '🔴 Inactive'}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn btn-outline btn-sm" onclick="openContestDetail('${c.id}')">Manage</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteContest('${c.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }
        // Point codes
        const codes = await api('/api/admin/codes');
        const codeList = document.getElementById('admin-codes-list');
        if (!codes.length) {
            codeList.innerHTML = '<div class="empty-state"><p>No point codes generated yet</p></div>';
        } else {
            codeList.innerHTML = codes.map(c => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4><span class="code-tag">${c.code}</span></h4>
                        <p>${esc(c.participant_name)} (${esc(c.participant_email)}) — Score: ${c.total_score}/${c.max_score}</p>
                    </div>
                    <span class="redeemed-tag ${c.redeemed ? 'yes' : 'no'}">${c.redeemed ? '✅ Redeemed' + (c.discord_username ? ' by ' + c.discord_username : '') : '⏳ Pending'}</span>
                </div>
            `).join('');
        }
    } catch (e) { toast(e.message, 'error'); }
    // Load settings
    try {
        const settings = await api('/api/admin/settings');
        document.getElementById('setting-discord-invite').value = settings.discord_invite || '';
        document.getElementById('setting-bot-token').value = settings.bot_token ? '••••••' : ''; // Just a visual placeholder
        document.getElementById('setting-channel-id').value = settings.channel_id || '';
    } catch (e) { /* settings not saved yet */ }
}

async function saveSettings() {
    const discord_invite = document.getElementById('setting-discord-invite').value.trim();
    const raw_bot_token = document.getElementById('setting-bot-token').value.trim();
    const channel_id = document.getElementById('setting-channel-id').value.trim();
    
    // Only send bot token if they changed it (not the placeholder)
    const body = { discord_invite, channel_id };
    if (raw_bot_token && raw_bot_token !== '••••••') {
        body.bot_token = raw_bot_token;
    }

    try {
        await api('/api/admin/settings', { method: 'POST', body });
        toast('Settings saved! ✅', 'success');
    } catch (e) { toast(e.message, 'error'); }
}

async function openContestDetail(contestId) {
    activeAdminContestId = contestId;
    const detail = document.getElementById('admin-contest-detail');
    detail.style.display = 'block';
    try {
        const contests = await api('/api/admin/contests');
        const c = contests.find(c => c.id === contestId);
        if (!c) return;
        document.getElementById('admin-detail-title').textContent = c.title;
        const qList = document.getElementById('admin-questions-list');
        if (!c.questions.length) {
            qList.innerHTML = '<div class="empty-state"><p>No questions yet — add one below</p></div>';
        } else {
            qList.innerHTML = c.questions.map((q, i) => {
                const tc = q.test_cases || [];
                return `<div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${String.fromCharCode(65 + i)}. ${esc(q.title)} — ${q.points} pts</h4>
                        <p>${tc.length} test cases · ${q.pdf_filename ? '📄 PDF attached' : 'No PDF'}</p>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Delete</button>
                </div>`;
            }).join('');
        }
        detail.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { toast(e.message, 'error'); }
}

async function addQuestion() {
    if (!activeAdminContestId) { toast('Select a contest first', 'error'); return; }
    const title = document.getElementById('q-title').value.trim();
    if (!title) { toast('Enter a title', 'error'); return; }
    const form = new FormData();
    form.append('title', title);
    form.append('description', document.getElementById('q-desc').value.trim());
    form.append('points', document.getElementById('q-points').value);
    form.append('sortOrder', document.getElementById('q-order').value);
    form.append('testCases', document.getElementById('q-testcases').value.trim() || '[]');
    const pdfFile = document.getElementById('q-pdf').files[0];
    if (pdfFile) form.append('pdf', pdfFile);
    try {
        await api(`/api/admin/contests/${activeAdminContestId}/questions`, { method: 'POST', body: form, headers: {} });
        toast('Question added!', 'success');
        document.getElementById('q-title').value = '';
        document.getElementById('q-desc').value = '';
        document.getElementById('q-testcases').value = '';
        document.getElementById('q-pdf').value = '';
        openContestDetail(activeAdminContestId);
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteContest(id) {
    if (!confirm('Delete this contest and ALL data?')) return;
    try { await api(`/api/admin/contests/${id}`, { method: 'DELETE' }); toast('Deleted', 'success'); loadAdminData(); }
    catch (e) { toast(e.message, 'error'); }
}

async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try { await api(`/api/admin/questions/${id}`, { method: 'DELETE' }); toast('Deleted', 'success'); openContestDetail(activeAdminContestId); }
    catch (e) { toast(e.message, 'error'); }
}

// ===== TAB KEY IN EDITOR =====
document.addEventListener('DOMContentLoaded', () => {
    loadContests();
    const editor = document.getElementById('code-editor');
    if (editor) {
        editor.addEventListener('keydown', e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = editor.selectionStart, end = editor.selectionEnd;
                editor.value = editor.value.substring(0, s) + '    ' + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = s + 4;
            }
        });
    }
});
