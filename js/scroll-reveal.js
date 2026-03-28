/* ─────────────────────────────────────────
       SCROLL REVEAL (IntersectionObserver)
    ───────────────────────────────────────── */
    const revealEls = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); revealObs.unobserve(e.target) }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObs.observe(el));