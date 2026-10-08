/* PuppyNany · estado persistente (localStorage), disponibilidad, búsqueda y daily care (IndexedDB) */
(function () {
  'use strict';
  const PN = window.PN;

  /* ---------- Estado de la app ---------- */
  const KEY = 'puppynany:v1';
  const blank = () => ({
    session: null,          // { role: 'cliente' } | { role: 'nany', nannyId }
    cliente: null,          // { nombre, ciudad, mascotas: [...] }
    reservas: [],
    favoritos: [],
    nannyEdits: {},         // cambios que cada nany hace en su perfil
    disponibilidad: {},     // { nannyId: { 'AAAA-MM-DD': true|false } }
    resenasExtra: {},       // opiniones escritas por clientes desde la app
    seeded: false,
    clienteDemo: false,
  });

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
  PN.state = Object.assign(blank(), saved || {});
  PN.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(PN.state)); } catch (e) { console.warn('No se pudo guardar el estado', e); }
  };

  /* ---------- Nanys (con ediciones y opiniones nuevas aplicadas) ---------- */
  PN.getNanny = (id) => {
    const base = PN.NANNIES_BY_ID[id];
    if (!base) return null;
    const edits = PN.state.nannyEdits[id];
    const n = Object.assign({}, base, edits || {});
    if (edits) {
      n.ecos = [...new Set(n.animales.map((a) => PN.ESPECIES[a].eco))];
      if (!n.ecos.includes(n.ecosistema)) n.ecosistema = n.ecos[0];
      n.rango = PN.rangoPrecio(n.precioNoche);
    }
    const extra = PN.state.resenasExtra[id] || [];
    n.resenasExtra = extra;
    if (extra.length) {
      const sum = extra.reduce((s, x) => s + x.estrellas, 0);
      n.numResenas = base.numResenas + extra.length;
      n.rating = Math.round(((base.rating * base.numResenas + sum) / n.numResenas) * 10) / 10;
    }
    return n;
  };
  PN.allNannies = () => PN.NANNIES.map((n) => PN.getNanny(n.id));

  /* ---------- Reservas y disponibilidad ---------- */
  PN.reservaEstado = (r) => {
    if (r.estado === 'cancelada') return 'cancelada';
    const t = PN.today();
    if (t < r.inicio) return 'proxima';
    if (t > r.fin) return 'finalizada';
    return 'encurso';
  };
  PN.reservasDeNanny = (id) => PN.state.reservas.filter((r) => r.nannyId === id);
  PN.isReserved = (id, iso) => PN.state.reservas.some((r) => r.nannyId === id && r.estado !== 'cancelada' && r.inicio <= iso && iso <= r.fin);

  // Agenda base: bloques de 4 días libres/ocupados, estables para cada nany
  PN.baseAvailable = (n, iso) => {
    const block = Math.floor((PN.dayNum(iso) + n.id * 3) / 4);
    return PN.hash2(n.id, block) >= n.busy;
  };
  PN.isAvailable = (n, iso) => {
    if (PN.isReserved(n.id, iso)) return false;
    const ov = PN.state.disponibilidad[n.id];
    if (ov && Object.prototype.hasOwnProperty.call(ov, iso)) return ov[iso];
    return PN.baseAvailable(n, iso);
  };
  PN.conflictDays = (n, desde, hasta) => {
    const out = [];
    for (let d = desde; d <= hasta; d = PN.addDays(d, 1)) if (!PN.isAvailable(n, d)) out.push(d);
    return out;
  };
  PN.rangeAvailable = (n, desde, hasta) => {
    for (let d = desde; d <= hasta; d = PN.addDays(d, 1)) if (!PN.isAvailable(n, d)) return false;
    return true;
  };
  PN.nextAvailable = (n, from) => {
    let d = from;
    for (let i = 0; i < 120; i++) {
      if (PN.isAvailable(n, d)) return d;
      d = PN.addDays(d, 1);
    }
    return null;
  };

  /* ---------- Búsqueda de nanys ---------- */
  PN.defaultFilters = () => ({
    q: '', especie: '', eco: '', ciudad: '', desde: '', hasta: '',
    minRating: 0, pmin: PN.PRICE_MIN, pmax: PN.PRICE_MAX,
    servicios: [], cert: '', verificado: false, jardin: false, minExp: 0, favs: false,
    orden: 'recomendados',
  });
  PN.filters = PN.defaultFilters();
  PN.resetFilters = () => { PN.filters = PN.defaultFilters(); };

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  PN.filterNannies = (list, f) => {
    const q = norm(f.q || '');
    const hasta = f.hasta && f.hasta >= f.desde ? f.hasta : f.desde;
    return list.filter((n) => {
      if (q && !norm(`${n.nombre} ${n.apellido} ${n.codigo}`).includes(q)) return false;
      if (f.especie && !n.animales.includes(f.especie)) return false;
      if (f.eco && !n.ecos.includes(f.eco)) return false;
      if (f.ciudad && n.ciudad !== f.ciudad) return false;
      if (n.rating < f.minRating) return false;
      if (n.precioNoche < f.pmin || n.precioNoche > f.pmax) return false;
      if (f.servicios.length && !f.servicios.every((s) => n.servicios.includes(s))) return false;
      if (f.cert && !n.certs.includes(f.cert)) return false;
      if (f.verificado && !n.verificado) return false;
      if (f.jardin && !n.jardin) return false;
      if (n.experiencia < f.minExp) return false;
      if (f.favs && !PN.state.favoritos.includes(n.id)) return false;
      if (f.desde && !PN.rangeAvailable(n, f.desde, hasta)) return false;
      return true;
    });
  };

  const score = (n) => n.rating * 2 + Math.log10(n.numResenas + 1) * 1.2 + (n.verificado ? 0.6 : 0) + n.certs.length * 0.15;
  const SORTS = {
    recomendados: (a, b) => score(b) - score(a),
    rating: (a, b) => b.rating - a.rating || b.numResenas - a.numResenas,
    'precio-asc': (a, b) => a.precioNoche - b.precioNoche || b.rating - a.rating,
    'precio-desc': (a, b) => b.precioNoche - a.precioNoche || b.rating - a.rating,
    resenas: (a, b) => b.numResenas - a.numResenas,
    experiencia: (a, b) => b.experiencia - a.experiencia || b.rating - a.rating,
  };
  PN.sortNannies = (list, orden) => [...list].sort(SORTS[orden] || SORTS.recomendados);

  PN.toggleFav = (id) => {
    const favs = PN.state.favoritos;
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1);
    else favs.push(id);
    PN.save();
    return i < 0;
  };

  /* ---------- Daily care: fotos y notas en IndexedDB ---------- */
  const DB_NAME = 'puppynany';
  const STORE = 'dailycare';
  const memPosts = [];
  let dbPromise = null;

  function openDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) return reject(new Error('IndexedDB no disponible'));
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const os = req.result.createObjectStore(STORE, { keyPath: 'id' });
          os.createIndex('reservaId', 'reservaId');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }).catch((err) => {
        console.warn('El daily care se guardará solo en memoria:', err);
        return null;
      });
    }
    return dbPromise;
  }
  const done = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

  PN.posts = {
    async add(post) {
      const db = await openDB();
      if (!db) { memPosts.push(post); return; }
      await done(db.transaction(STORE, 'readwrite').objectStore(STORE).put(post));
    },
    async byReserva(reservaId) {
      const db = await openDB();
      const list = db
        ? await done(db.transaction(STORE).objectStore(STORE).index('reservaId').getAll(reservaId))
        : memPosts.filter((p) => p.reservaId === reservaId);
      return list.sort((a, b) => b.createdAt - a.createdAt);
    },
    async remove(id) {
      const db = await openDB();
      if (!db) { const i = memPosts.findIndex((p) => p.id === id); if (i >= 0) memPosts.splice(i, 1); return; }
      await done(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id));
    },
  };

  /* ---------- Datos de ejemplo para probar la app desde el primer minuto ---------- */
  const NOTAS_DEMO = {
    perro: ['{pet} llegó con algo de nervios, pero tras el primer paseo por el bosque ya no paraba de mover la cola. ¡Ha cenado todo! 🍖', 'Buenos días desde el hotel 🌞 {pet} ha dormido toda la noche del tirón. Hoy toca ruta larga y juegos de olfato.'],
    gato: ['{pet} ha pasado la tarde explorando las estanterías de la Jungla Felina. Ya ha elegido su rincón favorito junto a la ventana ☀️', 'Arenero limpio, comida húmeda a su hora y una buena sesión de caña-pluma. {pet} ha ronroneado un buen rato 💛'],
    conejo: ['{pet} ha comido heno fresco y un poco de zanahoria. Ha pasado una tarde tranquila en la madriguera 🥕', 'Hoy {pet} ha explorado los túneles nuevos y ha hecho un par de "binkies" de felicidad 🐰'],
    roedor: ['{pet} ha corrido un buen rato en la rueda y ha guardado semillas en su escondite, como siempre 🌻', 'Jaula limpia, agua fresca y un trocito de pepino que ha desaparecido en segundos.'],
    ave: ['{pet} ha tomado su baño de la mañana y ha cantado al amanecer en el Aviario Tropical 🎶', 'Vuelo supervisado de 20 minutos y fruta fresca. ¡{pet} tiene muchas ganas de charla hoy! 🍎'],
    reptil: ['Terrario a 30 ºC en la zona caliente y UVB encendida 12 h. {pet} ha comido bien y ha estado tomando el sol.', 'Humedad en su punto y baño templado. {pet} se mueve mucho y tiene buen apetito.'],
    pez: ['Parámetros del agua perfectos (pH 7,2 · 25 ºC). {pet} y sus compañeros han comido con ganas 🐟', 'Cambio parcial de agua hecho y filtro revisado. Todo cristalino en el Arrecife Azul 💧'],
  };
  const nota = (especie, i, nombre) => NOTAS_DEMO[especie][i].replaceAll('{pet}', nombre);
  const horaHoy = (h, m) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return Math.min(d.getTime(), Date.now() - 30 * 60 * 1000);
  };

  PN.ensureSeed = async () => {
    if (PN.state.seeded) return;
    const t = PN.today();
    const n1 = PN.getNanny(1);
    const toby = {
      id: 'R-seed-toby', nannyId: 1, owner: 'seed', clienteNombre: 'Familia Ortega',
      mascota: { id: 'M-toby', nombre: 'Toby', especie: 'perro', raza: 'Beagle', edad: '4 años', notas: 'Le encanta buscar la pelota. Pienso dos veces al día (mañana y noche).' },
      inicio: PN.addDays(t, -2), fin: PN.addDays(t, 5), servicio: 'alojamiento', total: n1.precioNoche * 7, estado: 'confirmada', creada: Date.now(),
    };
    const mishi = {
      id: 'R-seed-mishi', nannyId: 1, owner: 'seed', clienteNombre: 'Andrea P.',
      mascota: { id: 'M-mishi', nombre: 'Mishi', especie: 'gato', raza: 'Europeo común', edad: '7 años', notas: 'Tímida al principio. Comida húmeda por la noche.' },
      inicio: PN.addDays(t, 7), fin: PN.addDays(t, 13), servicio: 'alojamiento', total: n1.precioNoche * 6, estado: 'confirmada', creada: Date.now(),
    };
    PN.state.reservas.push(toby, mishi);
    PN.state.seeded = true;
    PN.save();
    await PN.posts.add({
      id: 'P-seed-toby-1', reservaId: toby.id, nannyId: 1, createdAt: Date.now() - 26 * 3600 * 1000,
      fotos: [PN.illustration('perro', 'bosque', 0)], nota: nota('perro', 0, 'Toby'),
      checks: { comida: true, agua: true, paseo: true, juego: true }, animo: 'feliz',
    });
  };

  // Al hacer el primer check-in, el cliente recibe una estancia de ejemplo con daily care
  PN.seedClienteDemo = async (pet) => {
    if (PN.state.clienteDemo) return;
    const cand = PN.allNannies()
      .filter((n) => n.id !== 1 && n.animales.includes(pet.especie))
      .sort((a, b) => b.rating - a.rating || b.numResenas - a.numResenas)[0];
    if (!cand) return;
    const t = PN.today();
    const eco = PN.ESPECIES[pet.especie].eco;
    const servicio = cand.servicios.includes('alojamiento') ? 'alojamiento' : 'visitas';
    const total = servicio === 'alojamiento' ? cand.precioNoche * 4 : cand.precioVisita * 5;
    const r = {
      id: PN.uid('R'), nannyId: cand.id, owner: 'me', clienteNombre: PN.state.cliente.nombre,
      mascota: Object.assign({}, pet), inicio: PN.addDays(t, -1), fin: PN.addDays(t, 3),
      servicio, total: Math.round(total * 1.08), estado: 'confirmada', creada: Date.now(), demo: true,
    };
    PN.state.reservas.push(r);
    PN.state.clienteDemo = true;
    PN.save();
    await PN.posts.add({
      id: PN.uid('P'), reservaId: r.id, nannyId: cand.id, createdAt: Date.now() - 20 * 3600 * 1000,
      fotos: [PN.illustration(pet.especie, eco, 1)], nota: nota(pet.especie, 0, pet.nombre),
      checks: { comida: true, agua: true, juego: true }, animo: 'nervios',
    });
    await PN.posts.add({
      id: PN.uid('P'), reservaId: r.id, nannyId: cand.id, createdAt: horaHoy(9, 15),
      fotos: [PN.illustration(pet.especie, eco, 2), PN.illustration(pet.especie, eco, 4)], nota: nota(pet.especie, 1, pet.nombre),
      checks: { comida: true, agua: true, paseo: pet.especie === 'perro', higiene: true, descanso: true }, animo: 'feliz',
    });
  };
})();
