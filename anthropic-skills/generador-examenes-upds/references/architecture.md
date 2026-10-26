# Referencia tecnica de la arquitectura

Documento de consulta para entender internamente `assets/template.html` sin
tener que leer el archivo completo (~1400 lineas). Leelo cuando necesites
tocar algo mas alla de sustituir tokens y escribir `sections.js` -- por
ejemplo, cambiar el numero de bloques, ajustar el tiempo de tolerancia del
monitor de integridad, o depurar un fallo de la prueba e2e.

## Vista general del archivo

Un solo `index.html` con tres pantallas que se muestran/ocultan con
`style.display`, nunca se navega a otra pagina:

1. `#intake-screen` -- formulario de datos + declaracion de honestidad.
2. `#app-shell` -- el examen en si (header con timer/progreso, tabs por
   bloque, contenido de la seccion activa, barra inferior de navegacion).
3. `#results-overlay` -- pantalla de resultados + boton de descarga de PDF.

Toda la logica vive en el ULTIMO `<script>` del archivo (el primero solo
configura Tailwind). `python3 -c "import re; ..."` para extraerlo se explica
en `build_exam.py`.

## Estado global (`state`) y el arreglo activo (`ACTIVE_SECTIONS`)

```js
let state = {
  screen, student, current, answers, submitted,
  seconds, timerInterval, selectedChip, consent,
  lockRecord, veriCode, annulled, annulReason
};
let ACTIVE_SECTIONS = []; // se llena en startExam(): shuffle(SECTIONS).map(buildActiveSection)
```

`SECTIONS` (el banco completo que escribes en `sections.js`) NUNCA se usa
directamente para responder: en cada `startExam()`, `buildActiveSection()`
saca una muestra aleatoria de `QUESTIONS_PER_SECTION` preguntas del pool de
cada bloque (y mezcla el orden de las opciones donde aplica), y ese resultado
-- ya fijo para este intento -- es `ACTIVE_SECTIONS`. `state.answers` es un
arreglo paralelo a `ACTIVE_SECTIONS` con la respuesta de cada pregunta.

**Nota sobre `let`/`const` de nivel superior:** como el script NO es
`type="module"`, las variables `let`/`const` de nivel superior (`state`,
`ACTIVE_SECTIONS`, `SECTIONS`) NO quedan como propiedades de `window`. Solo
las funciones declaradas con `function nombre(){}` si quedan en `window`. Esto
importa al escribir pruebas: si necesitas inspeccionar `ACTIVE_SECTIONS` o
`state` desde fuera del documento (Node/jsdom), inyecta un `<script>` extra en
el MISMO documento que las exponga por un getter (ver el patron `bridge` en
`scripts/e2e_test_template.js`) -- acceder a `window.ACTIVE_SECTIONS`
directamente desde Node siempre da `undefined`, con o sin error visible.

## Esquema de `SECTIONS`

Cada bloque:
```js
{ id:0, title:'...', icon:'emoji', color:'blue'|'purple'|'green'|'orange'|'teal'|'red',
  type:'multiple'|'multiselect'|'truefalse'|'dragdrop',
  desc:'...', questions:[ /* segun el tipo, ver abajo */ ] }
```

**`multiple`** (opcion multiple, una correcta):
```js
{ text:'...', opts:['A','B','C','D'], correct:1 /* indice 0-based */, just:'...' }
```

**`multiselect`** (seleccion multiple, N correctas):
```js
{ text:'... Selecciona las 3 que...', opts:['A','B','C','D','E'], correct:[0,2,4], just:'...' }
```
`correct` es un arreglo de indices. El enunciado en `text` DEBE decir cuantas
hay que marcar (la UI muestra un contador "seleccionadas: X de N").

**`truefalse`** (verdadero/falso):
```js
{ text:'Afirmacion completa...', correct:true|false, just:'...' }
```

**`dragdrop`** (completar espacios, arrastrando una palabra del banco):
```js
{ before:'Texto que termina justo antes del hueco: ', after:' y sigue aqui.',
  correct:'Termino Exacto', just:'...' }
```
El banco de palabras arrastrables de cada bloque se arma en tiempo de examen
a partir de los `correct` de las preguntas EFECTIVAMENTE sorteadas para ese
intento (`buildActiveSection`), no de un listado estatico -- por eso los
`correct` deben ser unicos dentro del bloque.

**Redacciones alternativas (`alts`, opcional en cualquier tipo):**
```js
{ text:'Enunciado original...', opts:[...], correct:1, just:'...',
  alts:['Misma pregunta con otras palabras...', 'Otra frase que pide lo mismo...'] }
```
En `dragdrop` cada alternativa es un objeto `{before, after}` con los mismos
espacios (un solo hueco por alternativa, mismo `correct`):
```js
{ before:'...', after:'...', correct:'Termino Exacto', just:'...',
  alts:[{ before:'...', after:'...' }] }
```
`buildActiveSection` (en `pickVariant`) elige UNA redaccion al azar entre el
enunciado original y sus `alts` en cada intento. La respuesta correcta,
las opciones y la justificacion no cambian: solo cambia como se formula la
pregunta. Por eso las alternativas deben pedir exactamente lo mismo (mismo
numero de opciones a marcar en `multiselect`, misma afirmacion verdadera o
falsa en `truefalse`, mismo termino en `dragdrop`).

## Bloqueo por correo (un intento, sin backend)

