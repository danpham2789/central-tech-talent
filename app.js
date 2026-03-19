// ===== TRANY EXAM - Core Application Logic =====

// ===== DATA LAYER =====
const DB = {
    getUsers: () => JSON.parse(localStorage.getItem('trany_users') || '[]'),
    setUsers: (u) => localStorage.setItem('trany_users', JSON.stringify(u)),
    getExams: () => JSON.parse(localStorage.getItem('trany_exams') || '[]'),
    setExams: (e) => localStorage.setItem('trany_exams', JSON.stringify(e)),
    getResults: () => JSON.parse(localStorage.getItem('trany_results') || '[]'),
    setResults: (r) => localStorage.setItem('trany_results', JSON.stringify(r)),
    getStreaks: () => JSON.parse(localStorage.getItem('trany_streaks') || '{}'),
    setStreaks: (s) => localStorage.setItem('trany_streaks', JSON.stringify(s)),
    getChat: () => JSON.parse(localStorage.getItem('trany_chat') || '[]'),
    setChat: (c) => localStorage.setItem('trany_chat', JSON.stringify(c)),
    getCurrentUser: () => JSON.parse(sessionStorage.getItem('trany_current_user') || 'null'),
    setCurrentUser: (u) => sessionStorage.setItem('trany_current_user', JSON.stringify(u)),
    clearCurrentUser: () => sessionStorage.removeItem('trany_current_user'),
};

let currentPage = 'dashboard';
let questionCounter = 0;
let examTimerInterval = null;
let currentExamId = null;
let examTimeRemaining = 0;
let chatPollInterval = null;
let cvDataUrl = null;

// ===== STREAK SYSTEM =====
function getDateKey(d) { return (d || new Date()).toISOString().split('T')[0]; }

function getStreakMultiplier(streak) {
    if (streak >= 30) return 2.5;
    if (streak >= 14) return 2.0;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.2;
    return 1.0;
}

function getStreakMultiplierLabel(streak) {
    const m = getStreakMultiplier(streak);
    return m === 1.0 ? '1x' : m + 'x';
}

function getUserStreak(userId) {
    const streaks = DB.getStreaks();
    return streaks[userId] || { count: 0, lastDate: null, history: {} };
}

function recordStreakActivity(userId) {
    const streaks = DB.getStreaks();
    const today = getDateKey();
    let s = streaks[userId] || { count: 0, lastDate: null, history: {} };
    if (s.lastDate === today) { streaks[userId] = s; DB.setStreaks(streaks); return s; }
    const yesterday = getDateKey(new Date(Date.now() - 86400000));
    if (s.lastDate === yesterday) { s.count += 1; }
    else if (s.lastDate !== today) { s.count = 1; }
    s.lastDate = today;
    s.history[today] = true;
    streaks[userId] = s;
    DB.setStreaks(streaks);
    return s;
}

function updateStreakUI() {
    const user = DB.getCurrentUser();
    if (!user) return;
    const s = getUserStreak(user.id);
    const today = getDateKey();
    const yesterday = getDateKey(new Date(Date.now() - 86400000));
    let displayCount = s.count;
    if (s.lastDate !== today && s.lastDate !== yesterday) displayCount = 0;
    const mult = getStreakMultiplierLabel(displayCount);
    const isActive = displayCount > 0;

    // Sidebar
    document.getElementById('sidebar-streak-count').textContent = displayCount;
    document.getElementById('sidebar-streak-bonus').textContent = mult;
    const fire = document.getElementById('streak-fire');
    fire.classList.toggle('active', isActive);

    // Hero
    const heroEl = document.getElementById('streak-hero');
    if (heroEl) {
        document.getElementById('streak-hero-count').textContent = displayCount;
        document.getElementById('streak-hero-multiplier').textContent = mult;
        const heroFire = document.getElementById('streak-hero-fire');
        heroFire.classList.toggle('active', isActive);
        // 7-day heatmap
        const weekEl = document.getElementById('streak-week');
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let html = '';
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000);
            const key = getDateKey(d);
            const done = s.history && s.history[key];
            const isToday = key === today;
            html += `<div class="streak-day${done ? ' completed' : ''}${isToday ? ' today' : ''}">
                <span class="streak-day-label">${done ? '🔥' : days[d.getDay()]}</span>
            </div>`;
        }
        weekEl.innerHTML = html;
    }
}

