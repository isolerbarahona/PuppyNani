/* PuppyNany · zona de nanys: acceso, huéspedes y daily care, disponibilidad, perfil y opiniones */
(function () {
  'use strict';
  const PN = window.PN;
  const { esc } = PN;
  const S = () => PN.state;
  const MAX_FOTOS = 6;

  const huespedesActivos = () => {
    const counts = {};
    S().reservas.forEach((r) => {
      const st = PN.reservaEstado(r);
      if (st === 'encurso' || st === 'proxima') counts[r.nannyId] = (counts[r.nannyId] || 0) + 1;
    });
    return counts;
  };

  /* ===================== Acceso del personal ===================== */
  PN.views.nanyAcceso = (root) => {
    const counts = huespedesActivos();
    root.innerHTML = `
    <section class="wrap">
      <div class="desk-card wide">
        <div class="desk-head">
          <span class="bell" aria-hidden="true">🗝️</span>
          <h1>Acceso del personal</h1>
          <p>Elige tu perfil de nany para gestionar tus huéspedes, tu disponibilidad y subir el daily care.</p>
          <p class="tip">💡 Para probar: <b>PN-001</b> ya tiene huéspedes. Si reservas como cliente, entra después con la nany elegida para subirle fotos.</p>
        </div>
        <div class="staff-tools">
          <label class="field grow">Buscar<input type="search" id="staff-q" placeholder="Nombre, ciudad o código (PN-0XX)"></label>
          <label class="field">Ciudad<select id="staff-city"><option value="">Todas</option>${PN.CIUDADES.map((c) => `<option>${c}</option>`).join('')}</select></label>
          <label class="check"><input type="checkbox" id="staff-guests"> Solo con huéspedes</label>
        </div>
        <p class="muted small" id="staff-count"></p>
        <div id="staff-list" class="staff-list"></div>
      </div>
    </section>`;

    const list = root.querySelector('#staff-list');
    const q = root.querySelector('#staff-q');
    const city = root.querySelector('#staff-city');
    const guests = root.querySelector('#staff-guests');
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    function draw() {
      const term = norm(q.value.trim());
      const items = PN.allNannies()
        .filter((n) => (!term || norm(`${n.nombre} ${n.apellido} ${n.ciudad} ${n.codigo}`).includes(term)) && (!city.value || n.ciudad === city.value) && (!guests.checked || counts[n.id]))
        .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0) || a.id - b.id);
      root.querySelector('#staff-count').textContent = `${items.length} de ${PN.NANNIES.length} nanys`;
      list.innerHTML = items
        .map(
          (n) => `
        <button type="button" class="staff-item" data-id="${n.id}">
          ${PN.avatar(n, 46)}
          <span class="si-main"><b>${esc(n.nombre)} ${esc(n.apellido)}</b><small>${n.codigo} · ${esc(n.ciudad)} · ${PN.speciesIcons(n.animales)}</small></span>
          <span class="si-side">${PN.stars(n.rating, 'sm')}<small>${PN.num(n.rating)}</small>${counts[n.id] ? `<span class="badge b-live">${PN.plural(counts[n.id], 'huésped', 'huéspedes')}</span>` : ''}</span>
        </button>`
        )
        .join('') || '<p class="empty-mini">Ninguna nany coincide con la búsqueda.</p>';
    }
    [q, city, guests].forEach((el) => el.addEventListener('input', draw));
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      const n = PN.getNanny(Number(b.dataset.id));
      S().session = { role: 'nany', nannyId: n.id };
      PN.save();
      PN.toast(`¡Hola, ${n.nombre}! Buen turno 🛎️`);
      PN.go('#/nany/huespedes');
    });
    draw();
  };

  /* ===================== Huéspedes + subida del daily care ===================== */
  function uploadForm(r) {
    return `
    <form class="dc-form" data-res="${r.id}">
      <label class="dropzone">
        <input type="file" accept="image/*" multiple class="vh">
        <span class="dz-icon" aria-hidden="true">📷</span>
        <span><b>Arrastra fotos aquí</b> o haz clic para elegirlas</span>
        <small class="muted">Hasta ${MAX_FOTOS} fotos por actualización · se optimizan automáticamente</small>
      </label>
      <div class="previews"></div>
      <fieldset class="field"><legend>Rutina de hoy</legend>
        <div class="chips">${PN.CHECKS.map((c) => `<label class="chip"><input type="checkbox" name="checks" value="${c.id}"><span>${c.icon} ${c.nombre}</span></label>`).join('')}</div>
      </fieldset>
      <fieldset class="field"><legend>¿Cómo está ${esc(r.mascota.nombre)}?</legend>
        <div class="chips">${PN.MOODS.map((m, i) => `<label class="chip"><input type="radio" name="animo" value="${m.id}" ${i === 0 ? 'checked' : ''}><span>${m.icon} ${m.nombre}</span></label>`).join('')}</div>
      </fieldset>
      <label class="field">Nota para la familia<textarea name="nota" rows="3" maxlength="600" placeholder="Hoy ${esc(r.mascota.nombre)} ha…"></textarea></label>
      <div class="row-btns end"><button class="btn primary" type="submit">📬 Publicar actualización</button></div>
    </form>`;
  }

  function resCardNany(r, st) {
    const sp = PN.ESPECIES[r.mascota.especie];
    const eco = PN.ECOSISTEMAS[sp.eco];
    const E = PN.ESTADOS[st];
    const puedeSubir = st === 'encurso' || st === 'proxima';
    return `
    <article class="res-card st-${st}">
      <header class="res-head">
        <span class="pet-badge eco-${sp.eco}" aria-hidden="true">${sp.icon}</span>
        <div class="res-info">
          <h2>${esc(r.mascota.nombre)} <span class="muted">· ${sp.nombre}${r.mascota.raza ? `, ${esc(r.mascota.raza)}` : ''}${r.mascota.edad ? ` · ${esc(r.mascota.edad)}` : ''}</span></h2>
          <p class="muted">👤 ${esc(r.clienteNombre)} · 📅 ${PN.fmtDate(r.inicio)} → ${PN.fmtDate(r.fin)} · ${r.servicio === 'alojamiento' ? '🏠 Alojamiento' : '🚪 Visitas'} · ${PN.euro(r.total)}</p>
          <p class="res-eco eco-${sp.eco}">🏨 Planta ${eco.planta} · ${eco.icon} ${eco.nombre} · 🌡️ ${eco.clima}</p>
          ${r.mascota.notas ? `<p class="pet-notes">📝 ${esc(r.mascota.notas)}</p>` : ''}
        </div>
        <div class="res-badges"><span class="badge ${E.cls}">${E.txt}</span></div>
      </header>
      ${puedeSubir ? `
      <details class="dc-upload" ${st === 'encurso' ? 'open' : ''}>
        <summary>📷 Subir daily care para ${esc(r.mascota.nombre)}</summary>
        ${uploadForm(r)}
      </details>` : ''}
      <section class="dc">
        <h3>Actualizaciones enviadas</h3>
        <div class="timeline" data-timeline="${r.id}"><p class="muted">Cargando…</p></div>
      </section>
    </article>`;
  }

  function wireUpload(form, r, timeline) {
    const pending = [];
    const input = form.querySelector('input[type="file"]');
    const drop = form.querySelector('.dropzone');
    const prev = form.querySelector('.previews');
    const btn = form.querySelector('button[type="submit"]');

    const renderPrev = () => {
      prev.innerHTML = pending
        .map((src, i) => `<div class="pv"><img src="${src}" alt="Foto ${i + 1} preparada"><button type="button" data-rm="${i}" aria-label="Quitar foto ${i + 1}">✕</button></div>`)
        .join('');
    };
    async function addFiles(files) {
      const imgs = [...files].filter((f) => f.type.startsWith('image/'));
      if (!imgs.length) { PN.toast('Solo se admiten imágenes', 'warn'); return; }
      drop.classList.add('busy');
      for (const f of imgs) {
        if (pending.length >= MAX_FOTOS) { PN.toast(`Máximo ${MAX_FOTOS} fotos por actualización`, 'warn'); break; }
        try { pending.push(await PN.compressImage(f)); } catch (err) { PN.toast(err.message, 'warn'); }
      }
      drop.classList.remove('busy');
      renderPrev();
    }

    input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    prev.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) { pending.splice(Number(b.dataset.rm), 1); renderPrev(); }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nota = String(fd.get('nota') || '').trim();
      if (!pending.length && !nota) { PN.toast('Añade al menos una foto o una nota', 'warn'); return; }
      const checks = {};
      fd.getAll('checks').forEach((c) => { checks[c] = true; });
      btn.disabled = true;
      try {
        await PN.posts.add({
          id: PN.uid('P'), reservaId: r.id, nannyId: r.nannyId, createdAt: Date.now(),
          fotos: pending.slice(), nota, checks, animo: fd.get('animo') || '',
        });
        pending.length = 0;
        renderPrev();
        form.reset();
        PN.toast(`📬 Daily care enviado a la familia de ${r.mascota.nombre}`);
        await PN.loadTimeline(timeline, r.id, { canDelete: true });
      } catch (err) {
        console.error(err);
        PN.toast('No se pudo guardar. Prueba con menos fotos.', 'warn');
      } finally {
        btn.disabled = false;
      }
    });
  }

  PN.views.huespedes = (root) => {
    const n = PN.getNanny(S().session.nannyId);
    const order = { encurso: 0, proxima: 1, finalizada: 2 };
    const res = PN.reservasDeNanny(n.id)
      .map((r) => ({ r, st: PN.reservaEstado(r) }))
      .filter((x) => x.st !== 'cancelada')
      .sort((a, b) => order[a.st] - order[b.st] || a.r.inicio.localeCompare(b.r.inicio));
    const enCurso = res.filter((x) => x.st === 'encurso').length;
    const proximas = res.filter((x) => x.st === 'proxima').length;
    const ingresos = res.reduce((s, x) => s + x.r.total, 0) * 0.85;

    root.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <div class="ph-who">${PN.avatar(n, 64)}<div><p class="kicker">${n.codigo} · ${esc(n.ciudad)}</p><h1>¡Hola, ${esc(n.nombre)}!</h1><p class="muted">Tus huéspedes y el daily care que reciben sus familias.</p></div></div>
      </div>
      <div class="stats">
        <div class="stat"><span>⭐</span><b>${PN.num(n.rating)}</b><small>valoración</small></div>
        <div class="stat"><span>💬</span><b>${n.numResenas}</b><small>opiniones</small></div>
        <div class="stat"><span>🐾</span><b>${enCurso}</b><small>${enCurso === 1 ? 'huésped en curso' : 'huéspedes en curso'}</small></div>
        <div class="stat"><span>📅</span><b>${proximas}</b><small>${proximas === 1 ? 'reserva próxima' : 'reservas próximas'}</small></div>
        <div class="stat"><span>💶</span><b>${PN.euro(ingresos)}</b><small>ingresos netos</small></div>
      </div>
      ${res.length
        ? `<div class="res-list">${res.map(({ r, st }) => resCardNany(r, st)).join('')}</div>`
        : PN.emptyState('🛏️', 'Aún no tienes huéspedes', 'Cuando un cliente te reserve, aparecerá aquí y podrás enviarle el daily care. Mantén tu disponibilidad al día para recibir más reservas.', '<a class="btn primary" href="#/nany/disponibilidad">Revisar mi disponibilidad</a>')}
    </div>`;

    root.querySelectorAll('[data-timeline]').forEach((el) => {
      const r = S().reservas.find((x) => x.id === el.dataset.timeline);
      PN.loadTimeline(el, r.id, { canDelete: true, emptyText: 'Todavía no has enviado ninguna actualización a esta familia.' });
      const form = el.closest('.res-card').querySelector('.dc-form');
      if (form) wireUpload(form, r, el);
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-del-post]');
        if (!b) return;
        const ok = await PN.confirmDialog({ title: '¿Eliminar esta actualización?', text: '<p>La familia dejará de verla.</p>', ok: 'Eliminar', danger: true });
        if (!ok) return;
        await PN.posts.remove(b.dataset.delPost);
        PN.loadTimeline(el, r.id, { canDelete: true, emptyText: 'Todavía no has enviado ninguna actualización a esta familia.' });
      });
    });
  };

  /* ===================== Disponibilidad ===================== */
  PN.views.disponibilidad = (root) => {
    const id = S().session.nannyId;
    let offset = 0;

    function draw() {
      const n = PN.getNanny(id);
      const t = PN.today();
      const now = new Date();
      const months = [0, 1, 2].map((i) => new Date(now.getFullYear(), now.getMonth() + offset + i, 1));
      let libres = 0;
      for (let i = 0; i < 60; i++) if (PN.isAvailable(n, PN.addDays(t, i))) libres++;

      const dayInfo = (iso) => {
        if (iso < t) return { cls: 'past' };
        const hoy = iso === t ? ' today' : '';
        if (PN.isReserved(id, iso)) return { cls: `reserved${hoy}`, title: 'Reservado' };
        const av = PN.isAvailable(n, iso);
        return { cls: (av ? 'avail' : 'busy') + hoy, button: true, title: av ? 'Libre · pulsa para cerrar' : 'Cerrado · pulsa para abrir' };
      };

      root.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <div><h1>Mi disponibilidad</h1><p class="muted">Pulsa un día para abrirlo o cerrarlo. Los clientes solo pueden reservar tus días libres; los días con reserva se bloquean solos.</p></div>
          <div class="meter"><b>${Math.round((libres / 60) * 100)}%</b><small>días libres en los próximos 60 días</small></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <button type="button" class="btn ghost sm" id="prev" ${offset === 0 ? 'disabled' : ''}>‹ Anterior</button>
            <div class="cal-legend"><span class="lg avail"></span> Libre <span class="lg busy"></span> Cerrado <span class="lg reserved"></span> Reservado</div>
            <button type="button" class="btn ghost sm" id="next" ${offset >= 9 ? 'disabled' : ''}>Siguiente ›</button>
          </div>
          <div class="cal-months three">
            ${months.map((d) => `
              <div class="cal-box">
                ${PN.monthCalendar(d.getFullYear(), d.getMonth(), dayInfo)}
                <div class="cal-bulk"><button type="button" class="link" data-bulk="${PN.toISO(d)}" data-val="1">Abrir todo el mes</button><button type="button" class="link" data-bulk="${PN.toISO(d)}" data-val="0">Cerrar todo el mes</button></div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

      root.querySelector('#prev').addEventListener('click', () => { offset = Math.max(0, offset - 1); draw(); });
      root.querySelector('#next').addEventListener('click', () => { offset += 1; draw(); });
      root.querySelectorAll('[data-date]').forEach((b) =>
        b.addEventListener('click', () => {
          const ov = (S().disponibilidad[id] = S().disponibilidad[id] || {});
          ov[b.dataset.date] = !PN.isAvailable(n, b.dataset.date);
          PN.save();
          draw();
        })
      );
      root.querySelectorAll('[data-bulk]').forEach((b) =>
        b.addEventListener('click', () => {
          const first = PN.fromISO(b.dataset.bulk);
          const ov = (S().disponibilidad[id] = S().disponibilidad[id] || {});
          const val = b.dataset.val === '1';
          for (let d = new Date(first); d.getMonth() === first.getMonth(); d.setDate(d.getDate() + 1)) {
            const iso = PN.toISO(d);
            if (iso >= t && !PN.isReserved(id, iso)) ov[iso] = val;
          }
          PN.save();
          PN.toast(val ? 'Mes abierto a reservas' : 'Mes cerrado a reservas');
          draw();
        })
      );
    }
    draw();
  };

  /* ===================== Mi perfil (editable) ===================== */
  PN.views.nanyPerfil = (root) => {
    const id = S().session.nannyId;
    const n = PN.getNanny(id);
    root.innerHTML = `
    <div class="wrap">
      <div class="page-head">
        <div><h1>Mi perfil</h1><p class="muted">Así te ven los clientes. Mantén tus precios, servicios y especies al día.</p></div>
        <a class="btn ghost" href="#/perfil/${id}">Ver mi perfil público →</a>
      </div>
      <div class="two-col">
        <form id="pf" class="panel form-grid">
          <label class="field">Precio por noche (€)<input type="number" name="precioNoche" min="${PN.PRICE_MIN}" max="${PN.PRICE_MAX}" required value="${n.precioNoche}"></label>
          <label class="field">Precio por día de visitas (€)<input type="number" name="precioVisita" min="5" max="60" required value="${n.precioVisita}"></label>
          <label class="field full">Tu lema<input name="lema" maxlength="60" value="${esc(n.lema)}"></label>
          <label class="field full">Sobre mí<textarea name="bio" rows="5" maxlength="700">${esc(n.bio)}</textarea></label>
          <fieldset class="field full"><legend>Especies que aceptas</legend>
            <div class="chips">${Object.entries(PN.ESPECIES).map(([k, e]) => `<label class="chip"><input type="checkbox" name="animales" value="${k}" ${n.animales.includes(k) ? 'checked' : ''}><span>${e.icon} ${e.plural}</span></label>`).join('')}</div>
          </fieldset>
          <label class="field">Ecosistema principal<select name="ecosistema">${Object.entries(PN.ECOSISTEMAS).map(([k, e]) => `<option value="${k}" ${k === n.ecosistema ? 'selected' : ''}>${e.icon} ${e.nombre}</option>`).join('')}</select></label>
          <label class="field">Máx. mascotas a la vez<input type="number" name="maxMascotas" min="1" max="8" value="${n.maxMascotas}"></label>
          <fieldset class="field full"><legend>Servicios</legend>
            <div class="checks cols2">${PN.SERVICIOS.map((s) => `<label class="check"><input type="checkbox" name="servicios" value="${s.id}" ${n.servicios.includes(s.id) ? 'checked' : ''}> ${s.icon} ${s.nombre}</label>`).join('')}</div>
          </fieldset>
          <label class="check full"><input type="checkbox" name="jardin" ${n.jardin ? 'checked' : ''}> 🌳 Tengo jardín o terraza</label>
          <div class="full row-btns">
            <button class="btn primary" type="submit">Guardar cambios</button>
            ${S().nannyEdits[id] ? '<button type="button" class="btn ghost" id="pf-reset">Restablecer perfil original</button>' : ''}
          </div>
        </form>
        <aside class="side-col">
          <p class="kicker">Vista previa de tu tarjeta</p>
          ${PN.nannyCard(n, { noFav: true })}
          <div class="panel">
            <h3>Formación acreditada</h3>
            <ul class="ticks">${n.certs.length ? n.certs.map((c) => `<li>🎓 ${PN.CERTS.find((x) => x.id === c).nombre}</li>`).join('') : '<li class="muted">Sin certificaciones registradas</li>'}</ul>
            <p class="muted tiny">Para añadir una certificación, entrégala en recepción y la verificaremos.</p>
          </div>
        </aside>
      </div>
    </div>`;

    const form = root.querySelector('#pf');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const animales = fd.getAll('animales');
      const servicios = fd.getAll('servicios');
      if (!animales.length) { PN.toast('Elige al menos una especie', 'warn'); return; }
      if (!servicios.length) { PN.toast('Elige al menos un servicio', 'warn'); return; }
      const ecos = [...new Set(animales.map((a) => PN.ESPECIES[a].eco))];
      let ecosistema = fd.get('ecosistema');
      if (!ecos.includes(ecosistema)) {
        ecosistema = ecos[0];
        PN.toast(`Ecosistema ajustado a ${PN.ECOSISTEMAS[ecosistema].nombre} según tus especies`, 'warn');
      }
      const clamp = (v, a, z) => Math.max(a, Math.min(z, Math.round(Number(v) || a)));
      S().nannyEdits[id] = {
        precioNoche: clamp(fd.get('precioNoche'), PN.PRICE_MIN, PN.PRICE_MAX),
        precioVisita: clamp(fd.get('precioVisita'), 5, 60),
        lema: String(fd.get('lema') || '').trim() || n.lema,
        bio: String(fd.get('bio') || '').trim() || n.bio,
        animales, servicios, ecosistema,
        maxMascotas: clamp(fd.get('maxMascotas'), 1, 8),
        jardin: fd.has('jardin'),
      };
      PN.save();
      PN.toast('✔ Perfil actualizado');
      PN.views.nanyPerfil(root);
    });
    const reset = root.querySelector('#pf-reset');
    if (reset) reset.addEventListener('click', () => { delete S().nannyEdits[id]; PN.save(); PN.toast('Perfil restablecido'); PN.views.nanyPerfil(root); });
  };

  /* ===================== Opiniones ===================== */
  PN.views.nanyOpiniones = (root) => {
    const n = PN.getNanny(S().session.nannyId);
    root.innerHTML = `
    <div class="wrap">
      <div class="page-head"><div><h1>Mis opiniones</h1><p class="muted">Lo que dicen las familias que han confiado en ti.</p></div></div>
      <section class="panel">${PN.reviewsHTML(n)}</section>
    </div>`;
  };
})();
