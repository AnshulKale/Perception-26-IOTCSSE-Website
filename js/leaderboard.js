/* ═══════════════════════════════════════════════════════════
       LEADERBOARD SYSTEM
    ═══════════════════════════════════════════════════════════ */
    const LB = {
      _key: type => 'lb_' + type,

      get(type) {
        try { return JSON.parse(localStorage.getItem(this._key(type)) || '[]') }
        catch(e) { return [] }
      },

      add(type, name, score) {
        const data = this.get(type);
        const trimmedName = (name || 'Anonymous').trim().substring(0, 18);
        data.push({ name: trimmedName, score, ts: Date.now() });
        data.sort((a, b) => b.score - a.score);
        data.splice(10);
        try { localStorage.setItem(this._key(type), JSON.stringify(data)) } catch(e) {}
        renderLeaderboard();
        renderEvLb(type);
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

    function renderLeaderboard() {
      const entries = LB.get(currentLbTab);
      const container = document.getElementById('lb-entries');
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
    function renderEvLb(type) {
      const listEl = document.getElementById(`ev-lb-${type}-list`);
      if (!listEl) return;
      const entries = LB.get(type).slice(0, 5); // show top 5 inline
      if (!entries.length) {
        listEl.innerHTML = `<div class="ev-lb-empty">No scores yet</div>`;
        return;
      }
      const rankSymbols = ['🥇', '🥈', '🥉', '4', '5'];
      const rankClasses = ['ev-gold', 'ev-silver', 'ev-bronze', '', ''];
      listEl.innerHTML = entries.map((e, i) => `
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