// ===== INIT =====
function initDefaultData() {
    const users = DB.getUsers();
    if (users.length === 0) {
        DB.setUsers([{
            id: 'admin-001', fullName: 'Admin', username: 'admin', password: 'admin123',
            email: 'admin@trany.com', role: 'admin', cv: null, createdAt: new Date().toISOString()
        }]);
    }
}

// ===== AUTH =====
function toggleAuthForm(form) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(form === 'register' ? 'register-form' : 'login-form').classList.add('active');
}

function handleCVUpload(event) {
    const file = event.target.files[0];
    const display = document.getElementById('cv-upload-display');
    if (file) {
        cvDataUrl = file.name;
        display.classList.add('has-file');
        display.querySelector('span').textContent = '📄 ' + file.name;
    }
}

function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!username || !password) { showToast('Please fill in all fields', 'error'); return; }
    const user = DB.getUsers().find(u => u.username === username && u.password === password);
    if (!user) { showToast('Invalid username or password', 'error'); return; }
    DB.setCurrentUser(user);
    showToast(`Welcome back, ${user.fullName}!`, 'success');
    showApp();
}

function handleRegister() {
    const fullName = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const role = document.getElementById('reg-role').value;
    if (!fullName || !email || !username || !password) { showToast('Please fill in all required fields', 'error'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { showToast('Please enter a valid email', 'error'); return; }
    if (username.length < 3) { showToast('Username must be at least 3 characters', 'error'); return; }
    if (password.length < 4) { showToast('Password must be at least 4 characters', 'error'); return; }
    const users = DB.getUsers();
    if (users.find(u => u.username === username)) { showToast('Username already exists', 'error'); return; }
    if (users.find(u => u.email === email)) { showToast('Email already registered', 'error'); return; }
    const newUser = { id: 'user-' + Date.now(), fullName, email, username, password, role, cv: cvDataUrl, createdAt: new Date().toISOString() };
    users.push(newUser);
    DB.setUsers(users);
    DB.setCurrentUser(newUser);
    cvDataUrl = null;
    // Send welcome chat
    addSystemChatMessage(`${fullName} joined Trany Exam! 🎉`);
    showToast('Account created successfully!', 'success');
    showApp();
}

function handleLogout() {
    if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; }
    if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }
    DB.clearCurrentUser();
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    showToast('Logged out successfully', 'info');
}

// ===== APP NAV =====
function showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    const user = DB.getCurrentUser();
    document.getElementById('sidebar-username').textContent = user.fullName;
    document.getElementById('sidebar-role').textContent = user.role;
    document.getElementById('sidebar-avatar').textContent = user.fullName.charAt(0).toUpperCase();
    document.getElementById('admin-menu').style.display = user.role === 'admin' ? 'block' : 'none';
    document.getElementById('student-menu').style.display = user.role === 'student' ? 'block' : 'none';
    updateStreakUI();
    navigateTo('dashboard');
}

function navigateTo(page) {
    if (currentPage === 'take-exam' && page !== 'take-exam' && examTimerInterval) {
        clearInterval(examTimerInterval); examTimerInterval = null;
    }
    if (currentPage === 'chat' && page !== 'chat' && chatPollInterval) {
        clearInterval(chatPollInterval); chatPollInterval = null;
    }
    currentPage = page;
    document.querySelectorAll('.menu-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(`page-${page}`);
    if (el) el.classList.add('active');
    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'create-exam': initCreateExam(); break;
        case 'manage-exams': renderManageExams(); break;
        case 'view-results': renderViewResults(); break;
        case 'available-exams': renderAvailableExams(); break;
        case 'my-results': renderMyResults(); break;
        case 'leaderboard': renderLeaderboard(); break;
        case 'chat': initChat(); break;
    }
}

// ===== UTILITIES =====
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function formatDate(ds) { return new Date(ds).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
function timeAgo(ds) {
    const diff = Math.floor((Date.now() - new Date(ds)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return formatDate(ds);
}

function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
    };
    t.innerHTML = `${icons[type]||icons.info}<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function openModal(title, body, footer) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer || '';
    document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

// ===== KEYBOARD =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const as = document.getElementById('auth-screen');
        if (as.classList.contains('active')) {
            document.getElementById('login-form').classList.contains('active') ? handleLogin() : handleRegister();
        }
    }
    if (e.key === 'Escape') closeModal();
});

document.addEventListener('DOMContentLoaded', () => { initDefaultData(); const u = DB.getCurrentUser(); if (u) showApp(); });
