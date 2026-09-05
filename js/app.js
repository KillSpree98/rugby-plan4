/* ==========================================================================
   LÓGICA DE LA APP
   ========================================================================== */

const LS_KEYS = {
  checks: 'rp_checks_v1',
  nutrition: 'rp_nutrition_v1',
  runProgress: 'rp_run_progress_v1',
  tracking: 'rp_tracking_v1',
  exerciseLogs: 'rp_exercise_logs_v3',
};

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ICONS = {
  fuerza: '🏋️', cardio: '🏃', rsa: '⚡', hiit: '🔥', core: '🧱',
  primera_linea: '🛡️', movilidad: '🤸', tecnica: '🎯', neat: '👣',
  partido: '🏉', descanso: '💤',
};

// ---------------- utilidades de fecha ----------------
function todayISO() {
  const d = new Date();
  return isoFromDate(d);
}
function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoFromDate(d);
}
function dateObj(iso) { return new Date(iso + 'T00:00:00'); }
function fmtDateHuman(iso) {
  const d = dateObj(iso);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
function fmtDateShort(iso) {
  const d = dateObj(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function dayOfYear(iso) {
  const d = dateObj(iso);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / 86400000);
}

// Devuelve la semana de temporada (objeto de SEASON_CALENDAR) que contiene la fecha dada, o null
function findWeekForDate(iso) {
  for (const w of SEASON_CALENDAR) {
    const start = w.monday;
    const end = addDays(w.monday, 6);
    if (iso >= start && iso <= end) return w;
  }
  return null;
}

// índice de día 0=Lunes .. 6=Domingo dentro de la semana
function weekdayIndexMonFirst(iso) {
  const jsDay = dateObj(iso).getDay(); // 0=domingo..6=sabado
  return (jsDay + 6) % 7;
}

// La app es funcional TODOS los días del año, incluida pretemporada y postemporada.
// Cualquier fecha que no caiga dentro del calendario de 33 semanas se trata siempre
// como una semana T1 (bloque de desarrollo), tal como pide el plan.
function getEffectiveWeek(iso) {
  const week = findWeekForDate(iso);
  if (week) return week;
  const seasonStart = SEASON_CALENDAR[0].monday;
  const monday = addDays(iso, -weekdayIndexMonFirst(iso));
  const label = iso < seasonStart ? 'Pretemporada' : 'Postemporada';
  return { n: null, monday, event: label, template: 'T1', virtual: true };
}

// ---------------- estado app ----------------
const state = {
  tab: 'hoy',
  selectedDate: todayISO(),
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ---------------- checks de ejercicios ----------------
function getChecksForDate(iso) {
  const all = loadJSON(LS_KEYS.checks, {});
  return all[iso] || {};
}
function toggleCheck(iso, exId) {
  const all = loadJSON(LS_KEYS.checks, {});
  if (!all[iso]) all[iso] = {};
  all[iso][exId] = !all[iso][exId];
  saveJSON(LS_KEYS.checks, all);
}

// ---------------- histórico de ejercicios (tipo Hevy: series individuales) ----------------
// Estructura: exerciseLogs[movKey][fecha] = { sets: [ {peso,reps,done}, {..}, ... ] }
function getExerciseLogs(movKey) {
  const all = loadJSON(LS_KEYS.exerciseLogs, {});
  return all[movKey] || {};
}
function getExerciseLogEntry(movKey, iso) {
  return getExerciseLogs(movKey)[iso] || null;
}
function getExerciseSets(movKey, iso) {
  const entry = getExerciseLogEntry(movKey, iso);
  return (entry && entry.sets) || [];
}
// guarda un campo de una serie concreta (por índice)
function saveExerciseSetField(movKey, iso, setIndex, fieldKey, value) {
  const all = loadJSON(LS_KEYS.exerciseLogs, {});
  if (!all[movKey]) all[movKey] = {};
  if (!all[movKey][iso]) all[movKey][iso] = { sets: [] };
  const sets = all[movKey][iso].sets;
  while (sets.length <= setIndex) sets.push({});
  sets[setIndex] = { ...sets[setIndex], [fieldKey]: value };
  saveJSON(LS_KEYS.exerciseLogs, all);
}
// marca/desmarca una serie como completada; si no tiene valores, los rellena con la referencia anterior
function toggleExerciseSetDone(movKey, iso, setIndex, fallbackValues) {
  const all = loadJSON(LS_KEYS.exerciseLogs, {});
  if (!all[movKey]) all[movKey] = {};
  if (!all[movKey][iso]) all[movKey][iso] = { sets: [] };
  const sets = all[movKey][iso].sets;
  while (sets.length <= setIndex) sets.push({});
  const current = sets[setIndex];
  const nowDone = !current.done;
  let next = { ...current, done: nowDone };
  if (nowDone && fallbackValues) {
    Object.entries(fallbackValues).forEach(([k, v]) => {
      if (next[k] === undefined || next[k] === '') next[k] = v;
    });
  }
  sets[setIndex] = next;
  saveJSON(LS_KEYS.exerciseLogs, all);
}
// añade una serie extra vacía al final (botón "+ Añadir serie")
function addExerciseSet(movKey, iso) {
  const all = loadJSON(LS_KEYS.exerciseLogs, {});
  if (!all[movKey]) all[movKey] = {};
  if (!all[movKey][iso]) all[movKey][iso] = { sets: [] };
  all[movKey][iso].sets.push({});
  saveJSON(LS_KEYS.exerciseLogs, all);
}
// series de la sesión anterior (fecha < iso), para la columna "ANTERIOR"
function previousExerciseSets(movKey, iso) {
  const logs = getExerciseLogs(movKey);
  const dates = Object.keys(logs).filter(d => d < iso).sort();
  if (dates.length === 0) return [];
  return logs[dates[dates.length - 1]].sets || [];
}
// valor agregado (max o sum) de un campo entre las series de una fecha
function aggregateSetField(sets, fieldKey, agg) {
  const vals = (sets || []).map(s => parseFloat(s[fieldKey])).filter(v => !isNaN(v));
  if (vals.length === 0) return null;
  return agg === 'sum' ? vals.reduce((a, b) => a + b, 0) : Math.max(...vals);
}
// serie histórica (una fecha -> un valor agregado) para la gráfica de progreso
function exerciseHistorySeries(movKey, fieldKey, agg) {
  const logs = getExerciseLogs(movKey);
  return Object.keys(logs).sort()
    .map(d => ({ date: d, value: aggregateSetField(logs[d].sets, fieldKey, agg) }))
    .filter(p => p.value !== null);
}
// mejor marca histórica de un campo (para la insignia de PR), en fechas anteriores a iso
function historicalBestBefore(movKey, iso, fieldKey) {
  const logs = getExerciseLogs(movKey);
  const dates = Object.keys(logs).filter(d => d < iso).sort();
  let best = null;
  dates.forEach(d => {
    (logs[d].sets || []).forEach(s => {
      const v = parseFloat(s[fieldKey]);
      if (!isNaN(v) && (best === null || v > best)) best = v;
    });
  });
  return best;
}

// ---------------- nutrición ----------------
function getNutritionParams() {
  const stored = loadJSON(LS_KEYS.nutrition, null);
  return { ...NUTRITION_DEFAULTS, ...(stored || {}) };
}
function saveNutritionParams(p) { saveJSON(LS_KEYS.nutrition, p); }

// T5 (eliminatoria/final) sube a mantenimiento toda la semana.
// T1, T2 y T4 mantienen el déficit configurado.
function weekIsMaintenance(template) {
  return template === 'T5';
}

function computeNutrition(params, template) {
  const { peso, altura, edad, mlg, pesoObjetivo, factorActividad, porcentajeDeficit, kcalMax } = params;
  const bmr = 10 * peso + 6.25 * altura - 5 * edad + 5;
  const tdee = bmr * factorActividad;
  const maintenance = weekIsMaintenance(template);
  const deficitAplicado = maintenance ? 0 : porcentajeDeficit;
  const kcalCalculado = tdee * (1 - deficitAplicado);
  const tope = kcalMax || NUTRITION_DEFAULTS.kcalMax;
  const capApplied = kcalCalculado > tope;
  const kcalObjetivo = Math.min(kcalCalculado, tope);
  const proteina = mlg * 2.35;
  const grasas = peso * 0.68;
  const carbohidratos = Math.max(0, (kcalObjetivo - proteina * 4 - grasas * 9) / 4);
  const kgAPerder = peso - pesoObjetivo;
  const semanasEstimadas = kgAPerder > 0 ? kgAPerder / 0.9 : 0;
  return { bmr, tdee, kcalObjetivo, kcalCalculado, capApplied, tope, proteina, grasas, carbohidratos, kgAPerder, semanasEstimadas, maintenance, deficitAplicado };
}

// ---------------- progresión 10K ----------------
function getRunProgress() {
  return loadJSON(LS_KEYS.runProgress, { semana: 1 });
}
function setRunProgress(v) { saveJSON(LS_KEYS.runProgress, v); }

// ---------------- seguimiento semanal ----------------
function getTracking() {
  return loadJSON(LS_KEYS.tracking, {}); // keyed by monday ISO of the week
}
function saveTrackingEntry(mondayIso, entry) {
  const all = getTracking();
  all[mondayIso] = { ...(all[mondayIso] || {}), ...entry };
  saveJSON(LS_KEYS.tracking, all);
}

// ---------------- render helpers ----------------
const $app = document.getElementById('app');

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

function renderExercise(iso, exObj) {
  const specKey = getLogSpecKey(exObj);
  if (!specKey) return renderSimpleCheckRow(iso, exObj);
  return renderExerciseCard(iso, exObj, specKey);
}

// fila simple con checkbox, para lo que no tiene registro posible (partido, descanso)
function renderSimpleCheckRow(iso, exObj) {
  const checks = getChecksForDate(iso);
  const done = !!checks[exObj.id];
  const row = h('div', { class: 'ex-row' + (done ? ' ex-done' : '') });
  const box = h('button', {
    class: 'ex-check',
    'aria-label': 'Marcar completado',
    onclick: () => { toggleCheck(iso, exObj.id); render(); },
  }, done ? '✓' : '');
  const info = h('div', { class: 'ex-info' }, [
    h('div', { class: 'ex-name' }, `${ICONS[exObj.tipo] || ''} ${exObj.name}`),
    h('div', { class: 'ex-detail' }, [
      h('span', { class: 'ex-sets' }, exObj.sets),
      exObj.detail ? h('span', { class: 'ex-notes' }, ' · ' + exObj.detail) : null,
    ]),
  ]);
  row.appendChild(box);
  row.appendChild(info);
  return row;
}

function formatSetValue(fieldKey, val, unit) {
  if (val === undefined || val === null || val === '') return '—';
  const suffix = fieldKey === 'peso' ? 'kg' : fieldKey === 'reps' ? ' reps'
    : fieldKey === 'distancia' ? 'km' : fieldKey === 'duracion' ? unit
    : fieldKey === 'pasos' ? ' pasos' : '';
  return `${val}${suffix}`;
}

// tarjeta de ejercicio con tabla de series individuales (siempre visible, sin desplegable)
function renderExerciseCard(iso, exObj, specKey) {
  const spec = LOG_TYPE_SPECS[specKey];
  const movKey = getMovementKey(exObj);
  const unit = specKey === 'duracion' ? inferDurationUnit(exObj) : null;
  const fields = spec.fields.map(f => f.label ? f : { ...f, label: unit.toUpperCase() });

  const prescribed = Math.max(1, parseSetCount(exObj.sets));
  const todaySets = getExerciseSets(movKey, iso);
  const prevSets = previousExerciseSets(movKey, iso);
  const rowCount = Math.max(prescribed, todaySets.length);

  const bestBefore = historicalBestBefore(movKey, iso, spec.metric);
  const todayBest = aggregateSetField(todaySets, spec.metric, 'max');
  const isPR = bestBefore !== null && todayBest !== null && todayBest >= bestBefore;

  const card = h('div', { class: 'exercise-card' + (isPR ? ' exercise-is-pr' : '') });

  const head = h('div', { class: 'exercise-card-head' }, [
    h('div', { class: 'exercise-card-title' }, `${ICONS[exObj.tipo] || ''} ${exObj.name}`),
    h('div', { class: 'exercise-card-sub' }, [
      h('span', {}, exObj.sets),
      exObj.detail ? h('span', {}, ' · ' + exObj.detail) : null,
    ]),
  ]);
  if (isPR) head.appendChild(h('div', { class: 'pr-badge' }, '🏆 Nuevo PR'));
  else if (bestBefore !== null) head.appendChild(h('div', { class: 'best-mark' }, `Mejor marca: ${formatSetValue(spec.metric, bestBefore, unit)}`));
  card.appendChild(head);

  const gridHeadCells = [h('span', { class: 'set-col-serie' }, 'SERIE'), h('span', { class: 'set-col-anterior' }, 'ANTERIOR')];
  fields.forEach(f => gridHeadCells.push(h('span', { class: 'set-col-field' }, f.label)));
  gridHeadCells.push(h('span', { class: 'set-col-check' }, '✓'));
  card.appendChild(h('div', { class: `set-grid-head set-cols-${fields.length}` }, gridHeadCells));

  for (let i = 0; i < rowCount; i++) {
    const todaySet = todaySets[i] || {};
    const prevSet = prevSets[i] || null;
    const prevText = prevSet ? fields.map(f => formatSetValue(f.key, prevSet[f.key], unit)).join(' · ') : '—';
    const rowDone = !!todaySet.done;

    const rowCells = [
      h('span', { class: 'set-badge' }, String(i + 1)),
      h('span', { class: 'set-anterior' }, prevText),
    ];
    fields.forEach(f => {
      rowCells.push(h('input', {
        class: 'set-input', type: 'number', step: f.step,
        value: todaySet[f.key] ?? '',
        placeholder: prevSet && prevSet[f.key] !== undefined ? String(prevSet[f.key]) : '',
        onchange: (e) => { saveExerciseSetField(movKey, iso, i, f.key, e.target.value); render(); },
      }));
    });
    const fallbackValues = {};
    if (prevSet) fields.forEach(f => { if (prevSet[f.key] !== undefined) fallbackValues[f.key] = prevSet[f.key]; });
    rowCells.push(h('button', {
      class: 'set-check' + (rowDone ? ' set-check-done' : ''),
      'aria-label': 'Marcar serie completada',
      onclick: () => { toggleExerciseSetDone(movKey, iso, i, fallbackValues); render(); },
    }, rowDone ? '✓' : ''));

    card.appendChild(h('div', { class: `set-grid-row set-cols-${fields.length}` + (rowDone ? ' set-row-done' : '') }, rowCells));
  }

  card.appendChild(h('button', {
    class: 'add-set-btn',
    onclick: () => { addExerciseSet(movKey, iso); render(); },
  }, '＋ Añadir serie'));

  const series = exerciseHistorySeries(movKey, spec.metric, spec.metricAgg).map(p => p.value);
  card.appendChild(h('div', { class: 'log-chart-label' }, `Progreso · ${spec.metricLabel}`));
  card.appendChild(renderLineChart(series, { width: 300, height: 90 }));

  return card;
}

function renderDayCard(iso, dayData, opts = {}) {
  const card = h('div', { class: 'day-card' });
  card.appendChild(h('div', { class: 'day-card-head' }, [
    h('div', { class: 'day-card-title' }, dayData.titulo),
  ]));
  dayData.bloques.forEach(b => {
    card.appendChild(h('div', { class: 'block-label' }, b.grupo));
    const list = h('div', { class: 'ex-list' });
    b.ejercicios.forEach(e => list.appendChild(renderExercise(iso, e)));
    card.appendChild(list);
  });
  return card;
}

// navegador de fecha: permite ver/registrar cualquier día, no solo el de hoy
function dateNav(iso) {
  const isToday = iso === todayISO();
  const nav = h('div', { class: 'date-nav' });
  nav.appendChild(h('button', {
    class: 'date-nav-btn', 'aria-label': 'Día anterior',
    onclick: () => { state.selectedDate = addDays(state.selectedDate, -1); render(); },
  }, '◀'));
  const labelBits = [h('div', { class: 'date-nav-day' }, fmtDateHuman(iso))];
  if (!isToday) {
    labelBits.push(h('button', {
      class: 'date-nav-today',
      onclick: () => { state.selectedDate = todayISO(); render(); },
    }, 'Volver a hoy'));
  }
  nav.appendChild(h('div', { class: 'date-nav-label' }, labelBits));
  nav.appendChild(h('button', {
    class: 'date-nav-btn', 'aria-label': 'Día siguiente',
    onclick: () => { state.selectedDate = addDays(state.selectedDate, 1); render(); },
  }, '▶'));
  return nav;
}

function daysBetween(isoA, isoB) {
  return Math.round((dateObj(isoB) - dateObj(isoA)) / 86400000);
}

// ---------------- TAB: HOY ----------------
function tabHoy() {
  const iso = state.selectedDate;
  const week = getEffectiveWeek(iso);
  const wrap = h('div', { class: 'screen' });
  wrap.appendChild(dateNav(iso));

  const dIdx = weekdayIndexMonFirst(iso);
  const template = week.template;
  const dayData = TEMPLATES[template][dIdx];
  const meta = TEMPLATE_META[template];

  // banner motivación
  const doy = dayOfYear(iso);
  const useComida = doy % 2 === 0;
  const msgList = useComida ? MOTIVATION_COMIDA : MOTIVATION_RUGBY;
  const msg = msgList[doy % msgList.length];
  wrap.appendChild(h('div', { class: 'banner' }, [
    h('div', { class: 'banner-tag' }, useComida ? 'DISCIPLINA' : 'PACK'),
    h('div', { class: 'banner-text' }, msg),
  ]));

  // tip del día
  const tip = TIPS[doy % TIPS.length];
  wrap.appendChild(h('div', { class: 'tip' }, [
    h('span', { class: 'tip-cat' }, tip.cat),
    h('span', { class: 'tip-text' }, tip.texto),
  ]));

  // cabecera semana
  wrap.appendChild(h('div', { class: 'week-header' }, [
    h('span', { class: 'week-pill', style: `background:${meta.color}` }, `${template} · ${meta.label}`),
    h('span', { class: 'week-date' }, fmtDateHuman(iso)),
  ]));
  wrap.appendChild(h('div', { class: 'week-event' }, week.n ? `Semana ${week.n}: ${week.event}` : `${week.event} · fuera del calendario oficial, tratada como T1`));

  // cuenta atrás al próximo partido (solo semanas con partido: T2/T5)
  if (template === 'T2' || template === 'T5') {
    const matchDate = addDays(week.monday, 6);
    const diff = daysBetween(iso, matchDate);
    let matchTxt;
    if (diff === 0) matchTxt = '🏉 ¡Hoy juegas!';
    else if (diff > 0) matchTxt = `🏉 Partido en ${diff} día${diff === 1 ? '' : 's'} · domingo`;
    else matchTxt = '🏉 Partido ya jugado esta semana';
    wrap.appendChild(h('div', { class: 'match-countdown' }, matchTxt));
  }

  wrap.appendChild(renderDayCard(iso, dayData));

  return wrap;
}

// ---------------- TAB: SEMANA ----------------
function tabSemana() {
  const iso = state.selectedDate;
  const week = getEffectiveWeek(iso);
  const wrap = h('div', { class: 'screen' });
  const meta = TEMPLATE_META[week.template];
  wrap.appendChild(h('div', { class: 'week-header' }, [
    h('span', { class: 'week-pill', style: `background:${meta.color}` }, `${week.template} · ${meta.label}`),
  ]));
  wrap.appendChild(h('div', { class: 'week-event' }, week.n ? `Semana ${week.n}: ${week.event}` : `${week.event} · fuera del calendario oficial, tratada como T1`));

  const todayIdx = weekdayIndexMonFirst(iso);
  TEMPLATES[week.template].forEach((d, i) => {
    const dIso = addDays(week.monday, i);
    const isToday = i === todayIdx;
    const item = h('details', { class: 'week-day-item' + (isToday ? ' is-today' : '') });
    const summary = h('summary', {}, [
      h('span', { class: 'wd-name' }, d.day + (isToday ? ' · viendo' : '')),
      h('span', { class: 'wd-title' }, d.titulo),
    ]);
    item.appendChild(summary);
    item.appendChild(renderDayCard(dIso, d));
    if (isToday) item.setAttribute('open', 'open');
    wrap.appendChild(item);
  });
  return wrap;
}

// ---------------- TAB: CALENDARIO ----------------
function tabCalendario() {
  const iso = todayISO(); // el calendario de temporada siempre se referencia al día real, no al día que se esté consultando en Hoy
  const wrap = h('div', { class: 'screen' });
  wrap.appendChild(h('div', { class: 'legend' },
    Object.entries(TEMPLATE_META).map(([k, m]) =>
      h('span', { class: 'legend-item' }, [
        h('span', { class: 'legend-dot', style: `background:${m.color}` }),
        `${k} ${m.short}`,
      ])
    )
  ));
  const list = h('div', { class: 'cal-list' });
  SEASON_CALENDAR.forEach(w => {
    const start = w.monday;
    const end = addDays(w.monday, 6);
    const isCurrent = iso >= start && iso <= end;
    const meta = TEMPLATE_META[w.template];
    const row = h('div', { class: 'cal-row' + (isCurrent ? ' cal-current' : '') }, [
      h('span', { class: 'cal-dot', style: `background:${meta.color}` }),
      h('div', { class: 'cal-info' }, [
        h('div', { class: 'cal-week-n' }, `Semana ${w.n} · ${fmtDateShort(start)}`),
        h('div', { class: 'cal-event' }, w.event),
      ]),
      h('span', { class: 'cal-tag', style: `border-color:${meta.color};color:${meta.color}` }, w.template),
    ]);
    list.appendChild(row);
  });
  wrap.appendChild(list);
  return wrap;
}

// ---------------- TAB: NUTRICIÓN ----------------
function tabNutricion() {
  const iso = state.selectedDate;
  const week = getEffectiveWeek(iso);
  const template = week.template;
  const params = getNutritionParams();
  const wrap = h('div', { class: 'screen' });

  const res = computeNutrition(params, template);

  wrap.appendChild(h('div', { class: 'nutri-status', style: `border-color:${res.maintenance ? '#B4432E' : '#4C7A62'}` }, [
    h('div', { class: 'nutri-status-title' }, res.maintenance ? 'Semana de mantenimiento' : 'Semana de déficit'),
    h('div', { class: 'nutri-status-sub' }, res.maintenance
      ? `Semana ${template} (eliminatoria/final): calorías subidas a mantenimiento, sin déficit.`
      : `Semana ${template}: déficit del ${Math.round(res.deficitAplicado * 100)}% aplicado.`),
  ]));

  if (res.capApplied) {
    wrap.appendChild(h('div', { class: 'nutri-status', style: 'border-color:#D9A441' }, [
      h('div', { class: 'nutri-status-title' }, `Tope de ${Math.round(res.tope)} kcal aplicado`),
      h('div', { class: 'nutri-status-sub' }, `El cálculo daba ${Math.round(res.kcalCalculado)} kcal, pero nunca se superan las ${Math.round(res.tope)} kcal/día.`),
    ]));
  }

  const macroGrid = h('div', { class: 'macro-grid' }, [
    macroBox('Kcal objetivo', Math.round(res.kcalObjetivo), ''),
    macroBox('Proteína', Math.round(res.proteina), 'g'),
    macroBox('Grasas', Math.round(res.grasas), 'g'),
    macroBox('Carbohidratos', Math.round(res.carbohidratos), 'g'),
  ]);
  wrap.appendChild(macroGrid);

  wrap.appendChild(h('div', { class: 'card' }, [
    h('div', { class: 'card-title' }, 'Progreso hacia el objetivo'),
    h('div', { class: 'kv' }, [h('span', {}, 'BMR'), h('span', {}, `${Math.round(res.bmr)} kcal`)]),
    h('div', { class: 'kv' }, [h('span', {}, 'TDEE'), h('span', {}, `${Math.round(res.tdee)} kcal`)]),
    h('div', { class: 'kv' }, [h('span', {}, 'Kg por perder'), h('span', {}, `${res.kgAPerder.toFixed(1)} kg`)]),
    h('div', { class: 'kv' }, [h('span', {}, 'Semanas estimadas'), h('span', {}, `${res.semanasEstimadas.toFixed(0)} sem (ritmo 0,7-1,2 kg/sem)`)]),
  ]));

  // formulario editable
  const form = h('div', { class: 'card' }, [
    h('div', { class: 'card-title' }, 'Datos (editables)'),
  ]);
  const fields = [
    ['peso', 'Peso actual (kg)', 0.1],
    ['altura', 'Altura (cm)', 1],
    ['edad', 'Edad (años)', 1],
    ['mlg', 'Masa libre de grasa (kg)', 0.1],
    ['pesoObjetivo', 'Peso objetivo (kg)', 0.1],
    ['factorActividad', 'Factor de actividad', 0.01],
    ['porcentajeDeficit', '% Déficit (semanas normales)', 0.01],
    ['kcalMax', 'Tope máximo de kcal/día', 10],
  ];
  fields.forEach(([key, label, step]) => {
    const row = h('div', { class: 'field-row' });
    row.appendChild(h('label', {}, label));
    const displayVal = key === 'porcentajeDeficit' ? Math.round(params[key] * 100) : params[key];
    const input = h('input', {
      type: 'number', step: key === 'porcentajeDeficit' ? 1 : step, value: displayVal,
      onchange: (e) => {
        const raw = parseFloat(e.target.value);
        if (isNaN(raw)) return;
        const p = getNutritionParams();
        p[key] = key === 'porcentajeDeficit' ? raw / 100 : raw;
        saveNutritionParams(p);
        render();
      },
    });
    row.appendChild(input);
    form.appendChild(row);
  });
  wrap.appendChild(form);

  return wrap;
}
function macroBox(label, value, unit) {
  return h('div', { class: 'macro-box' }, [
    h('div', { class: 'macro-value' }, `${value}${unit}`),
    h('div', { class: 'macro-label' }, label),
  ]);
}

// ---------------- TAB: PROGRESIÓN 10K ----------------
function tabProgresion() {
  const wrap = h('div', { class: 'screen' });
  const rp = getRunProgress();
  const cur = RUN_PROGRESSION.find(r => r.semana === rp.semana) || RUN_PROGRESSION[0];

  wrap.appendChild(h('div', { class: 'card highlight-card' }, [
    h('div', { class: 'card-title' }, `Semana de progresión ${cur.semana} / 9`),
    h('div', { class: 'kv' }, [h('span', {}, 'Tirada larga (sábado)'), h('span', {}, cur.tirada)]),
    h('div', { class: 'kv' }, [h('span', {}, 'Tempo (jueves)'), h('span', {}, cur.tempo)]),
    h('div', { class: 'notice-small' }, 'Avanza solo en semanas T1. Si no te encuentras bien (dolor articular, fatiga excesiva), repite la semana en vez de avanzar.'),
    h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn', onclick: () => {
        const v = getRunProgress();
        if (v.semana > 1) { setRunProgress({ semana: v.semana - 1 }); render(); }
      }}, '← Repetir semana anterior'),
      h('button', { class: 'btn btn-accent', onclick: () => {
        const v = getRunProgress();
        if (v.semana < 9) { setRunProgress({ semana: v.semana + 1 }); render(); }
      }}, 'Avanzar semana →'),
    ]),
  ]));

  const table = h('div', { class: 'table' });
  RUN_PROGRESSION.forEach(r => {
    table.appendChild(h('div', { class: 'table-row' + (r.semana === cur.semana ? ' table-row-current' : '') }, [
      h('div', { class: 'table-cell cell-week' }, `S${r.semana}`),
      h('div', { class: 'table-cell' }, [
        h('div', { class: 'cell-label' }, 'Tirada'),
        h('div', {}, r.tirada),
        h('div', { class: 'cell-label' }, 'Tempo'),
        h('div', {}, r.tempo),
      ]),
    ]));
  });
  wrap.appendChild(table);
  return wrap;
}

