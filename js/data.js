/* ==========================================================================
   DATOS MAESTROS DEL PLAN — todo hardcodeado, nada que el usuario configure.
   ========================================================================== */

// ---------- CALENDARIO DE TEMPORADA (33 semanas, lunes a domingo) ----------
// template: 'T1' sin partido | 'T2' con partido | 'T4' descanso total | 'T5' eliminatoria/final
const SEASON_CALENDAR = [
  { n: 1,  monday: '2026-09-07',  event: 'Libre',                              template: 'T1' },
  { n: 2,  monday: '2026-09-14',  event: 'Libre',                              template: 'T1' },
  { n: 3,  monday: '2026-09-21',  event: 'Amistoso',                          template: 'T2' },
  { n: 4,  monday: '2026-09-28',  event: 'Libre',                              template: 'T1' },
  { n: 5,  monday: '2026-10-05',  event: 'Amistoso',                          template: 'T2' },
  { n: 6,  monday: '2026-10-12',  event: 'Libre',                              template: 'T1' },
  { n: 7,  monday: '2026-10-19',  event: 'Jornada 1 · 1er equipo',            template: 'T2' },
  { n: 8,  monday: '2026-10-26',  event: 'Jornada 2 · 1er equipo (+B)',       template: 'T2' },
  { n: 9,  monday: '2026-11-02',  event: 'Libre',                              template: 'T1' },
  { n: 10, monday: '2026-11-09',  event: 'Jornada 3 · 1er equipo',            template: 'T2' },
  { n: 11, monday: '2026-11-16',  event: 'Recuperación (+B) — juega con el B', template: 'T2' },
  { n: 12, monday: '2026-11-23',  event: 'Jornada 4 · 1er equipo (+B)',       template: 'T2' },
  { n: 13, monday: '2026-11-30',  event: 'Jornada 5 (+ Recuperación B)',      template: 'T2' },
  { n: 14, monday: '2026-12-07',  event: 'Libre',                              template: 'T1' },
  { n: 15, monday: '2026-12-14',  event: 'Jornada 6 · 1er equipo (+B)',       template: 'T2' },
  { n: 16, monday: '2026-12-21',  event: 'Jornada 7 · 1er equipo (+B)',       template: 'T2' },
  { n: 17, monday: '2026-12-28',  event: 'Libre (Navidad)',                    template: 'T1' },
  { n: 18, monday: '2027-01-04',  event: 'Libre',                              template: 'T1' },
  { n: 19, monday: '2027-01-11',  event: 'Jornada 8 · 1er equipo (+B)',       template: 'T2' },
  { n: 20, monday: '2027-01-18',  event: 'Jornada 9 (+ Recuperación B)',      template: 'T2' },
  { n: 21, monday: '2027-01-25',  event: 'Recuperación (+B) — juega con el B', template: 'T2' },
  { n: 22, monday: '2027-02-01',  event: 'Jornada 10 · 1er equipo (+B)',      template: 'T2' },
  { n: 23, monday: '2027-02-08',  event: 'Jornada 11 (+ Recuperación B)',     template: 'T2' },
  { n: 24, monday: '2027-02-15',  event: 'Recuperación (+B) — juega con el B', template: 'T2' },
  { n: 25, monday: '2027-02-22',  event: 'Jornada 12 · 1er equipo (+B)',      template: 'T2' },
  { n: 26, monday: '2027-03-01',  event: 'Libre',                              template: 'T1' },
  { n: 27, monday: '2027-03-08',  event: 'Jornada 13 · 1er equipo (+B) SM',   template: 'T2' },
  { n: 28, monday: '2027-03-15',  event: 'Jornada 14 · 1er equipo (+B) SM',   template: 'T2' },
  { n: 29, monday: '2027-03-22',  event: 'Recuperación (+ Recup. B) — nadie juega', template: 'T4' },
  { n: 30, monday: '2027-03-29',  event: 'Libre',                              template: 'T1' },
  { n: 31, monday: '2027-04-05',  event: 'Semifinal · 1er equipo (+B)',       template: 'T5' },
  { n: 32, monday: '2027-04-12',  event: 'Final · 1er equipo',                template: 'T5' },
  { n: 33, monday: '2027-04-19',  event: 'Recuperación — fin de temporada',   template: 'T4' },
];

