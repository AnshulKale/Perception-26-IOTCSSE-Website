/* ─────────────────────────────────────────
       PARTICLE CANVAS HERO
    ───────────────────────────────────────── */
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    function resizeCanvas() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    const NEON_COLORS = ['rgba(255,0,85,', 'rgba(0,255,157,', 'rgba(0,212,255,', 'rgba(180,0,255,'];
    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.r = Math.random() * 1.8 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.6 + 0.1;
        this.da = (Math.random() - 0.5) * 0.004;
        this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        this.alpha += this.da;
        if (this.alpha < 0.05 || this.alpha > 0.7) this.da *= -1;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${this.alpha})`;
        ctx.shadowBlur = 8; ctx.shadowColor = `${this.color}0.8)`;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    for (let i = 0; i < 120; i++) particles.push(new Particle());
    function animCanvas() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw() });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            const alpha = 0.08 * (1 - d / 90);
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `${particles[i].color}${alpha})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animCanvas);
    }
    animCanvas();