// ---------------- TAB: SEGUIMIENTO ----------------
function currentWeekMonday(iso) {
  return getEffectiveWeek(iso).monday;
}

function tabSeguimiento() {
  const wrap = h('div', { class: 'screen' });
  const tracking = getTracking();
  const thisMonday = currentWeekMonday(state.selectedDate);
  const entry = tracking[thisMonday] || {};

  const form = h('div', { class: 'card' }, [
    h('div', { class: 'card-title' }, `Registro semana del ${fmtDateShort(thisMonday)}`),
  ]);

  const fields = [
    ['peso', 'Peso (kg)', 'number'],
    ['cintura', 'Cintura (cm)', 'number'],
    ['kcalMedias', 'Kcal medias/día', 'number'],
    ['pasosMedios', 'Pasos medios/día', 'number'],
    ['tiempo10k', 'Tiempo 10K (si aplica)', 'text'],
  ];
  fields.forEach(([key, label, type]) => {
    const row = h('div', { class: 'field-row' });
    row.appendChild(h('label', {}, label));
    row.appendChild(h('input', {
      type, value: entry[key] ?? '',
      onchange: (e) => { saveTrackingEntry(thisMonday, { [key]: e.target.value }); },
    }));
    form.appendChild(row);
  });

  const chkRow = h('div', { class: 'field-row' });
  chkRow.appendChild(h('label', {}, '¿Completó el 10K esta semana?'));
  const chk = h('input', {
    type: 'checkbox',
    onchange: (e) => { saveTrackingEntry(thisMonday, { completo10k: e.target.checked }); },
  });
  chk.checked = !!entry.completo10k;
  chkRow.appendChild(chk);
  form.appendChild(chkRow);

  const commentRow = h('div', { class: 'field-row field-row-full' });
  commentRow.appendChild(h('label', {}, 'Comentarios'));
  commentRow.appendChild(h('textarea', {
    rows: 3,
    oninput: (e) => { saveTrackingEntry(thisMonday, { comentarios: e.target.value }); },
  }, entry.comentarios || ''));
  form.appendChild(commentRow);

  wrap.appendChild(form);

  // gráfica de peso
  const weightSeries = Object.keys(tracking).sort()
    .filter(w => tracking[w].peso !== undefined && tracking[w].peso !== '')
    .map(w => parseFloat(tracking[w].peso));
  wrap.appendChild(h('div', { class: 'card' }, [
    h('div', { class: 'card-title' }, 'Evolución del peso'),
    renderLineChart(weightSeries),
  ]));

  // puntuación de musculatura corporal
  wrap.appendChild(renderMuscleSection(tracking, thisMonday));

  // historial
  const hist = h('div', { class: 'card' }, [h('div', { class: 'card-title' }, 'Historial')]);
  const weeks = Object.keys(tracking).sort();
  if (weeks.length === 0) {
    hist.appendChild(h('div', { class: 'notice-small' }, 'Aún no hay registros.'));
  } else {
    weeks.slice().reverse().forEach(wk => {
      const e = tracking[wk];
      hist.appendChild(h('div', { class: 'hist-row' }, [
        h('div', { class: 'hist-date' }, fmtDateShort(wk)),
        h('div', { class: 'hist-data' }, `${e.peso || '—'} kg · ${e.cintura || '—'} cm · ${e.kcalMedias || '—'} kcal · ${e.pasosMedios || '—'} pasos${e.completo10k ? ' · 10K ✓' : ''}`),
      ]));
    });
  }
  wrap.appendChild(hist);

  return wrap;
}

