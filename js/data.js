/* PuppyNany · catálogos del hotel y red de 100 nanys (generada de forma determinista) */
(function () {
  'use strict';
  const PN = (window.PN = window.PN || {});

  /* ---------- Aleatoriedad reproducible: los mismos 100 perfiles en cada carga ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  PN.hash2 = (a, b) => mulberry32(Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503))();

  /* ---------- Catálogos ---------- */
  PN.ESPECIES = {
    perro: { nombre: 'Perro', plural: 'Perros', icon: '🐶', eco: 'bosque' },
    gato: { nombre: 'Gato', plural: 'Gatos', icon: '🐱', eco: 'jungla' },
    conejo: { nombre: 'Conejo', plural: 'Conejos', icon: '🐰', eco: 'pradera' },
    roedor: { nombre: 'Roedor', plural: 'Hámsters y cobayas', icon: '🐹', eco: 'pradera' },
    ave: { nombre: 'Ave', plural: 'Aves', icon: '🦜', eco: 'aviario' },
    reptil: { nombre: 'Reptil', plural: 'Reptiles', icon: '🦎', eco: 'desierto' },
    pez: { nombre: 'Pez', plural: 'Peces', icon: '🐠', eco: 'arrecife' },
  };

  PN.ECOSISTEMAS = {
    bosque: {
      nombre: 'Bosque Encantado', planta: 1, icon: '🌲', guest: '🐕', deco: ['🌲', '🌳', '🦴'],
      para: 'Perros de todos los tamaños', clima: '18–22 ºC · sombra y brisa',
      desc: 'Senderos para olfatear, zona de carreras vallada y rincones de sombra para la siesta. Mínimo tres paseos al día.',
      claves: ['Tres paseos diarios como mínimo', 'Zona de juego vallada', 'Juegos de olfato y enriquecimiento', 'Camas ortopédicas para perros senior'],
    },
    pradera: {
      nombre: 'Pradera Madriguera', planta: 2, icon: '🌾', guest: '🐇', deco: ['🌼', '🥕', '🌾'],
      para: 'Conejos, cobayas y hámsters', clima: '16–21 ºC · ambiente silencioso',
      desc: 'Heno fresco ilimitado, túneles, escondites y cero ruidos fuertes: el estrés es el mayor enemigo de los pequeños herbívoros.',
      claves: ['Heno y verdura fresca a diario', 'Túneles y madrigueras', 'Control de temperatura anti golpes de calor', 'Zona libre de depredadores'],
    },
    arrecife: {
      nombre: 'Arrecife Azul', planta: 3, icon: '🌊', guest: '🐠', deco: ['🐚', '💧', '🌊'],
      para: 'Peces y tortugas acuáticas', clima: 'Agua a 24–26 ºC · pH controlado',
      desc: 'Acuarios con filtración de respaldo, medición diaria de parámetros y alimentación pautada para que el agua siga cristalina.',
      claves: ['Test del agua diario', 'Filtro y calentador de respaldo', 'Dosis exacta de comida', 'Fotos del acuario cada día'],
    },
    desierto: {
      nombre: 'Desierto Templado', planta: 4, icon: '🌵', guest: '🦎', deco: ['🌵', '🪨', '☀️'],
      para: 'Reptiles y anfibios', clima: '26–34 ºC · gradiente térmico + UVB',
      desc: 'Terrarios con gradiente de temperatura, iluminación UVB y control de humedad, a cargo de nanys formadas en animales exóticos.',
      claves: ['Termostatos y lámparas UVB', 'Control de humedad', 'Gestión de alimento vivo', 'Manejo de exóticos certificado'],
    },
    jungla: {
      nombre: 'Jungla Felina', planta: 5, icon: '🌿', guest: '🐈', deco: ['🌿', '🪴', '🧶'],
      para: 'Gatos', clima: '20–24 ºC · alturas y escondites',
      desc: 'Estanterías para trepar, rascadores, escondites y ventanas con vistas. Rutinas tranquilas y feromonas relajantes para los gatos más sensibles.',
      claves: ['Rascadores y zonas en altura', 'Arenero limpio dos veces al día', 'Feromonas relajantes', 'Sin convivencia forzada con perros'],
    },
    aviario: {
      nombre: 'Aviario Tropical', planta: 6, icon: '🦜', guest: '🦜', deco: ['☁️', '🌺', '🌴'],
      para: 'Aves', clima: '20–26 ºC · 10–12 h de luz natural',
      desc: 'Luz natural en la azotea, perchas de distintos grosores, baños y vuelo supervisado. Se respetan los ciclos de luz y oscuridad.',
      claves: ['Vuelo supervisado a diario', 'Baño y perchas naturales', 'Ciclos de luz respetados', 'Semillas y fruta fresca'],
    },
  };

  PN.SERVICIOS = [
    { id: 'alojamiento', icon: '🏠', nombre: 'Alojamiento en casa de la nany' },
    { id: 'domicilio', icon: '🔑', nombre: 'Cuidado en tu domicilio' },
    { id: 'visitas', icon: '🚪', nombre: 'Visitas diarias' },
    { id: 'paseos', icon: '🦮', nombre: 'Paseos' },
    { id: 'medicacion', icon: '💊', nombre: 'Administración de medicación' },
    { id: 'senior', icon: '🤍', nombre: 'Cuidado senior' },
    { id: 'cachorros', icon: '🍼', nombre: 'Cachorros y crías' },
    { id: 'adiestramiento', icon: '🎓', nombre: 'Adiestramiento básico' },
    { id: 'peluqueria', icon: '🛁', nombre: 'Baño y cepillado' },
    { id: 'transporte', icon: '🚐', nombre: 'Recogida y entrega' },
  ];

  PN.CERTS = [
    { id: 'auxilios', nombre: 'Primeros auxilios veterinarios' },
    { id: 'atv', nombre: 'Auxiliar Técnico Veterinario (ATV)' },
    { id: 'etologia', nombre: 'Etología y comportamiento animal' },
    { id: 'adiestrador', nombre: 'Adiestramiento canino certificado' },
    { id: 'felino', nombre: 'Especialista felino (Cat Friendly)' },
    { id: 'exoticos', nombre: 'Manejo de animales exóticos' },
  ];

  PN.CIUDADES = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Zaragoza', 'Bilbao', 'Palma', 'Alicante', 'Granada', 'Valladolid', 'A Coruña'];

  PN.CHECKS = [
    { id: 'comida', icon: '🍽️', nombre: 'Comida' },
    { id: 'agua', icon: '💧', nombre: 'Agua fresca' },
    { id: 'paseo', icon: '🦮', nombre: 'Paseo / ejercicio' },
    { id: 'medicacion', icon: '💊', nombre: 'Medicación' },
    { id: 'juego', icon: '🎾', nombre: 'Juego' },
    { id: 'higiene', icon: '🛁', nombre: 'Higiene' },
    { id: 'descanso', icon: '💤', nombre: 'Buen descanso' },
  ];

  PN.MOODS = [
    { id: 'feliz', icon: '😄', nombre: 'Feliz' },
    { id: 'calma', icon: '😌', nombre: 'En calma' },
    { id: 'juego', icon: '🤪', nombre: 'Con ganas de jugar' },
    { id: 'sueno', icon: '😴', nombre: 'Con mucho sueño' },
    { id: 'nervios', icon: '😟', nombre: 'Con algo de nervios' },
    { id: 'añora', icon: '🥺', nombre: 'Te echa de menos' },
  ];

  PN.PRICE_MIN = 10;
  PN.PRICE_MAX = 90;
  PN.rangoPrecio = (p) => (p < 28 ? '€' : p < 48 ? '€€' : '€€€');

  /* ---------- Material para generar perfiles ---------- */
  const NOMBRES = ['Lucía', 'Hugo', 'Martina', 'Mateo', 'Sofía', 'Leo', 'Julia', 'Daniel', 'Paula', 'Álvaro', 'Valeria', 'Pablo', 'Emma', 'Adrián', 'Carla', 'Manuel', 'Alba', 'Diego', 'Noa', 'Javier', 'Irene', 'Marcos', 'Sara', 'Álex', 'Claudia', 'Iker', 'Laia', 'Bruno', 'Marta', 'Nicolás', 'Aitana', 'Sergio', 'Elena', 'Rubén', 'Carmen', 'Jorge', 'Lola', 'Andrés', 'Nerea', 'Gael', 'Ainhoa', 'Raúl', 'Inés', 'Óscar', 'Vega', 'Marc', 'Uxue', 'Unai', 'Olivia', 'Samuel', 'Rocío', 'Iván', 'Ariadna', 'Tomás', 'Celia', 'Joel', 'Blanca', 'Íñigo', 'Lara', 'Xoán'];
  const APELLIDOS = ['García', 'Martín', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Molina', 'Blanco', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Núñez', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Calvo', 'Cruz', 'Gallego', 'Vidal', 'León', 'Herrera', 'Peña', 'Flores', 'Cabrera', 'Campos', 'Vega', 'Fuentes', 'Carrasco', 'Aguirre', 'Etxeberria', 'Puig', 'Ferrer', 'Rovira', 'Otero', 'Pardo'];
  const MASCOTAS = ['Luna', 'Coco', 'Toby', 'Nala', 'Rocky', 'Kira', 'Simba', 'Lola', 'Bimba', 'Thor', 'Mía', 'Zeus', 'Canela', 'Pipo', 'Nube', 'Olivia', 'Bruno', 'Chispa', 'Kiwi', 'Rex', 'Leia', 'Gizmo', 'Mango', 'Pelusa', 'Oreo', 'Frida', 'Duna', 'Max', 'Trufa', 'Pancho'];

  const SKINS = ['#f8d5b8', '#f3c9a5', '#eab68f', '#c98b62', '#9b6544', '#6e4430'];
  const HAIRS = ['#2b1d16', '#5a3825', '#a0522d', '#d9a441', '#1b1b1b', '#8a8a8a', '#c4472e', '#e8c07a'];
  const BGS = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6', '#a0c4ff', '#ffadad'];
  const SHIRTS = ['#e8743b', '#2a9d8f', '#264653', '#e9c46a', '#6a4c93', '#1982c4', '#8ac926', '#ff595e'];

  const LEMAS = {
    bosque: ['Paseos largos y siestas al sol', 'Rutas por el monte y mimos infinitos', 'Mucho ejercicio y más cariño todavía', 'Cada paseo es una aventura'],
    pradera: ['Heno fresco y cero sustos', 'Calma total para orejas largas', 'Pequeños huéspedes, grandes cuidados'],
    arrecife: ['Agua cristalina, peces felices', 'Parámetros perfectos, siempre', 'Tu acuario en buenas manos'],
    desierto: ['Calor exacto y luz UVB', 'Especialista en sangre fría', 'Terrarios a punto, todos los días'],
    jungla: ['Alturas, rascadores y paz felina', 'Ronroneos garantizados', 'Respeto los tiempos de cada gato'],
    aviario: ['Luz natural y vuelos supervisados', 'Canto feliz, rutina perfecta', 'Perchas, fruta y mucha calma'],
  };

  const INTROS = [
    (n) => `¡Hola! Soy ${n.nombre} y los animales forman parte de mi vida desde que tengo memoria.`,
    (n) => `Me llamo ${n.nombre} y llevo ${PN.plural(n.experiencia, 'año', 'años')} cuidando mascotas en ${n.ciudad}.`,
    (n) => `Soy ${n.nombre}: cuidar animales no es mi trabajo, es mi forma de vida.`,
    (n) => `Hola, soy ${n.nombre}. Trato a cada huésped como a un miembro más de mi familia.`,
    (n) => `${n.nombre} por aquí 👋 Tengo ${PN.plural(n.experiencia, 'año', 'años')} de experiencia y paciencia de sobra.`,
  ];
  const ECO_BIO = {
    bosque: ['Vivo junto a un parque enorme y salgo al monte varias veces al día.', 'Me encantan las rutas largas, los juegos de olfato y las siestas compartidas en el sofá.'],
    pradera: ['Tengo un espacio fresco y silencioso, con heno de calidad y zona para que corran sin peligro.', 'Los pequeños herbívoros necesitan calma y rutina, y eso es justo lo que ofrezco.'],
    arrecife: ['Controlo los parámetros del agua a diario y tengo experiencia con acuarios tropicales y de agua fría.', 'Tengo equipo de respaldo por si falla el filtro o el calentador.'],
    desierto: ['Cuento con terrarios de respaldo, lámparas UVB y control de temperatura.', 'Me apasionan los reptiles y conozco bien sus necesidades de calor y humedad.'],
    jungla: ['Mi casa es un paraíso felino: estanterías para trepar, rascadores y ventanas con vistas.', 'Respeto los tiempos de cada gato: primero confianza, después mimos.'],
    aviario: ['Mantengo rutinas de luz y alimentación muy cuidadas; las aves necesitan calma y constancia.', 'Tengo una terraza luminosa donde las aves disfrutan del sol de la mañana.'],
  };
  const CERT_BIO = {
    auxilios: 'Tengo formación en primeros auxilios veterinarios y sé reaccionar ante cualquier imprevisto.',
    atv: 'Tengo el título de Auxiliar Técnico Veterinario, así que la medicación y los cuidados postoperatorios no me asustan.',
    etologia: 'Me he formado en comportamiento animal: los peludos con miedos o ansiedad están en buenas manos.',
  };
  const CIERRE = 'Te enviaré fotos y novedades cada día para que disfrutes de tus vacaciones sin preocupaciones.';

  const REVIEWS = {
    5: [
      '{nany} cuidó de {pet} como si fuera de su familia. Fotos cada día y vuelta a casa con muchísima energía.',
      '¡Repetiremos seguro! {pet} no quería irse del {eco} 😂',
      'Profesionalidad total: me explicó la rutina, se encargó de la medicación y me mandó vídeos de los paseos.',
      'Recibir el daily care cada mañana me dio una tranquilidad enorme durante el viaje. ¡Gracias, {nany}!',
      'Se nota la experiencia. {pet} tiene muchos miedos y en dos días ya se sentía como en casa.',
      'Casa impecable, mucho cariño y una comunicación perfecta. Un 10.',
    ],
    4: [
      'Muy buena experiencia, {pet} volvió con muy buena cara. Solo echamos de menos alguna foto más.',
      'Atención cuidadosa y puntual. Las respuestas tardaban un poco, pero todo salió genial.',
      'Buen trato y espacio muy limpio. Volveremos a contar con {nany}.',
      'Todo muy bien. {pet} comió y descansó con normalidad, que era lo que más nos preocupaba.',
    ],
    3: [
      '{pet} recibió buena atención, aunque las actualizaciones llegaban tarde.',
      'Cumplió con lo acordado, pero esperaba algo más de implicación en los paseos.',
      'Experiencia aceptable. El precio me pareció algo alto para el servicio recibido.',
      'Bien en general, aunque hubo un malentendido con los horarios de entrega.',
    ],
    2: [
      'Tardaba mucho en responder y solo recibimos dos fotos en toda la semana.',
      '{pet} volvió con bastante estrés. Creo que el espacio no era el adecuado.',
      'No siguió del todo las pautas de alimentación que dejamos por escrito.',
    ],
    1: [
      'No lo recomiendo: cambió la hora de entrega sin avisar y casi no hubo daily care.',
      'Muy mala comunicación. Ignoró las indicaciones de alimentación y medicación.',
      'Nos devolvió a {pet} sin el arnés y no supo explicarnos qué había pasado.',
    ],
  };

  const EXTRAS = {
    perro: ['gato', 'conejo', 'roedor'],
    gato: ['perro', 'conejo', 'ave', 'roedor'],
    conejo: ['roedor', 'gato', 'ave'],
    roedor: ['conejo', 'ave', 'pez'],
    ave: ['roedor', 'pez', 'gato'],
    reptil: ['pez', 'roedor', 'ave'],
    pez: ['reptil', 'ave', 'roedor'],
  };
  const ORDEN_SERV = PN.SERVICIOS.map((s) => s.id);

  function generar() {
    const list = [];
    const usados = new Set();
    for (let i = 1; i <= 100; i++) {
      const r = mulberry32(i * 7919 + 13);
      const pick = (arr) => arr[Math.floor(r() * arr.length)];
      const chance = (p) => r() < p;
      const weighted = (pairs) => {
        let x = r() * pairs.reduce((s, [, w]) => s + w, 0);
        for (const [v, w] of pairs) if ((x -= w) < 0) return v;
        return pairs[0][0];
      };

      let nombre, apellido;
      do {
        nombre = pick(NOMBRES);
        apellido = pick(APELLIDOS);
      } while (usados.has(nombre + apellido));
      usados.add(nombre + apellido);

      const ciudad = weighted([['Madrid', 16], ['Barcelona', 14], ['Valencia', 10], ['Sevilla', 9], ['Málaga', 8], ['Zaragoza', 7], ['Bilbao', 7], ['Palma', 6], ['Alicante', 6], ['Granada', 6], ['Valladolid', 5], ['A Coruña', 6]]);
      let principal = weighted([['perro', 36], ['gato', 24], ['conejo', 10], ['roedor', 8], ['ave', 8], ['reptil', 7], ['pez', 7]]);
      let animales = [principal];
      for (const e of EXTRAS[principal]) if (chance(0.38)) animales.push(e);

      const band = r();
      let rating = band < 0.05 ? 1 + r() : band < 0.13 ? 2 + r() : band < 0.32 ? 3 + r() : 4 + r();
      rating = Math.min(5, Math.round(rating * 10) / 10);

      // PN-001 es la nany de demostración: perros y gatos, muy bien valorada
      if (i === 1) {
        principal = 'perro';
        animales = ['perro', 'gato'];
        rating = 4.9;
      }

      const ecosistema = PN.ESPECIES[principal].eco;
      const ecos = [...new Set(animales.map((a) => PN.ESPECIES[a].eco))];
      const experiencia = Math.max(1, Math.min(20, Math.round(1 + r() * 8 + (rating - 1) * 2.2 * r())));
      const numResenas = 3 + Math.floor(r() * r() * 230);
      const verificado = i === 1 || (rating >= 3 ? chance(0.95) : chance(0.6));

      const servicios = [];
      const addS = (id, p) => { if (chance(p)) servicios.push(id); };
      addS('alojamiento', principal === 'pez' ? 0.35 : 0.75);
      addS('domicilio', principal === 'pez' || principal === 'reptil' ? 0.8 : 0.4);
      addS('visitas', 0.55);
      if (animales.includes('perro')) addS('paseos', 0.88);
      addS('medicacion', 0.45);
      addS('senior', 0.3);
      addS('cachorros', 0.28);
      if (animales.includes('perro')) addS('adiestramiento', 0.25);
      if (animales.some((a) => ['perro', 'gato', 'conejo'].includes(a))) addS('peluqueria', 0.3);
      addS('transporte', 0.3);
      if (i === 1) servicios.push('alojamiento', 'paseos', 'medicacion');
      if (!['alojamiento', 'domicilio', 'visitas'].some((s) => servicios.includes(s))) servicios.push('alojamiento');
      const serviciosOrd = [...new Set(servicios)].sort((a, b) => ORDEN_SERV.indexOf(a) - ORDEN_SERV.indexOf(b));

      const certs = [];
      const addC = (id, p) => { if (chance(p)) certs.push(id); };
      addC('auxilios', 0.55 + (rating - 3) * 0.1);
      addC('atv', 0.18);
      addC('etologia', 0.15);
      if (animales.includes('perro')) addC('adiestrador', 0.22);
      if (animales.includes('gato')) addC('felino', 0.3);
      if (animales.some((a) => ['reptil', 'ave', 'pez'].includes(a))) addC('exoticos', 0.55);
      if (i === 1 && !certs.includes('auxilios')) certs.unshift('auxilios');

      const jardin = serviciosOrd.includes('alojamiento') && chance(animales.includes('perro') ? 0.6 : 0.35);
      const maxMascotas = 1 + Math.floor(r() * 4);
      const RESP = ['< 15 min', '< 30 min', '< 1 h', '< 3 h', '< 12 h', '< 24 h'];
      const respuesta = RESP[Math.max(0, Math.min(5, Math.round((5 - rating) * 1.2 + r() * 2)))];

      const idiomas = ['Español'];
      const regional = { Barcelona: 'Catalán', Palma: 'Catalán', Valencia: 'Valenciano', Alicante: 'Valenciano', Bilbao: 'Euskera', 'A Coruña': 'Gallego' }[ciudad];
      if (regional && chance(0.7)) idiomas.push(regional);
      if (chance(0.55)) idiomas.push('Inglés');
      if (chance(0.15)) idiomas.push('Francés');
      if (chance(0.08)) idiomas.push('Italiano');
      if (chance(0.07)) idiomas.push('Alemán');

      const exotico = ['reptil', 'ave', 'pez'].includes(principal) ? 4 : 0;
      const precioNoche = Math.max(12, Math.min(85, Math.round(14 + rating * 5.5 + experiencia * 0.9 + (verificado ? 3 : 0) + certs.length * 2 + exotico + (r() * 12 - 4))));
      const precioVisita = Math.max(8, Math.min(40, Math.round(precioNoche * 0.45 + r() * 4)));

      const avatar = { bg: pick(BGS), skin: pick(SKINS), hair: Math.floor(r() * 5), hairColor: pick(HAIRS), shirt: pick(SHIRTS), glasses: chance(0.25) };

      const n = {
        id: i,
        codigo: `PN-${String(i).padStart(3, '0')}`,
        nombre, apellido, ciudad, animales, ecosistema, ecos, rating, numResenas, experiencia, verificado,
        servicios: serviciosOrd, certs, jardin, maxMascotas, respuesta, idiomas, precioNoche, precioVisita,
        rango: PN.rangoPrecio(precioNoche),
        busy: 0.12 + r() * 0.5,
        avatar,
        lema: pick(LEMAS[ecosistema]),
      };

      const certTxt = certs.map((c) => CERT_BIO[c]).find(Boolean);
      n.bio = [pick(INTROS)(n), pick(ECO_BIO[ecosistema]), certTxt || '', CIERRE].filter(Boolean).join(' ');

      const nRev = Math.min(numResenas, 3 + Math.floor(r() * 4));
      const resenas = [];
      let dias = 2 + Math.floor(r() * 10);
      for (let k = 0; k < nRev; k++) {
        const estrellas = Math.max(1, Math.min(5, Math.round(rating + (r() - 0.5) * 1.6)));
        const mascota = pick(MASCOTAS);
        const texto = pick(REVIEWS[estrellas])
          .replaceAll('{pet}', mascota)
          .replaceAll('{nany}', nombre)
          .replaceAll('{eco}', PN.ECOSISTEMAS[ecosistema].nombre);
        resenas.push({ autor: `${pick(NOMBRES)} ${pick(APELLIDOS)[0]}.`, mascota, especie: pick(animales), estrellas, texto, diasAtras: dias });
        dias += 5 + Math.floor(r() * 60);
      }
      n.resenas = resenas;
      list.push(n);
    }
    return list;
  }

  PN.NANNIES = generar();
  PN.NANNIES_BY_ID = Object.fromEntries(PN.NANNIES.map((n) => [n.id, n]));
})();
