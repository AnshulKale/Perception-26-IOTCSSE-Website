/* ─────────────────────────────────────────
       CAROUSEL (modal)
    ───────────────────────────────────────── */
    let cCur = 0;
    const cTrack = document.getElementById('modal-track');
    const cDots = document.querySelectorAll('#modal-dots .c-dot');
    function cGo(n) {
      cCur = (n + 3) % 3;
      cTrack.style.transform = `translateX(-${cCur * 100}%)`;
      cDots.forEach((d, i) => d.classList.toggle('active', i === cCur));
    }
    document.getElementById('c-next').onclick = () => cGo(cCur + 1);
    document.getElementById('c-prev').onclick = () => cGo(cCur - 1);
    cDots.forEach(d => d.onclick = () => cGo(+d.dataset.i));
    let autoSlide = null;
    function startAutoSlide() { autoSlide = setInterval(() => cGo(cCur + 1), 4000) }
    function stopAutoSlide() { clearInterval(autoSlide) }

    /* ─────────────────────────────────────────
       EVENT DATA
    ───────────────────────────────────────── */
    const events = {
      horror: {
        tag: 'VR · Horror · Tournament',
        titleLine1: 'LIGHTS', titleLine2: 'OUT',
        subtitle: 'When the moon goes dark, only the brave remain.',
        aboutName: 'Lights Out',
        bg: `radial-gradient(ellipse 80% 70% at 40% 30%,rgba(255,0,85,0.4) 0%,transparent 65%),
        radial-gradient(ellipse 60% 80% at 70% 80%,rgba(180,0,60,0.7) 0%,transparent 60%),
        radial-gradient(ellipse 40% 40% at 20% 60%,rgba(120,0,180,0.2) 0%,transparent 50%),#06010a`,
        desc: `<p class="modal-text">Lights Out is a VR tournament staged on the lunar surface — no atmosphere, no light, no escape. Players are sealed into haunted moonbase corridors and must outlast every rival in total blackout. The only objective is survival.</p>
          <p class="modal-text">Compete through rounds of escalating darkness, each phase pulling you deeper into the moonbase where something is already waiting. The player who keeps their nerve through every eclipse walks away victorious.</p>
          <p class="modal-text">Open to all students of IOT CS & SE Dept. No prior VR experience needed — if you can handle the dark side of the moon, step in.</p>`,
        details: [
          { label: 'Format', value: 'VR Tournament' },
          { label: 'Category', value: 'Gaming' },
          { label: 'Dept', value: 'IOT CS SE' },
          { label: 'Registration', value: 'VIERP.IN' },
          { label: 'Status', value: 'Upcoming' },
        ]
      },
      cricket: {
        tag: 'Cricket · Strategy · Challenge',
        titleLine1: '360', titleLine2: 'STRIKE',
        subtitle: 'Hit across every crater. Cover every degree.',
        aboutName: '360 Strike',
        bg: `radial-gradient(ellipse 80% 70% at 60% 30%,rgba(0,255,157,0.25) 0%,transparent 65%),
        radial-gradient(ellipse 60% 80% at 30% 80%,rgba(0,120,60,0.7) 0%,transparent 60%),
        radial-gradient(ellipse 40% 40% at 80% 60%,rgba(0,80,40,0.3) 0%,transparent 50%),#010a04`,
        desc: `<p class="modal-text">360 Strike reimagines cricket under low-gravity lunar rules. The playing field is a crater ring — each zone scores differently depending on how deep into the lunar outfield you can launch the ball. Every degree of the arena is in play.</p>
          <p class="modal-text">Compete across rounds designed to push your timing, placement and power under pressure. Dominate all 360 degrees of the crater and the player who charts the whole surface wins.</p>
          <p class="modal-text">Open to all students. Whether you are a seasoned cricketer or picking up the bat for the first time under the lunar sky — if you have the instinct, this is your orbit.</p>`,
        details: [
          { label: 'Format', value: 'Cricket Challenge' },
          { label: 'Category', value: 'Sports' },
          { label: 'Dept', value: 'IOT CS SE' },
          { label: 'Registration', value: 'VIERP.IN' },
          { label: 'Status', value: 'Upcoming' },
        ]
      },
      tech: {
        tag: 'SE · Technical Event · TBA',
        titleLine1: 'EVENT', titleLine2: 'NAME',
        subtitle: 'Engineer the systems that keep the moonbase alive.',
        aboutName: 'the SE Event',
        bg: `radial-gradient(ellipse 80% 70% at 40% 30%,rgba(0,212,255,0.25) 0%,transparent 65%),
        radial-gradient(ellipse 60% 80% at 70% 80%,rgba(0,50,100,0.8) 0%,transparent 60%),
        radial-gradient(ellipse 40% 40% at 20% 70%,rgba(0,100,180,0.2) 0%,transparent 50%),#010408`,
        desc: null,
        details: [
          { label: 'Format', value: 'Technical' },
          { label: 'Category', value: 'SE Dept' },
          { label: 'Dept', value: 'IOT CS SE' },
          { label: 'Registration', value: 'VIERP.IN' },
          { label: 'Status', value: 'TBA' },
        ]
      }
    };

    /* ─────────────────────────────────────────
       MODAL
    ───────────────────────────────────────── */
    const modal = document.getElementById('event-modal');
    let scrollPos = 0;

    function openModal(type) {
      const d = events[type];
      cGo(0);
      document.getElementById('modal-tag').textContent = d.tag;
      document.getElementById('modal-title').innerHTML = `${d.titleLine1}<br>${d.titleLine2}`;
      document.getElementById('modal-subtitle').textContent = d.subtitle;
      document.getElementById('modal-about-name').textContent = d.aboutName;
      document.getElementById('modal-bg').style.background = d.bg;
      const descEl = document.getElementById('modal-desc');
      if (d.desc) { descEl.innerHTML = d.desc }
      else { descEl.innerHTML = `<div class="modal-coming-soon"><h3>Details Coming Soon</h3><p>Full event description, format and rules are being finalised — check back shortly.</p></div>` }
      document.getElementById('modal-details').innerHTML = d.details.map(x => `
    <div class="modal-detail">
      <div class="modal-detail-label">${x.label}</div>
      <div class="modal-detail-value">${x.value}</div>
    </div>`).join('');
      scrollPos = window.scrollY;
      document.body.style.overflow = 'hidden';
      modal.scrollTop = 0;
      modal.classList.add('open');
      startAutoSlide();
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      stopAutoSlide();
    }

    document.getElementById('modal-close-btn').onclick = closeModal;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() });