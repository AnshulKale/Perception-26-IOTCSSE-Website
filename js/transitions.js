/* ─────────────────────────────────────────
       PAGE TRANSITION (decorative on load)
    ───────────────────────────────────────── */
    const pt = document.getElementById('page-transition');
    window.addEventListener('DOMContentLoaded', () => { pt.classList.add('exit') });