/* ─────────────────────────────────────────
       LOADER
    ───────────────────────────────────────── */
    window.addEventListener('load', () => {
      setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.style.transition = 'opacity 0.6s ease, visibility 0.6s';
        loader.style.opacity = '0'; loader.style.visibility = 'hidden';
      }, 1600);
    });