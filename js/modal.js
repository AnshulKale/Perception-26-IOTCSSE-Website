/* ─────────────────────────────────────────
   CAROUSEL (modal)
───────────────────────────────────────── */
let cCur = 0;
const cTrack = document.getElementById('modal-track');
let autoSlide = null;

function cGo(n) {
  // Dynamically count how many dots/slides currently exist
  const dots = document.querySelectorAll('#modal-dots .c-dot');
  const total = dots.length;
  if (total === 0) return;
  
  cCur = (n + total) % total;
  cTrack.style.transform = `translateX(-${cCur * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === cCur));
}

document.getElementById('c-next').onclick = () => cGo(cCur + 1);
document.getElementById('c-prev').onclick = () => cGo(cCur - 1);

function startAutoSlide() { autoSlide = setInterval(() => cGo(cCur + 1), 4000) }
function stopAutoSlide() { clearInterval(autoSlide) }

/* ─────────────────────────────────────────
   EVENT DATA (Text & Images)
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
    desc: `<p class="modal-text">Lights Out is a fast-paced VR horror tournament where players are dropped into a dark, abandoned hospital with one goal — escape before time runs out. With only a flashlight and limited resources, you’ll navigate tight corridors, restore power systems, and uncover hidden clues using UV light.</p>

<p class="modal-text">But you’re not alone. Something moves through the building, reacting to sound and movement, forcing you to stay alert and think carefully about every step you take. Every decision matters, and hesitation can cost you everything.</p>

<p class="modal-text">Designed for short, intense rounds, the experience is open to all students of IOT CS & SE Dept. No prior VR experience needed — just the ability to stay calm under pressure and make it out alive.</p>`,
    details: [
      { label: 'Format', value: 'VR Tournament' },
      { label: 'Category', value: 'Gaming' },
      { label: 'Club', value: 'XRGF' },
      { label: 'Registration', value: 'VIERP.IN' },
      { label: 'Status', value: 'Upcoming' },
    ],
    // ADD YOUR HORROR IMAGES HERE
    banners: [
      'https://media.discordapp.net/attachments/1250871673402691760/1487387461255434341/image.png?ex=69c8f505&is=69c7a385&hm=24e946f80c01682f80a6a4e6763a0dce2216cd3f6270c227d841c89115535a42&=&format=webp&quality=lossless&width=1536&height=566',
      'https://media.discordapp.net/attachments/1250871673402691760/1487388696016588811/image.png?ex=69c8f62b&is=69c7a4ab&hm=1ce8a7fe71c21397259649bb935192c3d092b66f5858d0c20f5fc291a6ff79a4&=&format=webp&quality=lossless&width=825&height=303',
      'https://media.discordapp.net/attachments/1250871673402691760/1487389524525846609/image.png?ex=69c8f6f1&is=69c7a571&hm=644ac839c445eeff5731b82340a31a49a3ad18a52e9b7a01ed3d19ca28b1c053&=&format=webp&quality=lossless&width=1536&height=566'
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
    ],
    // ADD YOUR CRICKET IMAGES HERE
    banners: [
      'img/cricket-banner-1.jpg',
      'img/cricket-banner-2.jpg',
      'img/cricket-banner-3.jpg'
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
    ],
    // ADD YOUR TECH IMAGES HERE
    banners: [
      'img/tech-banner-1.jpg',
      'img/tech-banner-2.jpg',
      'img/tech-banner-3.jpg'
    ]
  }
};

/* ─────────────────────────────────────────
   MODAL INJECTION LOGIC
───────────────────────────────────────── */
const modal = document.getElementById('event-modal');

function openModal(type) {
  const d = events[type];
  
  // 1. Inject the Text
  document.getElementById('modal-tag').textContent = d.tag;
  document.getElementById('modal-title').innerHTML = `${d.titleLine1}<br>${d.titleLine2}`;
  document.getElementById('modal-subtitle').textContent = d.subtitle;
  document.getElementById('modal-about-name').textContent = d.aboutName;
  document.getElementById('modal-bg').style.background = d.bg;
  
  const descEl = document.getElementById('modal-desc');
  if (d.desc) { 
    descEl.innerHTML = d.desc; 
  } else { 
    descEl.innerHTML = `<div class="modal-coming-soon"><h3>Details Coming Soon</h3><p>Full event description, format and rules are being finalised — check back shortly.</p></div>`;
  }
  
  document.getElementById('modal-details').innerHTML = d.details.map(x => `
    <div class="modal-detail">
      <div class="modal-detail-label">${x.label}</div>
      <div class="modal-detail-value">${x.value}</div>
    </div>`).join('');

  // 2. Inject the Images dynamically
  const track = document.getElementById('modal-track');
  const dotsContainer = document.getElementById('modal-dots');
  
  if (d.banners && d.banners.length > 0) {
    track.innerHTML = d.banners.map(imgSrc => `
      <div class="carousel-slide">
        <img src="${imgSrc}" alt="${d.aboutName} Banner" style="width:100%; height:100%; object-fit:contain; border-radius:4px; background:#000;">
      </div>
    `).join('');
    
    dotsContainer.innerHTML = d.banners.map((_, i) => `
      <div class="c-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>
    `).join('');
    
    // Bind click events to the new dots
    document.querySelectorAll('#modal-dots .c-dot').forEach(dot => {
      dot.onclick = () => cGo(+dot.dataset.i);
    });
  } else {
    // Fallback if no images are defined
    track.innerHTML = '';
    dotsContainer.innerHTML = '';
  }

  // 3. Open Modal & Start Carousel
  cGo(0); // Reset carousel to first slide
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
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