const TEMPLATE_META = {
  T1: { label: 'Desarrollo',        color: '#5B7C99', short: 'Sin partido' },
  T2: { label: 'Semana de partido', color: '#D9A441', short: 'Partido domingo' },
  T4: { label: 'Descanso total',    color: '#4C7A62', short: 'Nadie juega' },
  T5: { label: 'Eliminatoria',      color: '#B4432E', short: 'Final / semifinal' },
};

// ---------- PLANTILLAS DE ENTRENO ----------
// Cada plantilla: array de 7 días (Lunes -> Domingo)
// tipo de bloque: fuerza | cardio | rsa | hiit | core | primera_linea | movilidad | tecnica | neat | partido | descanso

function ex(id, name, sets, detail, tipo, mov) {
  return { id, name, sets, detail, tipo, mov };
}

// Normaliza un nombre de ejercicio a una clave de movimiento por defecto:
// minúsculas, sin acentos, sin texto entre paréntesis (variantes de agarre/material
// no cambian el movimiento de fondo). Así "Press banca (barra o mancuernas)" y
// "Press banca" comparten historial automáticamente sin tener que declararlo a mano.
function slugifyMovement(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Clave de movimiento efectiva de un ejercicio: la declarada a mano (mov) o,
// si no se declaró, la calculada a partir del nombre.
function getMovementKey(exObj) {
  return exObj.mov || slugifyMovement(exObj.name);
}

const T1_DAYS = [
  {
    day: 'Lunes', titulo: 'Tren inferior + core + RSA',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t1-lu-1', 'Sentadilla trasera', '3x5', 'Carga alta, técnica estricta', 'fuerza'),
        ex('t1-lu-2', 'Peso muerto rumano', '3x8', 'Control excéntrico', 'fuerza'),
        ex('t1-lu-3', 'Prensa de piernas', '3x10', '', 'fuerza'),
        ex('t1-lu-4', "Farmer's walk", '4x40 m', 'Pesados', 'fuerza'),
        ex('t1-lu-5', 'Plancha con lastre', '3x40-45 seg', '', 'core'),
      ]},
      { grupo: 'RSA', ejercicios: [
        ex('t1-lu-7', 'Calentamiento suave', '10 min', '', 'rsa'),
        ex('t1-lu-8', 'Sprints repetidos', '10 series', '15 seg sprint al 90% / 45 seg trote muy suave o caminar', 'rsa'),
      ]},
    ],
  },
  {
    day: 'Martes', titulo: 'Tren superior + cardio Zona 2',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t1-ma-1', 'Press banca (barra o mancuernas)', '3x6', '', 'fuerza'),
        ex('t1-ma-2', 'Remo Pendlay estricto', '3x8', '', 'fuerza', 'remo-pendlay'),
        ex('t1-ma-3', 'Press militar de pie', '3x8', '', 'fuerza'),
        ex('t1-ma-4', 'Dominadas (o jalón al pecho)', '3x8-10', '', 'fuerza'),
      ]},
      { grupo: 'Cardio', ejercicios: [
        ex('t1-ma-5', 'Carrera continua Zona 2', '40-50 min', 'Ritmo conversacional, 130-145 lpm', 'cardio', 'carrera-continua-z2'),
      ]},
    ],
  },
  {
    day: 'Miércoles', titulo: 'Movilidad + técnica rugby + primera línea',
    bloques: [
      { grupo: 'Movilidad', ejercicios: [
        ex('t1-mi-1', 'Movilidad dinámica cadera/tobillo/hombro', '15-20 min', '', 'movilidad'),
      ]},
      { grupo: 'Técnica rugby', ejercicios: [
        ex('t1-mi-2', 'Placaje en saco (técnica)', '20 min', '', 'tecnica'),
        ex('t1-mi-3', 'Pases + agilidad en escalera/conos', '20 min', '', 'tecnica'),
      ]},
      { grupo: 'Primera línea', ejercicios: [
        ex('t1-mi-4', 'Empuje/scrum (técnica)', '6-8 series', '5-6 seg empuje máximo', 'primera_linea', 'scrum-empuje'),
        ex('t1-mi-5', 'Isométrico posición de melé', '3x20-30 seg', '', 'primera_linea'),
        ex('t1-lu-9', 'Puente de cuello isométrico', '3x25-30 seg', '', 'primera_linea'),
        ex('t1-lu-10', 'Shrugs con barra trampa', '3x10', '', 'primera_linea'),
        ex('t1-lu-11', 'Pinza de disco (grip)', '3x25-30 seg', 'Por mano', 'primera_linea'),
      ]},
    ],
  },
  {
    day: 'Jueves', titulo: 'Tren inferior potencia + carrera tempo',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t1-ju-1', 'Peso muerto', '4x3-4', '', 'fuerza'),
        ex('t1-ju-2', 'Empuje de trineo pesado', '4x10 m', '', 'fuerza'),
        ex('t1-ju-3', 'Hip thrust pesado', '3x8', '', 'fuerza', 'hip-thrust'),
        ex('t1-ju-4', 'Pallof press', '3x12', 'Por lado', 'core'),
      ]},
      { grupo: 'Carrera tempo (ritmo objetivo 10K)', ejercicios: [
        ex('t1-ju-5', 'Calentamiento', '10 min', '', 'cardio'),
        ex('t1-ju-6', 'Bloques a ritmo objetivo', '3x8 min', 'Ver Progresión 10K · 3 min trote suave entre bloques', 'cardio'),
        ex('t1-ju-7', 'Enfriamiento', '10 min', '', 'cardio'),
      ]},
    ],
  },
  {
    day: 'Viernes', titulo: 'Tren superior potencia + HIIT láctico',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t1-vi-1', 'Press banca explosivo (pausa en pecho)', '4x4', '', 'fuerza'),
        ex('t1-vi-2', 'Lanzamiento de balón medicinal', '4x6', '', 'fuerza'),
        ex('t1-vi-3', 'Remo con mancuerna a una mano', '3x10', '', 'fuerza'),
        ex('t1-vi-4', 'Elevaciones laterales y facepull', '3x12-15', '', 'fuerza'),
      ]},
      { grupo: 'HIIT láctico', ejercicios: [
        ex('t1-vi-5', 'Sled push o bici de asalto', '6 series', '30 seg máxima intensidad / 90 seg descanso', 'hiit'),
      ]},
    ],
  },
  {
    day: 'Sábado', titulo: 'Tirada larga + técnica opcional',
    bloques: [
      { grupo: 'Carrera', ejercicios: [
        ex('t1-sa-1', 'Tirada larga (objetivo 10K)', '1 sesión', 'Ver distancia y ritmo en Progresión 10K', 'cardio'),
      ]},
      { grupo: 'Opcional', ejercicios: [
        ex('t1-sa-2', 'Técnica rugby ligera', '20-30 min', 'Opcional', 'tecnica'),
      ]},
    ],
  },
  {
    day: 'Domingo', titulo: 'Descanso / recuperación absoluta',
    bloques: [
      { grupo: 'Recuperación', ejercicios: [
        ex('t1-do-1', 'Descanso absoluto', '—', '', 'descanso'),
      ]},
      { grupo: 'Opcional', ejercicios: [
        ex('t1-do-3', 'Movilidad suave', '20-25 min', 'Opcional', 'movilidad'),
        ex('t1-do-4', 'Core suave', '2x15', 'Opcional', 'core'),
      ]},
    ],
  },
];

