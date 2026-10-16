// API Client for Madras United FC Mobile Tournament
const API = {
  baseUrl: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? ''
    : '', // Uses relative path for both local and hosted environments

  async getTournament() {
    const res = await fetch('/api/tournament');
    if (!res.ok) throw new Error('Failed to load tournament data');
    return res.json();
  },

  async registerPlayer(data) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to register');
    return result;
  },

  async pickTeam(playerId, teamId) {
    const res = await fetch('/api/teams/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, teamId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to pick team');
    return result;
  },

  async verifyAdmin(pin) {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Incorrect PIN');
    return result;
  },

  async updateDraftSettings(payload) {
    const res = await fetch('/api/admin/team-selection/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update draft settings');
    return result;
  },

  async updateTournamentSettings(payload) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update settings');
    return result;
  },

  async generateFixtures(payload) {
    const res = await fetch('/api/admin/fixtures/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to generate fixtures');
    return result;
  },

  async submitMatchResult(payload) {
    const res = await fetch('/api/admin/matches/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save match result');
    return result;
  },

  async deletePlayer(playerId, pin) {
    const res = await fetch(`/api/admin/players/${playerId}?pin=${encodeURIComponent(pin)}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete player');
    return result;
  },

  async resetTournament(pin) {
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to reset tournament');
    return result;
  },

  async seedDemo(pin) {
    const res = await fetch('/api/admin/seed-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to load demo');
    return result;
  }
};

window.API = API;
