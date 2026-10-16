// Madras United FC Mobile Solo Tournament - Core Application Controller

(function () {
  'use strict';

  // --- APPLICATION STATE ---
  const state = {
    tournamentInfo: {},
    teamSelection: {},
    players: [],
    teams: [],
    fixtures: [],
    standings: { overall: [], byGroup: {} },
    goldenBoot: [],
    goldenGlove: [],
    auditLog: [],
    serverTime: null,
    
    // UI state
    currentTab: 'tab-home',
    activeLeague: 'ALL',
    searchQuery: '',
    activeFixFilter: 'ALL',
    activeGroupTab: 'OVERALL',
    statsView: 'boot', // 'boot' | 'glove'
    adminPin: sessionStorage.getItem('mu_admin_pin') || null,
    selectedTeamForModal: null,
    countdownInterval: null
  };

  // --- DOM ELEMENTS ---
  const elements = {
    // Nav & Tabs
    navButtons: document.querySelectorAll('.nav-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    headerAdminBtn: document.getElementById('headerAdminBtn'),
    adminHeaderLabel: document.getElementById('adminHeaderLabel'),
    playerCountChip: document.getElementById('playerCountChip'),
    currentFormatBadge: document.getElementById('currentFormatBadge'),
    heroTournamentName: document.getElementById('heroTournamentName'),
    heroTournamentSub: document.getElementById('heroTournamentSub'),
    
    // Countdown
    draftCountdownBox: document.getElementById('draftCountdownBox'),
    cdHours: document.getElementById('cdHours'),
    cdMinutes: document.getElementById('cdMinutes'),
    cdSeconds: document.getElementById('cdSeconds'),
    
    // Registration
    registrationForm: document.getElementById('registrationForm'),
    regName: document.getElementById('regName'),
    regIgn: document.getElementById('regIgn'),
    regUid: document.getElementById('regUid'),
    regOvr: document.getElementById('regOvr'),
    regWhatsapp: document.getElementById('regWhatsapp'),
    registeredCount: document.getElementById('registeredCount'),
    playersListContainer: document.getElementById('playersListContainer'),
    auditLogContainer: document.getElementById('auditLogContainer'),
    btnShareLink: document.getElementById('btnShareLink'),

    // Teams
    teamSearchInput: document.getElementById('teamSearchInput'),
    leagueTabBtns: document.querySelectorAll('.league-tab-btn[data-league]'),
    teamsGridContainer: document.getElementById('teamsGridContainer'),
    draftStatusBadge: document.getElementById('draftStatusBadge'),

    // Fixtures
    fixturesCountBadge: document.getElementById('fixturesCountBadge'),
    fixFilterBtns: document.querySelectorAll('.league-tab-btn[data-fixfilter]'),
    fixturesListContainer: document.getElementById('fixturesListContainer'),

    // Standings
    standingsGroupTabs: document.getElementById('standingsGroupTabs'),
    standingsTableBody: document.getElementById('standingsTableBody'),

    // Stats
    btnStatsBoot: document.getElementById('btnStatsBoot'),
    btnStatsGlove: document.getElementById('btnStatsGlove'),
    goldenBootSection: document.getElementById('goldenBootSection'),
    goldenGloveSection: document.getElementById('goldenGloveSection'),
    goldenBootListContainer: document.getElementById('goldenBootListContainer'),
    goldenGloveListContainer: document.getElementById('goldenGloveListContainer'),

    // Admin
    adminLoginCard: document.getElementById('adminLoginCard'),
    adminPanelArea: document.getElementById('adminPanelArea'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminPinInput: document.getElementById('adminPinInput'),
    btnAdminLogout: document.getElementById('btnAdminLogout'),
    btnSeedDemo: document.getElementById('btnSeedDemo'),
    btnResetAll: document.getElementById('btnResetAll'),
    adminDraftLockSelect: document.getElementById('adminDraftLockSelect'),
    adminScheduleGroup: document.getElementById('adminScheduleGroup'),
    adminScheduleInput: document.getElementById('adminScheduleInput'),
    btnSaveDraftSettings: document.getElementById('btnSaveDraftSettings'),
    adminFormatSelect: document.getElementById('adminFormatSelect'),
    btnGenerateFixtures: document.getElementById('btnGenerateFixtures'),
    adminMatchSelect: document.getElementById('adminMatchSelect'),
    adminHomeScore: document.getElementById('adminHomeScore'),
    adminAwayScore: document.getElementById('adminAwayScore'),
    lblHomeTeam: document.getElementById('lblHomeTeam'),
    lblAwayTeam: document.getElementById('lblAwayTeam'),
    adminScorersInput: document.getElementById('adminScorersInput'),
    adminCleanSheetSelect: document.getElementById('adminCleanSheetSelect'),
    btnSubmitMatchResult: document.getElementById('btnSubmitMatchResult'),
    adminPlayersManagerList: document.getElementById('adminPlayersManagerList'),

    // Modal
    pickTeamModal: document.getElementById('pickTeamModal'),
    btnClosePickModal: document.getElementById('btnClosePickModal'),
    modalTeamBadge: document.getElementById('modalTeamBadge'),
    modalTeamName: document.getElementById('modalTeamName'),
    modalTeamLeague: document.getElementById('modalTeamLeague'),
    modalPlayerSelect: document.getElementById('modalPlayerSelect'),
    btnConfirmPickTeam: document.getElementById('btnConfirmPickTeam'),

    // Toast
    toastNotice: document.getElementById('toastNotice')
  };

  // --- TOAST HELPER ---
  function showToast(message, isError = false) {
    if (!elements.toastNotice) return;
    elements.toastNotice.textContent = message;
    elements.toastNotice.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => {
      elements.toastNotice.className = 'toast';
    }, 3500);
  }

  // --- TAB NAVIGATION ---
  function switchTab(tabId) {
    state.currentTab = tabId;
    elements.tabContents.forEach(el => el.classList.remove('active'));
    elements.navButtons.forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (targetBtn) targetBtn.classList.add('active');

    // Update admin header state if admin tab
    if (tabId === 'tab-admin') {
      elements.headerAdminBtn.classList.add('active');
    } else {
      elements.headerAdminBtn.classList.remove('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- INITIAL DATA FETCH & AUTO-SYNC ---
  async function syncTournamentData(isFirstLoad = false) {
    try {
      const data = await API.getTournament();
      state.tournamentInfo = data.tournamentInfo || {};
      state.teamSelection = data.teamSelection || {};
      state.players = data.players || [];
      state.teams = data.teams || window.TEAMS_LIST || [];
      state.fixtures = data.fixtures || [];
      state.standings = data.standings || { overall: [], byGroup: {} };
      state.goldenBoot = data.goldenBoot || [];
      state.goldenGlove = data.goldenGlove || [];
      state.auditLog = data.auditLog || [];
      state.serverTime = data.serverTime || new Date().toISOString();

      renderAll();

      if (isFirstLoad) {
        checkAdminSession();
      }
    } catch (err) {
      console.warn('Sync notice:', err.message);
    }
  }

  // --- RENDER ALL SECTIONS ---
  function renderAll() {
    renderTournamentHeader();
    renderCountdownBanner();
    renderPlayersList();
    renderAuditLog();
    renderTeamsGrid();
    renderFixtures();
    renderStandings();
    renderLeaderboards();
    renderAdminPanel();
  }

  // 1. Header & Summary Info
  function renderTournamentHeader() {
    if (state.tournamentInfo.name) {
      elements.heroTournamentName.textContent = state.tournamentInfo.name;
    }
    if (state.tournamentInfo.subtitle) {
      elements.heroTournamentSub.textContent = state.tournamentInfo.subtitle;
    }

    const count = state.players.length;
    elements.playerCountChip.textContent = count;
    elements.registeredCount.textContent = count;

    // Format badge
    const format = state.tournamentInfo.format || 'groups_knockouts';
    const formatNames = {
      groups_knockouts: 'Group Stage + Knockouts',
      league: 'Premier League Format',
      multistage: 'Multi-Stage Format'
    };
    elements.currentFormatBadge.textContent = formatNames[format] || 'Tournament';
  }

  // 2. Draft Countdown & Lock Banner
  function renderCountdownBanner() {
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
    }

    const ts = state.teamSelection;
    const isLocked = ts.isLocked;
    const scheduledTime = ts.scheduledOpenTime ? new Date(ts.scheduledOpenTime).getTime() : null;
    const now = Date.now();

    if (isLocked) {
      elements.draftCountdownBox.style.display = 'block';
      elements.draftCountdownBox.style.borderColor = 'rgba(255, 51, 102, 0.4)';
      document.getElementById('countdownTitle').textContent = 'Team Draft is Currently LOCKED by Admin';
      elements.cdHours.textContent = '--';
      elements.cdMinutes.textContent = '--';
      elements.cdSeconds.textContent = '--';
      elements.draftStatusBadge.textContent = 'DRAFT LOCKED';
      elements.draftStatusBadge.className = 'badge-taken';
      return;
    }

    if (scheduledTime && scheduledTime > now) {
      elements.draftCountdownBox.style.display = 'block';
      elements.draftCountdownBox.style.borderColor = 'rgba(255, 215, 0, 0.4)';
      document.getElementById('countdownTitle').textContent = 'Team Selection Unlocks In:';
      elements.draftStatusBadge.textContent = 'OPENS SOON';
      elements.draftStatusBadge.className = 'badge-available';
      elements.draftStatusBadge.style.color = 'var(--gold-accent)';
      elements.draftStatusBadge.style.borderColor = 'var(--gold-accent)';

      function tick() {
        const diff = scheduledTime - Date.now();
        if (diff <= 0) {
          clearInterval(state.countdownInterval);
          syncTournamentData();
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        elements.cdHours.textContent = String(hours).padStart(2, '0');
        elements.cdMinutes.textContent = String(mins).padStart(2, '0');
        elements.cdSeconds.textContent = String(secs).padStart(2, '0');
      }

      tick();
      state.countdownInterval = setInterval(tick, 1000);
      return;
    }

    // Otherwise Draft is OPEN
    elements.draftCountdownBox.style.display = 'none';
    elements.draftStatusBadge.textContent = 'DRAFT LIVE NOW';
    elements.draftStatusBadge.className = 'badge-available';
    elements.draftStatusBadge.style.color = 'var(--primary-neon)';
    elements.draftStatusBadge.style.borderColor = 'var(--primary-neon)';
  }

  // 3. Registered Players List
  function renderPlayersList() {
    if (!elements.playersListContainer) return;
    if (state.players.length === 0) {
      elements.playersListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 18px; font-size: 13px;">
          <i class="fa-solid fa-user-clock" style="font-size: 24px; margin-bottom: 6px; display: block; opacity: 0.5;"></i>
          No players registered yet. Enter your details above to join!
        </div>
      `;
      return;
    }

    let html = '';
    state.players.forEach((p, idx) => {
      const teamBadge = p.teamBadge ? `<img src="${p.teamBadge}" style="width: 20px; height: 20px; object-fit: contain;">` : '';
      const teamPicked = p.teamName 
        ? `<span style="color: var(--primary-neon); display: inline-flex; align-items: center; gap: 4px;">${teamBadge} ${p.teamName}</span>` 
        : `<span style="color: var(--text-muted); font-size: 11px;">(No Team Picked)</span>`;
      
      const whatsappBtn = p.whatsapp ? `
        <a href="https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" style="color: #25D366; font-size: 13px; text-decoration: none;" title="Chat on WhatsApp">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
      ` : '';

      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #1a233a; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff;">
              ${idx + 1}
            </div>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 14px; line-height: 1.1;">
                ${escapeHtml(p.name)} <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">(${escapeHtml(p.ign)})</span>
              </div>
              <div style="font-size: 12px; margin-top: 2px;">
                ${teamPicked}
                ${p.ovr ? `<span style="background: rgba(255,215,0,0.15); color: var(--gold-accent); font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px; margin-left: 6px;">${p.ovr} OVR</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${whatsappBtn}
            <span style="font-size: 10px; color: var(--cyan-neon);">${p.formattedPickedAt ? 'Locked' : 'Registered'}</span>
          </div>
        </div>
      `;
    });

    elements.playersListContainer.innerHTML = html;
  }

  // 4. Audit Log & Proof Feed
  function renderAuditLog() {
    if (!elements.auditLogContainer) return;
    if (state.auditLog.length === 0) {
      elements.auditLogContainer.innerHTML = `
        <p style="color: var(--text-muted); font-size: 12px; padding: 8px 0;">No activities logged yet.</p>
      `;
      return;
    }

    let html = '';
    state.auditLog.slice(0, 8).forEach(entry => {
      html += `
        <div class="audit-item">
          <i class="fa-solid fa-clock-rotate-left" style="color: var(--cyan-neon); margin-right: 4px;"></i>
          <strong>${escapeHtml(entry.message)}</strong>
          <span class="audit-time">${entry.formattedTime || ''}</span>
        </div>
      `;
    });
    elements.auditLogContainer.innerHTML = html;
  }

  // 5. Teams Picker Grid
  function renderTeamsGrid() {
    if (!elements.teamsGridContainer) return;

    const filtered = state.teams.filter(team => {
      const matchLeague = state.activeLeague === 'ALL' || team.league === state.activeLeague;
      const matchQuery = !state.searchQuery || 
        team.name.toLowerCase().includes(state.searchQuery) ||
        team.league.toLowerCase().includes(state.searchQuery);
      return matchLeague && matchQuery;
    });

    if (filtered.length === 0) {
      elements.teamsGridContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px;">
          No teams found matching "${escapeHtml(state.searchQuery)}".
        </div>
      `;
      return;
    }

    const isCurrentlyOpen = state.teamSelection.isSelectionCurrentlyOpen;

    let html = '';
    filtered.forEach(team => {
      const isAvailable = team.isAvailable !== false;
      const pick = team.pickedBy;

      const stars = '★'.repeat(Math.floor(team.starRating || 5)) + (team.starRating % 1 ? '½' : '');

      let actionHtml = '';
      if (isAvailable) {
        actionHtml = `
          <div class="team-status-col">
            <span class="badge-available">AVAILABLE</span>
            <button class="btn-pick-action" data-pickteam="${team.id}" ${!isCurrentlyOpen ? 'disabled style="opacity:0.4;"' : ''}>
              ${isCurrentlyOpen ? 'Pick Team' : 'Locked'}
            </button>
          </div>
        `;
      } else {
        actionHtml = `
          <div class="team-status-col">
            <span class="badge-taken">LOCKED / TAKEN</span>
            <div class="taken-by-text">${escapeHtml(pick?.playerName || 'Player')}</div>
            <div style="font-size: 10px; color: var(--text-muted);">(${escapeHtml(pick?.playerIgn || '')})</div>
            <div class="timestamp-proof">
              <i class="fa-solid fa-clock"></i> ${escapeHtml(pick?.formattedTime || 'Proof Saved')}
            </div>
          </div>
        `;
      }

      html += `
        <div class="team-card ${isAvailable ? 'available' : 'taken'}" style="border-left: 3px solid ${team.color || 'var(--border-light)'};">
          <img class="team-badge-img" src="${team.badge}" alt="${team.name}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d3/Soccerball.svg'">
          <div class="team-info">
            <div class="team-name">${escapeHtml(team.name)}</div>
            <div class="team-league-tag">${escapeHtml(team.league)} • <span style="color: var(--gold-accent);">${stars}</span></div>
          </div>
          ${actionHtml}
        </div>
      `;
    });

    elements.teamsGridContainer.innerHTML = html;

    // Attach click handlers to Pick Team buttons
    elements.teamsGridContainer.querySelectorAll('.btn-pick-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const teamId = e.currentTarget.getAttribute('data-pickteam');
        openPickTeamModal(teamId);
      });
    });
  }

  // 6. Fixtures & Results
  function renderFixtures() {
    if (!elements.fixturesListContainer) return;

    const rounds = state.fixtures || [];
    let totalMatches = 0;
    rounds.forEach(r => totalMatches += (r.matches?.length || 0));
    elements.fixturesCountBadge.textContent = `${totalMatches} MATCHES`;

    if (rounds.length === 0) {
      elements.fixturesListContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 40px 16px;">
          <i class="fa-solid fa-shuffle" style="font-size: 36px; margin-bottom: 12px; color: var(--cyan-neon); opacity: 0.7;"></i>
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 6px;">Fixtures Not Yet Generated</h3>
          <p style="font-size: 12px; margin-bottom: 16px;">Admin will generate the match schedule once all players are registered!</p>
          ${state.adminPin ? `<button class="btn btn-primary" onclick="window.switchToAdmin()">Go to Admin Dashboard</button>` : ''}
        </div>
      `;
      return;
    }

    let html = '';
    rounds.forEach(round => {
      const matches = round.matches || [];
      const filteredMatches = matches.filter(m => {
        if (state.activeFixFilter === 'UPCOMING') return m.status !== 'completed';
        if (state.activeFixFilter === 'COMPLETED') return m.status === 'completed';
        if (state.activeFixFilter === 'KNOCKOUTS') return m.isKnockout || round.stage === 'Knockouts';
        return true;
      });

      if (filteredMatches.length === 0) return;

      html += `
        <div class="round-section">
          <div class="round-header">
            <span><i class="fa-solid fa-calendar-day"></i> ${escapeHtml(round.roundName || 'Match Round')}</span>
            <span style="font-size: 11px; color: var(--text-muted);">${filteredMatches.length} Matches</span>
          </div>
      `;

      filteredMatches.forEach(m => {
        const isCompleted = m.status === 'completed';
        const homeCrest = m.homeTeamBadge || 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Soccerball.svg';
        const awayCrest = m.awayTeamBadge || 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Soccerball.svg';

        let scorersText = '';
        if (Array.isArray(m.scorers) && m.scorers.length > 0) {
          const sList = m.scorers.map(s => `⚽ ${escapeHtml(s.player || s.name)} (${s.goals || 1})`).join(' • ');
          scorersText = `<div class="match-scorers-list"><span>Scorers:</span> ${sList}</div>`;
        }

        let cleanSheetBadge = '';
        if (m.cleanSheets?.home || m.cleanSheets?.away) {
          cleanSheetBadge = `<span style="color: var(--cyan-neon);"><i class="fa-solid fa-mitten"></i> Clean Sheet Kept</span>`;
        }

        const adminEditBtn = state.adminPin ? `
          <button class="btn-secondary" style="font-size: 10px; padding: 2px 8px; width: auto;" onclick="window.prepareAdminScoreEntry('${m.id}')">
            <i class="fa-solid fa-pen"></i> Enter Score
          </button>
        ` : '';

        html += `
          <div class="match-card ${isCompleted ? 'completed' : ''}">
            <div class="match-teams-row">
              <div class="match-side home">
                <img class="match-side-crest" src="${homeCrest}" alt="home">
                <div>
                  <div class="match-player-name">${escapeHtml(m.homePlayerName || 'TBD')}</div>
                  <div class="match-team-label">${escapeHtml(m.homeTeamName || '')}</div>
                </div>
              </div>

              <div class="match-score-badge ${!isCompleted ? 'vs' : ''}">
                ${isCompleted ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
              </div>

              <div class="match-side away">
                <img class="match-side-crest" src="${awayCrest}" alt="away">
                <div>
                  <div class="match-player-name">${escapeHtml(m.awayPlayerName || 'TBD')}</div>
                  <div class="match-team-label">${escapeHtml(m.awayTeamName || '')}</div>
                </div>
              </div>
            </div>

            ${scorersText}

            <div class="match-details-footer">
              <div>
                ${isCompleted ? `<span style="color: var(--primary-neon);">✔ Completed</span>` : `<span style="color: var(--warning-amber);">Upcoming</span>`}
                ${cleanSheetBadge ? ` • ${cleanSheetBadge}` : ''}
              </div>
              <div>${adminEditBtn}</div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    elements.fixturesListContainer.innerHTML = html || `
      <div style="text-align: center; color: var(--text-muted); padding: 30px;">
        No matches match the selected filter.
      </div>
    `;
  }

  // 7. Standings Table
  function renderStandings() {
    if (!elements.standingsTableBody) return;

    const standings = state.standings || { overall: [], byGroup: {} };
    const format = state.tournamentInfo.format || 'groups_knockouts';

    // Group selector tabs
    if (format === 'groups_knockouts' && standings.byGroup && Object.keys(standings.byGroup).length > 0) {
      elements.standingsGroupTabs.style.display = 'flex';
      let tabsHtml = '';
      Object.keys(standings.byGroup).forEach(groupKey => {
        const isActive = state.activeGroupTab === groupKey || (state.activeGroupTab === 'OVERALL' && groupKey === 'Group A');
        tabsHtml += `
          <button class="league-tab-btn ${isActive ? 'active' : ''}" data-group="${groupKey}">
            ${groupKey}
          </button>
        `;
      });
      elements.standingsGroupTabs.innerHTML = tabsHtml;

      // Attach group tab listeners
      elements.standingsGroupTabs.querySelectorAll('.league-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          elements.standingsGroupTabs.querySelectorAll('.league-tab-btn').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          state.activeGroupTab = e.currentTarget.getAttribute('data-group');
          renderStandingsRows();
        });
      });
    } else {
      elements.standingsGroupTabs.style.display = 'none';
    }

    renderStandingsRows();
  }

  function renderStandingsRows() {
    const standings = state.standings || { overall: [], byGroup: {} };
    let list = [];

    if (state.standingsGroupTabs.style.display !== 'none' && standings.byGroup[state.activeGroupTab]) {
      list = standings.byGroup[state.activeGroupTab];
    } else {
      list = standings.overall || [];
    }

    if (list.length === 0) {
      elements.standingsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="padding: 30px; text-align: center; color: var(--text-muted);">
            No match results recorded yet. Points table updates automatically upon match completion!
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    list.forEach((item, idx) => {
      const isQualifyZone = idx < 2; // Top 2 qualify
      const badgeImg = item.teamBadge ? `<img src="${item.teamBadge}" style="width: 18px; height: 18px; object-fit: contain;">` : '';

      // Form dots
      const formHtml = (item.form || []).map(f => {
        const lower = (f || '').toLowerCase();
        return `<span class="form-dot ${lower}">${f}</span>`;
      }).join('');

      rowsHtml += `
        <tr class="${isQualifyZone ? 'qualify-zone' : ''}">
          <td style="font-weight: 800; color: ${idx === 0 ? 'var(--gold-accent)' : '#fff'};">${idx + 1}</td>
          <td class="team-cell">
            ${badgeImg}
            <div>
              <div style="font-size: 13px; line-height: 1.1;">${escapeHtml(item.playerName)}</div>
              <div style="font-size: 10.5px; color: var(--text-muted); font-weight: normal;">${escapeHtml(item.teamName)}</div>
            </div>
          </td>
          <td>${item.played}</td>
          <td>${item.won}</td>
          <td>${item.drawn}</td>
          <td>${item.lost}</td>
          <td style="color: ${item.goalDifference > 0 ? 'var(--primary-neon)' : item.goalDifference < 0 ? 'var(--danger-red)' : '#fff'};">
            ${item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
          </td>
          <td class="pts-cell">${item.points}</td>
          <td><div class="form-dots">${formHtml || '-'}</div></td>
        </tr>
      `;
    });

    elements.standingsTableBody.innerHTML = rowsHtml;
  }

  // 8. Leaderboards (Golden Boot & Golden Glove)
  function renderLeaderboards() {
    // Golden Boot
    if (elements.goldenBootListContainer) {
      const boot = state.goldenBoot || [];
      if (boot.length === 0) {
        elements.goldenBootListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 30px;">
            <i class="fa-solid fa-shoe-prints" style="font-size: 30px; margin-bottom: 8px; opacity: 0.5;"></i>
            <p>Goals will be tracked here once matches are played!</p>
          </div>
        `;
      } else {
        let html = '';
        boot.forEach((item, idx) => {
          const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
          const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
          html += `
            <div class="leaderboard-item">
              <div class="leader-rank ${rankClass}">${rankIcon}</div>
              <div class="leader-info">
                <div class="leader-name">${escapeHtml(item.name)}</div>
                <div class="leader-sub">${escapeHtml(item.teamName)} • ${escapeHtml(item.ign || '')}</div>
              </div>
              <div class="leader-stat">
                ${item.goals}
                <small>Goals</small>
              </div>
            </div>
          `;
        });
        elements.goldenBootListContainer.innerHTML = html;
      }
    }

    // Golden Glove
    if (elements.goldenGloveListContainer) {
      const glove = state.goldenGlove || [];
      if (glove.length === 0) {
        elements.goldenGloveListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 30px;">
            <i class="fa-solid fa-mitten" style="font-size: 30px; margin-bottom: 8px; opacity: 0.5;"></i>
            <p>Clean sheets will be tracked here!</p>
          </div>
        `;
      } else {
        let html = '';
        glove.forEach((item, idx) => {
          const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
          const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
          html += `
            <div class="leaderboard-item">
              <div class="leader-rank ${rankClass}">${rankIcon}</div>
              <div class="leader-info">
                <div class="leader-name">${escapeHtml(item.playerName)}</div>
                <div class="leader-sub">${escapeHtml(item.teamName)} • ${escapeHtml(item.ign)}</div>
              </div>
              <div class="leader-stat">
                ${item.cleanSheets}
                <small>Clean Sheets</small>
              </div>
            </div>
          `;
        });
        elements.goldenGloveListContainer.innerHTML = html;
      }
    }
  }

  // 9. Admin Panel Rendering & Population
  function renderAdminPanel() {
    const isLoggedIn = !!state.adminPin;
    elements.adminLoginCard.style.display = isLoggedIn ? 'none' : 'block';
    elements.adminPanelArea.style.display = isLoggedIn ? 'block' : 'none';
    elements.adminHeaderLabel.textContent = isLoggedIn ? 'PANEL ⚙️' : 'ADMIN';

    if (!isLoggedIn) return;

    // Populate Matches Select for Result Posting
    if (elements.adminMatchSelect) {
      let optionsHtml = '<option value="">-- Choose Match To Enter Score --</option>';
      const allRounds = state.fixtures || [];
      allRounds.forEach(r => {
        (r.matches || []).forEach(m => {
          const scoreLabel = m.status === 'completed' ? `[DONE ${m.homeScore}-${m.awayScore}]` : '[UPCOMING]';
          optionsHtml += `
            <option value="${m.id}">
              ${scoreLabel} ${escapeHtml(m.homePlayerName)} vs ${escapeHtml(m.awayPlayerName)} (${r.roundName})
            </option>
          `;
        });
      });
      elements.adminMatchSelect.innerHTML = optionsHtml;
    }

    // Populate Players Management List
    if (elements.adminPlayersManagerList) {
      if (state.players.length === 0) {
        elements.adminPlayersManagerList.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">No players registered yet.</p>';
      } else {
        let pListHtml = '';
        state.players.forEach(p => {
          pListHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;">
              <div>
                <strong>${escapeHtml(p.name)}</strong> (${escapeHtml(p.ign)})
                <span style="color: var(--primary-neon); margin-left: 6px;">${escapeHtml(p.teamName || 'No Team')}</span>
              </div>
              <button class="btn-danger" style="padding: 2px 8px; font-size: 10px; width: auto;" onclick="window.deletePlayerPrompt('${p.id}', '${escapeHtml(p.name)}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `;
        });
        elements.adminPlayersManagerList.innerHTML = pListHtml;
      }
    }
  }

  // --- MODAL: PICK TEAM ---
  function openPickTeamModal(teamId) {
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return;

    state.selectedTeamForModal = team;
    elements.modalTeamBadge.src = team.badge;
    elements.modalTeamName.textContent = team.name;
    elements.modalTeamLeague.textContent = team.league;

    // Populate Player Select Dropdown
    let pOptions = '<option value="">-- Select Your Registered Name --</option>';
    state.players.forEach(p => {
      const alreadyHasTeam = p.teamId ? ` (Currently: ${p.teamName})` : '';
      pOptions += `<option value="${p.id}">${escapeHtml(p.name)} - ${escapeHtml(p.ign)}${alreadyHasTeam}</option>`;
    });
    elements.modalPlayerSelect.innerHTML = pOptions;

    elements.pickTeamModal.classList.add('active');
  }

  function closePickTeamModal() {
    elements.pickTeamModal.classList.remove('active');
    state.selectedTeamForModal = null;
  }

  // --- EVENT LISTENERS ---

  // 1. Bottom Nav Switching
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  // Header Admin Button
  elements.headerAdminBtn.addEventListener('click', () => {
    switchTab('tab-admin');
  });

  window.switchToAdmin = function () {
    switchTab('tab-admin');
  };

  // 2. League Tabs Filter
  elements.leagueTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.leagueTabBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.activeLeague = e.currentTarget.getAttribute('data-league');
      renderTeamsGrid();
    });
  });

  // Search input
  if (elements.teamSearchInput) {
    elements.teamSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderTeamsGrid();
    });
  }

  // 3. Fixtures Filter
  elements.fixFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.fixFilterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.activeFixFilter = e.currentTarget.getAttribute('data-fixfilter');
      renderFixtures();
    });
  });

  // 4. Stats View Toggle
  elements.btnStatsBoot.addEventListener('click', () => {
    elements.btnStatsBoot.classList.add('active');
    elements.btnStatsGlove.classList.remove('active');
    elements.goldenBootSection.style.display = 'block';
    elements.goldenGloveSection.style.display = 'none';
  });

  elements.btnStatsGlove.addEventListener('click', () => {
    elements.btnStatsGlove.classList.add('active');
    elements.btnStatsBoot.classList.remove('active');
    elements.goldenBootSection.style.display = 'none';
    elements.goldenGloveSection.style.display = 'block';
  });

  // 5. Registration Form Submit
  elements.registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.regName.value.trim();
    const ign = elements.regIgn.value.trim();
    const uid = elements.regUid.value.trim();
    const ovr = elements.regOvr.value;
    const whatsapp = elements.regWhatsapp.value.trim();

    if (!name || !ign) {
      showToast('Please enter both Name and FC Mobile IGN.', true);
      return;
    }

    try {
      const res = await API.registerPlayer({ name, ign, uid, ovr, whatsapp });
      showToast(res.message);
      elements.registrationForm.reset();
      await syncTournamentData();
      // Prompt user to pick team
      setTimeout(() => {
        showToast('Now choose your exclusive team in the "Pick Team" tab!');
        switchTab('tab-teams');
      }, 1200);
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // 6. Confirm Pick Team
  elements.btnConfirmPickTeam.addEventListener('click', async () => {
    const playerId = elements.modalPlayerSelect.value;
    if (!playerId) {
      showToast('Please select your registered name.', true);
      return;
    }
    if (!state.selectedTeamForModal) return;

    try {
      const res = await API.pickTeam(playerId, state.selectedTeamForModal.id);
      showToast(res.message);
      closePickTeamModal();
      await syncTournamentData();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  elements.btnClosePickModal.addEventListener('click', closePickTeamModal);
  elements.pickTeamModal.addEventListener('click', (e) => {
    if (e.target === elements.pickTeamModal) closePickTeamModal();
  });

  // 7. Share Link Button
  elements.btnShareLink.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'Madras United FC Mobile Tournament',
        text: 'Register and pick your team for Madras United FC Mobile Solo Championship!',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Tournament link copied to clipboard!');
    }
  });

  // 8. Admin Authentication
  elements.adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = elements.adminPinInput.value.trim();
    try {
      await API.verifyAdmin(pin);
      state.adminPin = pin;
      sessionStorage.setItem('mu_admin_pin', pin);
      showToast('Admin access granted!');
      elements.adminPinInput.value = '';
      renderAdminPanel();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  elements.btnAdminLogout.addEventListener('click', () => {
    state.adminPin = null;
    sessionStorage.removeItem('mu_admin_pin');
    showToast('Admin panel locked.');
    renderAdminPanel();
  });

  function checkAdminSession() {
    if (state.adminPin) {
      API.verifyAdmin(state.adminPin).catch(() => {
        state.adminPin = null;
        sessionStorage.removeItem('mu_admin_pin');
      }).finally(() => {
        renderAdminPanel();
      });
    }
  }

  // 9. Admin Draft Settings Form
  elements.adminDraftLockSelect.addEventListener('change', (e) => {
    elements.adminScheduleGroup.style.display = e.target.value === 'SCHEDULED' ? 'block' : 'none';
  });

  elements.btnSaveDraftSettings.addEventListener('click', async () => {
    if (!state.adminPin) return;
    const mode = elements.adminDraftLockSelect.value;
    const isLocked = mode === 'LOCKED';
    let scheduledOpenTime = null;

    if (mode === 'SCHEDULED') {
      const val = elements.adminScheduleInput.value;
      if (!val) {
        showToast('Please pick a date and time.', true);
        return;
      }
      scheduledOpenTime = new Date(val).toISOString();
    }

    try {
      await API.updateDraftSettings({
        pin: state.adminPin,
        isLocked,
        scheduledOpenTime
      });
      showToast('Team selection settings updated!');
      await syncTournamentData();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // 10. Admin Generate Fixtures
  elements.btnGenerateFixtures.addEventListener('click', async () => {
    if (!state.adminPin) return;
    const format = elements.adminFormatSelect.value;
    try {
      const res = await API.generateFixtures({
        pin: state.adminPin,
        format
      });
      showToast(res.message);
      await syncTournamentData();
      switchTab('tab-fixtures');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // 11. Admin Match Select Change
  elements.adminMatchSelect.addEventListener('change', (e) => {
    const matchId = e.target.value;
    if (!matchId) return;

    for (const r of state.fixtures) {
      for (const m of (r.matches || [])) {
        if (m.id === matchId) {
          elements.lblHomeTeam.textContent = `${m.homePlayerName} (${m.homeTeamName || 'Home'})`;
          elements.lblAwayTeam.textContent = `${m.awayPlayerName} (${m.awayTeamName || 'Away'})`;
          elements.adminHomeScore.value = m.homeScore !== null ? m.homeScore : '';
          elements.adminAwayScore.value = m.awayScore !== null ? m.awayScore : '';
          
          if (Array.isArray(m.scorers) && m.scorers.length > 0) {
            elements.adminScorersInput.value = m.scorers.map(s => `${s.player} ${s.goals}`).join(', ');
          } else {
            elements.adminScorersInput.value = '';
          }
          return;
        }
      }
    }
  });

  window.prepareAdminScoreEntry = function (matchId) {
    switchTab('tab-admin');
    if (elements.adminMatchSelect) {
      elements.adminMatchSelect.value = matchId;
      elements.adminMatchSelect.dispatchEvent(new Event('change'));
      elements.adminHomeScore.focus();
    }
  };

  // 12. Submit Match Result
  elements.btnSubmitMatchResult.addEventListener('click', async () => {
    if (!state.adminPin) return;
    const matchId = elements.adminMatchSelect.value;
    if (!matchId) {
      showToast('Please select a match to submit results.', true);
      return;
    }

    const homeScore = elements.adminHomeScore.value;
    const awayScore = elements.adminAwayScore.value;

    if (homeScore === '' || awayScore === '') {
      showToast('Please enter scores for both sides.', true);
      return;
    }

    // Parse scorers input: e.g. "Mbappe 2, Saka 1, Haaland 1"
    const rawScorers = elements.adminScorersInput.value.trim();
    const scorers = [];
    if (rawScorers) {
      const parts = rawScorers.split(',');
      parts.forEach(p => {
        const item = p.trim();
        const match = item.match(/^(.+?)\s+(\d+)$/);
        if (match) {
          scorers.push({ player: match[1].trim(), goals: Number(match[2]) });
        } else if (item) {
          scorers.push({ player: item, goals: 1 });
        }
      });
    }

    const cleanSheetChoice = elements.adminCleanSheetSelect.value;
    const cleanSheets = {
      home: cleanSheetChoice === 'home' || (cleanSheetChoice === 'auto' && Number(awayScore) === 0),
      away: cleanSheetChoice === 'away' || (cleanSheetChoice === 'auto' && Number(homeScore) === 0)
    };

    try {
      const res = await API.submitMatchResult({
        pin: state.adminPin,
        matchId,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        scorers,
        cleanSheets
      });
      showToast(res.message);
      await syncTournamentData();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // 13. Seed Demo Tournament
  elements.btnSeedDemo.addEventListener('click', async () => {
    if (!state.adminPin) return;
    try {
      const res = await API.seedDemo(state.adminPin);
      showToast(res.message);
      await syncTournamentData();
      switchTab('tab-standings');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // 14. Reset Data
  elements.btnResetAll.addEventListener('click', async () => {
    if (!state.adminPin) return;
    if (!confirm('Are you sure you want to RESET all registered players, picks, and match fixtures?')) return;

    try {
      const res = await API.resetTournament(state.adminPin);
      showToast(res.message);
      await syncTournamentData();
      switchTab('tab-home');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // 15. Delete Player Prompt
  window.deletePlayerPrompt = async function (playerId, playerName) {
    if (!state.adminPin) return;
    if (!confirm(`Are you sure you want to remove player "${playerName}"? Their team pick will be freed up.`)) return;

    try {
      const res = await API.deletePlayer(playerId, state.adminPin);
      showToast(res.message);
      await syncTournamentData();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- BOOTSTRAP ---
  syncTournamentData(true);

  // Auto-sync polling every 4 seconds for real-time live score updates on players' mobile devices
  setInterval(() => {
    syncTournamentData();
  }, 4000);

})();