const T2_DAYS = [
  {
    day: 'Lunes', titulo: 'MD+1 · Tren superior + accesorios + cardio recuperación',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t2-lu-1', 'Press banca', '3x8', '', 'fuerza'),
        ex('t2-lu-2', 'Remo con barra o mancuerna', '3x10', '', 'fuerza'),
        ex('t2-lu-3', 'Press militar', '3x8', '', 'fuerza'),
        ex('t2-lu-4', 'Curl femoral o accesorio de pierna', '3x12', 'Carga moderada, no máxima', 'fuerza'),
        ex('t2-lu-5', 'Plancha', '3x40 seg', '', 'core'),
      ]},
      { grupo: 'Cardio recuperación', ejercicios: [
        ex('t2-lu-6', 'Bici o remo muy suave', '15-20 min', 'Zona 1, pulso <120', 'cardio'),
      ]},
    ],
  },
  {
    day: 'Martes', titulo: 'Día fuerte 1 (entreno de equipo esta noche 21-23h)',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t2-ma-1', 'Sentadilla trasera', '3x5', '', 'fuerza'),
        ex('t2-ma-2', 'Peso muerto rumano', '3x6', '', 'fuerza'),
        ex('t2-ma-3', "Farmer's walk", '3x30 m', '', 'fuerza'),
        ex('t2-ma-4', 'Plancha con lastre', '3x30 seg', '', 'core'),
      ]},
    ],
  },
  {
    day: 'Miércoles', titulo: 'Día fuerte 2 + cardio Zona 2 (sin entreno de equipo)',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t2-mi-1', 'Press banca', '3x6', '', 'fuerza'),
        ex('t2-mi-2', 'Remo Pendlay', '3x6', '', 'fuerza', 'remo-pendlay'),
        ex('t2-mi-3', 'Dominadas', '3x8', '', 'fuerza'),
      ]},
      { grupo: 'Cardio Zona 2', ejercicios: [
        ex('t2-mi-4', 'Calentamiento', '10 min', '', 'cardio'),
        ex('t2-mi-5', 'Carrera continua', '25-30 min', 'Ritmo conversacional, 130-145 lpm', 'cardio', 'carrera-continua-z2'),
        ex('t2-mi-6', 'Enfriamiento', '5 min', '', 'cardio'),
      ]},
    ],
  },
  {
    day: 'Jueves', titulo: 'Cardio/resistencia + accesorio (entreno de equipo esta noche)',
    bloques: [
      { grupo: 'Tempo', ejercicios: [
        ex('t2-ju-1', 'Calentamiento', '10 min', '', 'cardio'),
        ex('t2-ju-2', 'Bloques a ritmo moderado-alto', '4x6 min', 'RPE 7/10 · 2 min trote suave entre bloques', 'cardio'),
        ex('t2-ju-3', 'Enfriamiento', '5-10 min', '', 'cardio'),
      ]},
      { grupo: 'Accesorio ligero', ejercicios: [
        ex('t2-ju-4', 'Core', '3x12-15', 'No exige al sistema nervioso', 'core'),
        ex('t2-ju-5', 'Movilidad de cadera/hombro', '10 min', '', 'movilidad'),
      ]},
      { grupo: 'Primera línea', ejercicios: [
        ex('t2-ju-6', 'Pinza de disco (grip)', '3x25-30 seg', 'Por mano', 'primera_linea'),
      ]},
    ],
  },
  {
    day: 'Viernes', titulo: 'Fuerza con carga subida + técnica primera línea',
    bloques: [
      { grupo: 'Fuerza', ejercicios: [
        ex('t2-vi-1', 'Hip thrust', '3x8', '', 'fuerza', 'hip-thrust'),
        ex('t2-vi-2', 'Empuje de trineo pesado', '3x15 m', '', 'fuerza'),
        ex('t2-vi-3', 'Pallof press', '3x12', 'Por lado', 'core'),
      ]},
      { grupo: 'Primera línea', ejercicios: [
        ex('t2-vi-4', 'Trabajo técnico scrum/empuje', '5-6 series', '5-6 seg empuje máximo', 'primera_linea', 'scrum-empuje'),
        ex('t2-vi-5', 'Puente de cuello isométrico', '3x25-30 seg', '', 'primera_linea'),
      ]},
    ],
  },
  {
    day: 'Sábado', titulo: 'Descanso completo antes del partido',
    bloques: [
      { grupo: 'Recuperación', ejercicios: [
        ex('t2-sa-1', 'Sin sesión · descanso total', '—', 'Prioridad: llegar fresco al domingo', 'descanso'),
      ]},
    ],
  },
  {
    day: 'Domingo', titulo: 'PARTIDO',
    bloques: [
      { grupo: 'Partido', ejercicios: [
        ex('t2-do-1', 'Partido (mañana/mediodía)', '—', 'Con 1er equipo o equipo B, según semana', 'partido'),
      ]},
    ],
  },
];

