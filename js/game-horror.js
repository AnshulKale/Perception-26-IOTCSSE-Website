/* ═══════════════════════════════════════════════════════════
   HORROR MINI-GAME — Procedural "City Block" Level Generation
═══════════════════════════════════════════════════════════ */
const HorrorGame = (() => {
    const GW = 400, GH = 580;
    const PLAYER_R = 10, ENEMY_R = 13, KEY_R = 8, EXIT_R = 14;
    const PLAYER_SPEED = 2.8;
    const ENEMY_PATROL_SPEED = 0.85;
    const ENEMY_CHASE_SPEED = 1.55;
    const FLASH_RADIUS = 130;
    const MAX_KEYS = 3;
    const CHASE_DIST = 160;
    const AWARE_DIST = 220;

    // These are now dynamic variables instead of consts
    let WALLS = [];
    let PATROL_WAYPOINTS = [];
    let KEY_POS = [];

    let cvs, ctx2, raf, running = false;
    let player, enemy, keys, exitOpen, timeAlive, playerName;
    let keysDown = {};
    let joyDx = 0, joyDy = 0, joyActive = false;
    let vignetteAlpha = 0;
    let lastTime = 0;
    let hudKeysEl, hudTimeEl;

    // ─── Procedural Level Generator ───
    function generateLevel() {
        // 1. Reset boundaries
        WALLS = [
            [0, 0, GW, 8], [0, GH - 8, GW, 8], [0, 0, 8, GH], [GW - 8, 0, 8, GH]
        ];
        PATROL_WAYPOINTS = [];
        KEY_POS = [];

        // 2. City Block Grid Setup
        const cols = 3;
        const rows = 5;
        const cellW = GW / cols;
        const cellH = GH / rows;

        // 3. Spawn "Islands" inside cells (Guarantees no dead ends!)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Leave top-left clear for player spawn
                if (c === 0 && r === 0) continue;
                // Leave bottom-center clear for exit spawn
                if (c === 1 && r === rows - 1) continue;

                const cx = c * cellW + cellW / 2;
                const cy = r * cellH + cellH / 2;
                const rand = Math.random();
                let w = 0, h = 0;

                if (rand < 0.35) { // Wide block
                    w = 70 + Math.random() * 25;
                    h = 15 + Math.random() * 10;
                } else if (rand < 0.70) { // Tall block
                    w = 15 + Math.random() * 10;
                    h = 60 + Math.random() * 30;
                } else if (rand < 0.85) { // Square block
                    w = 35 + Math.random() * 15;
                    h = 35 + Math.random() * 15;
                }

                if (w > 0 && h > 0) {
                    WALLS.push([cx - w / 2, cy - h / 2, w, h]);
                }
            }
        }

        // 4. Map the "Streets" (guaranteed safe zones) for Key Spawns & Waypoints
        let safePoints = [];

        // True intersections (corners of the blocks)
        for (let r = 1; r < rows; r++) {
            for (let c = 1; c < cols; c++) {
                safePoints.push({ x: c * cellW, y: r * cellH });
            }
        }
        // Mid-points along horizontal streets
        for (let r = 1; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                safePoints.push({ x: c * cellW + cellW / 2, y: r * cellH });
            }
        }
        // Mid-points along vertical streets
        for (let c = 1; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                safePoints.push({ x: c * cellW, y: r * cellH + cellH / 2 });
            }
        }

        // Filter out points too close to the player spawn to prevent instant-pickups
        safePoints = safePoints.filter(p => Math.hypot(p.x - 30, p.y - 30) > 80);

        // 5. Randomly assign Keys and Patrol Route
        const shuffled = [...safePoints].sort(() => 0.5 - Math.random());
        KEY_POS = shuffled.slice(0, MAX_KEYS);
        PATROL_WAYPOINTS = shuffled.slice(MAX_KEYS, MAX_KEYS + 8);
    }

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

    // Improved line-of-sight checks every 8 pixels to prevent wall skipping
    function hasLineOfSight(ax, ay, bx, by) {
        const dist = Math.hypot(bx - ax, by - ay);
        const steps = Math.max(5, Math.ceil(dist / 8));
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = ax + (bx - ax) * t;
            const py = ay + (by - ay) * t;
            for (const [wx, wy, ww, wh] of WALLS) {
                if (ww === GW || wh === GH) continue;
                if (px >= wx && px <= wx + ww && py >= wy && py <= wy + wh) return false;
            }
        }
        return true;
    }

    // Steer enemy toward a target, sliding along walls if needed
    function steerToward(obj, tx, ty, speed, r) {
        const dx = tx - obj.x, dy = ty - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
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

        if (enemy.mode === 'patrol' && PATROL_WAYPOINTS.length > 0) {
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
        const grad = ctx2.createRadialGradient(GW / 2, GH / 2, GH * 0.3, GW / 2, GH / 2, GH * 0.8);
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
        if (keysDown['arrowup'] || keysDown['w'] || keysDown['keyw']) dy = -1;
        if (keysDown['arrowdown'] || keysDown['s'] || keysDown['keys']) dy = 1;
        if (keysDown['arrowleft'] || keysDown['a'] || keysDown['keya']) dx = -1;
        if (keysDown['arrowright'] || keysDown['d'] || keysDown['keyd']) dx = 1;
        if (joyActive) { dx = joyDx; dy = joyDy; }
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) { dx /= len; dy /= len; player.dx = dx; player.dy = dy; }
        player.x += dx * PLAYER_SPEED;
        player.y += dy * PLAYER_SPEED;
        resolveCircleWalls(player, PLAYER_R);

        // ── Enemy AI ──

        const edx = player.x - enemy.x;
        const edy = player.y - enemy.y;
        const edist = Math.sqrt(edx * edx + edy * edy);
        const canSee = edist < CHASE_DIST && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);

        const danger = edist < AWARE_DIST;
        vignetteAlpha += ((danger ? 1 : 0) - vignetteAlpha) * 0.05;
        vignetteAlpha = Math.max(0, Math.min(1, vignetteAlpha));

        // Calculate dynamic speeds based on how long the player has been alive
        // Increases slightly every second. Capped just below player speed (2.8).
        const currentChaseSpeed = Math.min(ENEMY_CHASE_SPEED + (timeAlive * 0.015), 2.65);
        const currentPatrolSpeed = Math.min(ENEMY_PATROL_SPEED + (timeAlive * 0.008), 1.8);

        if (canSee) {
            enemy.mode = 'chase';
            enemy.stuckTimer = 0;
            steerToward(enemy, player.x, player.y, currentChaseSpeed, ENEMY_R);
        } else {
            enemy.mode = 'patrol';
            if (PATROL_WAYPOINTS.length > 0) {
                const wp = PATROL_WAYPOINTS[enemy.waypointIdx];
                const distToWp = steerToward(enemy, wp.x, wp.y, currentPatrolSpeed, ENEMY_R);

                const prevX = enemy._prevX || enemy.x;
                const prevY = enemy._prevY || enemy.y;
                const moved = Math.hypot(enemy.x - prevX, enemy.y - prevY);
                enemy._prevX = enemy.x;
                enemy._prevY = enemy.y;

                if (moved < 0.15) {
                    enemy.stuckTimer = (enemy.stuckTimer || 0) + 1;
                    if (enemy.stuckTimer > 30) {
                        enemy.waypointIdx = (enemy.waypointIdx + 1) % PATROL_WAYPOINTS.length;
                        enemy.stuckTimer = 0;
                    }
                } else {
                    enemy.stuckTimer = 0;
                }

                if (distToWp < ENEMY_R + 12) {
                    enemy.waypointIdx = (enemy.waypointIdx + 1) % PATROL_WAYPOINTS.length;
                }
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
        if (exitOpen && Math.hypot(player.x - GW / 2, player.y - (GH - 30)) < PLAYER_R + EXIT_R) {
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
        // Generate a fresh procedural layout
        generateLevel();

        player = { x: 30, y: 30, dx: 1, dy: 0 }; // Top Left Spawn
        enemy = {
            x: GW - 30, y: GH - 50,                // Bottom Right Spawn
            mode: 'patrol',
            waypointIdx: 0,
            stuckTimer: 0,
            _prevX: GW - 30, _prevY: GH - 50
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
        if (e.code) keysDown[e.code.toLowerCase()] = true;
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) e.preventDefault();
    }
    function onKeyUp(e) { 
        keysDown[e.key.toLowerCase()] = false; 
        if (e.code) keysDown[e.code.toLowerCase()] = false;
    }

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
                const dist = Math.sqrt(dx * dx + dy * dy);
                const clamped = Math.min(dist, MAX_JOY);
                const angle = Math.atan2(dy, dx);
                joyDx = Math.cos(angle) * (clamped / MAX_JOY);
                joyDy = Math.sin(angle) * (clamped / MAX_JOY);
                knob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * clamped}px), calc(-50% + ${Math.sin(angle) * clamped}px))`;
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

        // ADD THIS: Auto-scroll perfectly to the game container, accounting for the sticky navbar
        const visualBox = document.getElementById('sec-horror').querySelector('.ev-visual');
        window.scrollTo({ top: visualBox.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });

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