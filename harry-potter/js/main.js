/* =========================================================
   HARRY POTTER · THE HOGWARTS EXPERIENCE
   Interacciones de la página
   ========================================================= */

(() => {
  // revisa si la persona pidió reducir el movimiento en su computador
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menú hamburguesa (celular) ---------- */
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
  // se cierra al dar clic en un link o al oprimir Escape
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Hero con parallax ----------
     El scroll mueve los mismos estados de Figma:
     niebla -> aparece el castillo -> los botes avanzan */
  const scene = document.querySelector('.scene');
  const q = s => scene.querySelector(s);
  const sky = q('.scene__sky'), castle = q('.scene__castle'), boats = q('.scene__boats'),
        fog = q('.scene__fog'), glow = q('.scene__glow'), title = q('.scene__title'),
        cta = q('.scene__cta'), hint = q('.scene__scroll');
  // funciones de ayuda: limitar un número, sacar el avance entre dos puntos y mezclar dos valores
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (p, s, e) => clamp((p - s) / (e - s));
  const lerp = (a, b, t) => a + (b - a) * t;

  function renderScene() {
    const H = scene.offsetHeight;
    const y = clamp(window.scrollY, 0, H);
    const p = y / Math.max(1, H - window.innerHeight);   // va de 0 a 1 mientras se ve la escena
    const reveal = range(p, 0, 0.3);                      // estado 1 -> 2: se va la niebla y sale el castillo
    const sail = range(p, 0.25, 0.65);                    // estado 2 -> 3: los botes avanzan por el lago

    // todas las capas bajan lo mismo para que el castillo, el lago y los botes no se separen
    const drift = y * 0.3;
    sky.style.transform = `translateY(${drift}px)`;
    castle.style.opacity = lerp(0.12, 1, reveal);
    castle.style.transform = `translateY(${drift + (1 - reveal) * 40}px) scale(${lerp(1.04, 1, reveal)})`;
    boats.style.opacity = clamp(sail * 1.6);
    boats.style.transform = `translateY(${drift + (1 - sail) * 90}px) scale(${lerp(1.08, 0.8, sail)})`; // los botes suben y se hacen más pequeños
    glow.style.opacity = lerp(0.1, 0.45, reveal);
    fog.style.top = `${lerp(8.3, 41.7, reveal)}%`;
    fog.style.opacity = lerp(1, 0.6, reveal) * (1 - sail);
    title.style.opacity = reveal;
    cta.classList.toggle('is-visible', sail > 0.5);
    hint.style.opacity = reveal > 0.15 ? 0 : 1;
  }

  // requestAnimationFrame-> para que la animación vaya fluida y no se trabe
  if (!reduceMotion) {
    let ticking = false;
    const onScroll = () => { if (!ticking) { requestAnimationFrame(() => { renderScene(); ticking = false; }); ticking = true; } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    renderScene();
  } else { hint.hidden = true; }

  /* ---------- Las secciones aparecen al hacer scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Si no carga la foto de una reseña, pongo las iniciales ---------- */
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

  /* ---------- Si no carga alguna imagen, que no se vea el ícono roto ---------- */
  document.querySelectorAll('img:not(.avatar)').forEach(img => {
    const mark = () => img.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) mark(); else img.addEventListener('error', mark);
  });

  /* ---------- Carrusel de reseñas ---------- */
  const carousel = document.querySelector('.carousel');
  const track = carousel.querySelector('.carousel__track');
  const cards = [...track.children];
  const dotsBox = carousel.querySelector('.carousel__dots');
  let index = 0, timer;

  // cuántas tarjetas se ven: 1 en celular, 2 en tablet y 4 en computador
  const perView = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 1100 ? 2 : 4);
  const maxIndex = () => Math.max(0, cards.length - perView());

  // crea los puntitos de abajo
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
  // mueve el carrusel a la posición i (si se pasa, vuelve al inicio)
  function go(i) {
    index = (i + maxIndex() + 1) % (maxIndex() + 1);
    const step = cards[0].getBoundingClientRect().width + 40;
    track.style.transform = `translateX(${-index * step}px)`;
    [...dotsBox.children].forEach((d, k) => d.setAttribute('aria-selected', String(k === index)));
  }
  // se mueve solo cada 4 segundos
  function restart() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(index + 1), 4000);
  }
  carousel.querySelector('.carousel__btn--next').addEventListener('click', () => { go(index + 1); restart(); });
  carousel.querySelector('.carousel__btn--prev').addEventListener('click', () => { go(index - 1); restart(); });
  // se pausa cuando el mouse está encima
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', restart);
  carousel.addEventListener('focusin', () => clearInterval(timer));
  window.addEventListener('resize', () => { buildDots(); go(Math.min(index, maxIndex())); });
  buildDots(); go(0); restart();

  /* ---------- Validación del formulario ---------- */
  const form = document.getElementById('owl-form');
  const msg = form.querySelector('.form__msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    // reviso cada campo y marco en rojo los que están mal
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
    // si todo está bien, mensaje de gracias con el primer nombre
    const name = form.elements['name'].value.trim().split(' ')[0];
    msg.textContent = `Thank you, ${name}! Your owl is on its way to ${form.elements['house'].value}.`;
    form.reset();
  });
})();
