/* PuppyNany · portada: la fachada del hotel y sus plantas-ecosistema */
(function () {
  'use strict';
  const PN = window.PN;
  const { esc } = PN;

  const ecosPorPlanta = (desc) =>
    Object.entries(PN.ECOSISTEMAS).sort((a, b) => (desc ? b[1].planta - a[1].planta : a[1].planta - b[1].planta));

  function hotelHTML() {
    const floors = ecosPorPlanta(true)
      .map(
        ([key, e]) => `
        <button type="button" class="floor" data-eco="${key}" aria-label="Planta ${e.planta}: ${e.nombre}. Ver detalles">
          <span class="floor-num">${e.planta}</span>
          <span class="window eco-${key}">
            <span class="curtain l"></span><span class="curtain r"></span>
            <span class="w-label">${e.icon} ${e.nombre}</span>
            <span class="deco d1">${e.deco[0]}</span><span class="deco d2">${e.deco[1]}</span><span class="deco d3">${e.deco[2]}</span>
            <span class="guest">${e.guest}</span>
          </span>
        </button>`
      )
      .join('');
    return `
    <div class="hotel">
      <div class="hotel-sign" aria-hidden="true">
        <span class="sign-stars">★★★★★</span>
        <span class="sign-name">PuppyNany</span>
        <span class="sign-sub">Pet Hotel</span>
      </div>
      <div class="hotel-body">
        ${floors}
        <div class="lobby">
          <div class="awning" aria-hidden="true"></div>
          <div class="lobby-row">
            <a class="door" href="#/nany/acceso"><span class="door-glass">🧑‍🍼</span><span class="door-label">Personal</span></a>
            <div class="reception" aria-hidden="true"><span>🛎️</span><b>Recepción</b><small>24 horas</small></div>
            <a class="door" href="#/cliente/acceso"><span class="door-glass">🐾</span><span class="door-label">Clientes</span></a>
          </div>
        </div>
      </div>
      <div class="hotel-ground" aria-hidden="true"><span>🪴</span><span>🌳</span><span>🐕‍🦺</span><span>🌳</span><span>🪴</span></div>
    </div>`;
  }

  PN.irAEcosistema = (key) => {
    PN.resetFilters();
    PN.filters.eco = key;
    const s = PN.state.session;
    PN.go(s && s.role === 'cliente' && PN.state.cliente ? '#/cliente/buscar' : '#/cliente/acceso');
  };

  function ecoModal(key) {
    const e = PN.ECOSISTEMAS[key];
    const nannies = PN.allNannies().filter((n) => n.ecos.includes(key));
    const top = [...nannies].sort((a, b) => b.rating - a.rating || b.numResenas - a.numResenas).slice(0, 3);
    PN.modal(
      `<div class="eco-modal">
        <div class="eco-scene window eco-${key}" aria-hidden="true">
          <span class="deco d1">${e.deco[0]}</span><span class="deco d2">${e.deco[1]}</span><span class="deco d3">${e.deco[2]}</span>
          <span class="guest">${e.guest}</span>
        </div>
        <p class="kicker">Planta ${e.planta}</p>
        <h2>${e.icon} ${e.nombre}</h2>
        <p>${e.desc}</p>
        <div class="eco-facts"><span>🌡️ ${e.clima}</span><span>🐾 ${e.para}</span><span>🧑‍🍼 ${nannies.length} nanys</span></div>
        <ul class="ticks">${e.claves.map((c) => `<li>${c}</li>`).join('')}</ul>
        <h3>Las mejor valoradas de esta planta</h3>
        <div class="mini-list">${top
          .map(
            (n) => `<a class="mini-nanny" href="#/perfil/${n.id}">${PN.avatar(n, 42)}<span><b>${esc(n.nombre)} ${esc(n.apellido)}</b><small>${PN.stars(n.rating, 'sm')} ${PN.num(n.rating)} · ${esc(n.ciudad)} · ${PN.euro(n.precioNoche)}/noche</small></span></a>`
          )
          .join('')}</div>
        <button type="button" class="btn primary big block" data-ir="${key}">Buscar nanys de ${e.nombre}</button>
      </div>`,
      {
        onMount(m, close) {
          m.querySelector('[data-ir]').addEventListener('click', () => { close(); PN.irAEcosistema(key); });
        },
      }
    );
  }

  const ecoCard = (k, e, N) => `
    <article class="eco-card eco-${k}">
      <button type="button" class="eco-card-top" data-eco="${k}" aria-label="Ver detalles de ${e.nombre}">
        <span class="planta">Planta ${e.planta}</span>
        <span class="eco-icon">${e.icon}</span><span class="eco-guest">${e.guest}</span>
      </button>
      <div class="eco-card-body">
        <h3>${e.nombre}</h3>
        <p class="eco-para">🐾 ${e.para}</p>
        <p class="muted">${e.desc}</p>
        <p class="eco-clima">🌡️ ${e.clima}</p>
        <div class="eco-card-foot"><span>${N.filter((n) => n.ecos.includes(k)).length} nanys</span><button type="button" class="link" data-ir="${k}">Ver nanys →</button></div>
      </div>
    </article>`;

  const PASOS = [
    ['🛎️', 'Haz el check-in', 'Crea tu ficha y la de tu mascota: especie, edad, rutinas y necesidades especiales.'],
    ['🔎', 'Filtra a tu medida', 'Especie, ecosistema, fechas, ciudad, precio, valoración, servicios y formación.'],
    ['🤝', 'Reserva con confianza', 'Perfiles verificados, opiniones reales y disponibilidad al día.'],
    ['📸', 'Disfruta del daily care', 'Tu nany te envía fotos y la rutina del día: comida, paseos, medicación y ánimo.'],
  ];
  const SEGURIDAD = [
    ['🪪', 'Identidad verificada', 'Comprobamos la identidad y los antecedentes de cada nany antes de activar su perfil.'],
    ['🩺', 'Formación acreditada', 'Primeros auxilios veterinarios, ATV, etología o manejo de exóticos, siempre a la vista.'],
    ['🛡️', 'Seguro veterinario', 'Cada estancia incluye un seguro veterinario y una clínica de guardia de referencia.'],
    ['📸', 'Daily care diario', 'Fotos y parte de cuidados cada día, para que no te pierdas nada.'],
    ['💳', 'Pago protegido', 'El pago queda retenido y la nany lo recibe cuando termina la estancia.'],
    ['☎️', 'Recepción 24 h', 'Un equipo de soporte disponible a cualquier hora, estés donde estés.'],
  ];

  PN.views.landing = (root) => {
    const N = PN.allNannies();
    const avg = N.reduce((s, n) => s + n.rating, 0) / N.length;
    const ciudades = new Set(N.map((n) => n.ciudad)).size;
    const top = [...N].filter((n) => n.numResenas >= 20).sort((a, b) => b.rating - a.rating || b.numResenas - a.numResenas).slice(0, 4);

    root.innerHTML = `
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="kicker">🛎️ Hotel boutique para mascotas · Red de ${N.length} nanys</p>
          <h1>Vete de vacaciones.<br><span class="hl">Ellos también.</span></h1>
          <p class="lead">En PuppyNany cada huésped se aloja en el ecosistema que necesita (bosque para perros, jungla para gatos, pradera para conejos…) con nanys capacitadas que te envían el <b>daily care</b> con fotos cada día.</p>
          <div class="role-buttons">
            <a class="role-btn nany" href="#/nany/acceso">
              <span class="rb-icon" aria-hidden="true">🧑‍🍼</span>
              <span><b>Entrar como Nany</b><small>Gestiona tus huéspedes y sube el daily care</small></span>
            </a>
            <a class="role-btn cliente" href="#/cliente/acceso">
              <span class="rb-icon" aria-hidden="true">🐾</span>
              <span><b>Entrar como Cliente</b><small>Encuentra la nany ideal con filtros</small></span>
            </a>
          </div>
          <ul class="hero-stats">
            <li><b>${N.length}</b><span>nanys en la red</span></li>
            <li><b>${PN.num(avg)} ★</b><span>valoración media</span></li>
            <li><b>${ciudades}</b><span>ciudades</span></li>
            <li><b>${Object.keys(PN.ECOSISTEMAS).length}</b><span>ecosistemas</span></li>
          </ul>
        </div>
        <div class="hero-hotel">
          ${hotelHTML()}
          <p class="hotel-hint">👆 Pulsa una planta para conocer su ecosistema</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <p class="kicker">Las plantas del hotel</p>
          <h2>Cada huésped, su ecosistema</h2>
          <p class="muted">No todos los animales necesitan lo mismo. Cada planta recrea el hábitat ideal de cada especie, y cada nany indica qué ecosistema puede ofrecer en su casa.</p>
        </div>
        <div class="eco-grid">${ecosPorPlanta(false).map(([k, e]) => ecoCard(k, e, N)).join('')}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head"><p class="kicker">Cómo funciona</p><h2>De la recepción a tus vacaciones en 4 pasos</h2></div>
        <ol class="steps">${PASOS.map(([i, t, d], k) => `<li class="step"><span class="step-n">${k + 1}</span><span class="step-icon" aria-hidden="true">${i}</span><h3>${t}</h3><p class="muted">${d}</p></li>`).join('')}</ol>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><p class="kicker">Tu tranquilidad, nuestra prioridad</p><h2>Dejarlos en buenas manos</h2></div>
        <div class="safety-grid">${SEGURIDAD.map(([i, t, d]) => `<div class="safety"><span aria-hidden="true">${i}</span><div><h3>${t}</h3><p class="muted">${d}</p></div></div>`).join('')}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap">
        <div class="section-head"><p class="kicker">Huéspedes de honor</p><h2>Nanys mejor valoradas</h2></div>
        <div class="cards-grid four">${top.map((n) => PN.nannyCard(n, { noFav: true })).join('')}</div>
        <div class="cta-band">
          <div><h2>¿Preparando las maletas?</h2><p>Haz el check-in de tu mascota y encuentra su nany en minutos.</p></div>
          <div class="row-btns">
            <a class="btn light big" href="#/cliente/acceso">🐾 Entrar como Cliente</a>
            <a class="btn outline-light big" href="#/nany/acceso">🧑‍🍼 Entrar como Nany</a>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="wrap footer-inner">
        <span class="brand small"><img src="assets/favicon.svg" alt="" width="28" height="28"> PuppyNany Pet Hotel</span>
        <span class="muted">Prototipo de demostración · Nanys, opiniones y reservas ficticias</span>
      </div>
    </footer>`;

    root.querySelectorAll('[data-eco]').forEach((b) => b.addEventListener('click', () => ecoModal(b.dataset.eco)));
    root.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => PN.irAEcosistema(b.dataset.ir)));
  };
})();
