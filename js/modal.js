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
      'https://ibb.co/Q70jN5by/content.png',
      'https://ibb.co/4g0V6XpK/content.png',
      'https://ibb.co/ksk3tPtS/content.png'
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
    desc: `<p class="modal-text">Strike360 is not your typical cricket game — it’s a full 360° test of precision, awareness, and decision-making under pressure. Instead of a traditional pitch, you stand at the center of a circular arena surrounded by scoring zones, each rewarding smart shots and punishing poor judgment.</p>

<p class="modal-text">With every delivery, you must choose your direction, control your power, and aim strategically. It’s not just about hitting hard — it’s about reading the field, understanding angles, and making the right call in a split second. Every shot has intent, and every mistake comes at a cost.</p>

<p class="modal-text">As the game progresses, the pressure builds. You start calculating, adjusting, and second-guessing. Do you play it safe, or go for the high-risk, high-reward zones? In Strike360, hesitation can be just as dangerous as a bad shot.</p>

<p class="modal-text">With limited deliveries to maximize your score, every moment matters. Designed for fast, competitive rounds, Strike360 challenges your skill, composure, and ability to perform under pressure. Step into the center and take control of the game in every direction.</p>`,
    details: [
      { label: 'Format', value: 'Cricket Challenge' },
      { label: 'Category', value: 'Sports' },
      { label: 'Dept', value: 'CS' },
      { label: 'Registration', value: 'VIERP.IN' },
      { label: 'Status', value: 'Upcoming' },
    ],
    // ADD YOUR CRICKET IMAGES HERE
    banners: [
      'https://ibb.co/MyLkrBwH/content.png',
      'https://ibb.co/gZ6wZQ9J/content.png',
      'https://ibb.co/nNBHmR0j/content.png'
    ]
  },
  tech: {
    tag: 'AI · Prompting · Battle',
    titleLine1: 'Meme Apocalypse:', titleLine2: 'AI EDITION',
    subtitle: 'Out-prompt. Out-meme. Outlast.',
    aboutName: 'the SE Event',
    bg: `radial-gradient(ellipse 80% 70% at 40% 30%,rgba(0,212,255,0.25) 0%,transparent 65%),
    radial-gradient(ellipse 60% 80% at 70% 80%,rgba(0,50,100,0.8) 0%,transparent 60%),
    radial-gradient(ellipse 40% 40% at 20% 70%,rgba(0,100,180,0.2) 0%,transparent 50%),#010408`,
    desc: `<p class="modal-text">Are you ready to claim your place in the digital hall of fame? Welcome to Meme Apocalypse: AI Edition — a chaotic arena where creativity meets pure madness, and the only thing that matters is how hard you can make people laugh.</p>

<p class="modal-text">Forget traditional editing. Your only tools are your humor and your ability to craft the perfect AI prompt. Using tools like ChatGPT, Gemini, or Midjourney, you’ll generate memes that are savage, relatable, and completely unhinged — the kind that make people stop scrolling.</p>

<p class="modal-text">Compete in fast-paced rounds that push your creativity under pressure. From cursed combinations to live prompt battles, you’ll need to think fast, adapt, and out-meme everyone else. The goal isn’t just to be funny — it’s to create something unforgettable.</p>

<p class="modal-text">No prior experience needed. Just bring your ideas, your humor, and the confidence to stand out. Laugh hard, meme harder, and prove you’ve got what it takes to survive the apocalypse.</p>`,
    details: [
      { label: 'Format', value: 'Technical' },
      { label: 'Dept', value: 'SE' },
      { label: 'Registration', value: 'VIERP.IN' },
      { label: 'Status', value: 'TBA' },
    ],
    // ADD YOUR TECH IMAGES HERE
    banners: [
      'https://ibb.co/mFyJXpTK/content.png',
      'https://ibb.co/cKz7t1qH/content.png',
      'https://ibb.co/4wXWVhKQ/content.png'
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