function renderLineChart(values, opts = {}) {
  const { width = 320, height = 110, colorVar = '--accent', minPoints = 2 } = opts;
  if (values.length < minPoints) {
    return h('div', { class: 'notice-small' }, `Necesitas al menos ${minPoints} registros para ver la gráfica.`);
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = (max - min) || 1;
  const PAD = 10;
  const stepX = values.length > 1 ? (width - PAD * 2) / (values.length - 1) : 0;
  const scaleY = v => height - PAD - ((v - min) / span) * (height - PAD * 2);
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${PAD + i * stepX} ${scaleY(v)}`).join(' ');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'weight-chart');
  const line = document.createElementNS(svgNS, 'path');
  line.setAttribute('d', path);
  line.setAttribute('stroke', `var(${colorVar})`);
  line.setAttribute('class', 'weight-chart-line');
  svg.appendChild(line);
  values.forEach((v, i) => {
    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('cx', PAD + i * stepX);
    c.setAttribute('cy', scaleY(v));
    c.setAttribute('r', 3);
    c.setAttribute('fill', `var(${colorVar})`);
    c.setAttribute('class', 'weight-chart-dot');
    svg.appendChild(c);
  });
  return svg;
}

function scoreColor(v) {
  if (v === null || v === undefined || v === '') return '#3a3d42';
  const n = parseFloat(v);
  if (isNaN(n)) return '#3a3d42';
  if (n < 4) return '#b4432e';
  if (n < 7) return '#d9a441';
  return '#4c7a62';
}

// Silueta frontal simplificada de un cuerpo masculino, construida como zonas propias
// (no es una imagen importada: al ser una PWA 100% offline, un dibujo propio evita
// depender de una descarga externa y de posibles derechos de una imagen de terceros).
function buildBodySVG(scores) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 220 380');
  svg.setAttribute('class', 'body-svg');

  function shape(tag, attrs, muscleKey) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (muscleKey) {
      el.setAttribute('fill', scoreColor(scores[muscleKey]));
      el.setAttribute('class', 'muscle-zone');
      el.setAttribute('data-muscle', muscleKey);
    }
    el.setAttribute('stroke', '#0d0e10');
    el.setAttribute('stroke-width', '2');
    return el;
  }

  const head = shape('ellipse', { cx: 110, cy: 26, rx: 17, ry: 19 });
  head.setAttribute('fill', '#4a4d53');
  svg.appendChild(head);

  svg.appendChild(shape('rect', { x: 98, y: 42, width: 24, height: 16, rx: 4 }, 'cuello'));
  svg.appendChild(shape('rect', { x: 44, y: 58, width: 44, height: 26, rx: 10 }, 'hombros'));
  svg.appendChild(shape('rect', { x: 132, y: 58, width: 44, height: 26, rx: 10 }, 'hombros'));
  svg.appendChild(shape('rect', { x: 22, y: 62, width: 26, height: 108, rx: 12 }, 'brazos'));
  svg.appendChild(shape('rect', { x: 172, y: 62, width: 26, height: 108, rx: 12 }, 'brazos'));
  svg.appendChild(shape('rect', { x: 80, y: 60, width: 60, height: 50, rx: 12 }, 'pecho'));
  svg.appendChild(shape('rect', { x: 86, y: 108, width: 48, height: 62, rx: 10 }, 'core'));
  svg.appendChild(shape('rect', { x: 66, y: 176, width: 36, height: 108, rx: 14 }, 'piernas'));
  svg.appendChild(shape('rect', { x: 118, y: 176, width: 36, height: 108, rx: 14 }, 'piernas'));
  svg.appendChild(shape('rect', { x: 68, y: 288, width: 30, height: 84, rx: 12 }, 'gemelos'));
  svg.appendChild(shape('rect', { x: 122, y: 288, width: 30, height: 84, rx: 12 }, 'gemelos'));

  return svg;
}

function getMuscleScores(tracking, mondayIso) {
  return (tracking[mondayIso] && tracking[mondayIso].musculo) || {};
}

function saveMuscleScore(mondayIso, key, value) {
  const tracking = getTracking();
  const current = getMuscleScores(tracking, mondayIso);
  saveTrackingEntry(mondayIso, { musculo: { ...current, [key]: value } });
}

function muscleHistorySeries(tracking, key) {
  return Object.keys(tracking).sort()
    .map(wk => parseFloat(getMuscleScores(tracking, wk)[key]))
    .filter(v => !isNaN(v));
}

function renderMuscleSection(tracking, thisMonday) {
  const scores = getMuscleScores(tracking, thisMonday);
  const wrap = h('div', { class: 'card' }, [
    h('div', { class: 'card-title' }, 'Puntuación muscular (0-10)'),
  ]);

  const layout = h('div', { class: 'muscle-layout' });
  layout.appendChild(buildBodySVG(scores));

  const list = h('div', { class: 'muscle-list' });
  MUSCLE_GROUPS.forEach(m => {
    const details = h('details', { class: 'muscle-row-details' });
    const summary = h('summary', {}, [
      h('span', { class: 'muscle-dot', style: `background:${scoreColor(scores[m.key])}` }),
      h('span', { class: 'muscle-label' }, m.label),
      h('span', { class: 'muscle-current-score' }, scores[m.key] !== undefined && scores[m.key] !== '' ? `${scores[m.key]}/10` : '—'),
    ]);
    details.appendChild(summary);

    const body = h('div', { class: 'muscle-row-body' });
    const fw = h('div', { class: 'log-field' });
    fw.appendChild(h('label', {}, 'Puntuación esta semana (0-10)'));
    fw.appendChild(h('input', {
      type: 'number', min: 0, max: 10, step: 1,
      value: scores[m.key] ?? '',
      onchange: (e) => { saveMuscleScore(thisMonday, m.key, e.target.value); render(); },
    }));
    body.appendChild(fw);

    const series = muscleHistorySeries(tracking, m.key);
    body.appendChild(h('div', { class: 'log-chart-label' }, 'Tendencia'));
    body.appendChild(renderLineChart(series, { width: 260, height: 70 }));

    details.appendChild(body);
    list.appendChild(details);
  });
  layout.appendChild(list);
  wrap.appendChild(layout);

  const vals = Object.values(scores).map(v => parseFloat(v)).filter(v => !isNaN(v));
  const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  wrap.appendChild(h('div', { class: 'kv' }, [
    h('span', {}, 'Puntuación general esta semana'),
    h('span', {}, avg !== null ? avg.toFixed(1) + ' / 10' : '— (rellena los grupos)'),
  ]));

  const weeklyAverages = Object.keys(tracking).sort().map(wk => {
    const s = getMuscleScores(tracking, wk);
    const v = Object.values(s).map(x => parseFloat(x)).filter(x => !isNaN(x));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }).filter(v => v !== null);
  wrap.appendChild(h('div', { class: 'log-chart-label' }, 'Evolución de la puntuación general'));
  wrap.appendChild(renderLineChart(weeklyAverages));

  return wrap;
}

// ---------------- NAV ----------------
const TABS = [
  { id: 'hoy', label: 'Hoy', render: tabHoy },
  { id: 'semana', label: 'Semana', render: tabSemana },
  { id: 'calendario', label: 'Calendario', render: tabCalendario },
  { id: 'nutricion', label: 'Nutrición', render: tabNutricion },
  { id: 'progresion', label: '10K', render: tabProgresion },
  { id: 'seguimiento', label: 'Seguimiento', render: tabSeguimiento },
];

function render() {
  $app.innerHTML = '';
  const activeTab = TABS.find(t => t.id === state.tab) || TABS[0];
  $app.appendChild(activeTab.render());

  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  TABS.forEach(t => {
    const btn = h('button', {
      class: 'nav-btn' + (t.id === state.tab ? ' nav-btn-active' : ''),
      onclick: () => { state.tab = t.id; render(); window.scrollTo(0, 0); },
    }, t.label);
    nav.appendChild(btn);
  });
}

render();

// ---------------- Service worker ----------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
