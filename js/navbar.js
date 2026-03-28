/* ─────────────────────────────────────────
       NAVBAR SCROLL EFFECT
    ───────────────────────────────────────── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });

    /* ─────────────────────────────────────────
       MOBILE NAV
    ───────────────────────────────────────── */
    function openMobileNav() { document.getElementById('mobile-nav').classList.add('open') }
    function closeMobileNav() { document.getElementById('mobile-nav').classList.remove('open') }
    document.getElementById('mobile-nav-close').onclick = closeMobileNav;