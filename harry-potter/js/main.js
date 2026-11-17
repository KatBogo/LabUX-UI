/* Hogwarts Experience · interactions */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('nav-menu');
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('is-open');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    menu.classList.toggle('is-open', !open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Hero parallax (fog -> castle -> boats) ---------- */
  const hero = document.querySelector('.hero');
  const sky = hero.querySelector('.hero__sky');
  const castle = hero.querySelector('.hero__castle');
  const boats = hero.querySelector('.hero__boats');
  const fog = hero.querySelector('.hero__fog--top');
  const glow = hero.querySelector('.hero__glow');
  const content = hero.querySelector('.hero__content');
  const cta = hero.querySelector('.hero__cta');
  const scrollHint = hero.querySelector('.hero__scroll');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (p, start, end) => clamp((p - start) / (end - start));

  function renderHero() {
    const total = hero.offsetHeight - window.innerHeight;
    const p = clamp(-hero.getBoundingClientRect().top / total); // 0 → 1 while scrolling the hero

    // 0.00–0.35 : the fog lifts and the castle is revealed
    const reveal = range(p, 0, 0.35);
    // 0.35–0.85 : the boats glide across the lake
    const sail = range(p, 0.35, 0.85);

    // All layers end perfectly aligned (as in Figma); during the scroll each one moves at its own speed.
    const base = -p * 10;                                                   // whole scene drifts up
    sky.style.transform = `translateY(${base * 0.3}vh)`;                    // slow layer (0.3x)
    castle.style.opacity = 0.15 + reveal * 0.85;
    castle.style.transform = `translateY(${base * 0.3 + (1 - reveal) * 4}vh) scale(${1.05 - reveal * 0.05})`; // mid layer (0.6x)
    boats.style.opacity = clamp(sail * 2);
    boats.style.transform = `translateY(${base * 0.3 + (1 - sail) * 30}vh)`; // fast layer (1x), lands on the lake
    fog.style.opacity = 1 - reveal * 0.55;
    fog.style.transform = `translateY(${-reveal * 25 + sail * 15}vh)`;
    glow.style.opacity = 0.1 + reveal * 0.4;
    content.style.opacity = reveal;
    content.style.transform = `translate(-50%, ${-50 - sail * 45}%)`;
    cta.classList.toggle('is-visible', sail > 0.55);
    scrollHint.style.opacity = 1 - range(p, 0.6, 0.9);
  }

  if (!reduceMotion) {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(() => { renderHero(); ticking = false; }); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    renderHero();
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Avatar fallback (initials if the photo is missing) ---------- */
  document.querySelectorAll('.avatar').forEach(img => {
    const swap = () => {
      const div = document.createElement('div');
      div.className = 'avatar avatar--initials';
      div.setAttribute('role', 'img');
      div.setAttribute('aria-label', img.alt);
      div.textContent = img.dataset.initials || '';
      img.replaceWith(div);
    };
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap);
  });

  /* ---------- Missing images: keep the layout clean ---------- */
  document.querySelectorAll('img:not(.avatar)').forEach(img => {
    const mark = () => img.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) mark(); else img.addEventListener('error', mark);
  });

  /* ---------- Reviews carousel ---------- */
  const carousel = document.querySelector('.carousel');
  const track = carousel.querySelector('.carousel__track');
  const cards = [...track.children];
  const dotsBox = carousel.querySelector('.carousel__dots');
  let index = 0, timer;

  const perView = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 1100 ? 2 : 4);
  const maxIndex = () => Math.max(0, cards.length - perView());

  function buildDots() {
    dotsBox.innerHTML = '';
    for (let i = 0; i <= maxIndex(); i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Go to review group ${i + 1}`);
      b.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(b);
    }
  }
  function go(i) {
    index = (i + maxIndex() + 1) % (maxIndex() + 1);
    const step = cards[0].getBoundingClientRect().width + 40;
    track.style.transform = `translateX(${-index * step}px)`;
    [...dotsBox.children].forEach((d, k) => d.setAttribute('aria-selected', String(k === index)));
  }
  function restart() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(index + 1), 4000);
  }
  carousel.querySelector('.carousel__btn--next').addEventListener('click', () => { go(index + 1); restart(); });
  carousel.querySelector('.carousel__btn--prev').addEventListener('click', () => { go(index - 1); restart(); });
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', restart);
  carousel.addEventListener('focusin', () => clearInterval(timer));
  window.addEventListener('resize', () => { buildDots(); go(Math.min(index, maxIndex())); });
  buildDots(); go(0); restart();

  /* ---------- Form validation ---------- */
  const form = document.getElementById('owl-form');
  const msg = form.querySelector('.form__msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstInvalid = null;
    form.querySelectorAll('input, select').forEach(f => {
      const ok = f.checkValidity();
      f.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = f;
    });
    if (firstInvalid) {
      msg.textContent = 'Please complete every field with a valid value.';
      firstInvalid.focus();
      return;
    }
    const name = form.elements['name'].value.trim().split(' ')[0];
    msg.textContent = `Thank you, ${name}! Your owl is on its way to ${form.elements['house'].value}.`;
    form.reset();
  });
})();
