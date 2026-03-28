/* ═══════════════════════════════════════════════════════════
       CRICKET MINI-GAME  — Infinite balls, 3 wickets to end
    ═══════════════════════════════════════════════════════════ */
    const CricketGame = (() => {
      const GW = 400, GH = 580;
      const PITCH_W = 70, PITCH_CX = GW / 2;
      const STUMP_X = PITCH_CX, STUMP_Y = GH - 55;
      const BOWL_X = PITCH_CX, BOWL_Y = 40;
      const BAT_W = 80, BAT_H = 10, BAT_Y = STUMP_Y - 20;
      const BALL_R = 11;
      const HIT_ZONE_TOP = GH - 110, HIT_ZONE_BOT = GH - 60;
      const MAX_WKTS = 3;

      let cvs, ctx2, running = false;
      let score, wickets, balls, fours, sixes;
      let ball, batX, swinging, swingTime;
      let popupText, popupColor, popupAlpha;
      let playerName;
      let frameId = null;
      let lastTs = 0;
      let hudRunsEl, hudWktsEl, hudBallsEl;
      let mouseX = GW / 2;

      // Single pending-bowl timer — prevents double-queuing
      let bowlTimer = null;

      function getBallDifficulty() {
        return Math.min(Math.floor(score / 20), 5);
      }

      function resetState() {
        score = 0; wickets = 0; balls = 0; fours = 0; sixes = 0;
        ball = { x: BOWL_X, y: BOWL_Y, vx: 0, vy: 0, active: false, _swing: 0 };
        batX = GW / 2;
        swinging = false; swingTime = 0;
        popupAlpha = 0; popupText = '';
        mouseX = GW / 2;
        clearBowlTimer();
      }

      function clearBowlTimer() {
        if (bowlTimer !== null) { clearTimeout(bowlTimer); bowlTimer = null; }
      }

      // Schedule next ball — always clears any existing timer first
      function scheduleBowl(delay) {
        clearBowlTimer();
        bowlTimer = setTimeout(() => {
          bowlTimer = null;
          bowlNextBall();
        }, delay);
      }

      function drawBackground() {
        ctx2.fillStyle = '#010a04';
        ctx2.fillRect(0, 0, GW, GH);
        ctx2.save();
        ctx2.strokeStyle = 'rgba(0,255,157,0.06)';
        ctx2.lineWidth = 1;
        for (let r = 60; r < 300; r += 60) {
          ctx2.beginPath();
          ctx2.arc(GW/2, GH - 50, r, 0, Math.PI * 2);
          ctx2.stroke();
        }
        ctx2.restore();
        ctx2.fillStyle = 'rgba(0,60,20,0.55)';
        ctx2.fillRect(PITCH_CX - PITCH_W/2, BOWL_Y - 5, PITCH_W, STUMP_Y - BOWL_Y + 40);
        ctx2.strokeStyle = 'rgba(0,255,157,0.18)';
        ctx2.lineWidth = 1;
        ctx2.strokeRect(PITCH_CX - PITCH_W/2, BOWL_Y - 5, PITCH_W, STUMP_Y - BOWL_Y + 40);
        ctx2.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx2.lineWidth = 1.5;
        ctx2.beginPath();
        ctx2.moveTo(PITCH_CX - PITCH_W/2 - 5, BAT_Y + BAT_H/2);
        ctx2.lineTo(PITCH_CX + PITCH_W/2 + 5, BAT_Y + BAT_H/2);
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.moveTo(PITCH_CX - PITCH_W/2 - 5, BOWL_Y + 10);
        ctx2.lineTo(PITCH_CX + PITCH_W/2 + 5, BOWL_Y + 10);
        ctx2.stroke();
        const stumpColor = swinging ? 'rgba(0,255,157,0.9)' : 'rgba(255,255,255,0.7)';
        ctx2.strokeStyle = stumpColor;
        ctx2.lineWidth = 2.5;
        [-10, 0, 10].forEach(offset => {
          ctx2.beginPath();
          ctx2.moveTo(STUMP_X + offset, STUMP_Y);
          ctx2.lineTo(STUMP_X + offset, STUMP_Y - 30);
          ctx2.stroke();
        });
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.moveTo(STUMP_X - 10, STUMP_Y - 30);
        ctx2.lineTo(STUMP_X + 10, STUMP_Y - 30);
        ctx2.stroke();
        ctx2.fillStyle = 'rgba(255,255,255,0.15)';
        ctx2.beginPath();
        ctx2.arc(BOWL_X, BOWL_Y - 18, 7, 0, Math.PI*2);
        ctx2.fill();
        ctx2.fillRect(BOWL_X - 5, BOWL_Y - 11, 10, 16);
      }

      function drawBall() {
        if (!ball.active) return;
        ctx2.save();
        ctx2.shadowBlur = 16;
        ctx2.shadowColor = 'rgba(0,255,157,0.7)';
        ctx2.beginPath();
        ctx2.arc(ball.x, ball.y, BALL_R, 0, Math.PI*2);
        const grd = ctx2.createRadialGradient(ball.x-4, ball.y-4, 1, ball.x, ball.y, BALL_R);
        grd.addColorStop(0, '#dd3030');
        grd.addColorStop(1, '#6b0000');
        ctx2.fillStyle = grd;
        ctx2.fill();
        ctx2.strokeStyle = 'rgba(255,200,200,0.5)';
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.arc(ball.x, ball.y, BALL_R * 0.75, 0.3, Math.PI - 0.3);
        ctx2.stroke();
        ctx2.restore();
      }

      function drawBat() {
        const bx = batX - BAT_W / 2, by = BAT_Y;
        if (swinging) {
          ctx2.save();
          ctx2.shadowBlur = 20;
          ctx2.shadowColor = 'rgba(0,255,157,0.8)';
          ctx2.fillStyle = 'rgba(0,255,157,0.6)';
          ctx2.fillRect(bx, by, BAT_W, BAT_H);
          ctx2.restore();
        } else {
          ctx2.fillStyle = '#c8a060';
          ctx2.fillRect(bx, by, BAT_W, BAT_H);
          ctx2.fillStyle = '#8b6020';
          ctx2.fillRect(batX - 5, by, 10, BAT_H);
          ctx2.fillStyle = 'rgba(255,255,200,0.25)';
          ctx2.fillRect(bx, by, BAT_W, 2);
        }
      }

      function drawHitZone() {
        if (!ball.active) return;
        const inZone = ball.y > HIT_ZONE_TOP && ball.y < HIT_ZONE_BOT;
        ctx2.save();
        ctx2.globalAlpha = inZone ? 0.35 : 0.1;
        ctx2.strokeStyle = inZone ? '#00ff9d' : 'rgba(255,255,255,0.3)';
        ctx2.lineWidth = 1;
        ctx2.setLineDash([5, 5]);
        ctx2.strokeRect(PITCH_CX - PITCH_W/2 - 2, HIT_ZONE_TOP, PITCH_W + 4, HIT_ZONE_BOT - HIT_ZONE_TOP);
        ctx2.setLineDash([]);
        ctx2.restore();
      }

      function drawPopup() {
        if (popupAlpha <= 0) return;
        ctx2.save();
        ctx2.globalAlpha = popupAlpha;
        ctx2.fillStyle = popupColor;
        ctx2.font = 'bold 28px Bebas Neue, sans-serif';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.shadowBlur = 20;
        ctx2.shadowColor = popupColor;
        ctx2.fillText(popupText, GW / 2, GH / 2 - 40 - (1 - popupAlpha) * 30);
        ctx2.restore();
      }

      function drawWaitMessage() {
        if (!running || ball.active || bowlTimer === null) return;
        ctx2.fillStyle = 'rgba(0,255,157,0.35)';
        ctx2.font = '13px Outfit, sans-serif';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText('Next ball incoming…', GW/2, GH/2 - 20);
      }

      function showPopup(text, color) {
        popupText = text; popupColor = color; popupAlpha = 1;
      }

      function bowlNextBall() {
        if (wickets >= MAX_WKTS || !running) return;
        const diff = getBallDifficulty();
        const variation = (Math.random() - 0.5) * (28 + diff * 8);
        ball.x = BOWL_X;
        ball.y = BOWL_Y + 8;
        ball.vx = variation * 0.016;
        ball.vy = 5.5 + Math.random() * 1.5 + diff * 0.25;
        ball._swing = (Math.random() - 0.5) * 0.005 * diff;
        ball.active = true;
        swinging = false;
        swingTime = 0;
      }

      function updateBall(dt) {
        if (!ball.active) return;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx += ball._swing;
        ball.vx += ball.vx * 0.008;

        // If the ball passes the stumps
        if (ball.y > STUMP_Y + 10) {
            ball.active = false;
            
            // Check if the ball hit the stumps, regardless of if the bat is swinging
            const hitStumps = Math.abs(ball.x - STUMP_X) < 16;
            
            if (hitStumps) {
            wickets++;
            showPopup('WICKET! 🏏', '#ff3355');
            balls++;
            updateHUD();
            if (wickets >= MAX_WKTS) {
                scheduleBowl(900); // Dummy schedule
                setTimeout(() => endGame(), 900);
            } else {
                scheduleBowl(1200);
            }
            } else {
            // Player missed, but it didn't hit the stumps (Dot Ball)
            showPopup('Dot Ball', 'rgba(255,255,255,0.5)');
            balls++;
            updateHUD();
            scheduleBowl(1100);
            }
        }
        }

      function updateSwing() {
        if (!swinging) return;
        if (Date.now() - swingTime > 220) swinging = false;
      }

      function trySwing() {
        // Guard: only act when ball is live
        if (!running || !ball.active) return;

        swinging = true;
        swingTime = Date.now();

        const inHitZone = ball.y > HIT_ZONE_TOP && ball.y < HIT_ZONE_BOT;
        if (!inHitZone) {
          showPopup(ball.y > HIT_ZONE_BOT ? 'Too Late!' : 'Too Early!', 'rgba(255,200,0,0.8)');
          return;
        }

        const dist = Math.abs(batX - ball.x);
        let runs = 0, label = '', col = '';
        if (dist <= 12)      { runs = 6; label = 'SIX! 🎆';  col = '#00ff9d'; sixes++; }
        else if (dist <= 30) { runs = 4; label = 'FOUR! 🔥'; col = '#00ddcc'; fours++; }
        else if (dist <= 55) { runs = 2; label = '2 Runs';   col = '#aaffcc'; }
        else if (dist <= 85) { runs = 1; label = '1 Run';    col = '#88ffaa'; }
        else                 { runs = 0; label = 'Missed!';  col = 'rgba(255,255,255,0.45)'; }

        score += runs;
        balls++;
        ball.active = false;  // deactivate immediately so further clicks do nothing
        showPopup(label, col);
        updateHUD();

        if (wickets >= MAX_WKTS) {
          setTimeout(() => endGame(), 1000);
        } else {
          scheduleBowl(1000);
        }
      }

      function updateHUD() {
        hudRunsEl.textContent = `🏏 ${score}`;
        hudWktsEl.textContent = `Wkts: ${wickets}/${MAX_WKTS}`;
        hudBallsEl.textContent = `Balls: ${balls}`;
      }

      function endGame() {
        running = false;
        clearBowlTimer();
        cancelAnimationFrame(frameId);
        document.getElementById('cricket-go-score').textContent = score;
        document.getElementById('cricket-go-sub').textContent = `${fours} fours · ${sixes} sixes · ${balls} balls faced`;
        document.getElementById('cricket-game-over').classList.add('show');
        LB.add('cricket', playerName, score);
      }

      function onMouseMove(e) {
        const rect = cvs.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (GW / rect.width);
        batX = Math.max(BAT_W/2 + 8, Math.min(GW - BAT_W/2 - 8, mouseX));
      }

      function onTouchMove(e) {
        e.preventDefault();
        const rect = cvs.getBoundingClientRect();
        const t = e.touches[0];
        mouseX = (t.clientX - rect.left) * (GW / rect.width);
        batX = Math.max(BAT_W/2 + 8, Math.min(GW - BAT_W/2 - 8, mouseX));
      }

      function bindControls() {
        cvs.addEventListener('mousemove', e => onMouseMove(e));
        cvs.addEventListener('click', () => trySwing());
        cvs.addEventListener('touchmove', e => onTouchMove(e), { passive: false });
        cvs.addEventListener('touchstart', e => { onTouchMove(e); trySwing(); }, { passive: false });
      }

      function loop(ts) {
        if (!running) return;
        const dt = Math.min((ts - lastTs) / 1000, 0.05);
        lastTs = ts;
        batX += (mouseX - batX) * 0.18;
        batX = Math.max(BAT_W/2 + 8, Math.min(GW - BAT_W/2 - 8, batX));
        updateBall(dt);
        updateSwing();
        if (popupAlpha > 0) popupAlpha -= dt * 1.8;
        ctx2.clearRect(0, 0, GW, GH);
        drawBackground();
        drawHitZone();
        drawBall();
        drawBat();
        drawPopup();
        drawWaitMessage();
        frameId = requestAnimationFrame(loop);
      }

      function _init() {
        playerName = (document.getElementById('cricket-name-input').value.trim() || 'Unknown').substring(0, 18);
        cvs = document.getElementById('cricket-canvas');
        ctx2 = cvs.getContext('2d');
        cvs.width = GW;
        cvs.height = GH;
        hudRunsEl  = document.getElementById('hud-runs');
        hudWktsEl  = document.getElementById('hud-wkts');
        hudBallsEl = document.getElementById('hud-balls');
        resetState();
        updateHUD();
        document.getElementById('cricket-intro').classList.add('hidden');
        cvs.classList.add('active');
        document.getElementById('cricket-hud').classList.add('active');
        document.getElementById('cricket-game-over').classList.remove('show');
        bindControls();
        running = true;
        lastTs = performance.now();
        frameId = requestAnimationFrame(loop);
        scheduleBowl(900);
      }

      return {
        init: _init,
        swing(e) { if (e) e.preventDefault(); trySwing(); },
        restart() {
          document.getElementById('cricket-game-over').classList.remove('show');
          resetState();
          updateHUD();
          running = true;
          lastTs = performance.now();
          frameId = requestAnimationFrame(loop);
          scheduleBowl(800);
        }
      };
    })();