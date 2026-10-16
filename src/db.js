// File-based persistent JSON database with atomic writes
const fs = require('fs');
const path = require('path');
const { TEAMS } = require('./teams');

const DATA_FILE = path.join(__dirname, '..', 'data', 'tournament.json');

const DEFAULT_STATE = {
  tournamentInfo: {
    name: 'Madras United FC Mobile Solo Championship',
    subtitle: 'Official Solo Tournament • 2026 Season',
    adminPin: '1947',
    format: 'groups_knockouts', // 'groups_knockouts' | 'league' | 'multistage'
    rules: [
      'Solo 1v1 FC Mobile matches.',
      'Exclusive Team Selection: First-come, first-served. Once locked, no changes allowed.',
      'Match duration: Standard 90 min (in-game). Extra Time & Penalties for Knockouts.',
      'Both players must take a screenshot of the final score screen and submit to Admin.',
      'Network disconnection rule: If disconnect happens before 30 mins, restart. If after 30 mins, current score stands.'
    ]
  },
  teamSelection: {
    isLocked: false,
    scheduledOpenTime: null, // e.g. "2026-10-16T18:00:00+05:30"
    unlockMessage: 'Team Draft will open soon. Stay tuned!'
  },
  players: [],
  picks: {}, // { [teamId]: { playerId, playerName, playerIgn, pickedAt, formattedTime } }
  rounds: [], // Fixture rounds
  auditLog: [] // Activity log with timestamps for proofs
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          tournamentInfo: { ...DEFAULT_STATE.tournamentInfo, ...(parsed.tournamentInfo || {}) },
          teamSelection: { ...DEFAULT_STATE.teamSelection, ...(parsed.teamSelection || {}) }
        };
      }
    } catch (err) {
      console.error('Error reading database file, using defaults:', err);
    }
    this.save(DEFAULT_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save(data = this.data) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tempPath = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  get() {
    return this.data;
  }

  update(updaterFn) {
    updaterFn(this.data);
    this.save();
    return this.data;
  }

  logActivity(message, meta = {}) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      formattedTime: formatIndianTime(new Date()),
      message,
      meta
    };
    if (!this.data.auditLog) this.data.auditLog = [];
    this.data.auditLog.unshift(entry);
    // Keep last 100 entries
    if (this.data.auditLog.length > 100) {
      this.data.auditLog = this.data.auditLog.slice(0, 100);
    }
    this.save();
    return entry;
  }
}

function formatIndianTime(dateObj = new Date()) {
  try {
    return dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateObj.toISOString();
  }
}

const db = new Database();

module.exports = { db, formatIndianTime, DEFAULT_STATE };
