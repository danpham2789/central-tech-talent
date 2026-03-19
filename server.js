const express = require('express');
const multer = require('multer');
const path = require('path');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { loadDB, saveDB, generatePointCode } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Admin auth middleware
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'admin123';
function adminAuth(req, res, next) {
    const pw = req.headers['x-admin-password'] || req.body.adminPassword;
    if (pw === ADMIN_PW) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// ===== CONTEST ROUTES =====
app.get('/api/contests', (req, res) => {
    const db = loadDB();
    const active = db.contests.filter(c => c.is_active);
    res.json(active.map(c => ({
        ...c,
        questionCount: db.questions.filter(q => q.contest_id === c.id).length,
        participantCount: db.participants.filter(p => p.contest_id === c.id).length
    })));
});

app.get('/api/contests/:id', (req, res) => {
    const db = loadDB();
    const contest = db.contests.find(c => c.id === req.params.id);
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    const questions = db.questions.filter(q => q.contest_id === contest.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(q => ({ ...q, test_cases: typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases }));
    res.json({ contest, questions });
});

app.post('/api/admin/contests', adminAuth, (req, res) => {
    const { title, description, timeLimitMinutes } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const db = loadDB();
    const contest = { id: uuidv4(), title, description: description || '', time_limit_minutes: timeLimitMinutes || 120, is_active: true, created_at: new Date().toISOString() };
    db.contests.push(contest);
    saveDB(db);
    res.json({ id: contest.id, message: 'Contest created' });
});

app.delete('/api/admin/contests/:id', adminAuth, (req, res) => {
    const db = loadDB();
    db.contests = db.contests.filter(c => c.id !== req.params.id);
    db.questions = db.questions.filter(q => q.contest_id !== req.params.id);
    db.participants = db.participants.filter(p => p.contest_id !== req.params.id);
    db.point_codes = db.point_codes.filter(pc => pc.contest_id !== req.params.id);
    saveDB(db);
    res.json({ message: 'Contest deleted' });
});

// ===== QUESTION ROUTES =====
app.post('/api/admin/contests/:contestId/questions', adminAuth, upload.single('pdf'), (req, res) => {
    const { title, description, points, testCases, sortOrder } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    let parsedTC = [];
    try { parsedTC = JSON.parse(testCases || '[]'); } catch (e) {}
    const db = loadDB();
    const question = { id: uuidv4(), contest_id: req.params.contestId, title, description: description || '', pdf_filename: req.file ? req.file.filename : null, points: parseInt(points) || 100, sort_order: parseInt(sortOrder) || 0, test_cases: parsedTC, created_at: new Date().toISOString() };
    db.questions.push(question);
    saveDB(db);
    res.json({ id: question.id, message: 'Question added' });
});

app.delete('/api/admin/questions/:id', adminAuth, (req, res) => {
    const db = loadDB();
    db.questions = db.questions.filter(q => q.id !== req.params.id);
    saveDB(db);
    res.json({ message: 'Question deleted' });
});

// ===== PARTICIPANT ROUTES =====
app.post('/api/join', (req, res) => {
    const { contestId, fullName, email, phone } = req.body;
    if (!contestId || !fullName || !email || !phone) return res.status(400).json({ error: 'All fields required' });
    const db = loadDB();
    const contest = db.contests.find(c => c.id === contestId && c.is_active);
    if (!contest) return res.status(404).json({ error: 'Contest not found or inactive' });
    // Return existing participant if same email
    const existing = db.participants.find(p => p.contest_id === contestId && p.email === email);
    if (existing) return res.json({ participantId: existing.id, message: 'Welcome back!' });
    const participant = { id: uuidv4(), contest_id: contestId, full_name: fullName, email, phone, started_at: new Date().toISOString(), completed_at: null, point_code: null, total_score: 0 };
    db.participants.push(participant);
    saveDB(db);
    res.json({ participantId: participant.id, message: 'Joined successfully!' });
});

app.get('/api/participant/:id', (req, res) => {
    const db = loadDB();
    const p = db.participants.find(p => p.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Participant not found' });
    const subs = db.submissions.filter(s => s.participant_id === p.id).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    res.json({ participant: p, submissions: subs.map(s => ({ ...s, test_results: typeof s.test_results === 'string' ? JSON.parse(s.test_results) : s.test_results })) });
});

// ===== CODE EXECUTION (Piston API) =====
const PISTON_API = 'https://emkc.org/api/v2/piston/execute';
const LANG_MAP = {
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'c': { language: 'c', version: '10.2.0' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' },
    'go': { language: 'go', version: '1.16.2' },
    'rust': { language: 'rust', version: '1.68.2' },
};

async function executeCode(code, language, stdin) {
    const lc = LANG_MAP[language];
    if (!lc) throw new Error(`Unsupported language: ${language}`);
    try {
        const resp = await fetch(PISTON_API, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lc.language, version: lc.version, files: [{ content: code }], stdin: stdin || '', run_timeout: 10000 })
        });
        const data = await resp.json();
        if (data.run) return { stdout: (data.run.stdout || '').trim(), stderr: (data.run.stderr || '').trim(), exitCode: data.run.code, error: data.run.signal ? `Killed: ${data.run.signal}` : null };
        return { stdout: '', stderr: data.message || 'Execution failed', exitCode: 1, error: data.message };
    } catch (e) {
        return { stdout: '', stderr: e.message, exitCode: 1, error: 'API connection failed. Make sure you have internet access.' };
    }
}

// ===== SUBMIT CODE =====
app.post('/api/submit', async (req, res) => {
    try {
        const { participantId, questionId, code, language } = req.body;
        if (!participantId || !questionId || !code || !language) return res.status(400).json({ error: 'All fields required' });
        const db = loadDB();
        const participant = db.participants.find(p => p.id === participantId);
        if (!participant) return res.status(404).json({ error: 'Participant not found' });
        const question = db.questions.find(q => q.id === questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        const testCases = Array.isArray(question.test_cases) ? question.test_cases : JSON.parse(question.test_cases || '[]');
        if (!testCases.length) {
            const sub = { id: uuidv4(), participant_id: participantId, question_id: questionId, code, language, status: 'accepted', score: question.points, test_results: [], submitted_at: new Date().toISOString() };
            db.submissions.push(sub);
            updateScore(db, participantId);
            saveDB(db);
            return res.json({ submissionId: sub.id, status: 'accepted', score: question.points, testResults: [], passedCount: 0, totalTests: 0, message: 'No test cases — Accepted' });
        }

        const testResults = [];
        let passedCount = 0;
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const result = await executeCode(code, language, tc.input);
            const expected = (tc.expectedOutput || '').trim();
            const passed = result.stdout === expected;
            if (passed) passedCount++;
            testResults.push({ testCase: i + 1, passed, input: tc.input, expectedOutput: expected, actualOutput: result.stdout, error: result.stderr || result.error || null, isHidden: tc.hidden || false });
        }

        const score = Math.round((passedCount / testCases.length) * question.points);
        const status = passedCount === testCases.length ? 'accepted' : passedCount > 0 ? 'partial' : 'wrong';
        const visibleResults = testResults.map(tr => tr.isHidden ? { ...tr, input: 'Hidden', expectedOutput: 'Hidden', actualOutput: tr.passed ? 'Correct' : 'Wrong' } : tr);
        const sub = { id: uuidv4(), participant_id: participantId, question_id: questionId, code, language, status, score, test_results: testResults, submitted_at: new Date().toISOString() };
        db.submissions.push(sub);
        updateScore(db, participantId);
        saveDB(db);
        res.json({ submissionId: sub.id, status, score, passedCount, totalTests: testCases.length, testResults: visibleResults });
    } catch (e) { console.error('Submit error:', e); res.status(500).json({ error: e.message }); }
});

function updateScore(db, participantId) {
    const p = db.participants.find(p => p.id === participantId);
    if (!p) return;
    const questions = db.questions.filter(q => q.contest_id === p.contest_id);
    let total = 0;
    for (const q of questions) {
        const subs = db.submissions.filter(s => s.participant_id === participantId && s.question_id === q.id);
        const best = subs.reduce((b, s) => (s.score > (b?.score || 0) ? s : b), null);
        if (best) total += best.score;
    }
    p.total_score = total;
}

// ===== DISCORD ONE-TIME INVITE =====
async function createDiscordInvite(db) {
    const settings = db.settings || {};
    const botToken = settings.bot_token;
    const channelId = settings.channel_id;
    if (!botToken || !channelId) return null;
    try {
        const resp = await fetch(`https://discord.com/api/v10/channels/${channelId}/invites`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ max_uses: 1, max_age: 86400, unique: true })
        });
        const data = await resp.json();
        if (data.code) return `https://discord.gg/${data.code}`;
        console.error('Discord invite error:', data);
        return null;
    } catch (e) {
        console.error('Discord invite creation failed:', e.message);
        return null;
    }
}