// T4 = estructura de T2 (Lun-Sáb) pero domingo sin partido -> sesión ligera/descanso
const T4_DAYS = T2_DAYS.map((d, i) => {
  if (i === 6) {
    return {
      day: 'Domingo', titulo: 'Sin partido · sesión ligera o descanso',
      bloques: [
        { grupo: 'Recuperación', ejercicios: [
          ex('t4-do-1', 'Descanso o sesión ligera extra', '—', 'Aprovecha la semana para apretar el déficit calórico', 'descanso'),
          ex('t4-do-2', 'Movilidad suave (opcional)', '20-25 min', 'Opcional', 'movilidad'),
        ]},
      ],
    };
  }
  return d;
});

// T5 = estructura de T2 pero jueves recortado (sin HIIT/tempo, solo movilidad y activación ligera)
const T5_DAYS = T2_DAYS.map((d, i) => {
  if (i === 3) {
    return {
      day: 'Jueves', titulo: 'Recorte de carga · movilidad y activación ligera',
      bloques: [
        { grupo: 'Movilidad y activación', ejercicios: [
          ex('t5-ju-1', 'Movilidad general', '15-20 min', 'Suave, sin fatiga', 'movilidad'),
          ex('t5-ju-2', 'Activación ligera', '10-15 min', 'Skipping suave, técnica de carrera, sin intensidad', 'movilidad'),
        ]},
        { grupo: 'Primera línea', ejercicios: [
          ex('t5-ju-3', 'Pinza de disco (grip)', '3x20 seg', 'Por mano · carga baja', 'primera_linea'),
        ]},
      ],
    };
  }
  return d;
});

