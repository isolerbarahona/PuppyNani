/* PuppyNany · piezas de interfaz reutilizadas por clientes y nanys */
(function () {
  'use strict';
  const PN = window.PN;
  const { esc } = PN;

  PN.ESTADOS = {
    proxima: { txt: 'Próxima', cls: 'b-next' },
    encurso: { txt: 'En curso', cls: 'b-live' },
    finalizada: { txt: 'Finalizada', cls: 'b-done' },
    cancelada: { txt: 'Cancelada', cls: 'b-cancel' },
  };

  PN.speciesIcons = (arr) =>
    arr.map((a) => `<span title="${PN.ESPECIES[a].plural}">${PN.ESPECIES[a].icon}</span>`).join('');

  PN.availabilityText = (n, f) => {
    if (f && f.desde) return '<span class="avail ok">✓ Libre en tus fechas</span>';
    const t = PN.today();
    const next = PN.nextAvailable(n, t);
    if (!next) return '<span class="avail no">Sin huecos próximos</span>';
    if (next === t) return '<span class="avail ok">● Disponible hoy</span>';
    return `<span class="avail soon">Libre desde el ${PN.fmtDate(next)}</span>`;
  };

  PN.favButton = (id) => {
    const on = PN.state.favoritos.includes(id);
    return `<button type="button" class="fav ${on ? 'on' : ''}" data-fav="${id}" aria-pressed="${on}" aria-label="${on ? 'Quitar de favoritos' : 'Añadir a favoritos'}">${on ? '♥' : '♡'}</button>`;
  };

  PN.nannyCard = (n, opts = {}) => {
    const eco = PN.ECOSISTEMAS[n.ecosistema];
    return `
    <article class="nanny-card">
      <div class="nc-top eco-${n.ecosistema}">
        <span class="nc-eco">${eco.icon} ${eco.nombre}</span>
        ${opts.noFav ? '' : PN.favButton(n.id)}
        ${PN.avatar(n, 78)}
      </div>
      <div class="nc-body">
        <h3><a class="card-link" href="#/perfil/${n.id}">${esc(n.nombre)} ${esc(n.apellido)}</a>${n.verificado ? '<span class="vdot" title="Perfil verificado">✔</span>' : ''}</h3>
        <p class="nc-meta">📍 ${esc(n.ciudad)} · ${PN.plural(n.experiencia, 'año', 'años')} de experiencia</p>
        <p class="nc-rating">${PN.stars(n.rating)} <b>${PN.num(n.rating)}</b> <span class="muted">(${n.numResenas})</span></p>
        <p class="nc-lema">“${esc(n.lema)}”</p>
        <div class="nc-species">${PN.speciesIcons(n.animales)}</div>
        <div class="nc-foot">
          <span class="price"><b>${PN.euro(n.precioNoche)}</b>/noche <span class="rango">${n.rango}</span></span>
          ${PN.availabilityText(n, opts.filters)}
        </div>
      </div>
    </article>`;
  };

  /* ---------- Opiniones ---------- */
  PN.ratingBars = (n) => {
    const w = [1, 2, 3, 4, 5].map((k) => Math.exp(-Math.pow(k - n.rating, 2) / 0.8));
    const sum = w.reduce((a, b) => a + b, 0);
    return [5, 4, 3, 2, 1]
      .map((k) => {
        const pct = Math.round((w[k - 1] / sum) * 100);
        return `<div class="bar-row"><span>${k} ★</span><span class="bar"><span style="width:${pct}%"></span></span><span class="muted">${pct}%</span></div>`;
      })
      .join('');
  };

  PN.reviewsHTML = (n) => {
    const t = PN.today();
    const extra = (n.resenasExtra || []).map((x) => Object.assign({}, x, { diasAtras: PN.diffDays(x.fecha, t), mine: true })).reverse();
    const all = extra.concat(n.resenas);
    return `
      <div class="reviews-summary">
        <div class="big-score"><b>${PN.num(n.rating)}</b>${PN.stars(n.rating, 'lg')}<span class="muted">${PN.plural(n.numResenas, 'opinión', 'opiniones')}</span></div>
        <div class="bars">${PN.ratingBars(n)}</div>
      </div>
      <ul class="reviews">${all
        .map(
          (rv) => `
        <li class="review">
          <span class="rv-avatar" aria-hidden="true">${PN.ESPECIES[rv.especie].icon}</span>
          <div>
            <p class="rv-head"><b>${esc(rv.autor)}</b> <span class="muted">· con ${esc(rv.mascota)} · ${PN.fmtAgo(rv.diasAtras)}</span>${rv.mine ? ' <span class="badge b-next">Desde la app</span>' : ''}</p>
            ${PN.stars(rv.estrellas, 'sm')}
            <p>${esc(rv.texto)}</p>
          </div>
        </li>`
        )
        .join('')}</ul>
      <p class="muted tiny">Mostrando ${all.length} de ${PN.plural(n.numResenas, 'opinión', 'opiniones')}.</p>`;
  };

  /* ---------- Daily care ---------- */
  PN.postHTML = (p, opts = {}) => {
    const mood = PN.MOODS.find((m) => m.id === p.animo);
    const checks = PN.CHECKS.filter((c) => p.checks && p.checks[c.id]);
    const fotos = p.fotos || [];
    return `
    <article class="post">
      <div class="post-head">
        <span class="post-date">🕒 ${PN.fmtDateTime(p.createdAt)}</span>
        ${mood ? `<span class="mood">${mood.icon} ${mood.nombre}</span>` : ''}
        ${opts.canDelete ? `<button type="button" class="link danger" data-del-post="${esc(p.id)}">Eliminar</button>` : ''}
      </div>
      ${fotos.length ? `<div class="post-photos n${Math.min(fotos.length, 3)}">${fotos.map((src, i) => `<button type="button" class="photo" aria-label="Ampliar foto ${i + 1}"><img src="${esc(src)}" alt="Foto ${i + 1} del daily care" loading="lazy"></button>`).join('')}</div>` : ''}
      ${checks.length ? `<ul class="post-checks">${checks.map((c) => `<li>${c.icon} ${c.nombre}</li>`).join('')}</ul>` : ''}
      ${p.nota ? `<p class="post-note">${esc(p.nota)}</p>` : ''}
    </article>`;
  };

  PN.loadTimeline = async (container, reservaId, opts = {}) => {
    try {
      const posts = await PN.posts.byReserva(reservaId);
      container.innerHTML = posts.length
        ? posts.map((p) => PN.postHTML(p, opts)).join('')
        : `<p class="empty-mini">${opts.emptyText || 'Aún no hay actualizaciones.'}</p>`;
      return posts;
    } catch (e) {
      container.innerHTML = '<p class="empty-mini">No se pudo cargar el daily care.</p>';
      return [];
    }
  };

  PN.emptyState = (icon, title, text, action = '') => `
    <div class="empty"><span class="empty-icon" aria-hidden="true">${icon}</span><h2>${title}</h2><p class="muted">${text}</p>${action}</div>`;
})();