// ===== COMPLETE & GENERATE POINT CODE =====
app.post('/api/complete', async (req, res) => {
    const { participantId } = req.body;
    const db = loadDB();
    const p = db.participants.find(p => p.id === participantId);
    if (!p) return res.status(404).json({ error: 'Participant not found' });

    // Already completed — return existing code + static invite
    if (p.point_code) {
        const discordInvite = p.discord_invite || db.settings?.discord_invite || '';
        return res.json({ pointCode: p.point_code, totalScore: p.total_score, maxScore: db.questions.filter(q => q.contest_id === p.contest_id).reduce((s, q) => s + q.points, 0), discordInvite, message: 'Already completed' });
    }

    updateScore(db, participantId);
    const maxScore = db.questions.filter(q => q.contest_id === p.contest_id).reduce((s, q) => s + q.points, 0);
    let pointCode;
    do { pointCode = generatePointCode(); } while (db.point_codes.find(pc => pc.code === pointCode));

    // Create one-time Discord invite
    let discordInvite = await createDiscordInvite(db);
    // Fallback to static invite if one-time creation failed
    if (!discordInvite) discordInvite = db.settings?.discord_invite || '';

    p.completed_at = new Date().toISOString();
    p.point_code = pointCode;
    p.discord_invite = discordInvite; // save so they get the same link if they refresh
    db.point_codes.push({ code: pointCode, participant_id: participantId, contest_id: p.contest_id, participant_name: p.full_name, participant_email: p.email, total_score: p.total_score, max_score: maxScore, redeemed: false, discord_user_id: null, discord_username: null, created_at: new Date().toISOString(), redeemed_at: null });
    saveDB(db);
    res.json({ pointCode, totalScore: p.total_score, maxScore, discordInvite, message: 'Contest completed!' });
});

