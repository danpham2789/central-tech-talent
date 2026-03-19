// ===== JSON-File Database (no native deps needed) =====
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const DEFAULT_DB = {
    contests: [],
    questions: [],
    participants: [],
    submissions: [],
    point_codes: [],
    discord_points: []
};

function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) { console.error('DB load error:', e.message); }
    return { ...DEFAULT_DB };
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function generatePointCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TR-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

module.exports = { loadDB, saveDB, generatePointCode };
