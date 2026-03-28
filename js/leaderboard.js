/* ═══════════════════════════════════════════════════════════
   GLOBAL LEADERBOARD SYSTEM (Supabase)
═══════════════════════════════════════════════════════════ */

// 1. Initialize Supabase (Paste your URL and Key here)
const supabaseUrl = 'https://rwwsluvuqbszokkgxrxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d3NsdXZ1cWJzem9ra2d4cnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzI5NDUsImV4cCI6MjA5MDI0ODk0NX0.2b_j-DNAnuSJJ3dQOHxADzHF_wKzE_nx3ABsb02hG7g';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const LB = {
  // Fetch top 10 scores for a specific game
  async get(type) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('game_type', type)
        .order('score', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
      return [];
    }
  },

  // Push a new score to the database
  async add(type, name, score) {
    const trimmedName = (name || 'Anonymous').trim().substring(0, 18);
    try {
      await supabase
        .from('leaderboard')
        .insert([{ game_type: type, name: trimmedName, score: score }]);
      
      // Refresh the UI after successful save
      await renderLeaderboard();
      await renderEvLb(type);
    } catch (e) {
      console.error("Error saving score:", e);
    }
  }
};

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Full leaderboard section (tabbed) ──
let currentLbTab = 'horror';

function switchLbTab(type) {
  currentLbTab = type;
  document.querySelectorAll('.lb-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.type === type);
  });
  renderLeaderboard();
}

async function renderLeaderboard() {
  const container = document.getElementById('lb-entries');
  container.innerHTML = `<div class="lb-empty">Loading scores...</div>`; // Loading state

  const entries = await LB.get(currentLbTab);
  
  if (!entries.length) {
    container.innerHTML = `<div class="lb-empty">No scores yet — play the demo to get on the board</div>`;
    return;
  }
  
  const rankEmojis = ['🥇', '🥈', '🥉'];
  const rankClasses = ['lb-gold', 'lb-silver', 'lb-bronze'];
  
  container.innerHTML = `
    <div class="lb-grid">
      ${entries.map((e, i) => `
        <div class="lb-row ${rankClasses[i] || ''}" style="animation-delay:${i * 0.06}s">
          <div class="lb-rank">${rankEmojis[i] || (i + 1)}</div>
          <div class="lb-name-cell">
            <div class="lb-name">${escapeHtml(e.name)}</div>
            <div class="lb-game-type ${currentLbTab}-type">${currentLbTab === 'horror' ? '⚡ Lights Out' : '🏏 360 Strike'}</div>
          </div>
          <div class="lb-score ${currentLbTab}-score">${e.score}</div>
        </div>
      `).join('')}
    </div>`;
}

// ── Inline mini-leaderboard (overlaid on each game's ev-visual) ──
async function renderEvLb(type) {
  const listEl = document.getElementById(`ev-lb-${type}-list`);
  if (!listEl) return;
  
  const entries = await LB.get(type);
  const top5 = entries.slice(0, 5); // show top 5 inline
  
  if (!top5.length) {
    listEl.innerHTML = `<div class="ev-lb-empty">No scores yet</div>`;
    return;
  }
  
  const rankSymbols = ['🥇', '🥈', '🥉', '4', '5'];
  const rankClasses = ['ev-gold', 'ev-silver', 'ev-bronze', '', ''];
  
  listEl.innerHTML = top5.map((e, i) => `
    <div class="ev-lb-row ${rankClasses[i]}" style="animation-delay:${i * 0.05}s">
      <div class="ev-lb-rank">${rankSymbols[i]}</div>
      <div class="ev-lb-name">${escapeHtml(e.name)}</div>
      <div class="ev-lb-score">${e.score}</div>
    </div>
  `).join('');
}

// Init on load
renderLeaderboard();
renderEvLb('horror');
renderEvLb('cricket');