Clave de `localStorage` (configurable via `{{LOCK_KEY_UNICA}}`, para que
examenes de materias distintas no choquen si se abren en el mismo navegador):
```js
localStorage[LOCK_STORAGE_KEY] = {
  "correo.normalizado@dominio.com": {
    student, activeSections, answers, code,
    annulled, annulReason,
    submittedAtIso, submittedAtDisplay
  },
  ...
}
```
`normalizeEmail()` hace `trim().toLowerCase()` antes de usar el correo como
llave, para que mayusculas/espacios no permitan burlar el bloqueo.

Flujo: `checkIntake()` consulta `getLockForEmail()` en cada tecla que se
escribe en el campo de correo; si hay bloqueo, cambia el boton a "Ver mi
resultado ya registrado" y `handleStartClick()` llama a `loadLockedResult()`
en vez de `startExam()` -- esto reconstruye `ACTIVE_SECTIONS`/`state.answers`
desde el registro guardado y renderiza la MISMA pantalla de resultados que
vio el estudiante la primera vez (no un examen nuevo). `startExam()` tambien
repite la verificacion como respaldo, por si se invoca directo.

**Limite real y honesto:** esto es una proteccion de navegador, no de
servidor. Si el estudiante abre el archivo en otro dispositivo o borra el
`localStorage`, puede intentarlo de nuevo y el sistema no tiene forma de
saberlo. El codigo de verificacion embebido en el PDF (`generateSubmissionCode`,
un hash no criptografico tipo cyrb53, no requiere `crypto.subtle` que a veces
esta bloqueado en `file://`) es el respaldo manual: el docente puede detectar
una segunda entrega sospechosa si dos PDFs del mismo estudiante tienen codigos
distintos. Se lo debes decir explicitamente al usuario al entregar el examen.

## Monitor de integridad (anulacion por cambio de pantalla)

`startIntegrityMonitor()` se llama al final de `startExam()` (no en
`loadLockedResult()`, que solo muestra un resultado ya cerrado) y registra dos
listeners:

- `document.addEventListener('visibilitychange', ...)`: dispara si
  `document.hidden` es verdadero (cambio de pestaña, minimizar).
- `window.addEventListener('blur', ...)`: dispara si, tras un margen de 50ms,
  `document.hidden || !document.hasFocus()` (cambio a otra aplicacion). El
  margen evita falsos positivos por un enfoque interno de la propia pagina.

Ambos llaman a `annulExam(reason)`, que:
1. Ignora la llamada si `state.submitted` ya es verdadero (evita anular un
   examen que ya se entrego normalmente, y evita doble disparo).
2. Detiene el propio monitor y el timer.
3. Marca `state.annulled = true`, guarda la razon, fuerza `state.submitted`.
4. Llama a `saveLockRecord()` (persiste el bloqueo con `annulled:true`, para
   que reabrir con el mismo correo muestre el mismo resultado anulado) y luego
   a `computeAndRenderResults()`.

`computeAndRenderResults()` fuerza la nota mostrada y calificada a **0**
cuando `state.annulled` es verdadero (no solo visualmente: es el numero que
queda grabado en el registro y en el PDF), muestra el banner rojo
`#annul-banner`, y en el PDF agrega un bloque `.va` con "EXAMEN ANULADO" bien
visible. El desglose por bloque y el analisis de insights se ocultan en la
pantalla (no aportan si la nota es 0 de todas formas), pero la retroalimentacion
pregunta por pregunta SI se mantiene en el PDF, para que el docente pueda
revisar el caso si hay un reclamo.

**Este mecanismo es deliberadamente sin tolerancia**: la primera vez que se
detecta el cambio, se anula, sin aviso previo ni segunda oportunidad. Si el
usuario pide una version con aviso previo (p. ej. "avisa una vez antes de
anular"), es un cambio de comportamiento explicito -- confirmalo, no lo
asumas.

## Generacion de PDF

`downloadPDF()` arma un documento HTML COMPLETO como un string de JS (con su
propio `<style>`, cabecera, tarjeta de puntaje, desglose, insights, y
retroalimentacion detallada pregunta por pregunta via
`buildDetailedFeedbackHTML()`), lo mete en un `Blob` y dispara la descarga
como `.html`. Ese archivo `.html`, al abrirse, ejecuta
`window.print()` automaticamente 800ms despues de cargar -- el estudiante
elige "Guardar como PDF" en el dialogo de impresion del navegador. No es una
libreria de generacion de PDF real; es HTML pensado para imprimirse. Esto es
intencional (no requiere dependencias externas ni conexion a internet), pero
significa que **el string generado contiene sus propios `<script>` y
`</body></html>` literales** -- la razon exacta por la que
`build_exam.py`/`e2e_test_template.js` usan `lastIndexOf` en vez de
`indexOf`/`replace` en cualquier operacion sobre `</body>` o `</script>` del
archivo completo (ver "Por que un script, y no editar el HTML a mano" en
`SKILL.md`).

## Constantes clave (ajustables)

```js
const QUESTIONS_PER_SECTION = N; // cuantas preguntas de cada bloque se muestran por intento
const TOTAL_QUESTIONS = QUESTIONS_PER_SECTION * NUM_BLOQUES;
const EXAM_SECONDS = MINUTOS * 60;
const LOCK_STORAGE_KEY = 'clave_unica_por_examen';
```
Si cambias el NUMERO de bloques (distinto de 4), tambien tienes que ajustar a
mano los botones de tabs en el HTML (`<button class="stab" id="tab-0">` ...
uno por bloque, en la seccion justo debajo del header) -- el template viene
con 4 por ser el caso mas comun, y no se generan dinamicamente.