// ===== ADMIN ROUTES =====
app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PW) res.json({ success: true });
    else res.status(401).json({ error: 'Wrong password' });
});

app.get('/api/admin/codes', adminAuth, (req, res) => {
    res.json(loadDB().point_codes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

app.get('/api/admin/contests', adminAuth, (req, res) => {
    const db = loadDB();
    res.json(db.contests.map(c => ({
        ...c,
        questions: db.questions.filter(q => q.contest_id === c.id).map(q => ({ ...q, test_cases: Array.isArray(q.test_cases) ? q.test_cases : JSON.parse(q.test_cases || '[]') })),
        participants: db.participants.filter(p => p.contest_id === c.id),
        codes: db.point_codes.filter(pc => pc.contest_id === c.id)
    })));
});

// ===== DISCORD INVITE LINK =====
app.get('/api/admin/settings', adminAuth, (req, res) => {
    const db = loadDB();
    res.json(db.settings || {});
});

app.post('/api/admin/settings', adminAuth, (req, res) => {
    const db = loadDB();
    if (!db.settings) db.settings = {};
    if (req.body.discord_invite !== undefined) db.settings.discord_invite = req.body.discord_invite;
    if (req.body.bot_token !== undefined) db.settings.bot_token = req.body.bot_token;
    if (req.body.channel_id !== undefined) db.settings.channel_id = req.body.channel_id;
    saveDB(db);
    res.json({ message: 'Settings saved', settings: { ...db.settings, bot_token: db.settings.bot_token ? '••••••' : '' } });
});

app.get('/api/languages', (req, res) => {
    res.json(Object.keys(LANG_MAP).map(k => ({ id: k, name: k.charAt(0).toUpperCase() + k.slice(1) })));
});

// Start
app.listen(PORT, () => {
    console.log(`\n🚀 Trany Code Contest Server`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Admin password: ${ADMIN_PW}\n`);
});
