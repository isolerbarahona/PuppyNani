/* PuppyNany · utilidades compartidas: formato, fechas y piezas de interfaz */
(function () {
  'use strict';
  const PN = (window.PN = window.PN || {});
  PN.views = PN.views || {};

  PN.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  PN.uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  PN.plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  PN.euro = (n) => `${Math.round(n)} €`;
  PN.num = (n, d = 1) => n.toFixed(d).replace('.', ',');

  /* ---------- Fechas (cadenas locales AAAA-MM-DD) ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  PN.MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  PN.toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  PN.fromISO = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  PN.today = () => PN.toISO(new Date());
  PN.addDays = (iso, n) => {
    const d = PN.fromISO(iso);
    d.setDate(d.getDate() + n);
    return PN.toISO(d);
  };
  PN.dayNum = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 864e5);
  };
  PN.diffDays = (a, b) => PN.dayNum(b) - PN.dayNum(a);
  PN.isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  PN.fmtDate = (iso) => {
    const d = PN.fromISO(iso);
    return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
  };
  PN.fmtDateLong = (iso) => {
    const d = PN.fromISO(iso);
    return `${d.getDate()} de ${PN.MESES[d.getMonth()]} de ${d.getFullYear()}`;
  };
  PN.fmtDateTime = (ts) => {
    const d = new Date(ts);
    return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  PN.fmtAgo = (days) => {
    if (days <= 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) {
      const w = Math.round(days / 7);
      return `hace ${w} ${w === 1 ? 'semana' : 'semanas'}`;
    }
    if (days < 365) {
      const m = Math.round(days / 30);
      return `hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
    }
    return 'hace más de un año';
  };

  /* ---------- Estrellas (relleno parcial) ---------- */
  PN.stars = (r, size = '') => {
    const pct = Math.max(0, Math.min(100, (r / 5) * 100)).toFixed(1);
    return `<span class="stars ${size}" style="--pct:${pct}%" role="img" aria-label="${PN.num(r)} de 5 estrellas">★★★★★</span>`;
  };

  /* ---------- Avatares ilustrados de las nanys ---------- */
  const HAIR = {
    short: (c) => `<path d="M17.5 31c0-9.5 6.5-15.5 14.5-15.5S46.5 21.5 46.5 31c-2.5-4.5-7-7.5-14.5-7.5S20 26.5 17.5 31z" fill="${c}"/>`,
    longBack: (c) => `<path d="M15 33c0-11 7.5-18 17-18s17 7 17 18v19c-4 2-8 2-10 0V30H25v22c-2 2-6 2-10 0z" fill="${c}"/>`,
    bun: (c) => `<circle cx="32" cy="13.5" r="6" fill="${c}"/>`,
    curly: (c) =>
      [[19, 27], [22.5, 20.5], [28.5, 16.5], [35.5, 16.5], [41.5, 20.5], [45, 27], [32, 21]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.6" fill="${c}"/>`)
        .join(''),
    side: (c) => `<path d="M17.5 32c-1-11 6-17 15-17 8 0 14.5 5.5 14 14-5-1-11-4-14-8-2 5-8 9-15 11z" fill="${c}"/>`,
  };

  PN.avatarSVG = (a) => {
    let back = '';
    let front = '';
    switch (a.hair) {
      case 0: front = HAIR.short(a.hairColor); break;
      case 1: back = HAIR.longBack(a.hairColor); front = HAIR.short(a.hairColor); break;
      case 2: back = HAIR.bun(a.hairColor); front = HAIR.short(a.hairColor); break;
      case 3: front = HAIR.curly(a.hairColor); break;
      default: front = HAIR.side(a.hairColor);
    }
    const glasses = a.glasses
      ? '<g fill="none" stroke="#2b2420" stroke-width="1.4"><circle cx="26.5" cy="34" r="4"/><circle cx="37.5" cy="34" r="4"/><path d="M30.5 34h3"/></g>'
      : '';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <rect width="64" height="64" fill="${a.bg}"/>
      ${back}
      <path d="M10 66c1.5-11 10-17.5 22-17.5S52.5 55 54 66z" fill="${a.shirt}"/>
      <rect x="28" y="44" width="8" height="7" rx="3" fill="${a.skin}"/>
      <circle cx="18" cy="35" r="3" fill="${a.skin}"/><circle cx="46" cy="35" r="3" fill="${a.skin}"/>
      <ellipse cx="32" cy="33" rx="14" ry="15" fill="${a.skin}"/>
      ${front}
      <circle cx="26.5" cy="34" r="1.7" fill="#2b2420"/><circle cx="37.5" cy="34" r="1.7" fill="#2b2420"/>
      <circle cx="23.5" cy="38.5" r="2.4" fill="#ff8a80" opacity=".35"/><circle cx="40.5" cy="38.5" r="2.4" fill="#ff8a80" opacity=".35"/>
      <path d="M28 40.5q4 3.2 8 0" fill="none" stroke="#2b2420" stroke-width="1.6" stroke-linecap="round"/>
      ${glasses}
    </svg>`;
  };

  PN.avatar = (n, size = 56) => `<span class="avatar" style="--s:${size}px" aria-hidden="true">${PN.avatarSVG(n.avatar)}</span>`;

  /* ---------- Avisos flotantes ---------- */
  PN.toast = (msg, type = 'ok') => {
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3000);
    setTimeout(() => el.remove(), 3500);
  };

  /* ---------- Ventanas modales ---------- */
  PN.modal = (html, { onMount, wide } = {}) => {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" tabindex="-1">
      <button class="modal-close" type="button" aria-label="Cerrar">✕</button>${html}</div>`;
    const prevFocus = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    function close() {
      wrap.remove();
      document.removeEventListener('keydown', onKey);
      document.body.classList.toggle('modal-open', !!root.children.length);
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
    }
    root.appendChild(wrap);
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('.modal-close').addEventListener('click', close);
    const dialog = wrap.querySelector('.modal');
    dialog.focus();
    if (onMount) onMount(dialog, close);
    return close;
  };

  PN.confirmDialog = ({ title, text, ok = 'Confirmar', cancel = 'Volver', danger = false }) =>
    new Promise((resolve) => {
      let answered = false;
      const close = PN.modal(
        `<div class="confirm">
          <h2>${title}</h2>
          ${text ? `<div class="confirm-text">${text}</div>` : ''}
          <div class="row-btns end">
            <button class="btn ghost" type="button" data-a="0">${cancel}</button>
            <button class="btn ${danger ? 'danger' : 'primary'}" type="button" data-a="1">${ok}</button>
          </div>
        </div>`,
        {
          onMount(m) {
            m.querySelectorAll('[data-a]').forEach((b) =>
              b.addEventListener('click', () => {
                answered = true;
                close();
                resolve(b.dataset.a === '1');
              })
            );
            const obs = new MutationObserver(() => {
              if (!document.contains(m)) { obs.disconnect(); if (!answered) resolve(false); }
            });
            obs.observe(document.getElementById('modal-root'), { childList: true });
          },
        }
      );
    });

  PN.lightbox = (src) => {
    PN.modal(`<figure class="lightbox"><img src="${PN.esc(src)}" alt="Foto del daily care ampliada"></figure>`, { wide: true });
  };

  /* ---------- Calendario mensual (lunes primero) ---------- */
  PN.monthCalendar = (year, month, dayInfo) => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<span class="cal-cell empty"></span>';
    for (let d = 1; d <= days; d++) {
      const iso = `${year}-${pad(month + 1)}-${pad(d)}`;
      const info = dayInfo(iso) || {};
      const title = info.title ? ` title="${PN.esc(info.title)}"` : '';
      cells += info.button
        ? `<button type="button" class="cal-cell ${info.cls || ''}" data-date="${iso}"${title}>${d}</button>`
        : `<span class="cal-cell ${info.cls || ''}"${title}>${d}</span>`;
    }
    const wd = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((w) => `<span class="cal-wd">${w}</span>`).join('');
    return `<div class="cal"><div class="cal-title">${PN.MESES[month]} ${year}</div><div class="cal-grid">${wd}${cells}</div></div>`;
  };

  /* ---------- Ilustraciones para el daily care de ejemplo ---------- */
  const ILLU = {
    bosque: ['#d4eecd', '#6a994e'],
    pradera: ['#fff3cc', '#a7c957'],
    arrecife: ['#a6e6f5', '#1f7fb8'],
    desierto: ['#ffe7b0', '#e2a75c'],
    jungla: ['#c4efdf', '#2a9d8f'],
    aviario: ['#cfeaff', '#f4c58f'],
  };
  PN.illustration = (especie, ecoKey, variant = 0) => {
    const eco = PN.ECOSISTEMAS[ecoKey];
    const sp = PN.ESPECIES[especie];
    const [sky, ground] = ILLU[ecoKey];
    const props = ['🎾', '🍖', '💤', '❤️', '🧸'];
    const dx = (variant % 3) * 60;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="${660 - dx}" cy="110" r="56" fill="#fff6c9" opacity=".95"/>
      <path d="M0 430 Q200 380 400 420 T800 410 V600 H0Z" fill="${ground}"/>
      <text x="${60 + dx}" y="410" font-size="120">${eco.deco[0]}</text>
      <text x="${600 - dx}" y="430" font-size="140">${eco.deco[1]}</text>
      <text x="${230 + dx}" y="530" font-size="230">${sp.icon}</text>
      <text x="${560 - dx / 2}" y="550" font-size="80">${props[variant % props.length]}</text>
      <rect x="28" y="28" rx="22" width="400" height="56" fill="#ffffff" opacity=".85"/>
      <text x="50" y="66" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#2d2a32">📸 Daily care · ${eco.nombre}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  /* ---------- Compresión de fotos antes de guardarlas ---------- */
  PN.compressImage = (file, max = 1280, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`No se pudo leer «${file.name}»`));
      };
      img.src = url;
    });
})();