const TEMPLATES = { T1: T1_DAYS, T2: T2_DAYS, T4: T4_DAYS, T5: T5_DAYS };

// ---------- PROGRESIÓN DE CARRERA HACIA 10K < 1H ----------
// Avanza únicamente en semanas T1 (bloque de desarrollo)
const RUN_PROGRESSION = [
  { semana: 1, tirada: '6 km, ritmo cómodo sin cronómetro',              tempo: '3x6 min' },
  { semana: 2, tirada: '7 km, cómodo',                                    tempo: '3x7 min' },
  { semana: 3, tirada: '8 km, cómodo, empieza a notar ritmo',             tempo: '3x8 min' },
  { semana: 4, tirada: '8 km, ~6:45 min/km (descarga si hay fatiga)',     tempo: '3x8 min a 6:15 min/km' },
  { semana: 5, tirada: '9 km, ~6:30 min/km',                              tempo: '4x8 min a 6:10 min/km' },
  { semana: 6, tirada: '9 km, ~6:20 min/km',                              tempo: '4x8 min a 6:05 min/km' },
  { semana: 7, tirada: '10 km, ~6:10 min/km (primera vez completando 10K)', tempo: '4x8 min a 6:00 min/km' },
  { semana: 8, tirada: '10 km, ~6:00 min/km objetivo (test cronometrado)', tempo: '4x8 min a 5:50 min/km' },
  { semana: 9, tirada: '10 km, mantener bajo 6:00 min/km',                tempo: 'Mantener, consolidar' },
];

