// ===== TRANY EXAM - Features (Dashboard, Exams, Chat, Leaderboard) =====

// ===== DASHBOARD =====
function renderDashboard() {
    const user = DB.getCurrentUser();
    const exams = DB.getExams();
    const results = DB.getResults();
    updateStreakUI();

    const hour = new Date().getHours();
    let g = 'Good Evening';
    if (hour < 12) g = 'Good Morning'; else if (hour < 17) g = 'Good Afternoon';
    document.getElementById('dashboard-greeting').textContent = `${g}, ${user.fullName}!`;

    const sc = document.getElementById('dashboard-stats');
    if (user.role === 'admin') {
        const my = exams.filter(e => e.createdBy === user.id);
        const ts = new Set(results.map(r => r.userId)).size;
        const avg = results.length ? Math.round(results.reduce((s,r) => s + r.scorePercent, 0) / results.length) : 0;
        sc.innerHTML = `
            <div class="stat-card purple"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="stat-content"><h4>${my.length}</h4><p>Total Exams</p></div></div>
            <div class="stat-card green"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="stat-content"><h4>${ts}</h4><p>Students Tested</p></div></div>
            <div class="stat-card blue"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div class="stat-content"><h4>${results.length}</h4><p>Submissions</p></div></div>
            <div class="stat-card orange"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><div class="stat-content"><h4>${avg}%</h4><p>Avg Score</p></div></div>`;
    } else {
        const mr = results.filter(r => r.userId === user.id);
        const tp = mr.reduce((s,r) => s + (r.totalEarned || r.pointsEarned), 0);
        const avg = mr.length ? Math.round(mr.reduce((s,r) => s + r.scorePercent, 0) / mr.length) : 0;
        const avail = exams.filter(e => !mr.find(r => r.examId === e.id));
        sc.innerHTML = `
            <div class="stat-card purple"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="stat-content"><h4>${mr.length}</h4><p>Completed</p></div></div>
            <div class="stat-card green"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><div class="stat-content"><h4>${tp}</h4><p>Total Points</p></div></div>
            <div class="stat-card blue"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div><div class="stat-content"><h4>${avg}%</h4><p>Avg Score</p></div></div>
            <div class="stat-card orange"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><div class="stat-content"><h4>${avail.length}</h4><p>Available</p></div></div>`;
    }
    renderRecentActivity(user, results, exams);
    renderQuickActions(user);
}

function renderRecentActivity(user, results, exams) {
    const c = document.getElementById('recent-activity');
    let acts = [];
    if (user.role === 'admin') {
        const rr = [...results].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0,5);
        const users = DB.getUsers();
        acts = rr.map(r => {
            const st = users.find(u => u.id === r.userId);
            const ex = exams.find(e => e.id === r.examId);
            return { icon: r.scorePercent >= 70 ? 'green' : 'purple',
                iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                text: `<strong>${st?.fullName||'Unknown'}</strong> scored ${r.scorePercent}% on <strong>${ex?.title||'?'}</strong>`,
                time: timeAgo(r.completedAt) };
        });
    } else {
        const mr = results.filter(r => r.userId === user.id).sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0,5);
        acts = mr.map(r => {
            const ex = exams.find(e => e.id === r.examId);
            return { icon: r.scorePercent >= 70 ? 'green' : 'blue',
                iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
                text: `Scored <strong>${r.scorePercent}%</strong> (${r.totalEarned||r.pointsEarned} pts) on <strong>${ex?.title||'?'}</strong>`,
                time: timeAgo(r.completedAt) };
        });
    }
    if (!acts.length) { c.innerHTML = '<div class="empty-state"><h3>No activity yet</h3><p>Activity appears once exams are taken</p></div>'; return; }
    c.innerHTML = acts.map(a => `<div class="activity-item"><div class="activity-icon ${a.icon}">${a.iconSvg}</div><div class="activity-content"><div class="activity-text">${a.text}</div><div class="activity-time">${a.time}</div></div></div>`).join('');
}

