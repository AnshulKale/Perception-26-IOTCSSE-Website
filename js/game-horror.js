/* ═══════════════════════════════════════════════════════════
       HORROR MINI-GAME — Intelligent patrolling enemy
    ═══════════════════════════════════════════════════════════ */
    const HorrorGame = (() => {
      const GW = 400, GH = 580;
      const PLAYER_R = 10, ENEMY_R = 13, KEY_R = 8, EXIT_R = 14;
      const PLAYER_SPEED = 2.8;
      const ENEMY_PATROL_SPEED = 0.85;   // slower patrol
      const ENEMY_CHASE_SPEED  = 1.55;   // chase speed (still beatable)
      const FLASH_RADIUS = 130;
      const MAX_KEYS = 3;
      const CHASE_DIST = 160;    // enemy starts chasing when player within this range
      const AWARE_DIST = 220;    // danger vignette begins

      // Wall definitions [x, y, w, h]
      const WALLS = [
        [0, 0, GW, 8], [0, GH-8, GW, 8], [0, 0, 8, GH], [GW-8, 0, 8, GH],
        [60,  60,  110, 12],
        [60,  60,  12,  90],
        [220, 48,  12,  100],
        [160, 140, 110, 12],
        [280, 100, 80,  12],
        [280, 100, 12,  80],
        [50,  200, 12,  100],
        [50,  200, 110, 12],
        [220, 220, 12,  110],
        [160, 330, 80,  12],
        [290, 240, 90,  12],
        [290, 240, 12,  90],
        [55,  360, 130, 12],
        [220, 360, 12,  100],
        [95,  440, 12,  100],
        [95,  440, 120, 12],
        [280, 400, 80,  12],
        [280, 400, 12,  90],
        [160, 490, 100, 12],
      ];

      // Patrol waypoints — enemy visits these in order, cycling
      // Chosen so they cover all maze quadrants with no dead-end traps
      const PATROL_WAYPOINTS = [
        { x: 340, y: 40  },   // top-right open area
        { x: 300, y: 160 },   // after top-right block
        { x: 350, y: 300 },   // mid-right corridor
        { x: 350, y: 480 },   // bottom-right
        { x: 220, y: 520 },   // bottom-center
        { x: 120, y: 510 },   // bottom-left
        { x: 30,  y: 420 },   // left side low
        { x: 25,  y: 280 },   // left side mid
        { x: 130, y: 170 },   // top-left open area
        { x: 30,  y: 40  },   // top-left corner
        { x: 200, y: 30  },   // top center
      ];

      const KEY_POS = [
        { x: 330, y: 70  },
        { x: 90,  y: 300 },
        { x: 330, y: 450 },
      ];

      let cvs, ctx2, raf, running = false;
      let player, enemy, keys, exitOpen, timeAlive, playerName;
      let keysDown = {};
      let joyDx = 0, joyDy = 0, joyActive = false;
      let vignetteAlpha = 0;
      let lastTime = 0;
      let hudKeysEl, hudTimeEl;

      // ─── Collision helpers ───
      function circleAABB(cx, cy, cr, rx, ry, rw, rh) {
        const nx = Math.max(rx, Math.min(cx, rx + rw));
        const ny = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - nx, dy = cy - ny;
        return dx * dx + dy * dy < cr * cr;
      }

      function resolveCircleWalls(obj, r) {
        for (const [wx, wy, ww, wh] of WALLS) {
          if (!circleAABB(obj.x, obj.y, r, wx, wy, ww, wh)) continue;
          const cx = wx + ww / 2, cy = wy + wh / 2;
          const overlapX = (ww / 2 + r) - Math.abs(obj.x - cx);
          const overlapY = (wh / 2 + r) - Math.abs(obj.y - cy);
          if (overlapX < overlapY) {
            obj.x += overlapX * Math.sign(obj.x - cx);
          } else {
            obj.y += overlapY * Math.sign(obj.y - cy);
          }
        }
        obj.x = Math.max(r + 8, Math.min(GW - r - 8, obj.x));
        obj.y = Math.max(r + 8, Math.min(GH - r - 8, obj.y));
      }

      // Simple line-of-sight check (wall blocking test via ray sampling)
      function hasLineOfSight(ax, ay, bx, by) {
        const steps = 12;
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const px = ax + (bx - ax) * t;
          const py = ay + (by - ay) * t;
          for (const [wx, wy, ww, wh] of WALLS) {
            if (ww === GW || wh === GH) continue; // skip border
            if (px >= wx && px <= wx + ww && py >= wy && py <= wy + wh) return false;
          }
        }
        return true;
      }

      // Steer enemy toward a target, sliding along walls if needed
      function steerToward(obj, tx, ty, speed, r) {
        const dx = tx - obj.x, dy = ty - obj.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 1) return dist;

        const nx = dx / dist, ny = dy / dist;

        // Try direct move
        const nx2 = obj.x + nx * speed, ny2 = obj.y + ny * speed;
        let blocked = false;
        for (const [wx, wy, ww, wh] of WALLS) {
          if (circleAABB(nx2, ny2, r, wx, wy, ww, wh)) { blocked = true; break; }
        }

        if (!blocked) {
          obj.x = nx2; obj.y = ny2;
        } else {
          // Wall slide: try each axis independently
          const ax = obj.x + nx * speed, ay = obj.y;
          let bxBlocked = false;
          for (const [wx, wy, ww, wh] of WALLS) {
            if (circleAABB(ax, ay, r, wx, wy, ww, wh)) { bxBlocked = true; break; }
          }
          if (!bxBlocked) { obj.x = ax; }

          const bx2 = obj.x, by2 = obj.y + ny * speed;
          let byBlocked = false;
          for (const [wx, wy, ww, wh] of WALLS) {
            if (circleAABB(bx2, by2, r, wx, wy, ww, wh)) { byBlocked = true; break; }
          }
          if (!byBlocked) { obj.y = by2; }

          // Last resort: perpendicular nudge to escape tight corners
          if (bxBlocked && byBlocked) {
            obj.x += (Math.random() - 0.5) * 2.5;
            obj.y += (Math.random() - 0.5) * 2.5;
          }
        }

        resolveCircleWalls(obj, r);
        return dist;
      }

      // ─── Draw routines ───
      function drawWall(wx, wy, ww, wh) {
        if (ww === GW || wh === GH) return;
        ctx2.fillStyle = 'rgba(40,8,15,0.95)';
        ctx2.fillRect(wx, wy, ww, wh);
        ctx2.strokeStyle = 'rgba(255,0,85,0.18)';
        ctx2.lineWidth = 1;
        ctx2.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);
      }

      function drawKey(k) {
        if (k.collected) return;
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003 + k.x);
        ctx2.save();
        ctx2.shadowBlur = 18 * pulse;
        ctx2.shadowColor = '#00ffb3';
        ctx2.beginPath();
        ctx2.arc(k.x, k.y, KEY_R, 0, Math.PI * 2);
        ctx2.fillStyle = `rgba(0,255,179,${0.85 * pulse})`;
        ctx2.fill();
        ctx2.strokeStyle = 'rgba(0,255,179,0.9)';
        ctx2.lineWidth = 1.5;
        ctx2.stroke();
        ctx2.restore();
        ctx2.fillStyle = '#001a0d';
        ctx2.font = 'bold 9px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText('K', k.x, k.y);
      }

      function drawExit() {
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.004);
        if (exitOpen) {
          ctx2.save();
          ctx2.shadowBlur = 30 * pulse;
          ctx2.shadowColor = '#ff2d6e';
          ctx2.beginPath();
          ctx2.arc(GW / 2, GH - 30, EXIT_R, 0, Math.PI * 2);
          ctx2.fillStyle = `rgba(255,45,110,${0.7 * pulse})`;
          ctx2.fill();
          ctx2.strokeStyle = '#ff2d6e';
          ctx2.lineWidth = 2;
          ctx2.stroke();
          ctx2.restore();
          ctx2.fillStyle = '#fff';
          ctx2.font = 'bold 8px sans-serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillText('EXIT', GW / 2, GH - 30);
        } else {
          ctx2.strokeStyle = 'rgba(255,45,110,0.3)';
          ctx2.lineWidth = 1.5;
          ctx2.setLineDash([4, 4]);
          ctx2.beginPath();
          ctx2.arc(GW / 2, GH - 30, EXIT_R, 0, Math.PI * 2);
          ctx2.stroke();
          ctx2.setLineDash([]);
          ctx2.fillStyle = 'rgba(255,45,110,0.35)';
          ctx2.font = '8px sans-serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillText('🔒', GW / 2, GH - 30);
        }
      }

      function drawEnemy() {
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.008);
        ctx2.save();
        ctx2.shadowBlur = 22 * pulse;
        ctx2.shadowColor = '#ff0055';
        ctx2.beginPath();
        ctx2.arc(enemy.x, enemy.y, ENEMY_R, 0, Math.PI * 2);
        ctx2.fillStyle = `rgba(220,0,50,${pulse})`;
        ctx2.fill();
        ctx2.strokeStyle = `rgba(255,80,120,${pulse})`;
        ctx2.lineWidth = 2;
        ctx2.stroke();
        ctx2.restore();
        ctx2.fillStyle = '#fff';
        ctx2.beginPath();
        ctx2.arc(enemy.x - 4, enemy.y - 2, 2.5, 0, Math.PI * 2);
        ctx2.arc(enemy.x + 4, enemy.y - 2, 2.5, 0, Math.PI * 2);
        ctx2.fill();

        // Draw patrol waypoint indicator (very faint, for feel)
        if (enemy.mode === 'patrol') {
          const wp = PATROL_WAYPOINTS[enemy.waypointIdx];
          ctx2.save();
          ctx2.globalAlpha = 0.06;
          ctx2.strokeStyle = '#ff0055';
          ctx2.lineWidth = 1;
          ctx2.setLineDash([3, 6]);
          ctx2.beginPath();
          ctx2.moveTo(enemy.x, enemy.y);
          ctx2.lineTo(wp.x, wp.y);
          ctx2.stroke();
          ctx2.setLineDash([]);
          ctx2.restore();
        }
      }

      function drawPlayer() {
        ctx2.save();
        ctx2.shadowBlur = 12;
        ctx2.shadowColor = 'rgba(200,200,255,0.8)';
        ctx2.beginPath();
        ctx2.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
        ctx2.fillStyle = 'rgba(220,220,255,0.95)';
        ctx2.fill();
        ctx2.restore();
        ctx2.beginPath();
        ctx2.arc(player.x + player.dx * 5, player.y + player.dy * 5, 3, 0, Math.PI * 2);
        ctx2.fillStyle = 'rgba(0,255,179,0.8)';
        ctx2.fill();
      }

      function drawFlashlight() {
        const grad = ctx2.createRadialGradient(player.x, player.y, 0, player.x, player.y, FLASH_RADIUS);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.55, 'rgba(0,0,0,0.05)');
        grad.addColorStop(0.75, 'rgba(0,0,0,0.7)');
        grad.addColorStop(1, 'rgba(0,0,0,0.97)');
        ctx2.fillStyle = grad;
        ctx2.fillRect(0, 0, GW, GH);
        ctx2.fillStyle = 'rgba(0,0,0,0.98)';
        const cutout = new Path2D();
        cutout.rect(0, 0, GW, GH);
        cutout.arc(player.x, player.y, FLASH_RADIUS * 1.15, 0, Math.PI * 2, true);
        ctx2.save();
        ctx2.clip(cutout);
        ctx2.fillRect(0, 0, GW, GH);
        ctx2.restore();
      }

      function drawDangerVignette() {
        if (vignetteAlpha <= 0) return;
        const grad = ctx2.createRadialGradient(GW/2, GH/2, GH*0.3, GW/2, GH/2, GH*0.8);
        grad.addColorStop(0, 'rgba(255,0,55,0)');
        grad.addColorStop(1, `rgba(255,0,55,${vignetteAlpha * 0.45})`);
        ctx2.fillStyle = grad;
        ctx2.fillRect(0, 0, GW, GH);
      }

      function drawFloorGrid() {
        ctx2.strokeStyle = 'rgba(255,0,55,0.04)';
        ctx2.lineWidth = 0.5;
        for (let gx = 0; gx < GW; gx += 32) {
          ctx2.beginPath(); ctx2.moveTo(gx, 0); ctx2.lineTo(gx, GH); ctx2.stroke();
        }
        for (let gy = 0; gy < GH; gy += 32) {
          ctx2.beginPath(); ctx2.moveTo(0, gy); ctx2.lineTo(GW, gy); ctx2.stroke();
        }
      }

      // ─── Update ───
      function update(dt) {
        // ── Player movement ──
        let dx = 0, dy = 0;
        if (keysDown['arrowup']    || keysDown['w']) dy = -1;
        if (keysDown['arrowdown']  || keysDown['s']) dy =  1;
        if (keysDown['arrowleft']  || keysDown['a']) dx = -1;
        if (keysDown['arrowright'] || keysDown['d']) dx =  1;
        if (joyActive) { dx = joyDx; dy = joyDy; }
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) { dx /= len; dy /= len; player.dx = dx; player.dy = dy; }
        player.x += dx * PLAYER_SPEED;
        player.y += dy * PLAYER_SPEED;
        resolveCircleWalls(player, PLAYER_R);

        // ── Enemy AI ──
        const edx = player.x - enemy.x;
        const edy = player.y - enemy.y;
        const edist = Math.sqrt(edx*edx + edy*edy);
        const canSee = edist < CHASE_DIST && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);

        // Vignette based on awareness
        const danger = edist < AWARE_DIST;
        vignetteAlpha += ((danger ? 1 : 0) - vignetteAlpha) * 0.05;
        vignetteAlpha = Math.max(0, Math.min(1, vignetteAlpha));

        if (canSee) {
          // ── Chase mode ──
          enemy.mode = 'chase';
          enemy.stuckTimer = 0;
          steerToward(enemy, player.x, player.y, ENEMY_CHASE_SPEED, ENEMY_R);
        } else {
          // ── Patrol mode ──
          enemy.mode = 'patrol';
          const wp = PATROL_WAYPOINTS[enemy.waypointIdx];
          const distToWp = steerToward(enemy, wp.x, wp.y, ENEMY_PATROL_SPEED, ENEMY_R);

          // Detect if stuck (barely moving toward waypoint)
          const prevX = enemy._prevX || enemy.x;
          const prevY = enemy._prevY || enemy.y;
          const moved = Math.hypot(enemy.x - prevX, enemy.y - prevY);
          enemy._prevX = enemy.x;
          enemy._prevY = enemy.y;

          if (moved < 0.15) {
            enemy.stuckTimer = (enemy.stuckTimer || 0) + 1;
            if (enemy.stuckTimer > 30) {
              // Skip to next waypoint to escape stuck state
              enemy.waypointIdx = (enemy.waypointIdx + 1) % PATROL_WAYPOINTS.length;
              enemy.stuckTimer = 0;
            }
          } else {
            enemy.stuckTimer = 0;
          }

          // Advance to next waypoint when close enough
          if (distToWp < ENEMY_R + 12) {
            enemy.waypointIdx = (enemy.waypointIdx + 1) % PATROL_WAYPOINTS.length;
          }
        }

        // ── Key collection ──
        keys.forEach(k => {
          if (k.collected) return;
          if (Math.hypot(k.x - player.x, k.y - player.y) < PLAYER_R + KEY_R + 2) {
            k.collected = true;
            exitOpen = keys.every(k2 => k2.collected);
          }
        });

        // ── HUD ──
        const collectedCount = keys.filter(k => k.collected).length;
        timeAlive += dt;
        hudKeysEl.textContent = `🗝 ${collectedCount}/${MAX_KEYS}`;
        hudTimeEl.textContent = `⏱ ${Math.floor(timeAlive)}s`;

        // ── Exit check ──
        if (exitOpen && Math.hypot(player.x - GW/2, player.y - (GH - 30)) < PLAYER_R + EXIT_R) {
          endGame(true);
          return;
        }

        // ── Caught check ──
        if (edist < PLAYER_R + ENEMY_R) {
          endGame(false);
        }
      }

      function drawFrame() {
        ctx2.fillStyle = '#02010a';
        ctx2.fillRect(0, 0, GW, GH);
        drawFloorGrid();
        WALLS.forEach(([wx, wy, ww, wh]) => drawWall(wx, wy, ww, wh));
        keys.forEach(k => drawKey(k));
        drawExit();
        drawEnemy();
        drawPlayer();
        drawFlashlight();
        drawDangerVignette();
      }

      function gameLoop(ts) {
        if (!running) return;
        const dt = Math.min((ts - lastTime) / 1000, 0.05);
        lastTime = ts;
        update(dt);
        drawFrame();
        raf = requestAnimationFrame(gameLoop);
      }

      function _reset() {
        player = { x: 28, y: 28, dx: 1, dy: 0 };
        enemy  = {
          x: GW - 28, y: GH - 50,
          mode: 'patrol',
          waypointIdx: 0,
          stuckTimer: 0,
          _prevX: GW - 28, _prevY: GH - 50
        };
        keys = KEY_POS.map(k => ({ x: k.x, y: k.y, collected: false }));
        exitOpen = false;
        timeAlive = 0;
        vignetteAlpha = 0;
        keysDown = {};
        joyDx = 0; joyDy = 0; joyActive = false;
      }

      function endGame(won) {
        running = false;
        cancelAnimationFrame(raf);
        const collected = keys.filter(k => k.collected).length;
        const score = Math.floor(timeAlive) * 10 + collected * 200 + (won ? 500 : 0);
        if (won) {
          ctx2.fillStyle = 'rgba(0,255,120,0.15)';
          ctx2.fillRect(0, 0, GW, GH);
        } else {
          ctx2.fillStyle = 'rgba(255,0,55,0.2)';
          ctx2.fillRect(0, 0, GW, GH);
        }
        document.getElementById('horror-go-title').textContent = won ? '🎉 ESCAPED!' : '💀 CAUGHT';
        document.getElementById('horror-go-score').textContent = score;
        document.getElementById('horror-go-sub').textContent = `${collected} key${collected !== 1 ? 's' : ''} · ${Math.floor(timeAlive)}s survived`;
        document.getElementById('horror-game-over').classList.add('show');
        LB.add('horror', playerName, score);
        _unbindControls();
      }

      function onKeyDown(e) {
        keysDown[e.key.toLowerCase()] = true;
        if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
      }
      function onKeyUp(e) { keysDown[e.key.toLowerCase()] = false; }

      let _kd, _ku;
      function _bindControls() {
        _kd = e => onKeyDown(e);
        _ku = e => onKeyUp(e);
        window.addEventListener('keydown', _kd);
        window.addEventListener('keyup', _ku);
        _setupJoystick();
      }
      function _unbindControls() {
        window.removeEventListener('keydown', _kd);
        window.removeEventListener('keyup', _ku);
      }

      function _setupJoystick() {
        const zone = document.getElementById('horror-joy-zone');
        const base = document.getElementById('horror-joy-base');
        const knob = document.getElementById('horror-joy-knob');
        const MAX_JOY = 36;
        let touchId = null, bx = 0, by = 0;
        zone.addEventListener('touchstart', e => {
          e.preventDefault();
          const t = e.changedTouches[0];
          touchId = t.identifier;
          const rect = base.getBoundingClientRect();
          bx = rect.left + rect.width / 2;
          by = rect.top + rect.height / 2;
          joyActive = true;
        }, { passive: false });
        zone.addEventListener('touchmove', e => {
          e.preventDefault();
          for (const t of e.changedTouches) {
            if (t.identifier !== touchId) continue;
            const dx = t.clientX - bx, dy = t.clientY - by;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const clamped = Math.min(dist, MAX_JOY);
            const angle = Math.atan2(dy, dx);
            joyDx = Math.cos(angle) * (clamped / MAX_JOY);
            joyDy = Math.sin(angle) * (clamped / MAX_JOY);
            knob.style.transform = `translate(calc(-50% + ${Math.cos(angle)*clamped}px), calc(-50% + ${Math.sin(angle)*clamped}px))`;
          }
        }, { passive: false });
        function joyEnd() { joyDx = 0; joyDy = 0; joyActive = false; knob.style.transform = 'translate(-50%, -50%)'; }
        zone.addEventListener('touchend', joyEnd, { passive: true });
        zone.addEventListener('touchcancel', joyEnd, { passive: true });
      }

      function _init() {
        playerName = (document.getElementById('horror-name-input').value.trim() || 'Unknown').substring(0, 18);
        cvs = document.getElementById('horror-canvas');
        ctx2 = cvs.getContext('2d');
        cvs.width = GW;
        cvs.height = GH;
        hudKeysEl = document.getElementById('hud-keys');
        hudTimeEl = document.getElementById('hud-time');
        _reset();
        document.getElementById('horror-intro').classList.add('hidden');
        cvs.classList.add('active');
        document.getElementById('horror-hud').classList.add('active');
        document.getElementById('horror-game-over').classList.remove('show');
        document.getElementById('horror-joy-zone').style.display = '';
        _bindControls();
        running = true;
        lastTime = performance.now();
        raf = requestAnimationFrame(gameLoop);
      }

      return {
        init: _init,
        restart() {
          document.getElementById('horror-game-over').classList.remove('show');
          _reset();
          running = true;
          lastTime = performance.now();
          raf = requestAnimationFrame(gameLoop);
          _bindControls();
        }
      };
    })();