// ---------- MENSAJES DE MOTIVACIÓN (rotan a diario, alternando categoría) ----------
const MOTIVATION_COMIDA = [
  'Hoy pesas 140. El objetivo son 112,5. Eso no lo arregla una sesión de gimnasio, lo arregla lo que decidas comer en las próximas horas.',
  'Nadie va a controlar tu comida por ti. Esa es literalmente la única parte del plan que depende solo de ti.',
  'Un entrenamiento perfecto no compensa un día de comer sin cabeza. Las dos cosas van juntas o no funciona ninguna.',
  'Aguantar 80 minutos de partido se entrena en el gimnasio, pero se paga en la cocina. No hay atajos.',
  'No necesitas motivación para comer bien, necesitas decidirlo antes de tener hambre. Decídelo ahora.',
  'Sabes exactamente cuál es tu punto débil. Hoy es un día más para demostrarte que lo estás trabajando.',
  'El peso no baja por desearlo, baja por lo que hay en el plato. Hoy también cuenta.',
  'Si hoy fallas con la comida, mañana no empieza de cero: empieza más abajo. Corta la racha antes de que empiece.',
];

const MOTIVATION_RUGBY = [
  'Eres primera línea. Tu trabajo no es lucir bien, es no ceder ni un centímetro en el minuto 78. Para eso entrenas hoy.',
  'El paquete no aguanta por talento, aguanta por constancia. Cada sesión que no te saltas es un empuje que ganas en marzo.',
  'Bajar de 140 a 112,5 no es para verte mejor, es para llegar entero al segundo tiempo. No lo olvides en la sesión de hoy.',
  'Nadie ve el trabajo de las 6 de la mañana. Se nota el domingo, cuando el otro pilar ya no puede empujar y tú sí.',
  'La resistencia de un delantero se construye en semanas aburridas como esta, no en el partido.',
  'Confío en que puedes aguantar un partido entero. Hoy toca ganarte otro poco de ese partido.',
  'No entrenas para ser más rápido que un tres cuartos. Entrenas para seguir siendo tú mismo en el minuto 70.',
  'El pack te necesita entero los 80 minutos, no los primeros 50. Hoy también se entrena eso.',
];

// ---------- TIP DEL DÍA (rota, sin repetir consecutivos) ----------
const TIPS = [
  { cat: 'Nutrición', texto: 'Empieza el plato por la proteína: si la cubres primero, es más difícil pasarte con lo demás.' },
  { cat: 'Primera línea', texto: 'En el empuje de scrum, la fuerza sale de la cadera y las piernas, no de arquear la espalda.' },
  { cat: 'Recuperación', texto: 'Dormir menos de 7h reduce la síntesis de proteína muscular casi tanto como saltarte una comida.' },
  { cat: 'Carrera', texto: 'En la tirada larga, si no puedes hablar en frases cortas, vas demasiado rápido para zona 2.' },
  { cat: 'Nutrición', texto: 'El hambre real tarda en aparecer; el antojo aparece de golpe. Aprende a distinguirlos antes de comer.' },
  { cat: 'Primera línea', texto: 'Un cuello fuerte protege en el placaje y en el scrum. No te saltes el trabajo isométrico aunque parezca poca cosa.' },
  { cat: 'Recuperación', texto: 'Un día de cardio muy suave (Zona 1) después del partido baja más la fatiga que quedarte parado en el sofá.' },
  { cat: 'Carrera', texto: 'El ritmo objetivo se entrena, no se fuerza. Si un bloque de tempo se te hace muy duro, baja el ritmo y manténlo constante.' },
  { cat: 'Nutrición', texto: 'Los días de doble sesión (gimnasio + equipo) no es el día para recortar hidratos: es el día que más los necesitas.' },
  { cat: 'Primera línea', texto: 'El grip de manos aguanta agarres en la melé y en el ruck. Los 3x25-30 seg de pinza no son relleno.' },
  { cat: 'Recuperación', texto: 'El dolor articular no se "aguanta": si aparece, repite la semana de progresión en vez de avanzar.' },
  { cat: 'Carrera', texto: '10.000 pasos fuera del gimnasio ayudan a recuperar más que quedarte quieto, sin añadir fatiga real.' },
  { cat: 'Nutrición', texto: 'Antes de un entreno a las 6-7 de la mañana, algo pequeño con proteína o hidratos rápidos rinde más que ir en ayunas total.' },
  { cat: 'Primera línea', texto: 'La posición de melé se entrena isométrica porque así se aguanta en el partido: sostenida, no explosiva.' },
];

