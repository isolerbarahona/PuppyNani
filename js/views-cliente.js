/* PuppyNany · zona de clientes: check-in, búsqueda con filtros, perfil y reserva, mis reservas y mascotas */
(function () {
  'use strict';
  const PN = window.PN;
  const { esc } = PN;
  const S = () => PN.state;

  const speciesChips = (name, current, type = 'radio') =>
    Object.entries(PN.ESPECIES)
      .map(([k, e]) => `<label class="chip"><input type="${type}" name="${name}" value="${k}" ${(Array.isArray(current) ? current.includes(k) : current === k) ? 'checked' : ''}><span>${e.icon} ${e.nombre}</span></label>`)
      .join('');

  const ecoSuggest = (especie) => {
    const e = PN.ECOSISTEMAS[PN.ESPECIES[especie].eco];
    return `🏨 Se alojará en la <b>planta ${e.planta} · ${e.icon} ${e.nombre}</b> <span class="muted">(${e.clima})</span>`;
  };

  const petFields = () => `
    <fieldset class="field full"><legend>¿Quién se queda en el hotel?</legend>
      <div class="chips big">${speciesChips('especie', 'perro')}</div>
    </fieldset>
    <label class="field">Nombre de tu mascota<input name="pnombre" required maxlength="30" placeholder="Ej. Luna"></label>
    <label class="field"><span>Raza o tipo <span class="muted">(opcional)</span></span><input name="raza" maxlength="40" placeholder="Ej. Golden retriever"></label>
    <label class="field"><span>Edad <span class="muted">(opcional)</span></span><input name="edad" maxlength="20" placeholder="Ej. 3 años"></label>
    <label class="field full"><span>Necesidades especiales <span class="muted">(opcional)</span></span><textarea name="notas" rows="3" maxlength="400" placeholder="Medicación, alergias, miedos, rutinas…"></textarea></label>
    <p class="eco-suggest full" data-eco-suggest>${ecoSuggest('perro')}</p>`;

  const readPet = (fd) => ({
    id: PN.uid('M'),
    nombre: String(fd.get('pnombre') || '').trim(),
    especie: fd.get('especie') || 'perro',
    raza: String(fd.get('raza') || '').trim(),
    edad: String(fd.get('edad') || '').trim(),
    notas: String(fd.get('notas') || '').trim(),
  });

  const wireEcoSuggest = (form) => {
    const out = form.querySelector('[data-eco-suggest]');
    form.querySelectorAll('input[name="especie"]').forEach((i) => i.addEventListener('change', () => { out.innerHTML = ecoSuggest(i.value); }));
  };

  /* ===================== Check-in ===================== */
  PN.views.clienteAcceso = (root) => {
    const c = S().cliente;
    root.innerHTML = `
    <section class="wrap narrow">
      <div class="desk-card">
        <div class="desk-head">
          <span class="bell" aria-hidden="true">🛎️</span>
          <h1>Check-in de clientes</h1>
          <p>Cuéntanos quién se queda en el hotel mientras disfrutas de tus vacaciones.</p>
        </div>
        ${c ? `
        <div class="welcome-back">
          <p>¡Hola de nuevo, <b>${esc(c.nombre)}</b>! Ya tenemos en recepción la ficha de ${c.mascotas.map((m) => `${PN.ESPECIES[m.especie].icon} ${esc(m.nombre)}`).join(', ')}.</p>
          <div class="row-btns">
            <button type="button" class="btn primary big" id="continuar">Continuar como ${esc(c.nombre)}</button>
            <button type="button" class="btn ghost" id="nuevo">Hacer un check-in nuevo</button>
          </div>
        </div>` : ''}
        <form id="checkin" class="form-grid" ${c ? 'hidden' : ''}>
          <label class="field">Tu nombre<input name="nombre" required maxlength="40" autocomplete="given-name" placeholder="Ej. Marta"></label>
          <label class="field">Tu ciudad<select name="ciudad">${PN.CIUDADES.map((x) => `<option>${x}</option>`).join('')}</select></label>
          ${petFields()}
          <button class="btn primary big full" type="submit">Hacer check-in 🐾</button>
        </form>
      </div>
    </section>`;

    const form = root.querySelector('#checkin');
    wireEcoSuggest(form);

    const cont = root.querySelector('#continuar');
    if (cont) {
      cont.addEventListener('click', () => {
        S().session = { role: 'cliente' };
        PN.save();
        PN.go('#/cliente/buscar');
      });
      root.querySelector('#nuevo').addEventListener('click', () => {
        root.querySelector('.welcome-back').remove();
        form.hidden = false;
        form.querySelector('input[name="nombre"]').focus();
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nombre = String(fd.get('nombre') || '').trim();
      const pet = readPet(fd);
      if (!nombre || !pet.nombre) { PN.toast('Escribe tu nombre y el de tu mascota', 'warn'); return; }
      S().cliente = { nombre, ciudad: fd.get('ciudad'), mascotas: [pet] };
      S().session = { role: 'cliente' };
      PN.save();
      if (!PN.filters.eco) PN.filters.especie = pet.especie;
      await PN.seedClienteDemo(pet);
      PN.toast(`¡Check-in completado! Hola, ${nombre} 👋`);
      PN.go('#/cliente/buscar');
    });
  };

  /* ===================== Búsqueda con filtros ===================== */
  const PAGE = 12;
  let visibles = PAGE;

  const radioChips = (name, items, current) =>
    items.map(([v, label]) => `<label class="chip"><input type="radio" name="${name}" value="${v}" ${String(current) === String(v) ? 'checked' : ''}><span>${label}</span></label>`).join('');

  function filtersHTML(f) {
    const pct = (v) => (((v - PN.PRICE_MIN) / (PN.PRICE_MAX - PN.PRICE_MIN)) * 100).toFixed(1);
    return `
      <div class="f-head"><h2>Filtros</h2><button type="button" class="link" id="f-reset">Limpiar todo</button></div>
      <label class="field">Buscar por nombre o código<input type="search" name="q" value="${esc(f.q)}" placeholder="Ej. Lucía o PN-001"></label>
      <fieldset class="field"><legend>Especie</legend><div class="chips">${radioChips('especie', [['', 'Todas'], ...Object.entries(PN.ESPECIES).map(([k, e]) => [k, `${e.icon} ${e.plural}`])], f.especie)}</div></fieldset>
      <fieldset class="field"><legend>Ecosistema</legend><div class="chips">${radioChips('eco', [['', 'Todos'], ...Object.entries(PN.ECOSISTEMAS).map(([k, e]) => [k, `${e.icon} ${e.nombre}`])], f.eco)}</div></fieldset>
      <label class="field">Ciudad<select name="ciudad"><option value="">Todas las ciudades</option>${PN.CIUDADES.map((c) => `<option ${c === f.ciudad ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <fieldset class="field"><legend>Fechas de tus vacaciones</legend>
        <div class="row2">
          <label class="sub">Entrada<input type="date" name="desde" min="${PN.today()}" value="${f.desde}"></label>
          <label class="sub">Salida<input type="date" name="hasta" min="${f.desde || PN.today()}" value="${f.hasta}"></label>
        </div>
      </fieldset>
      <fieldset class="field"><legend>Valoración mínima</legend><div class="chips">${radioChips('minRating', [[0, 'Cualquiera'], [2, '2+ ★'], [3, '3+ ★'], [4, '4+ ★'], [4.5, '4,5+ ★']], f.minRating)}</div></fieldset>
      <fieldset class="field"><legend>Precio por noche <output id="price-out">${f.pmin} € – ${f.pmax} €</output></legend>
        <div class="range2" style="--a:${pct(f.pmin)}%;--b:${pct(f.pmax)}%">
          <span class="track"><span class="track-fill"></span></span>
          <input type="range" name="pmin" min="${PN.PRICE_MIN}" max="${PN.PRICE_MAX}" step="1" value="${f.pmin}" aria-label="Precio mínimo por noche">
          <input type="range" name="pmax" min="${PN.PRICE_MIN}" max="${PN.PRICE_MAX}" step="1" value="${f.pmax}" aria-label="Precio máximo por noche">
        </div>
        <div class="chips tight">
          <button type="button" class="chip-btn" data-price="${PN.PRICE_MIN}-27">€ · hasta 27 €</button>
          <button type="button" class="chip-btn" data-price="28-47">€€ · 28–47 €</button>
          <button type="button" class="chip-btn" data-price="48-${PN.PRICE_MAX}">€€€ · 48 € o más</button>
        </div>
      </fieldset>
      <fieldset class="field"><legend>Servicios</legend><div class="checks">${PN.SERVICIOS.map((s) => `<label class="check"><input type="checkbox" name="servicios" value="${s.id}" ${f.servicios.includes(s.id) ? 'checked' : ''}> ${s.icon} ${s.nombre}</label>`).join('')}</div></fieldset>
      <fieldset class="field"><legend>Seguridad y formación</legend>
        <div class="checks">
          <label class="check"><input type="checkbox" name="verificado" ${f.verificado ? 'checked' : ''}> ✔ Solo perfiles verificados</label>
          <label class="check"><input type="checkbox" name="jardin" ${f.jardin ? 'checked' : ''}> 🌳 Con jardín o terraza</label>
        </div>
        <label class="field sub">Certificación<select name="cert"><option value="">Cualquiera</option>${PN.CERTS.map((c) => `<option value="${c.id}" ${c.id === f.cert ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select></label>
        <label class="field sub">Experiencia mínima<select name="minExp">${[[0, 'Sin mínimo'], [2, '2 años o más'], [5, '5 años o más'], [10, '10 años o más']].map(([v, l]) => `<option value="${v}" ${f.minExp === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </fieldset>
      <label class="check fav-only"><input type="checkbox" name="favs" ${f.favs ? 'checked' : ''}> ♥ Solo mis favoritos</label>`;
  }

  function readFilters(form) {
    const fd = new FormData(form);
    let desde = fd.get('desde') || '';
    let hasta = fd.get('hasta') || '';
    if (desde && desde < PN.today()) desde = PN.today();
    if (hasta && desde && hasta < desde) hasta = '';
    if (hasta && !desde) desde = hasta;
    let pmin = Number(fd.get('pmin'));
    let pmax = Number(fd.get('pmax'));
    if (pmin > pmax) [pmin, pmax] = [pmax, pmin];
    return {
      q: String(fd.get('q') || '').trim(),
      especie: fd.get('especie') || '',
      eco: fd.get('eco') || '',
      ciudad: fd.get('ciudad') || '',
      desde, hasta,
      minRating: Number(fd.get('minRating')) || 0,
      pmin, pmax,
      servicios: fd.getAll('servicios'),
      cert: fd.get('cert') || '',
      verificado: fd.has('verificado'),
      jardin: fd.has('jardin'),
      minExp: Number(fd.get('minExp')) || 0,
      favs: fd.has('favs'),
      orden: PN.filters.orden,
    };
  }

  function activeChips(f) {
    const chips = [];
    if (f.q) chips.push(['q', `🔤 “${esc(f.q)}”`]);
    if (f.especie) chips.push(['especie', `${PN.ESPECIES[f.especie].icon} ${PN.ESPECIES[f.especie].plural}`]);
    if (f.eco) chips.push(['eco', `${PN.ECOSISTEMAS[f.eco].icon} ${PN.ECOSISTEMAS[f.eco].nombre}`]);
    if (f.ciudad) chips.push(['ciudad', `📍 ${esc(f.ciudad)}`]);
    if (f.desde) chips.push(['fechas', `📅 ${PN.fmtDate(f.desde)}${f.hasta && f.hasta !== f.desde ? ` → ${PN.fmtDate(f.hasta)}` : ''}`]);
    if (f.minRating) chips.push(['minRating', `${String(f.minRating).replace('.', ',')}+ ★`]);
    if (f.pmin > PN.PRICE_MIN || f.pmax < PN.PRICE_MAX) chips.push(['precio', `💶 ${f.pmin}–${f.pmax} €`]);
    f.servicios.forEach((s) => { const sv = PN.SERVICIOS.find((x) => x.id === s); chips.push([`servicio:${s}`, `${sv.icon} ${sv.nombre}`]); });
    if (f.cert) chips.push(['cert', `🎓 ${PN.CERTS.find((c) => c.id === f.cert).nombre}`]);
    if (f.verificado) chips.push(['verificado', '✔ Verificados']);
    if (f.jardin) chips.push(['jardin', '🌳 Con jardín']);
    if (f.minExp) chips.push(['minExp', `⏳ ${f.minExp}+ años`]);
    if (f.favs) chips.push(['favs', '♥ Favoritos']);
    return chips.map(([k, label]) => `<button type="button" class="achip" data-clear="${k}" aria-label="Quitar filtro">${label} <span aria-hidden="true">✕</span></button>`).join('');
  }

  function clearFilter(key) {
    const f = PN.filters;
    const d = PN.defaultFilters();
    if (key.startsWith('servicio:')) f.servicios = f.servicios.filter((s) => s !== key.slice(9));
    else if (key === 'fechas') { f.desde = ''; f.hasta = ''; }
    else if (key === 'precio') { f.pmin = d.pmin; f.pmax = d.pmax; }
    else f[key] = d[key];
  }

  PN.views.buscar = (root) => {
    const f = PN.filters;
    const c = S().cliente;
    visibles = PAGE;

    root.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <div>
          <h1>Encuentra a tu nany</h1>
          <p class="muted">${PN.NANNIES.length} nanys en ${PN.CIUDADES.length} ciudades. Ajusta los filtros a lo que necesita cada huésped.</p>
        </div>
      </div>
      <div class="pet-banner">
        <span>🏨 Tus huéspedes:</span>
        ${c.mascotas.map((m) => `<button type="button" class="pet-pill" data-pet-filter="${m.especie}">${PN.ESPECIES[m.especie].icon} ${esc(m.nombre)} <small>→ ${PN.ECOSISTEMAS[PN.ESPECIES[m.especie].eco].nombre}</small></button>`).join('')}
        <a class="link" href="#/cliente/mascotas">+ Añadir mascota</a>
      </div>
      <div class="search-layout">
        <aside class="filters-wrap">
          <button type="button" class="btn ghost filters-toggle" aria-expanded="false" aria-controls="filters">⚙️ Mostrar filtros</button>
          <form id="filters" class="filters panel" autocomplete="off">${filtersHTML(f)}</form>
        </aside>
        <section class="results" aria-live="polite">
          <div class="results-bar">
            <p id="results-count" class="results-count"></p>
            <label class="sort">Ordenar por
              <select id="orden">
                ${[['recomendados', 'Recomendadas'], ['rating', 'Mejor valoradas'], ['precio-asc', 'Precio: de menor a mayor'], ['precio-desc', 'Precio: de mayor a menor'], ['resenas', 'Más opiniones'], ['experiencia', 'Más experiencia']].map(([v, l]) => `<option value="${v}" ${v === f.orden ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </label>
          </div>
          <div id="active-chips" class="active-chips"></div>
          <div id="results" class="cards-grid"></div>
          <div class="more-wrap"><button type="button" id="more" class="btn ghost">Ver más nanys</button></div>
        </section>
      </div>
    </div>`;

    const form = root.querySelector('#filters');
    const results = root.querySelector('#results');
    const count = root.querySelector('#results-count');
    const chips = root.querySelector('#active-chips');
    const more = root.querySelector('#more');

    function renderResults() {
      const list = PN.sortNannies(PN.filterNannies(PN.allNannies(), PN.filters), PN.filters.orden);
      count.innerHTML = `<b>${list.length}</b> ${list.length === 1 ? 'nany encontrada' : 'nanys encontradas'}`;
      chips.innerHTML = activeChips(PN.filters);
      results.innerHTML = list.length
        ? list.slice(0, visibles).map((n) => PN.nannyCard(n, { filters: PN.filters })).join('')
        : PN.emptyState('😿', 'Ninguna nany coincide con tus filtros', 'Prueba a ampliar el rango de precio, quitar algún servicio o cambiar las fechas.', '<button type="button" class="btn primary" data-reset>Limpiar filtros</button>');
      more.hidden = list.length <= visibles;
    }

    function syncPriceUI() {
      const pct = (v) => (((v - PN.PRICE_MIN) / (PN.PRICE_MAX - PN.PRICE_MIN)) * 100).toFixed(1);
      const box = form.querySelector('.range2');
      box.style.setProperty('--a', `${pct(PN.filters.pmin)}%`);
      box.style.setProperty('--b', `${pct(PN.filters.pmax)}%`);
      form.querySelector('#price-out').textContent = `${PN.filters.pmin} € – ${PN.filters.pmax} €`;
    }

    const rebuild = () => { const y = window.scrollY; PN.views.buscar(root); window.scrollTo(0, y); };

    form.addEventListener('input', (e) => {
      // Mantener los dos tiradores de precio sin cruzarse
      const pmin = form.elements.pmin;
      const pmax = form.elements.pmax;
      if (e.target === pmin && +pmin.value > +pmax.value) pmin.value = pmax.value;
      if (e.target === pmax && +pmax.value < +pmin.value) pmax.value = pmin.value;
      if (e.target.name === 'desde') form.elements.hasta.min = e.target.value || PN.today();
      PN.filters = readFilters(form);
      if (form.elements.desde.value !== PN.filters.desde) form.elements.desde.value = PN.filters.desde;
      if (form.elements.hasta.value !== PN.filters.hasta) form.elements.hasta.value = PN.filters.hasta;
      visibles = PAGE;
      syncPriceUI();
      renderResults();
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    form.querySelectorAll('[data-price]').forEach((b) =>
      b.addEventListener('click', () => {
        const [a, z] = b.dataset.price.split('-').map(Number);
        PN.filters.pmin = a;
        PN.filters.pmax = z;
        form.elements.pmin.value = a;
        form.elements.pmax.value = z;
        syncPriceUI();
        renderResults();
      })
    );
    root.querySelector('#f-reset').addEventListener('click', () => { const orden = PN.filters.orden; PN.resetFilters(); PN.filters.orden = orden; rebuild(); });
    root.querySelector('#orden').addEventListener('change', (e) => { PN.filters.orden = e.target.value; renderResults(); });
    more.addEventListener('click', () => { visibles += PAGE; renderResults(); });
    chips.addEventListener('click', (e) => { const b = e.target.closest('[data-clear]'); if (b) { clearFilter(b.dataset.clear); rebuild(); } });
    results.addEventListener('click', (e) => { if (e.target.closest('[data-reset]')) { PN.resetFilters(); rebuild(); } });
    root.querySelectorAll('[data-pet-filter]').forEach((b) =>
      b.addEventListener('click', () => { PN.filters.especie = b.dataset.petFilter; PN.filters.eco = ''; rebuild(); })
    );

    const toggle = root.querySelector('.filters-toggle');
    toggle.addEventListener('click', () => {
      const open = form.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✕ Ocultar filtros' : '⚙️ Mostrar filtros';
    });

    PN.afterFav = () => { if (PN.filters.favs) renderResults(); };
    renderResults();
  };

  /* ===================== Perfil público de una nany + reserva ===================== */
  PN.views.perfil = (root, idStr) => {
    const id = Number(idStr);
    const n = PN.getNanny(id);
    const s = S().session;
    if (!n) {
      root.innerHTML = `<div class="wrap">${PN.emptyState('🔍', 'No encontramos a esta nany', 'Puede que el enlace no sea correcto.', '<a class="btn primary" href="#/">Volver al hotel</a>')}</div>`;
      return;
    }
    const isCliente = s && s.role === 'cliente' && S().cliente;
    const back = isCliente ? ['#/cliente/buscar', '← Volver a resultados'] : s && s.role === 'nany' ? ['#/nany/perfil', '← Volver a mi perfil'] : ['#/', '← Volver al hotel'];
    const eco = PN.ECOSISTEMAS[n.ecosistema];
    const sel = { desde: PN.filters.desde || '', hasta: PN.filters.hasta || '' };
    let monthOffset = 0;

    const servOpts = [];
    if (n.servicios.includes('alojamiento')) servOpts.push(['alojamiento', `🏠 Alojamiento en casa de ${n.nombre} · ${PN.euro(n.precioNoche)}/noche`]);
    if (n.servicios.includes('visitas') || n.servicios.includes('domicilio')) servOpts.push(['visitas', `🚪 Visitas o cuidado en tu casa · ${PN.euro(n.precioVisita)}/día`]);

    root.innerHTML = `
    <div class="wrap">
      <a class="back" href="${back[0]}">${back[1]}</a>
      <div class="profile-layout">
        <div class="profile-main">
          <section class="profile-hero eco-${n.ecosistema}">
            ${PN.avatar(n, 116)}
            <div class="ph-info">
              <p class="kicker">${n.codigo} · Planta ${eco.planta} · ${eco.icon} ${eco.nombre}</p>
              <h1>${esc(n.nombre)} ${esc(n.apellido)}</h1>
              <p class="ph-meta">📍 ${esc(n.ciudad)} · ${PN.plural(n.experiencia, 'año', 'años')} de experiencia · ⚡ Responde en ${n.respuesta}</p>
              <p class="ph-rating">${PN.stars(n.rating, 'lg')} <b>${PN.num(n.rating)}</b> <span class="muted">· ${PN.plural(n.numResenas, 'opinión', 'opiniones')}</span> <span class="pill">${n.rango}</span> ${n.verificado ? '<span class="verified">✔ Perfil verificado</span>' : '<span class="pill warn">Verificación pendiente</span>'}</p>
              <p class="ph-lema">“${esc(n.lema)}”</p>
            </div>
            ${isCliente ? PN.favButton(n.id) : ''}
          </section>

          <section class="panel">
            <h2>Sobre mí</h2>
            <p>${esc(n.bio)}</p>
            <p class="muted">🗣️ Idiomas: ${n.idiomas.join(', ')}</p>
          </section>

          <section class="panel eco-room eco-${n.ecosistema}">
            <div class="eco-room-scene window eco-${n.ecosistema}" aria-hidden="true">
              <span class="deco d1">${eco.deco[0]}</span><span class="deco d2">${eco.deco[1]}</span><span class="deco d3">${eco.deco[2]}</span><span class="guest">${eco.guest}</span>
            </div>
            <div>
              <h2>Su habitación en el hotel: ${eco.nombre}</h2>
              <p class="muted">🌡️ ${eco.clima}</p>
              <ul class="ticks">${eco.claves.map((k) => `<li>${k}</li>`).join('')}</ul>
              ${n.ecos.length > 1 ? `<p class="muted tiny">También ofrece: ${n.ecos.filter((e) => e !== n.ecosistema).map((e) => `${PN.ECOSISTEMAS[e].icon} ${PN.ECOSISTEMAS[e].nombre}`).join(' · ')}</p>` : ''}
            </div>
          </section>

          <div class="two-panels">
            <section class="panel">
              <h2>Huéspedes que acepta</h2>
              <div class="tag-list">${n.animales.map((a) => `<span class="tag">${PN.ESPECIES[a].icon} ${PN.ESPECIES[a].plural}</span>`).join('')}</div>
              <h2 class="mt">Servicios</h2>
              <ul class="serv-list">${n.servicios.map((sid) => { const sv = PN.SERVICIOS.find((x) => x.id === sid); return `<li>${sv.icon} ${sv.nombre}</li>`; }).join('')}</ul>
            </section>
            <section class="panel">
              <h2>Formación y seguridad</h2>
              <ul class="ticks">
                ${n.certs.length ? n.certs.map((cid) => `<li>🎓 ${PN.CERTS.find((x) => x.id === cid).nombre}</li>`).join('') : '<li class="muted">Sin certificaciones registradas</li>'}
                <li>${n.verificado ? '🪪 Identidad y antecedentes verificados' : '⏳ Verificación de identidad en curso'}</li>
                <li>🛡️ Seguro veterinario incluido en cada estancia</li>
                <li>${n.jardin ? '🌳 Tiene jardín o terraza' : '🏢 Vivienda sin jardín'}</li>
                <li>🐾 Hasta ${PN.plural(n.maxMascotas, 'mascota', 'mascotas')} a la vez</li>
              </ul>
            </section>
          </div>

          <section class="panel">
            <div class="panel-head">
              <h2>Disponibilidad</h2>
              <div class="row-btns">
                <button type="button" class="btn ghost sm" id="cal-prev" aria-label="Meses anteriores">‹</button>
                <button type="button" class="btn ghost sm" id="cal-next" aria-label="Meses siguientes">›</button>
              </div>
            </div>
            <div id="cal" class="cal-months two"></div>
            <div class="cal-legend"><span class="lg avail"></span> Libre <span class="lg busy"></span> No disponible <span class="lg sel"></span> Tu selección</div>
            ${isCliente ? '<p class="muted tiny">Pulsa un día libre para elegir la entrada y otro para la salida.</p>' : ''}
          </section>

          <section class="panel">
            <h2>Opiniones</h2>
            ${PN.reviewsHTML(n)}
          </section>
        </div>

        <aside class="booking">
          <div class="booking-card">
            <p class="price-big"><b>${PN.euro(n.precioNoche)}</b> / noche</p>
            <p class="muted">Visitas a domicilio: ${PN.euro(n.precioVisita)} / día</p>
            ${isCliente ? `
            <form id="book" class="book-form">
              <div class="row2">
                <label class="field">Entrada<input type="date" name="desde" min="${PN.today()}" value="${sel.desde}" required></label>
                <label class="field">Salida<input type="date" name="hasta" min="${sel.desde || PN.today()}" value="${sel.hasta}" required></label>
              </div>
              <label class="field">Mascota<select name="pet">${S().cliente.mascotas.map((m) => `<option value="${m.id}">${PN.ESPECIES[m.especie].icon} ${esc(m.nombre)}</option>`).join('')}</select></label>
              <label class="field">Servicio<select name="servicio">${servOpts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
              <div id="quote" class="quote"></div>
              <button class="btn primary big block" type="submit" id="book-btn">Reservar</button>
              <p class="tiny muted center">🛡️ Seguro veterinario incluido · 💳 Pago retenido hasta el check-out</p>
            </form>` : `
            <p>Para reservar con ${esc(n.nombre)}, entra como cliente.</p>
            <a class="btn primary big block" href="#/cliente/acceso">🐾 Entrar como Cliente</a>`}
          </div>
        </aside>
      </div>
    </div>`;

    const calBox = root.querySelector('#cal');
    function drawCal() {
      const t = PN.today();
      const now = new Date();
      const months = [0, 1].map((i) => new Date(now.getFullYear(), now.getMonth() + monthOffset + i, 1));
      calBox.innerHTML = months
        .map((d) =>
          PN.monthCalendar(d.getFullYear(), d.getMonth(), (iso) => {
            if (iso < t) return { cls: 'past' };
            const av = PN.isAvailable(n, iso);
            let cls = av ? 'avail' : 'busy';
            if (iso === t) cls += ' today';
            if (sel.desde && iso === sel.desde) cls += ' sel-start';
            if (sel.hasta && iso === sel.hasta) cls += ' sel-end';
            if (sel.desde && sel.hasta && iso > sel.desde && iso < sel.hasta) cls += ' in-range';
            return { cls, button: !!isCliente && av, title: av ? 'Libre' : 'No disponible' };
          })
        )
        .join('');
      root.querySelector('#cal-prev').disabled = monthOffset === 0;
      root.querySelector('#cal-next').disabled = monthOffset >= 4;
    }
    root.querySelector('#cal-prev').addEventListener('click', () => { monthOffset = Math.max(0, monthOffset - 1); drawCal(); });
    root.querySelector('#cal-next').addEventListener('click', () => { monthOffset = Math.min(4, monthOffset + 1); drawCal(); });
    drawCal();

    if (!isCliente) return;

    const form = root.querySelector('#book');
    const quoteEl = root.querySelector('#quote');
    const btn = root.querySelector('#book-btn');

    if (!servOpts.length) {
      quoteEl.innerHTML = '<p class="alert">Esta nany no tiene servicios de cuidado activos ahora mismo.</p>';
      btn.disabled = true;
      return;
    }

    function calcQuote() {
      const fd = new FormData(form);
      const desde = fd.get('desde');
      const hasta = fd.get('hasta');
      const pet = S().cliente.mascotas.find((m) => m.id === fd.get('pet'));
      const serv = fd.get('servicio');
      sel.desde = desde || '';
      sel.hasta = hasta || '';
      drawCal();
      if (!desde || !hasta) {
        quoteEl.innerHTML = '<p class="muted small">Elige las fechas de entrada y salida (o pulsa los días en el calendario).</p>';
        btn.disabled = true;
        return null;
      }
      const problems = [];
      if (desde < PN.today()) problems.push('La fecha de entrada ya ha pasado.');
      if (hasta < desde) problems.push('La salida debe ser igual o posterior a la entrada.');
      if (pet && !n.animales.includes(pet.especie)) problems.push(`${n.nombre} no acepta ${PN.ESPECIES[pet.especie].plural.toLowerCase()}.`);
      if (!problems.length) {
        const conflicts = PN.conflictDays(n, desde, hasta);
        if (conflicts.length) problems.push(`No está disponible: ${conflicts.slice(0, 4).map(PN.fmtDate).join(', ')}${conflicts.length > 4 ? '…' : ''}`);
      }
      if (problems.length) {
        quoteEl.innerHTML = problems.map((p) => `<p class="alert">⚠️ ${esc(p)}</p>`).join('');
        btn.disabled = true;
        return null;
      }
      const dias = PN.diffDays(desde, hasta);
      const alojamiento = serv === 'alojamiento';
      const qty = alojamiento ? Math.max(1, dias) : dias + 1;
      const unit = alojamiento ? n.precioNoche : n.precioVisita;
      const sub = unit * qty;
      const fee = Math.round(sub * 0.08);
      const total = sub + fee;
      quoteEl.innerHTML = `
        <div class="q-row"><span>${PN.euro(unit)} × ${alojamiento ? PN.plural(qty, 'noche', 'noches') : PN.plural(qty, 'día', 'días')}</span><span>${PN.euro(sub)}</span></div>
        <div class="q-row"><span>Gestión y seguro veterinario</span><span>${PN.euro(fee)}</span></div>
        <div class="q-row total"><span>Total</span><span>${PN.euro(total)}</span></div>
        <p class="ok-line">✓ ${esc(n.nombre)} está libre en esas fechas</p>`;
      btn.disabled = false;
      return { desde, hasta, pet, serv, total, qty, alojamiento };
    }

    form.addEventListener('input', (e) => {
      if (e.target.name === 'desde') form.elements.hasta.min = e.target.value || PN.today();
      calcQuote();
    });
    calBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-date]');
      if (!b) return;
      const d = b.dataset.date;
      if (!sel.desde || sel.hasta || d < sel.desde) { sel.desde = d; sel.hasta = ''; }
      else sel.hasta = d;
      form.elements.desde.value = sel.desde;
      form.elements.hasta.value = sel.hasta;
      form.elements.hasta.min = sel.desde;
      calcQuote();
    });
    calcQuote();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = calcQuote();
      if (!q) return;
      const ok = await PN.confirmDialog({
        title: 'Confirmar reserva',
        text: `<div class="summary">
          ${PN.avatar(n, 52)}
          <div>
            <p><b>${PN.ESPECIES[q.pet.especie].icon} ${esc(q.pet.nombre)}</b> con <b>${esc(n.nombre)} ${esc(n.apellido)}</b></p>
            <p class="muted">📅 ${PN.fmtDateLong(q.desde)} → ${PN.fmtDateLong(q.hasta)}</p>
            <p class="muted">${q.alojamiento ? '🏠 Alojamiento' : '🚪 Visitas'} · ${q.alojamiento ? PN.plural(q.qty, 'noche', 'noches') : PN.plural(q.qty, 'día', 'días')}</p>
            <p class="total-line">Total: <b>${PN.euro(q.total)}</b></p>
          </div>
        </div>
        <p class="tiny muted">El pago queda retenido hasta el final de la estancia. Podrás cancelar desde «Mis reservas».</p>`,
        ok: 'Confirmar reserva',
      });
      if (!ok) return;
      S().reservas.push({
        id: PN.uid('R'), nannyId: n.id, owner: 'me', clienteNombre: S().cliente.nombre,
        mascota: Object.assign({}, q.pet), inicio: q.desde, fin: q.hasta, servicio: q.serv,
        total: q.total, estado: 'confirmada', creada: Date.now(),
      });
      PN.save();
      PN.toast(`🎉 ¡Reserva confirmada! ${q.pet.nombre} se queda con ${n.nombre}`);
      PN.go('#/cliente/reservas');
    });
  };

  /* ===================== Mis reservas + daily care ===================== */
  function resCardCliente(r, st) {
    const n = PN.getNanny(r.nannyId);
    const sp = PN.ESPECIES[r.mascota.especie];
    const eco = PN.ECOSISTEMAS[sp.eco];
    const E = PN.ESTADOS[st];
    return `
    <article class="res-card st-${st}">
      <header class="res-head">
        <a href="#/perfil/${n.id}" class="res-avatar" aria-label="Ver perfil de ${esc(n.nombre)}">${PN.avatar(n, 58)}</a>
        <div class="res-info">
          <h2>${sp.icon} ${esc(r.mascota.nombre)} <span class="muted">con</span> <a href="#/perfil/${n.id}">${esc(n.nombre)} ${esc(n.apellido)}</a></h2>
          <p class="muted">📅 ${PN.fmtDate(r.inicio)} → ${PN.fmtDate(r.fin)} · ${r.servicio === 'alojamiento' ? '🏠 Alojamiento' : '🚪 Visitas'} · <b>${PN.euro(r.total)}</b></p>
          <p class="res-eco eco-${sp.eco}">🏨 Planta ${eco.planta} · ${eco.icon} ${eco.nombre}</p>
        </div>
        <div class="res-badges"><span class="badge ${E.cls}">${E.txt}</span>${r.demo ? '<span class="badge b-demo">Ejemplo</span>' : ''}</div>
      </header>
      ${st !== 'cancelada' ? `
      <section class="dc">
        <h3>📸 Daily care</h3>
        <div class="timeline" data-timeline="${r.id}"><p class="muted">Cargando…</p></div>
      </section>` : ''}
      <footer class="res-actions">
        ${(st === 'encurso' || st === 'finalizada') && !r.valorada ? `<button type="button" class="btn primary sm" data-valorar="${r.id}">⭐ Valorar estancia</button>` : ''}
        ${r.valorada ? '<span class="muted small">✔ Ya has valorado esta estancia</span>' : ''}
        ${st === 'proxima' || st === 'encurso' ? `<button type="button" class="btn ghost sm" data-cancelar="${r.id}">Cancelar reserva</button>` : ''}
      </footer>
    </article>`;
  }

  function valorar(r, done) {
    const n = PN.getNanny(r.nannyId);
    PN.modal(
      `<h2>Valora a ${esc(n.nombre)}</h2>
      <p class="muted">¿Qué tal fue la estancia de ${esc(r.mascota.nombre)}?</p>
      <form id="rv" class="stack">
        <div class="star-picker" role="radiogroup" aria-label="Puntuación">
          ${[5, 4, 3, 2, 1].map((k) => `<input type="radio" id="st${k}" name="estrellas" value="${k}" ${k === 5 ? 'checked' : ''}><label for="st${k}" title="${PN.plural(k, 'estrella', 'estrellas')}">★</label>`).join('')}
        </div>
        <label class="field">Tu opinión<textarea name="texto" rows="4" required maxlength="500" placeholder="Cuéntale a otras familias cómo fue…"></textarea></label>
        <button class="btn primary block" type="submit">Publicar opinión</button>
      </form>`,
      {
        onMount(m, close) {
          m.querySelector('#rv').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const texto = String(fd.get('texto') || '').trim();
            if (!texto) return;
            (S().resenasExtra[n.id] = S().resenasExtra[n.id] || []).push({
              autor: S().cliente.nombre, mascota: r.mascota.nombre, especie: r.mascota.especie,
              estrellas: Number(fd.get('estrellas')), texto, fecha: PN.today(),
            });
            r.valorada = true;
            PN.save();
            close();
            PN.toast('⭐ ¡Gracias por tu opinión!');
            done();
          });
        },
      }
    );
  }

  PN.views.reservas = (root) => {
    const order = { encurso: 0, proxima: 1, finalizada: 2, cancelada: 3 };
    const mine = S().reservas
      .filter((r) => r.owner === 'me')
      .map((r) => ({ r, st: PN.reservaEstado(r) }))
      .sort((a, b) => order[a.st] - order[b.st] || (a.st === 'finalizada' ? b.r.inicio.localeCompare(a.r.inicio) : a.r.inicio.localeCompare(b.r.inicio)));

    root.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <div>
          <h1>Mis reservas</h1>
          <p class="muted">Aquí recibes el <b>daily care</b>: las fotos y la rutina del día que suben las nanys.</p>
        </div>
        <a class="btn primary" href="#/cliente/buscar">+ Nueva reserva</a>
      </div>
      ${mine.length
        ? `<div class="res-list">${mine.map(({ r, st }) => resCardCliente(r, st)).join('')}</div>`
        : PN.emptyState('🧳', 'Todavía no tienes reservas', 'Encuentra la nany ideal para tu mascota y empieza a planear tus vacaciones.', '<a class="btn primary" href="#/cliente/buscar">Buscar nanys</a>')}
    </div>`;

    root.querySelectorAll('[data-timeline]').forEach((el) =>
      PN.loadTimeline(el, el.dataset.timeline, { emptyText: 'La nany todavía no ha subido actualizaciones. ¡Llegarán pronto! 📸' })
    );
    const rerender = () => { const y = window.scrollY; PN.views.reservas(root); window.scrollTo(0, y); PN.refreshTopbar(); };
    root.querySelectorAll('[data-valorar]').forEach((b) =>
      b.addEventListener('click', () => valorar(S().reservas.find((r) => r.id === b.dataset.valorar), rerender))
    );
    root.querySelectorAll('[data-cancelar]').forEach((b) =>
      b.addEventListener('click', async () => {
        const r = S().reservas.find((x) => x.id === b.dataset.cancelar);
        const ok = await PN.confirmDialog({
          title: '¿Cancelar la reserva?',
          text: `<p>Se cancelará la estancia de <b>${esc(r.mascota.nombre)}</b> del ${PN.fmtDate(r.inicio)} al ${PN.fmtDate(r.fin)} y la nany volverá a tener esos días libres.</p>`,
          ok: 'Sí, cancelar', cancel: 'No, mantener', danger: true,
        });
        if (!ok) return;
        r.estado = 'cancelada';
        PN.save();
        PN.toast('Reserva cancelada');
        rerender();
      })
    );
  };

  /* ===================== Mis mascotas ===================== */
  PN.views.mascotas = (root) => {
    const c = S().cliente;
    root.innerHTML = `
    <div class="wrap">
      <div class="page-head"><div><h1>Mis mascotas</h1><p class="muted">Las fichas que verá la nany al recibir a tus huéspedes.</p></div></div>
      <div class="pets-grid">
        ${c.mascotas.map((m) => {
          const e = PN.ECOSISTEMAS[PN.ESPECIES[m.especie].eco];
          return `
          <article class="pet-card eco-${PN.ESPECIES[m.especie].eco}">
            <div class="pet-face" aria-hidden="true">${PN.ESPECIES[m.especie].icon}</div>
            <div>
              <h2>${esc(m.nombre)}</h2>
              <p class="muted">${PN.ESPECIES[m.especie].nombre}${m.raza ? ` · ${esc(m.raza)}` : ''}${m.edad ? ` · ${esc(m.edad)}` : ''}</p>
              <p class="small">🏨 Planta ${e.planta} · ${e.icon} ${e.nombre}</p>
              ${m.notas ? `<p class="pet-notes">📝 ${esc(m.notas)}</p>` : ''}
              <div class="row-btns">
                <button type="button" class="btn ghost sm" data-buscar="${m.especie}">Buscar nany</button>
                ${c.mascotas.length > 1 ? `<button type="button" class="link danger" data-borrar="${m.id}">Eliminar</button>` : ''}
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
      <section class="panel mt">
        <h2>Añadir otra mascota</h2>
        <form id="add-pet" class="form-grid">${petFields()}<button class="btn primary full" type="submit">Añadir mascota</button></form>
      </section>
    </div>`;

    const form = root.querySelector('#add-pet');
    wireEcoSuggest(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pet = readPet(new FormData(form));
      if (!pet.nombre) return;
      c.mascotas.push(pet);
      PN.save();
      PN.toast(`${PN.ESPECIES[pet.especie].icon} ${pet.nombre} ya tiene ficha en recepción`);
      PN.views.mascotas(root);
    });
    root.querySelectorAll('[data-borrar]').forEach((b) =>
      b.addEventListener('click', async () => {
        const m = c.mascotas.find((x) => x.id === b.dataset.borrar);
        const ok = await PN.confirmDialog({ title: `¿Eliminar a ${esc(m.nombre)}?`, text: '<p>Sus reservas existentes se mantienen.</p>', ok: 'Eliminar', danger: true });
        if (!ok) return;
        c.mascotas = c.mascotas.filter((x) => x.id !== m.id);
        PN.save();
        PN.views.mascotas(root);
      })
    );
    root.querySelectorAll('[data-buscar]').forEach((b) =>
      b.addEventListener('click', () => { PN.resetFilters(); PN.filters.especie = b.dataset.buscar; PN.go('#/cliente/buscar'); })
    );
  };
})();
