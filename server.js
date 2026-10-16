// Express Backend Server for Madras United FC Mobile Solo Tournament
const express = require('express');
const cors = require('cors');
const path = require('path');
const { TEAMS } = require('./src/teams');
const { db, formatIndianTime } = require('./src/db');
const {
  generateLeagueFixtures,
  generateGroupStageFixtures,
  generateMultiStageFixtures,
  calculateStandings,
  calculateGoldenBoot,
  calculateGoldenGlove
} = require('./src/tournamentEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Check if team draft is currently open
function isDraftOpen(teamSelection) {
  if (teamSelection.isLocked) return false;
  if (teamSelection.scheduledOpenTime) {
    const openTime = new Date(teamSelection.scheduledOpenTime).getTime();
    if (Date.now() < openTime) {
      return false; // Still waiting for scheduled time
    }
  }
  return true;
}

// Helper: Flatten all matches across rounds
function getAllMatches(rounds) {
  if (!Array.isArray(rounds)) return [];
  const matches = [];
  rounds.forEach(r => {
    if (Array.isArray(r.matches)) {
      matches.push(...r.matches);
    }
  });
  return matches;
}

// --- GET FULL TOURNAMENT STATE ---
app.get('/api/tournament', (req, res) => {
  const data = db.get();
  const allMatches = getAllMatches(data.rounds);

  // Enrich master teams list with current pick information
  const enrichedTeams = TEAMS.map(team => {
    const pick = data.picks[team.id];
    return {
      ...team,
      isAvailable: !pick,
      pickedBy: pick || null
    };
  });

  const standings = calculateStandings(data.players, allMatches);
  const goldenBoot = calculateGoldenBoot(data.players, allMatches);
  const goldenGlove = calculateGoldenGlove(data.players, allMatches);

  const draftOpen = isDraftOpen(data.teamSelection);

  res.json({
    tournamentInfo: data.tournamentInfo,
    teamSelection: {
      ...data.teamSelection,
      isSelectionCurrentlyOpen: draftOpen
    },
    players: data.players,
    teams: enrichedTeams,
    fixtures: data.rounds,
    standings,
    goldenBoot,
    goldenGlove,
    auditLog: (data.auditLog || []).slice(0, 30),
    serverTime: new Date().toISOString()
  });
});

// --- REGISTER PLAYER ---
app.post('/api/register', (req, res) => {
  const { name, ign, uid, ovr, whatsapp } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Player Name is required.' });
  }
  if (!ign || !ign.trim()) {
    return res.status(400).json({ error: 'FC Mobile In-Game Name (IGN) is required.' });
  }

  const cleanName = name.trim();
  const cleanIgn = ign.trim();
  const cleanUid = (uid || '').trim();

  const data = db.get();

  // Check duplicate UID or IGN
  const existingUid = cleanUid && data.players.find(p => p.uid && p.uid.toLowerCase() === cleanUid.toLowerCase());
  if (existingUid) {
    return res.status(400).json({ error: `FC Mobile UID "${cleanUid}" is already registered by ${existingUid.name}!` });
  }

  const existingIgn = data.players.find(p => p.ign.toLowerCase() === cleanIgn.toLowerCase());
  if (existingIgn) {
    return res.status(400).json({ error: `In-Game Name "${cleanIgn}" is already registered!` });
  }

  const newPlayer = {
    id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: cleanName,
    ign: cleanIgn,
    uid: cleanUid || 'N/A',
    ovr: ovr ? Number(ovr) : null,
    whatsapp: (whatsapp || '').trim(),
    teamId: null,
    teamName: null,
    teamBadge: null,
    registeredAt: new Date().toISOString(),
    formattedRegisteredAt: formatIndianTime(new Date())
  };

  db.update(d => {
    d.players.push(newPlayer);
  });

  db.logActivity(`New player registered: ${newPlayer.name} (${newPlayer.ign})`, { playerId: newPlayer.id });

  res.json({
    success: true,
    message: `Registered successfully as ${newPlayer.name}!`,
    player: newPlayer
  });
});

