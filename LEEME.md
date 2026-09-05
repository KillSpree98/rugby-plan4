# Plan Pilar — instalación en el móvil

Es una PWA (web app instalable): HTML/CSS/JS puro, sin dependencias externas, con
todos los datos del plan ya integrados en el código. Funciona 100% offline una vez
cargada la primera vez. No hay backend, ni login, ni cuentas — todo se guarda en el
propio móvil (localStorage).

## 1. Súbela a un hosting con HTTPS (necesario para "Añadir a pantalla de inicio")

Android exige HTTPS para instalar una PWA de verdad (con icono propio y modo
standalone). La forma más rápida y gratuita:

**Opción A — GitHub Pages**
1. Crea un repositorio nuevo en GitHub y sube el contenido de esta carpeta tal cual
   (manteniendo la estructura de subcarpetas `css/`, `js/`, `icons/`).
2. En el repositorio: *Settings → Pages → Deploy from branch → main → /(root)*.
3. En 1-2 minutos tendrás una URL tipo `https://tu-usuario.github.io/tu-repo/`.

**Opción B — Netlify Drop**
1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta completa (o un ZIP con estos archivos).
3. Te da una URL HTTPS al instante.

Cualquier hosting de archivos estáticos sirve (Vercel, Cloudflare Pages, etc.),
lo único que necesitas es que se sirva por HTTPS y que se respete la estructura
de carpetas.

## 2. Instalar en el móvil Android

1. Abre la URL en **Chrome** en el móvil.
2. Chrome mostrará un aviso "Añadir Plan Pilar a la pantalla de inicio" (o pulsa
   el menú ⋮ → "Añadir a pantalla de inicio" / "Instalar app").
3. Confirma. Se crea un icono propio (el escudo con la "P") en tu pantalla de
   inicio, que abre la app directamente en la pantalla "Hoy", a pantalla completa
   y sin barra de navegador.
4. A partir de ahí funciona sin conexión: el service worker (`sw.js`) cachea
   todos los ficheros la primera vez que se abre.

## 3. Notas sobre los datos

- Todo el plan (calendario de 33 semanas, rutinas T1/T2/T4/T5, progresión de
  carrera, mensajes y tips) está escrito directamente en `js/data.js`. Si en
  algún momento cambia algo del plan (fechas, ejercicios...), se edita ese
  fichero y ya está — no hace falta rehacer la app.
- Los únicos datos que el usuario edita desde la propia app son: peso, altura,
  edad, masa libre de grasa, peso objetivo, factor de actividad y % de déficit
  (pestaña Nutrición), la semana de progresión de carrera (pestaña 10K), y el
  registro semanal de seguimiento (pestaña Seguimiento). Todo se guarda en el
  propio dispositivo.
- Regla de nutrición por semana: en la semana **T5** (semifinal/final) las
  calorías suben a mantenimiento (sin déficit). En **T1, T2 y T4** se aplica el
  % de déficit configurado (19% por defecto). Si prefieres que T2 también pase
  a mantenimiento en semana de partido normal, cambia esa regla en
  `weekIsMaintenance()` dentro de `js/app.js`.
