// Tournament Engine: Fixture generation, Points Table calculations, Golden Boot & Golden Glove

function generateRoundRobinRounds(participants, stageName = 'League') {
  if (!participants || participants.length < 2) return [];

  // Clone participants
  let list = [...participants];

  // If odd number, add a BYE dummy
  const isOdd = list.length % 2 !== 0;
  if (isOdd) {
    list.push({ id: '__BYE__', name: 'BYE', isBye: true });
  }

  const numTeams = list.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  const rounds = [];
  let teamPool = [...list];

  for (let r = 0; r < numRounds; r++) {
    const roundNumber = r + 1;
    const roundName = `${stageName} - Round ${roundNumber}`;
    const matches = [];

    for (let i = 0; i < half; i++) {
      const home = teamPool[i];
      const away = teamPool[numTeams - 1 - i];

      // Skip match if it's a BYE
      if (home.isBye || away.isBye) continue;

      // Alternate home/away to keep balance
      const isAlt = (r % 2 === 1 && i === 0);
      const teamA = isAlt ? away : home;
      const teamB = isAlt ? home : away;

      matches.push({
        id: `match_${stageName.toLowerCase().replace(/\s+/g, '_')}_r${roundNumber}_m${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        stage: stageName,
        round: roundNumber,
        roundName,
        homePlayerId: teamA.id,
        homePlayerName: teamA.name,
        homeIgn: teamA.ign || teamA.name,
        homeTeamId: teamA.teamId || '',
        homeTeamName: teamA.teamName || 'TBD',
        homeTeamBadge: teamA.teamBadge || '',
        awayPlayerId: teamB.id,
        awayPlayerName: teamB.name,
        awayIgn: teamB.ign || teamB.name,
        awayTeamId: teamB.teamId || '',
        awayTeamName: teamB.teamName || 'TBD',
        awayTeamBadge: teamB.teamBadge || '',
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
        scorers: [],
        cleanSheets: { home: false, away: false },
        completedAt: null,
        proofUrl: ''
      });
    }

    if (matches.length > 0) {
      rounds.push({
        roundNumber,
        roundName,
        stage: stageName,
        matches
      });
    }

    // Rotate pool (keep first fixed, rotate the rest)
    const fixed = teamPool[0];
    const rest = teamPool.slice(1);
    const last = rest.pop();
    rest.unshift(last);
    teamPool = [fixed, ...rest];
  }

  return rounds;
}

// Format 1: Full Premier League Style (All vs All)
function generateLeagueFixtures(players) {
  return generateRoundRobinRounds(players, 'Premier League Format');
}

// Format 2: Group Stage + Knockouts (e.g. 2 or 4 groups)
function generateGroupStageFixtures(players, numGroups = 2) {
  // Shuffle players randomly
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const groupNames = ['Group A', 'Group B', 'Group C', 'Group D'];
  const groups = {};

  for (let i = 0; i < numGroups; i++) {
    groups[groupNames[i]] = [];
  }

  shuffled.forEach((p, idx) => {
    const groupName = groupNames[idx % numGroups];
    p.group = groupName;
    groups[groupName].push(p);
  });

  const allRounds = [];

  // Generate round-robin for each group
  Object.keys(groups).forEach(groupName => {
    const groupPlayers = groups[groupName];
    const groupRounds = generateRoundRobinRounds(groupPlayers, groupName);
    allRounds.push(...groupRounds);
  });

  // Pre-seed Knockout Brackets placeholder (e.g. Semifinals & Final)
  const knockoutMatches = [];
  if (numGroups === 2) {
    knockoutMatches.push(
      {
        id: `ko_semi_1_${Date.now()}`,
        stage: 'Semi-Final',
        round: 100,
        roundName: 'Semi-Final 1',
        homePlayerId: 'TBD',
        homePlayerName: 'Group A Winner (1st)',
        homeIgn: 'TBD',
        homeTeamId: '',
        homeTeamName: 'TBD',
        awayPlayerId: 'TBD',
        awayPlayerName: 'Group B Runner-up (2nd)',
        awayIgn: 'TBD',
        awayTeamId: '',
        awayTeamName: 'TBD',
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
        scorers: [],
        cleanSheets: { home: false, away: false },
        isKnockout: true,
        nextMatchId: `ko_final_${Date.now()}`,
        nextMatchSlot: 'home'
      },
      {
        id: `ko_semi_2_${Date.now()}`,
        stage: 'Semi-Final',
        round: 100,
        roundName: 'Semi-Final 2',
        homePlayerId: 'TBD',
        homePlayerName: 'Group B Winner (1st)',
        homeIgn: 'TBD',
        homeTeamId: '',
        homeTeamName: 'TBD',
        awayPlayerId: 'TBD',
        awayPlayerName: 'Group A Runner-up (2nd)',
        awayIgn: 'TBD',
        awayTeamId: '',
        awayTeamName: 'TBD',
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
        scorers: [],
        cleanSheets: { home: false, away: false },
        isKnockout: true,
        nextMatchId: `ko_final_${Date.now()}`,
        nextMatchSlot: 'away'
      },
      {
        id: `ko_final_${Date.now()}`,
        stage: 'Grand Final',
        round: 101,
        roundName: 'Grand Final 🏆',
        homePlayerId: 'TBD',
        homePlayerName: 'Winner Semi-Final 1',
        homeIgn: 'TBD',
        homeTeamId: '',
        homeTeamName: 'TBD',
        awayPlayerId: 'TBD',
        awayPlayerName: 'Winner Semi-Final 2',
        awayIgn: 'TBD',
        awayTeamId: '',
        awayTeamName: 'TBD',
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
        scorers: [],
        cleanSheets: { home: false, away: false },
        isKnockout: true
      }
    );
  }

  if (knockoutMatches.length > 0) {
    allRounds.push({
      roundNumber: 100,
      roundName: 'Knockout Stages',
      stage: 'Knockouts',
      matches: knockoutMatches
    });
  }

  return { rounds: allRounds, groups };
}

// Format 3: Multi-Stage (Stage 1 Groups -> Stage 2 Super League / Next Group -> Knockouts)
function generateMultiStageFixtures(players) {
  // First generate 2 groups
  const groupData = generateGroupStageFixtures(players, 2);
  return {
    rounds: groupData.rounds,
    groups: groupData.groups,
    isMultiStage: true
  };
}

// Calculate Standings / Points Table
function calculateStandings(players, allMatches) {
  // Initialize table mapping
  const table = {};

  players.forEach(p => {
    table[p.id] = {
      playerId: p.id,
      playerName: p.name,
      ign: p.ign || p.name,
      teamId: p.teamId || '',
      teamName: p.teamName || 'No Team',
      teamBadge: p.teamBadge || '',
      group: p.group || 'All',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [] // 'W', 'D', 'L'
    };
  });

  // Process completed matches
  allMatches.forEach(m => {
    if (m.status !== 'completed' || m.homeScore === null || m.awayScore === null) return;
    if (m.isKnockout) return; // Knockouts don't count towards points table

    const home = table[m.homePlayerId];
    const away = table[m.awayPlayerId];

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;

    home.goalsFor += Number(m.homeScore);
    home.goalsAgainst += Number(m.awayScore);

    away.goalsFor += Number(m.awayScore);
    away.goalsAgainst += Number(m.homeScore);

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      home.form.push('W');

      away.lost += 1;
      away.form.push('L');
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      away.points += 3;
      away.form.push('W');

      home.lost += 1;
      home.form.push('L');
    } else {
      home.drawn += 1;
      home.points += 1;
      home.form.push('D');

      away.drawn += 1;
      away.points += 1;
      away.form.push('D');
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });

  // Calculate sort order
  const sortFn = (a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.playerName.localeCompare(b.playerName);
  };

  const list = Object.values(table);

  // Keep last 5 in form guide
  list.forEach(item => {
    item.form = item.form.slice(-5);
  });

  // Group by group if applicable
  const byGroup = {};
  list.forEach(item => {
    const grp = item.group || 'League';
    if (!byGroup[grp]) byGroup[grp] = [];
    byGroup[grp].push(item);
  });

  Object.keys(byGroup).forEach(grp => {
    byGroup[grp].sort(sortFn);
    // Assign position
    byGroup[grp].forEach((entry, idx) => {
      entry.position = idx + 1;
    });
  });

  const overall = [...list].sort(sortFn);
  overall.forEach((entry, idx) => {
    entry.position = idx + 1;
  });

  return {
    overall,
    byGroup
  };
}

// Calculate Golden Boot (Top Goalscorers)
function calculateGoldenBoot(players, allMatches) {
  const scorersMap = {};

  allMatches.forEach(m => {
    if (m.status !== 'completed' || !Array.isArray(m.scorers)) return;

    m.scorers.forEach(s => {
      const scorerName = (s.player || s.name || 'Unknown').trim();
      const goals = Number(s.goals) || 1;
      const teamName = s.teamName || (s.side === 'home' ? m.homeTeamName : m.awayTeamName) || '';
      const ign = s.ign || (s.side === 'home' ? m.homeIgn : m.awayIgn) || '';
      const key = `${scorerName}__${teamName}`;

      if (!scorersMap[key]) {
        scorersMap[key] = {
          name: scorerName,
          ign,
          teamName,
          goals: 0,
          matchesScoredIn: 0
        };
      }

      scorersMap[key].goals += goals;
      scorersMap[key].matchesScoredIn += 1;
    });
  });

  const list = Object.values(scorersMap).sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.name.localeCompare(b.name);
  });

  list.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return list;
}

// Calculate Golden Glove (Clean Sheets)
function calculateGoldenGlove(players, allMatches) {
  const gloveMap = {};

  // Initialize for all registered players with teams
  players.forEach(p => {
    gloveMap[p.id] = {
      playerId: p.id,
      playerName: p.name,
      ign: p.ign || p.name,
      teamId: p.teamId || '',
      teamName: p.teamName || 'No Team',
      teamBadge: p.teamBadge || '',
      cleanSheets: 0,
      goalsConceded: 0,
      matchesPlayed: 0
    };
  });

  allMatches.forEach(m => {
    if (m.status !== 'completed' || m.homeScore === null || m.awayScore === null) return;

    const homeG = gloveMap[m.homePlayerId];
    const awayG = gloveMap[m.awayPlayerId];

    if (homeG) {
      homeG.matchesPlayed += 1;
      homeG.goalsConceded += Number(m.awayScore);
      if (Number(m.awayScore) === 0 || m.cleanSheets?.home) {
        homeG.cleanSheets += 1;
      }
    }

    if (awayG) {
      awayG.matchesPlayed += 1;
      awayG.goalsConceded += Number(m.homeScore);
      if (Number(m.homeScore) === 0 || m.cleanSheets?.away) {
        awayG.cleanSheets += 1;
      }
    }
  });

  const list = Object.values(gloveMap).sort((a, b) => {
    if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets;
    if (a.goalsConceded !== b.goalsConceded) return a.goalsConceded - b.goalsConceded;
    return b.matchesPlayed - a.matchesPlayed;
  });

  list.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return list;
}

module.exports = {
  generateLeagueFixtures,
  generateGroupStageFixtures,
  generateMultiStageFixtures,
  calculateStandings,
  calculateGoldenBoot,
  calculateGoldenGlove
};