// --- PICK TEAM (EXCLUSIVE + TIMESTAMP PROOF) ---
app.post('/api/teams/pick', (req, res) => {
  const { playerId, teamId } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'Player selection is required.' });
  }
  if (!teamId) {
    return res.status(400).json({ error: 'Team selection is required.' });
  }

  const data = db.get();

  // 1. Check if draft is open
  if (!isDraftOpen(data.teamSelection)) {
    if (data.teamSelection.scheduledOpenTime) {
      const openTime = new Date(data.teamSelection.scheduledOpenTime);
      return res.status(400).json({
        error: `Team selection is currently locked! It will open at ${formatIndianTime(openTime)}.`
      });
    }
    return res.status(400).json({ error: 'Team selection is currently locked by Admin.' });
  }

  // 2. Find player
  const player = data.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found. Please register first.' });
  }

  // 3. Find team
  const targetTeam = TEAMS.find(t => t.id === teamId);
  if (!targetTeam) {
    return res.status(404).json({ error: 'Invalid team selected.' });
  }

  // 4. Strict Exclusivity Check: Is team already taken by someone else?
  const existingPick = data.picks[teamId];
  if (existingPick && existingPick.playerId !== playerId) {
    return res.status(400).json({
      error: `Sorry! ${targetTeam.name} has already been picked by ${existingPick.playerName} (${existingPick.playerIgn}) at ${existingPick.formattedTime}!`
    });
  }

  const now = new Date();
  const timestampIso = now.toISOString();
  const formattedTime = formatIndianTime(now);

  db.update(d => {
    // If player had previously picked a different team, free up the old team
    if (player.teamId && player.teamId !== teamId) {
      delete d.picks[player.teamId];
    }

    // Set exclusive pick
    d.picks[teamId] = {
      playerId: player.id,
      playerName: player.name,
      playerIgn: player.ign,
      pickedAt: timestampIso,
      formattedTime
    };

    // Update player record
    const pIndex = d.players.findIndex(p => p.id === playerId);
    if (pIndex !== -1) {
      d.players[pIndex].teamId = targetTeam.id;
      d.players[pIndex].teamName = targetTeam.name;
      d.players[pIndex].teamBadge = targetTeam.badge;
      d.players[pIndex].teamColor = targetTeam.color;
      d.players[pIndex].teamLeague = targetTeam.league;
      d.players[pIndex].pickedAt = timestampIso;
      d.players[pIndex].formattedPickedAt = formattedTime;
    }
  });

  const logMsg = `TEAM PICKED: ${player.name} (${player.ign}) selected ${targetTeam.name} at ${formattedTime}`;
  db.logActivity(logMsg, { playerId, teamId });

  res.json({
    success: true,
    message: `Congratulations ${player.name}! You locked in ${targetTeam.name}!`,
    timestamp: formattedTime,
    team: targetTeam
  });
});

// --- ADMIN: VERIFY PIN ---
app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  const data = db.get();
  if (pin === data.tournamentInfo.adminPin) {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ error: 'Incorrect Admin PIN!' });
});

// --- ADMIN: UPDATE TEAM SELECTION LOCK / UNLOCK / SCHEDULE ---
app.post('/api/admin/team-selection/settings', (req, res) => {
  const { pin, isLocked, scheduledOpenTime, unlockMessage } = req.body;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  db.update(d => {
    d.teamSelection.isLocked = !!isLocked;
    d.teamSelection.scheduledOpenTime = scheduledOpenTime || null;
    if (unlockMessage !== undefined) {
      d.teamSelection.unlockMessage = unlockMessage;
    }
  });

  const statusText = isLocked ? 'LOCKED' : scheduledOpenTime ? `SCHEDULED for ${scheduledOpenTime}` : 'OPEN';
  db.logActivity(`Admin updated team selection status: ${statusText}`);

  res.json({
    success: true,
    teamSelection: db.get().teamSelection
  });
});

// --- ADMIN: UPDATE GENERAL TOURNAMENT SETTINGS ---
app.post('/api/admin/settings', (req, res) => {
  const { pin, name, subtitle, newPin, format, rules } = req.body;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  db.update(d => {
    if (name) d.tournamentInfo.name = name.trim();
    if (subtitle) d.tournamentInfo.subtitle = subtitle.trim();
    if (newPin && newPin.trim()) d.tournamentInfo.adminPin = newPin.trim();
    if (format) d.tournamentInfo.format = format;
    if (Array.isArray(rules)) d.tournamentInfo.rules = rules;
  });

  db.logActivity('Admin updated tournament settings');

  res.json({
    success: true,
    tournamentInfo: db.get().tournamentInfo
  });
});

// --- ADMIN: GENERATE RANDOM FIXTURES ---
app.post('/api/admin/fixtures/generate', (req, res) => {
  const { pin, format, numGroups = 2 } = req.body;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  const players = data.players;
  if (!players || players.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 registered players to generate fixtures.' });
  }

  let generated;
  const chosenFormat = format || data.tournamentInfo.format || 'groups_knockouts';

  if (chosenFormat === 'league') {
    const rounds = generateLeagueFixtures(players);
    generated = { rounds, groups: null };
  } else if (chosenFormat === 'multistage') {
    generated = generateMultiStageFixtures(players);
  } else {
    // groups_knockouts
    generated = generateGroupStageFixtures(players, Number(numGroups) || 2);
  }

  db.update(d => {
    d.tournamentInfo.format = chosenFormat;
    d.rounds = generated.rounds;
  });

  db.logActivity(`Fixtures generated for format: ${chosenFormat} (${players.length} players)`);

  res.json({
    success: true,
    message: `Generated ${generated.rounds.length} rounds of fixtures successfully!`,
    fixtures: generated.rounds
  });
});