function renderQuickActions(user) {
    const c = document.getElementById('quick-actions');
    const actions = user.role === 'admin' ? [
        { page: 'create-exam', label: 'Create New Exam', bg: 'rgba(108,99,255,0.15)', color: 'var(--primary-light)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
        { page: 'manage-exams', label: 'Manage Exams', bg: 'rgba(0,229,160,0.15)', color: 'var(--accent)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
        { page: 'chat', label: 'Community Chat', bg: 'rgba(61,172,255,0.15)', color: 'var(--info)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    ] : [
        { page: 'available-exams', label: 'Browse Exams', bg: 'rgba(108,99,255,0.15)', color: 'var(--primary-light)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
        { page: 'leaderboard', label: 'View Leaderboard', bg: 'rgba(255,180,67,0.15)', color: 'var(--warning)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' },
        { page: 'chat', label: 'Community Chat', bg: 'rgba(61,172,255,0.15)', color: 'var(--info)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    ];
    c.innerHTML = actions.map(a => `<div class="quick-action" onclick="navigateTo('${a.page}')"><div class="quick-action-icon" style="background:${a.bg};color:${a.color};">${a.icon}</div><span class="quick-action-text">${a.label}</span></div>`).join('');
}

// ===== CREATE EXAM =====
function initCreateExam() {
    questionCounter = 0;
    document.getElementById('exam-title').value = '';
    document.getElementById('exam-duration').value = '30';
    document.getElementById('exam-description').value = '';
    document.getElementById('exam-category').value = 'math';
    document.getElementById('exam-points').value = '10';
    document.getElementById('questions-list').innerHTML = '';
    addQuestion();
}

function addQuestion() {
    questionCounter++;
    const c = document.getElementById('questions-list');
    const q = document.createElement('div');
    q.className = 'question-block'; q.id = `question-${questionCounter}`;
    const qNum = questionCounter;
    q.innerHTML = `<div class="question-block-header"><div class="question-number"><span>${qNum}</span> Question ${qNum}</div><div style="display:flex;gap:8px;align-items:center"><select class="q-type-select" onchange="toggleQuestionType(${qNum}, this.value)" style="padding:6px 12px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;cursor:pointer"><option value="mcq">Multiple Choice</option><option value="type">Type Answer</option></select><button class="btn-icon" onclick="removeQuestion(${qNum})" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>
    <div class="input-group"><label>Question Text</label><textarea class="q-text" placeholder="Type your question here..." rows="2"></textarea></div>
    <div class="q-mcq-section">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;display:block">Options (select correct answer)</label>
        <div class="options-grid">
            <div class="option-input-group"><input type="radio" name="correct-${qNum}" class="option-radio" value="0" checked><span class="option-label">A</span><input type="text" class="q-option" placeholder="Option A"></div>
            <div class="option-input-group"><input type="radio" name="correct-${qNum}" class="option-radio" value="1"><span class="option-label">B</span><input type="text" class="q-option" placeholder="Option B"></div>
            <div class="option-input-group"><input type="radio" name="correct-${qNum}" class="option-radio" value="2"><span class="option-label">C</span><input type="text" class="q-option" placeholder="Option C"></div>
            <div class="option-input-group"><input type="radio" name="correct-${qNum}" class="option-radio" value="3"><span class="option-label">D</span><input type="text" class="q-option" placeholder="Option D"></div>
        </div>
    </div>
    <div class="q-type-section" style="display:none">
        <div class="input-group"><label>Correct Answer</label><input type="text" class="q-correct-answer" placeholder="Type the correct answer here..."></div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:-8px">💡 Answer matching is case-insensitive and ignores extra spaces</p>
    </div>`;
    c.appendChild(q);
    q.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeQuestion(id) { const e = document.getElementById(`question-${id}`); if (e) { e.style.animation = 'fadeIn 0.3s ease reverse'; setTimeout(() => e.remove(), 280); } }
function resetExamForm() { initCreateExam(); showToast('Form reset', 'info'); }

function toggleQuestionType(qNum, type) {
    const block = document.getElementById(`question-${qNum}`);
    if (!block) return;
    const mcqSection = block.querySelector('.q-mcq-section');
    const typeSection = block.querySelector('.q-type-section');
    if (type === 'type') {
        mcqSection.style.display = 'none';
        typeSection.style.display = 'block';
    } else {
        mcqSection.style.display = 'block';
        typeSection.style.display = 'none';
    }
}

function saveExam() {
    const title = document.getElementById('exam-title').value.trim();
    const duration = parseInt(document.getElementById('exam-duration').value) || 30;
    const desc = document.getElementById('exam-description').value.trim();
    const cat = document.getElementById('exam-category').value;
    const ppq = parseInt(document.getElementById('exam-points').value) || 10;
    if (!title) { showToast('Please enter an exam title', 'error'); return; }
    const blocks = document.querySelectorAll('.question-block');
    if (!blocks.length) { showToast('Add at least one question', 'error'); return; }
    const questions = []; let valid = true;
    blocks.forEach((b, i) => {
        const text = b.querySelector('.q-text').value.trim();
        const qType = b.querySelector('.q-type-select').value;
        if (!text) { showToast(`Q${i+1}: Enter question text`, 'error'); valid = false; return; }
        if (qType === 'type') {
            const correctAnswer = b.querySelector('.q-correct-answer').value.trim();
            if (!correctAnswer) { showToast(`Q${i+1}: Enter the correct answer`, 'error'); valid = false; return; }
            questions.push({ text, type: 'type', correctAnswer });
        } else {
            const opts = Array.from(b.querySelectorAll('.q-option')).map(o => o.value.trim());
            const cr = b.querySelector('.option-radio:checked');
            if (opts.some(o => !o)) { showToast(`Q${i+1}: Fill all options`, 'error'); valid = false; return; }
            questions.push({ text, type: 'mcq', options: opts, correctIndex: cr ? parseInt(cr.value) : 0 });
        }
    });
    if (!valid) return;
    const user = DB.getCurrentUser();
    const exam = { id: 'exam-' + Date.now(), title, description: desc || 'No description.', duration, category: cat, pointsPerQuestion: ppq, questions, createdBy: user.id, createdAt: new Date().toISOString() };
    const exams = DB.getExams(); exams.push(exam); DB.setExams(exams);
    showToast('Exam published! 🎉', 'success');
    navigateTo('manage-exams');
}

// ===== MANAGE / DELETE EXAMS =====
function renderManageExams() {
    const user = DB.getCurrentUser();
    const exams = DB.getExams().filter(e => e.createdBy === user.id);
    const results = DB.getResults();
    const c = document.getElementById('manage-exams-list');
    if (!exams.length) { c.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>No exams yet</h3><p>Create your first exam</p><button class="btn btn-primary" style="margin-top:16px" onclick="navigateTo(\'create-exam\')">Create Exam</button></div>'; return; }
    c.innerHTML = exams.map(e => {
        const subs = results.filter(r => r.examId === e.id).length;
        return `<div class="exam-card"><div class="exam-card-header"><span class="exam-card-category cat-${e.category}">${e.category}</span></div><h3>${escapeHtml(e.title)}</h3><p class="exam-card-desc">${escapeHtml(e.description)}</p><div class="exam-card-meta"><span class="exam-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${e.duration} min</span><span class="exam-meta-item">${e.questions.length} Qs</span><span class="exam-meta-item">${subs} submissions</span></div><div class="exam-card-actions"><button class="btn btn-sm btn-danger" onclick="deleteExam('${e.id}')">Delete</button></div></div>`;
    }).join('');
}
function deleteExam(id) { openModal('Delete Exam', '<p>Delete this exam and all results?</p>', `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="confirmDeleteExam('${id}')">Delete</button>`); }
function confirmDeleteExam(id) { DB.setExams(DB.getExams().filter(e => e.id !== id)); DB.setResults(DB.getResults().filter(r => r.examId !== id)); closeModal(); showToast('Exam deleted', 'success'); renderManageExams(); }

// ===== VIEW RESULTS (Admin) =====
function renderViewResults() {
    const results = DB.getResults(), users = DB.getUsers(), exams = DB.getExams();
    const tb = document.getElementById('results-tbody');
    if (!results.length) { tb.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No results yet</td></tr>'; return; }
    const sorted = [...results].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
    tb.innerHTML = sorted.map(r => {
        const st = users.find(u => u.id === r.userId);
        const ex = exams.find(e => e.id === r.examId);
        const base = r.pointsEarned;
        const bonus = (r.totalEarned || base) - base;
        const sc = r.scorePercent >= 50 ? 'status-pass' : 'status-fail';
        return `<tr><td><strong>${st ? escapeHtml(st.fullName) : '?'}</strong></td><td>${ex ? escapeHtml(ex.title) : '?'}</td><td>${r.scorePercent}%</td><td>${base}</td><td style="color:var(--streak-orange)">${bonus > 0 ? '+' + bonus : '0'}</td><td><strong>${r.totalEarned || base}</strong></td><td>${formatDate(r.completedAt)}</td><td><span class="status-badge ${sc}">${r.scorePercent >= 50 ? 'Pass' : 'Fail'}</span></td></tr>`;
    }).join('');
}

// ===== AVAILABLE EXAMS =====
function renderAvailableExams() {
    const user = DB.getCurrentUser(), exams = DB.getExams(), results = DB.getResults();
    const c = document.getElementById('available-exams-list');
    if (!exams.length) { c.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>No exams available</h3><p>Check back later</p></div>'; return; }
    c.innerHTML = exams.map(e => {
        const taken = results.find(r => r.examId === e.id && r.userId === user.id);
        const cr = DB.getUsers().find(u => u.id === e.createdBy);
        return `<div class="exam-card"><div class="exam-card-header"><span class="exam-card-category cat-${e.category}">${e.category}</span>${taken ? '<span class="status-badge status-pass">Done</span>' : ''}</div><h3>${escapeHtml(e.title)}</h3><p class="exam-card-desc">${escapeHtml(e.description)}</p><div class="exam-card-meta"><span class="exam-meta-item">${e.duration} min</span><span class="exam-meta-item">${e.questions.length} Qs</span><span class="exam-meta-item">${e.questions.length * e.pointsPerQuestion} pts</span></div><div class="exam-card-meta" style="margin-bottom:0;margin-top:-8px"><span class="exam-meta-item">By ${cr ? escapeHtml(cr.fullName) : '?'}</span></div><div class="exam-card-actions" style="margin-top:16px">${taken ? `<button class="btn btn-sm btn-secondary" onclick="viewExamResult('${e.id}')">Review</button><button class="btn btn-sm btn-primary" onclick="startExam('${e.id}')">Retake</button>` : `<button class="btn btn-sm btn-primary" onclick="startExam('${e.id}')">▶ Start</button>`}</div></div>`;
    }).join('');
}

// ===== TAKE EXAM =====
function startExam(examId) {
    const exam = DB.getExams().find(e => e.id === examId);
    if (!exam) { showToast('Exam not found', 'error'); return; }
    currentExamId = examId;
    document.getElementById('taking-exam-title').textContent = exam.title;
    document.getElementById('exam-timer').style.display = 'flex';
    const ec = document.getElementById('exam-questions-container');
    ec.innerHTML = exam.questions.map((q,i) => {
        const qType = q.type || 'mcq';
        const typeBadge = qType === 'type' ? '<span style="font-size:11px;padding:2px 8px;border-radius:8px;background:rgba(61,172,255,0.15);color:var(--info);font-weight:700;margin-left:8px">✏️ TYPE</span>' : '';
        if (qType === 'type') {
            return `<div class="exam-question-card" id="eq-${i}"><div class="exam-question-text"><span class="exam-question-num">${i+1}</span><span>${escapeHtml(q.text)}${typeBadge}</span></div><div class="input-group" style="margin-bottom:0"><input type="text" class="exam-type-input" data-question="${i}" placeholder="Type your answer here..." oninput="updateExamProgress()" autocomplete="off" style="padding:14px 18px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px;width:100%"></div></div>`;
        }
        return `<div class="exam-question-card" id="eq-${i}"><div class="exam-question-text"><span class="exam-question-num">${i+1}</span><span>${escapeHtml(q.text)}</span></div><div class="exam-options">${q.options.map((o,j) => `<div class="exam-option" onclick="selectOption(${i},${j})" data-question="${i}" data-option="${j}"><div class="exam-option-radio"></div><span>${escapeHtml(o)}</span></div>`).join('')}</div></div>`;
    }).join('');
    updateExamProgress();
    examTimeRemaining = exam.duration * 60;
    updateTimerDisplay();
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => { examTimeRemaining--; updateTimerDisplay(); if (examTimeRemaining <= 0) { clearInterval(examTimerInterval); examTimerInterval = null; submitExam(true); } }, 1000);
    currentPage = 'take-exam';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-take-exam').classList.add('active');
    window.scrollTo({ top: 0 });
}

function selectOption(qi, oi) {
    document.querySelectorAll(`.exam-option[data-question="${qi}"]`).forEach(o => o.classList.remove('selected'));
    document.querySelector(`.exam-option[data-question="${qi}"][data-option="${oi}"]`)?.classList.add('selected');
    updateExamProgress();
}
function updateExamProgress() {
    const exam = DB.getExams().find(e => e.id === currentExamId); if (!exam) return;
    const t = exam.questions.length;
    const mcqAnswered = document.querySelectorAll('.exam-option.selected').length;
    const typeAnswered = document.querySelectorAll('.exam-type-input').length > 0
        ? Array.from(document.querySelectorAll('.exam-type-input')).filter(i => i.value.trim() !== '').length : 0;
    const a = mcqAnswered + typeAnswered;
    document.getElementById('exam-progress-fill').style.width = `${t ? (a/t)*100 : 0}%`;
    document.getElementById('exam-progress-text').textContent = `${a} / ${t}`;
}
function updateTimerDisplay() {
    const m = Math.floor(examTimeRemaining/60), s = examTimeRemaining%60;
    document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    document.getElementById('exam-timer').classList.toggle('warning', examTimeRemaining <= 60);
}
function confirmSubmitExam() {
    const exam = DB.getExams().find(e => e.id === currentExamId); if (!exam) return;
    const t = exam.questions.length;
    const mcqA = document.querySelectorAll('.exam-option.selected').length;
    const typeA = Array.from(document.querySelectorAll('.exam-type-input')).filter(i => i.value.trim() !== '').length;
    const a = mcqA + typeA;
    if (a < t) { openModal('Submit?', `<p>Answered <strong>${a}/${t}</strong>. Unanswered = incorrect.</p>`, `<button class="btn btn-secondary" onclick="closeModal()">Continue</button><button class="btn btn-primary" onclick="closeModal();submitExam(false)">Submit</button>`); }
    else submitExam(false);
}

function submitExam(timeUp) {
    if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; }
    const exam = DB.getExams().find(e => e.id === currentExamId);
    const user = DB.getCurrentUser();
    if (!exam || !user) return;

    // Record streak activity
    const streak = recordStreakActivity(user.id);
    const multiplier = getStreakMultiplier(streak.count);

    let correct = 0; const answers = [];
    exam.questions.forEach((q,i) => {
        const qType = q.type || 'mcq';
        if (qType === 'type') {
            const input = document.querySelector(`.exam-type-input[data-question="${i}"]`);
            const typed = input ? input.value.trim() : '';
            const ic = typed.toLowerCase().replace(/\s+/g,' ') === q.correctAnswer.toLowerCase().replace(/\s+/g,' ');
            if (ic) correct++;
            answers.push({ type: 'type', typedAnswer: typed, isCorrect: ic });
        } else {
            const sel = document.querySelector(`.exam-option.selected[data-question="${i}"]`);
            const si = sel ? parseInt(sel.dataset.option) : -1;
            const ic = si === q.correctIndex;
            if (ic) correct++;
            answers.push({ type: 'mcq', selectedIndex: si, isCorrect: ic });
        }
    });

    const total = exam.questions.length;
    const scorePercent = Math.round((correct/total)*100);
    const basePoints = correct * exam.pointsPerQuestion;
    const bonusPoints = Math.round(basePoints * (multiplier - 1));
    const totalEarned = basePoints + bonusPoints;

    const result = { id: 'r-' + Date.now(), examId: exam.id, userId: user.id, answers, correct, totalQuestions: total, scorePercent, pointsEarned: basePoints, bonusPoints, totalEarned, streakAtTime: streak.count, multiplier, completedAt: new Date().toISOString(), timeUp };
    const results = DB.getResults();
    const ei = results.findIndex(r => r.examId === exam.id && r.userId === user.id);
    if (ei !== -1) results.splice(ei, 1);
    results.push(result);
    DB.setResults(results);
    updateStreakUI();

    const sc = scorePercent >= 80 ? 'var(--accent)' : scorePercent >= 60 ? 'var(--info)' : scorePercent >= 40 ? 'var(--warning)' : 'var(--danger)';
    const bonusHtml = multiplier > 1 ? `<div class="bonus-display"><div class="bonus-display-title">🔥 ${streak.count}-Day Streak Bonus!</div><div class="bonus-display-detail">${getStreakMultiplierLabel(streak.count)} → +${bonusPoints} bonus points</div></div>` : '';
    openModal(timeUp ? '⏰ Time\'s Up!' : '✅ Exam Submitted!',
        `<div class="score-display"><div class="score-circle" style="--score-percent:${scorePercent}%;background:var(--bg-secondary)"><span class="score-value" style="color:${sc}">${scorePercent}%</span><span class="score-label">Score</span></div><div class="score-summary"><div class="score-summary-item"><div class="score-summary-value" style="color:var(--accent)">${correct}</div><div class="score-summary-label">Correct</div></div><div class="score-summary-item"><div class="score-summary-value" style="color:var(--danger)">${total-correct}</div><div class="score-summary-label">Wrong</div></div><div class="score-summary-item"><div class="score-summary-value" style="color:var(--primary-light)">${totalEarned}</div><div class="score-summary-label">Points</div></div></div>${bonusHtml}</div>`,
        `<button class="btn btn-secondary" onclick="closeModal();showExamReview('${exam.id}')">Review</button><button class="btn btn-primary" onclick="closeModal();navigateTo('my-results')">Results</button>`);
}

function showExamReview(examId) {
    const exam = DB.getExams().find(e => e.id === examId);
    const user = DB.getCurrentUser();
    const result = DB.getResults().find(r => r.examId === examId && r.userId === user.id);
    if (!exam || !result) return;
    exam.questions.forEach((q,i) => {
        const qType = q.type || 'mcq';
        if (qType === 'type') {
            const input = document.querySelector(`.exam-type-input[data-question="${i}"]`);
            if (input) {
                input.disabled = true;
                input.value = result.answers[i]?.typedAnswer || '';
                const answerEl = result.answers[i];
                if (answerEl?.isCorrect) {
                    input.style.borderColor = 'var(--accent)'; input.style.color = 'var(--accent)';
                } else {
                    input.style.borderColor = 'var(--danger)'; input.style.color = 'var(--danger)';
                }
                // Show correct answer below
                const correctDiv = document.createElement('div');
                correctDiv.style.cssText = 'margin-top:8px;padding:10px 14px;border-radius:var(--radius-sm);font-size:13px;';
                if (answerEl?.isCorrect) {
                    correctDiv.style.background = 'rgba(0,229,160,0.1)'; correctDiv.style.color = 'var(--accent)'; correctDiv.style.border = '1px solid var(--accent)';
                    correctDiv.textContent = '✅ Correct!';
                } else {
                    correctDiv.style.background = 'rgba(255,92,92,0.1)'; correctDiv.style.color = 'var(--danger)'; correctDiv.style.border = '1px solid var(--danger)';
                    correctDiv.textContent = '❌ Correct answer: ' + q.correctAnswer;
                }
                input.parentElement.appendChild(correctDiv);
            }
        } else {
            document.querySelectorAll(`.exam-option[data-question="${i}"]`).forEach((o,j) => {
                o.style.pointerEvents = 'none'; o.classList.remove('selected');
                if (j === q.correctIndex) o.classList.add('correct');
                if (result.answers[i]?.selectedIndex === j && !result.answers[i].isCorrect) o.classList.add('incorrect');
            });
        }
    });
    document.getElementById('exam-timer').style.display = 'none';
}
function viewExamResult(examId) { startExam(examId); if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; } setTimeout(() => showExamReview(examId), 100); }

// ===== MY RESULTS =====
function renderMyResults() {
    const user = DB.getCurrentUser();
    const results = DB.getResults().filter(r => r.userId === user.id);
    const exams = DB.getExams();
    const c = document.getElementById('my-results-list');
    if (!results.length) { c.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>No results yet</h3><p>Take an exam to see results</p><button class="btn btn-primary" style="margin-top:16px" onclick="navigateTo(\'available-exams\')">Browse Exams</button></div>'; return; }
    c.innerHTML = [...results].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt)).map(r => {
        const ex = exams.find(e => e.id === r.examId);
        const sc = r.scorePercent >= 80 ? 'score-excellent' : r.scorePercent >= 60 ? 'score-good' : r.scorePercent >= 40 ? 'score-average' : 'score-poor';
        const bonus = r.bonusPoints || 0;
        return `<div class="result-card"><div class="result-card-header"><h3>${ex ? escapeHtml(ex.title) : '?'}</h3><span class="result-score-badge ${sc}">${r.scorePercent}%</span></div><div class="result-details"><div class="result-detail"><span class="result-detail-label">Correct</span><span class="result-detail-value">${r.correct}/${r.totalQuestions}</span></div><div class="result-detail"><span class="result-detail-label">Base Points</span><span class="result-detail-value">${r.pointsEarned}</span></div><div class="result-detail"><span class="result-detail-label">Streak Bonus</span><span class="result-detail-value">${bonus > 0 ? `<span class="result-bonus-tag">🔥 +${bonus}</span>` : '—'}</span></div><div class="result-detail"><span class="result-detail-label">Total Earned</span><span class="result-detail-value" style="color:var(--accent)">${r.totalEarned||r.pointsEarned}</span></div></div></div>`;
    }).join('');
}

// ===== LEADERBOARD =====
function renderLeaderboard() {
    const results = DB.getResults(), users = DB.getUsers().filter(u => u.role === 'student');
    const lb = users.map(u => {
        const ur = results.filter(r => r.userId === u.id);
        const tp = ur.reduce((s,r) => s + (r.totalEarned||r.pointsEarned), 0);
        const et = ur.length;
        const avg = et ? Math.round(ur.reduce((s,r) => s + r.scorePercent, 0)/et) : 0;
        const streak = getUserStreak(u.id);
        const today = getDateKey(), yesterday = getDateKey(new Date(Date.now()-86400000));
        const sc = (streak.lastDate === today || streak.lastDate === yesterday) ? streak.count : 0;
        return { ...u, totalPoints: tp, examsTaken: et, avgScore: avg, streak: sc };
    }).filter(u => u.examsTaken > 0).sort((a,b) => b.totalPoints - a.totalPoints);

    const pc = document.getElementById('leaderboard-podium');
    if (lb.length >= 3) {
        const [f,s,t] = lb;
        pc.innerHTML = `<div class="podium-item podium-2"><div class="podium-avatar">${s.fullName[0].toUpperCase()}<div class="podium-rank">2</div></div><span class="podium-name">${escapeHtml(s.fullName)}</span><span class="podium-points">${s.totalPoints} pts</span><span class="podium-streak">🔥 ${s.streak}</span></div><div class="podium-item podium-1"><div class="podium-avatar">${f.fullName[0].toUpperCase()}<div class="podium-rank">1</div></div><span class="podium-name">${escapeHtml(f.fullName)}</span><span class="podium-points">${f.totalPoints} pts</span><span class="podium-streak">🔥 ${f.streak}</span></div><div class="podium-item podium-3"><div class="podium-avatar">${t.fullName[0].toUpperCase()}<div class="podium-rank">3</div></div><span class="podium-name">${escapeHtml(t.fullName)}</span><span class="podium-points">${t.totalPoints} pts</span><span class="podium-streak">🔥 ${t.streak}</span></div>`;
    } else pc.innerHTML = '';

    const tb = document.getElementById('leaderboard-tbody');
    if (!lb.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No scores yet</td></tr>'; return; }
    tb.innerHTML = lb.map((u,i) => `<tr><td><strong>${i+1}</strong></td><td><div style="display:flex;align-items:center;gap:10px"><div class="user-avatar" style="width:32px;height:32px;font-size:12px">${u.fullName[0].toUpperCase()}</div><span>${escapeHtml(u.fullName)}</span></div></td><td><strong style="color:var(--accent)">${u.totalPoints}</strong></td><td>🔥 ${u.streak}</td><td>${u.examsTaken}</td><td>${u.avgScore}%</td></tr>`).join('');
}

// ===== COMMUNITY CHAT =====
function addSystemChatMessage(text) {
    const msgs = DB.getChat();
    msgs.push({ id: 'm-' + Date.now(), type: 'system', text, timestamp: new Date().toISOString() });
    DB.setChat(msgs);
}

function initChat() {
    renderChat();
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(renderChat, 2000);
    setTimeout(() => {
        const mc = document.getElementById('chat-messages');
        mc.scrollTop = mc.scrollHeight;
    }, 100);
}

function renderChat() {
    const msgs = DB.getChat();
    const user = DB.getCurrentUser();
    const users = DB.getUsers();
    const mc = document.getElementById('chat-messages');
    const wasAtBottom = mc.scrollHeight - mc.scrollTop - mc.clientHeight < 60;
    let lastDate = '';
    let html = '';

    msgs.forEach(m => {
        const mDate = new Date(m.timestamp).toLocaleDateString();
        if (mDate !== lastDate) {
            html += `<div class="chat-date-divider"><span>${mDate}</span></div>`;
            lastDate = mDate;
        }
        if (m.type === 'system') {
            html += `<div class="chat-system-msg">${escapeHtml(m.text)}</div>`;
        } else {
            const sender = users.find(u => u.id === m.userId);
            const isOwn = m.userId === user.id;
            const sName = sender ? sender.fullName : 'Unknown';
            const sRole = sender ? sender.role : 'student';
            const sStreak = getUserStreak(m.userId);
            const today = getDateKey(), yesterday = getDateKey(new Date(Date.now()-86400000));
            const sc = (sStreak.lastDate === today || sStreak.lastDate === yesterday) ? sStreak.count : 0;
            const streakTag = sc > 0 ? `<span class="chat-msg-streak">🔥 ${sc} day streak</span>` : '';
            const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            html += `<div class="chat-message ${isOwn ? 'own' : 'other'}">
                ${!isOwn ? `<div class="chat-msg-header"><span class="chat-msg-name">${escapeHtml(sName)}</span><span class="chat-msg-role ${sRole}">${sRole}</span><span class="chat-msg-time">${time}</span></div>` : ''}
                <div class="chat-msg-bubble">${escapeHtml(m.text)}</div>
                ${isOwn ? `<div style="text-align:right"><span class="chat-msg-time">${time}</span></div>` : ''}
                ${streakTag}
            </div>`;
        }
    });

    if (!msgs.length) {
        html = '<div class="empty-state"><h3>No messages yet</h3><p>Start the conversation!</p></div>';
    }

    mc.innerHTML = html;
    if (wasAtBottom) mc.scrollTop = mc.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const user = DB.getCurrentUser();
    const msgs = DB.getChat();
    msgs.push({ id: 'm-' + Date.now(), type: 'message', userId: user.id, text, timestamp: new Date().toISOString() });
    DB.setChat(msgs);
    input.value = '';
    renderChat();
}
