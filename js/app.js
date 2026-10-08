/* PuppyNany · enrutado, barra superior y huellas de patita */
(function () {
  'use strict';
  const PN = window.PN;
  const { esc } = PN;
  const V = PN.views;
  const app = document.getElementById('app');
  const topbar = document.getElementById('topbar');

  const routes = [
    { re: /^#\/?$/, view: V.landing, name: 'landing', title: 'Pet Hotel' },
    { re: /^#\/cliente\/acceso$/, view: V.clienteAcceso, name: 'checkin', title: 'Check-in de clientes' },
    { re: /^#\/cliente\/buscar$/, view: V.buscar, role: 'cliente', name: 'buscar', title: 'Buscar nanys' },
    { re: /^#\/cliente\/reservas$/, view: V.reservas, role: 'cliente', name: 'reservas', title: 'Mis reservas' },
    { re: /^#\/cliente\/mascotas$/, view: V.mascotas, role: 'cliente', name: 'mascotas', title: 'Mis mascotas' },
    { re: /^#\/perfil\/(\d+)$/, view: V.perfil, name: 'perfil', title: 'Perfil de nany' },
    { re: /^#\/nany\/acceso$/, view: V.nanyAcceso, name: 'staff', title: 'Acceso del personal' },
    { re: /^#\/nany\/huespedes$/, view: V.huespedes, role: 'nany', name: 'huespedes', title: 'Mis huéspedes' },
    { re: /^#\/nany\/disponibilidad$/, view: V.disponibilidad, role: 'nany', name: 'disponibilidad', title: 'Mi disponibilidad' },
    { re: /^#\/nany\/perfil$/, view: V.nanyPerfil, role: 'nany', name: 'nanyPerfil', title: 'Mi perfil' },
    { re: /^#\/nany\/opiniones$/, view: V.nanyOpiniones, role: 'nany', name: 'nanyOpiniones', title: 'Mis opiniones' },
  ];

  let current = 'landing';

  /* ---------- Barra superior según el rol ---------- */
  function renderTopbar() {
    const s = PN.state.session;
    const link = (href, label, name) => `<a href="${href}" class="nav-link ${current === name ? 'active' : ''}" ${current === name ? 'aria-current="page"' : ''}>${label}</a>`;
    let nav = '';
    let who = '';
    if (s && s.role === 'cliente' && PN.state.cliente) {
      const activas = PN.state.reservas.filter((r) => r.owner === 'me' && ['proxima', 'encurso'].includes(PN.reservaEstado(r))).length;
      nav = link('#/cliente/buscar', '🔎 Buscar nanys', 'buscar') +
        link('#/cliente/reservas', `📅 Mis reservas${activas ? ` <span class="count">${activas}</span>` : ''}`, 'reservas') +
        link('#/cliente/mascotas', '🐾 Mis mascotas', 'mascotas');
      who = `<span class="who-pill cliente">🐾 ${esc(PN.state.cliente.nombre)}</span><button type="button" class="btn ghost sm" data-logout>Salir</button>`;
    } else if (s && s.role === 'nany' && PN.getNanny(s.nannyId)) {
      const n = PN.getNanny(s.nannyId);
      nav = link('#/nany/huespedes', '🏨 Mis huéspedes', 'huespedes') +
        link('#/nany/disponibilidad', '📅 Disponibilidad', 'disponibilidad') +
        link('#/nany/perfil', '👤 Mi perfil', 'nanyPerfil') +
        link('#/nany/opiniones', '⭐ Opiniones', 'nanyOpiniones');
      who = `<span class="who-pill nany">${PN.avatar(n, 26)} ${esc(n.nombre)} <small>${n.codigo}</small></span><button type="button" class="btn ghost sm" data-logout>Salir</button>`;
    } else {
      who = '<a class="btn ghost sm" href="#/nany/acceso">🧑‍🍼 Soy Nany</a><a class="btn primary sm" href="#/cliente/acceso">🐾 Soy Cliente</a>';
    }
    topbar.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="#/"><img src="assets/favicon.svg" alt="" width="34" height="34"><span>PuppyNany<small>Pet Hotel</small></span></a>
        ${nav ? `<nav class="main-nav" aria-label="Principal">${nav}</nav>` : '<span class="spacer"></span>'}
        <div class="who">${who}</div>
      </div>`;
  }
  PN.refreshTopbar = renderTopbar;

  /* ---------- Enrutado por hash ---------- */
  async function render() {
    const hash = location.hash || '#/';
    const route = routes.find((r) => r.re.test(hash));
    if (!route) { location.replace('#/'); return; }

    const s = PN.state.session;
    if (route.role) {
      const ok = s && s.role === route.role && (route.role === 'cliente' ? !!PN.state.cliente : !!PN.getNanny(s.nannyId));
      if (!ok) { location.replace(route.role === 'cliente' ? '#/cliente/acceso' : '#/nany/acceso'); return; }
    }

    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('modal-open');
    PN.afterFav = null;
    current = route.name;
    document.body.dataset.route = route.name;
    document.body.dataset.role = s ? s.role : 'visitante';
    document.title = `${route.title} · PuppyNany`;
    renderTopbar();
    await route.view(app, ...hash.match(route.re).slice(1));
    window.scrollTo(0, 0);
  }

  PN.go = (hash) => {
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  window.addEventListener('hashchange', render);

  /* ---------- Acciones globales ---------- */
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      const id = Number(fav.dataset.fav);
      const on = PN.toggleFav(id);
      document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
        b.classList.toggle('on', on);
        b.textContent = on ? '♥' : '♡';
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', on ? 'Quitar de favoritos' : 'Añadir a favoritos');
      });
      PN.toast(on ? '♥ Añadida a favoritos' : 'Quitada de favoritos');
      if (PN.afterFav) PN.afterFav();
      return;
    }
    const photo = e.target.closest('.photo');
    if (photo) { PN.lightbox(photo.querySelector('img').src); return; }
    if (e.target.closest('[data-logout]')) {
      PN.state.session = null;
      PN.save();
      PN.toast('Sesión cerrada. ¡Hasta pronto! 👋');
      PN.go('#/');
    }
  });

  /* ---------- Huellas de patita al hacer clic (y rastro en la portada) ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function stamp(x, y, rot, cls) {
    const el = document.createElement('span');
    el.className = `paw-print ${cls || ''}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--rot', `${rot}deg`);
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
  if (!reduceMotion) {
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stamp(e.clientX, e.clientY, Math.random() * 40 - 20, 'click');
    });
    let last = null;
    let side = 1;
    document.addEventListener('pointermove', (e) => {
      if (document.body.dataset.route !== 'landing' || e.pointerType !== 'mouse') return;
      if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.hypot(dx, dy) < 70) return;
      const ang = Math.atan2(dy, dx);
      side = -side;
      const ox = Math.cos(ang + Math.PI / 2) * 9 * side;
      const oy = Math.sin(ang + Math.PI / 2) * 9 * side;
      stamp(e.clientX + ox, e.clientY + oy, (ang * 180) / Math.PI + 90, 'trail');
      last = { x: e.clientX, y: e.clientY };
    });
  }

  /* ---------- Arranque ---------- */
  PN.ensureSeed()
    .catch((err) => console.warn('No se pudieron crear los datos de ejemplo', err))
    .finally(render);
})();