// --- ADMIN: POST / UPDATE MATCH RESULT ---
app.post('/api/admin/matches/result', (req, res) => {
  const { pin, matchId, homeScore, awayScore, scorers, cleanSheets, proofUrl } = req.body;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  if (!matchId) {
    return res.status(400).json({ error: 'Match ID is required.' });
  }
  if (homeScore === undefined || awayScore === undefined || homeScore === null || awayScore === null) {
    return res.status(400).json({ error: 'Scores are required.' });
  }

  let foundMatch = null;
  let nextMatchToAdvance = null;

  db.update(d => {
    for (const r of d.rounds) {
      for (const m of r.matches) {
        if (m.id === matchId) {
          foundMatch = m;
          m.homeScore = Number(homeScore);
          m.awayScore = Number(awayScore);
          m.status = 'completed';
          m.scorers = Array.isArray(scorers) ? scorers : [];
          m.cleanSheets = cleanSheets || {
            home: Number(awayScore) === 0,
            away: Number(homeScore) === 0
          };
          m.proofUrl = proofUrl || '';
          m.completedAt = new Date().toISOString();
          m.formattedCompletedAt = formatIndianTime(new Date());

          // Knockout Progression Check
          if (m.isKnockout && m.nextMatchId) {
            const winner = m.homeScore >= m.awayScore ? {
              id: m.homePlayerId,
              name: m.homePlayerName,
              ign: m.homeIgn,
              teamId: m.homeTeamId,
              teamName: m.homeTeamName
            } : {
              id: m.awayPlayerId,
              name: m.awayPlayerName,
              ign: m.awayIgn,
              teamId: m.awayTeamId,
              teamName: m.awayTeamName
            };

            // Locate next match and update slot
            for (const r2 of d.rounds) {
              for (const nm of r2.matches) {
                if (nm.id === m.nextMatchId) {
                  if (m.nextMatchSlot === 'home') {
                    nm.homePlayerId = winner.id;
                    nm.homePlayerName = winner.name;
                    nm.homeIgn = winner.ign;
                    nm.homeTeamId = winner.teamId;
                    nm.homeTeamName = winner.teamName;
                  } else {
                    nm.awayPlayerId = winner.id;
                    nm.awayPlayerName = winner.name;
                    nm.awayIgn = winner.ign;
                    nm.awayTeamId = winner.teamId;
                    nm.awayTeamName = winner.teamName;
                  }
                  nextMatchToAdvance = nm;
                }
              }
            }
          }
          break;
        }
      }
      if (foundMatch) break;
    }
  });

  if (!foundMatch) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const logText = `RESULT: ${foundMatch.homePlayerName} (${foundMatch.homeScore}) vs (${foundMatch.awayScore}) ${foundMatch.awayPlayerName}`;
  db.logActivity(logText);

  res.json({
    success: true,
    message: 'Match result saved and leaderboards updated!',
    match: foundMatch,
    nextMatch: nextMatchToAdvance
  });
});

// --- ADMIN: DELETE PLAYER ---
app.delete('/api/admin/players/:id', (req, res) => {
  const { pin } = req.query;
  const playerId = req.params.id;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const player = data.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  db.update(d => {
    // Free team if picked
    if (player.teamId && d.picks[player.teamId]) {
      delete d.picks[player.teamId];
    }
    d.players = d.players.filter(p => p.id !== playerId);
  });

  db.logActivity(`Admin deleted player: ${player.name} (${player.ign})`);

  res.json({ success: true, message: `Removed ${player.name}` });
});

// --- ADMIN: RESET ALL DATA ---
app.post('/api/admin/reset', (req, res) => {
  const { pin } = req.body;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.update(d => {
    d.players = [];
    d.picks = {};
    d.rounds = [];
    d.teamSelection = {
      isLocked: false,
      scheduledOpenTime: null,
      unlockMessage: 'Team Draft will open soon.'
    };
    d.auditLog = [];
  });

  db.logActivity('Admin performed full tournament reset.');

  res.json({ success: true, message: 'Tournament data reset successfully!' });
});