// ---------- Grupos musculares (para la puntuación de musculatura en Seguimiento) ----------
const MUSCLE_GROUPS = [
  { key: 'cuello', label: 'Cuello' },
  { key: 'hombros', label: 'Hombros' },
  { key: 'pecho', label: 'Pecho' },
  { key: 'brazos', label: 'Brazos' },
  { key: 'core', label: 'Core / abdomen' },
  { key: 'piernas', label: 'Piernas (cuádriceps)' },
  { key: 'gemelos', label: 'Gemelos' },
];

// ---------- Tipos de registro de ejercicio (qué campos se piden según el tipo) ----------
const LOG_TYPE_SPECS = {
  peso_reps: {
    fields: [
      { key: 'peso', label: 'KG', step: 0.5 },
      { key: 'reps', label: 'REPS', step: 1 },
    ],
    metric: 'peso', metricLabel: 'Peso (kg)', metricAgg: 'max',
  },
  distancia_duracion: {
    fields: [
      { key: 'duracion', label: 'MIN', step: 1 },
      { key: 'distancia', label: 'KM', step: 0.1 },
    ],
    metric: 'duracion', metricLabel: 'Duración total (min)', metricAgg: 'sum',
  },
  duracion: {
    fields: [{ key: 'duracion', label: null, step: 5 }], // label se resuelve en runtime (SEG/MIN)
    metric: 'duracion', metricLabel: 'Mejor serie', metricAgg: 'max',
  },
  reps: {
    fields: [{ key: 'reps', label: 'REPS', step: 1 }],
    metric: 'reps', metricLabel: 'Mejor serie (reps)', metricAgg: 'max',
  },
  pasos: {
    fields: [{ key: 'pasos', label: 'PASOS', step: 100 }],
    metric: 'pasos', metricLabel: 'Pasos', metricAgg: 'sum',
  },
};

// Determina cuántas series (filas) tiene un ejercicio a partir de su texto de "sets"
// ("3x5" -> 3, "6-8 series" -> 6, "4 rondas" -> 4). Si no hay un patrón de series
// (p.ej. una carrera continua de "40-50 min"), se trata como una sola entrada.
function parseSetCount(setsStr) {
  if (!setsStr) return 1;
  const s = setsStr.trim();
  if (s === '—') return 0;
  let m = s.match(/^(\d+)\s*[x×]/i);
  if (m) return parseInt(m[1], 10);
  m = s.match(/^(\d+)(?:-\d+)?\s*(series|rondas)/i);
  if (m) return parseInt(m[1], 10);
  return 1;
}

// Unidad de duración a mostrar en el registro (segundos o minutos), inferida del texto
function inferDurationUnit(exObj) {
  const text = ((exObj.sets || '') + ' ' + (exObj.detail || '')).toLowerCase();
  if (text.includes('seg')) return 'seg';
  return 'min';
}
// Determina qué tipo de registro corresponde a cada ejercicio según su tipo/nombre
function getLogSpecKey(exObj) {
  const name = exObj.name.toLowerCase();
  if (exObj.tipo === 'fuerza') return 'peso_reps';
  if (exObj.tipo === 'cardio') return 'distancia_duracion';
  if (exObj.tipo === 'rsa' || exObj.tipo === 'hiit') return 'duracion';
  if (exObj.tipo === 'primera_linea') {
    if (name.includes('shrug')) return 'peso_reps';
    return 'duracion';
  }
  if (exObj.tipo === 'core') {
    if (name.includes('plancha')) return 'duracion';
    return 'reps';
  }
  if (exObj.tipo === 'movilidad' || exObj.tipo === 'tecnica') return 'duracion';
  if (exObj.tipo === 'neat') return 'pasos';
  return null; // partido, descanso: sin registro
}

const NUTRITION_DEFAULTS = {
  peso: 140,
  altura: 195,
  edad: 18,
  mlg: 89.3,
  pesoObjetivo: 112.5,
  factorActividad: 1.65,
  porcentajeDeficit: 0.19,
  kcalMax: 2200,
};