// --- ADMIN: SEED DEMO TOURNAMENT (Instant Realistic 8-Player Demo) ---
app.post('/api/admin/seed-demo', (req, res) => {
  const { pin } = req.body;
  const data = db.get();

  if (pin !== data.tournamentInfo.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const samplePlayers = [
    { name: 'Hariharan (Madras)', ign: 'MadrasStriker', uid: '10928374', ovr: 104, teamId: 'realmadrid' },
    { name: 'Karthik Raja', ign: 'Karthi_FC', uid: '29837482', ovr: 103, teamId: 'mancity' },
    { name: 'Sanjay Kumar', ign: 'Sanju_Gamer', uid: '38472910', ovr: 102, teamId: 'arsenal' },
    { name: 'Vignesh V', ign: 'Vicky_V', uid: '47291038', ovr: 101, teamId: 'liverpool' },
    { name: 'Arun Prakash', ign: 'Arun_Sniper', uid: '58291047', ovr: 100, teamId: 'barcelona' },
    { name: 'Dinesh Babu', ign: 'Dinesh_R10', uid: '69382019', ovr: 102, teamId: 'bayern' },
    { name: 'Mohamed Ashik', ign: 'Ashik_CR7', uid: '70192837', ovr: 103, teamId: 'argentina' },
    { name: 'Naveen Kumar', ign: 'Naveen_GOAT', uid: '81029384', ovr: 99, teamId: 'france' }
  ];

  const players = [];
  const picks = {};

  samplePlayers.forEach((p, idx) => {
    const teamObj = TEAMS.find(t => t.id === p.teamId);
    const dateObj = new Date(Date.now() - (8 - idx) * 120000); // 2 mins apart
    const iso = dateObj.toISOString();
    const formatted = formatIndianTime(dateObj);

    const playerObj = {
      id: `p_demo_${idx + 1}`,
      name: p.name,
      ign: p.ign,
      uid: p.uid,
      ovr: p.ovr,
      whatsapp: `+91 9840${idx}12345`,
      teamId: teamObj.id,
      teamName: teamObj.name,
      teamBadge: teamObj.badge,
      teamColor: teamObj.color,
      teamLeague: teamObj.league,
      registeredAt: iso,
      formattedRegisteredAt: formatted,
      pickedAt: iso,
      formattedPickedAt: formatted
    };

    players.push(playerObj);

    picks[teamObj.id] = {
      playerId: playerObj.id,
      playerName: playerObj.name,
      playerIgn: playerObj.ign,
      pickedAt: iso,
      formattedTime: formatted
    };
  });

  // Generate Group Stage fixtures
  const fixturesData = generateGroupStageFixtures(players, 2);

  // Pre-complete a few matches for demo excitement
  const r1 = fixturesData.rounds[0];
  if (r1 && r1.matches && r1.matches.length >= 2) {
    const m1 = r1.matches[0];
    m1.status = 'completed';
    m1.homeScore = 3;
    m1.awayScore = 1;
    m1.scorers = [
      { player: 'Mbappé', goals: 2, side: 'home', ign: m1.homeIgn, teamName: m1.homeTeamName },
      { player: 'Vinicius Jr', goals: 1, side: 'home', ign: m1.homeIgn, teamName: m1.homeTeamName },
      { player: 'Haaland', goals: 1, side: 'away', ign: m1.awayIgn, teamName: m1.awayTeamName }
    ];
    m1.cleanSheets = { home: false, away: false };
    m1.completedAt = new Date().toISOString();
    m1.formattedCompletedAt = formatIndianTime(new Date());

    const m2 = r1.matches[1];
    m2.status = 'completed';
    m2.homeScore = 2;
    m2.awayScore = 0;
    m2.scorers = [
      { player: 'Saka', goals: 2, side: 'home', ign: m2.homeIgn, teamName: m2.homeTeamName }
    ];
    m2.cleanSheets = { home: true, away: false };
    m2.completedAt = new Date().toISOString();
    m2.formattedCompletedAt = formatIndianTime(new Date());
  }

  db.update(d => {
    d.players = players;
    d.picks = picks;
    d.rounds = fixturesData.rounds;
    d.teamSelection = {
      isLocked: false,
      scheduledOpenTime: null,
      unlockMessage: 'Team Draft is LIVE!'
    };
  });

  db.logActivity('Demo tournament populated with 8 players & live matches!');

  res.json({
    success: true,
    message: 'Demo tournament loaded with 8 players, picked teams, live points table & golden boot!'
  });
});

// Serve frontend for all unmatched routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`⚽ MADRAS UNITED FC MOBILE TOURNAMENT SYSTEM ONLINE!`);
    console.log(`🚀 Local Server running on: http://localhost:${PORT}`);
    console.log(`📱 Optimized for Mobile View & Live Updates`);
    console.log(`====================================================`);
  });
}

module.exports = app;
