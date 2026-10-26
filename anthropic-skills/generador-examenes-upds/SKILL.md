---
name: "generador-examenes-upds"
description: 'Genera o actualiza un examen parcial o final interactivo de una sola pagina HTML (index.html) para una materia de UPDS, a partir del avance del curso y los materiales que el usuario indique o tenga en el Project. Usa siempre esta skill cuando el usuario pida crear, armar, generar, modificar o actualizar un "examen", "evaluacion", "parcial", "final", "quiz" o "prueba" en HTML/index.html para una materia -- sobre todo si menciona UPDS, un codigo tipo SIS-XXXX, pide que "se parezca a examenes anteriores", o adjunta un index.html existente. Produce preguntas de opcion multiple, seleccion multiple, verdadero/falso y completar espacios del contenido real del curso (nunca genericas), con banco mas grande que el mostrado (sorteo por intento), un solo intento por correo (bloqueo en localStorage, sin backend), anulacion automatica con nota 0 si el estudiante cambia de pestaña o ventana durante el examen, codigo de verificacion unico, y exportacion a PDF con aviso de que solo esa entrega se califica.'
---

# Generador de examenes HTML para UPDS

Produce un archivo `index.html` autocontenido (sin backend, sin dependencias de
servidor) que funciona como examen interactivo: pantalla de datos del
estudiante, secciones por bloque tematico, temporizador, envio, pantalla de
resultados con retroalimentacion detallada, y descarga en PDF. Incluye
seguridad anti-fraude puramente en el navegador (ver `references/architecture.md`
para el detalle tecnico completo).

**No reinventes la arquitectura.** Ya existe una version totalmente probada
(con pruebas automatizadas) en `assets/template.html`. Tu trabajo es: (1)
entrevistar al usuario para conseguir el contenido de la materia, (2) redactar
las preguntas siguiendo `references/question-writing-guide.md`, y (3) usar
`scripts/build_exam.py` para ensamblar el resultado. No copies y pegues texto
a mano dentro del HTML de mas de unas pocas lineas: los reemplazos manuales de
bloques largos de JS son la fuente mas comun de archivos rotos (ver la seccion
"Por que un script, y no editar el HTML a mano" mas abajo).

## Flujo de trabajo

### 1. Si el usuario adjunto un index.html existente hecho con esta misma skill

Si ya trae un examen generado previamente y solo quiere cambiar el contenido
(otro bloque de materia, mas preguntas, otra materia), NO empieces de cero:
extrae su `SECTIONS` actual con el mismo metodo de `scripts/build_exam.py`
(buscar `const SECTIONS = [` hasta el `\n];\n` que le sigue) para ver el estilo
y nivel ya usado, y reutiliza su plantilla intacta (branding, logo, textos)
salvo que el usuario pida cambiarlos explicitamente. Si el archivo NO fue
generado con esta skill (otra estructura), trata el contenido como referencia
de estilo/branding mas no cambies de arquitectura sin avisar al usuario.

### 2. Entrevista (no generes nada todavia)

Pregunta lo que falte de esto -- si el usuario ya lo dio en el mensaje o hay
documentos en el Project que lo cubren, no lo vuelvas a preguntar:

- **Materia y codigo** (ej. "Auditoria de Sistemas I", "SIS-0400").
- **Parcial o final**, y si hay un numero de bloques/temas ya definido por el
  silabo o el avance de clases (lo mas comun es 3-4 bloques; el layout de tabs
  del template asume 4 por defecto -- ver `references/architecture.md` si el
  usuario necesita un numero distinto).
- **El contenido real**: pide que suba o referencie el material (diapositivas,
  guias, PDFs de las clases, rubricas, proyecto integrador) o usa lo que ya
  este en el Project. Si el usuario dice "usa el avance del curso" sin
  adjuntar nada, busca en el Project antes de preguntar de nuevo.
- **Complejidad esperada**: por defecto, asume que quiere preguntas de
  escenario aplicado con trampas de distractores (el estandar de
  `question-writing-guide.md`), no seguir preguntando si ya lo pidieron asi
  antes en la conversacion.
- **Duracion y numero de preguntas por intento** (por defecto: 90 minutos, 6
  preguntas por bloque x 4 bloques = 24; ajustable).
- Solo pregunta por el correo institucional/dominio si necesitas validarlo de
  forma especial; el template ya acepta cualquier correo con formato valido.

No hace falta preguntar por el mecanismo de seguridad (bloqueo por correo +
anulacion por cambio de pantalla): es el comportamiento por defecto de esta
skill. Si el usuario pide explicitamente OTRO comportamiento (p. ej. permitir
reintentos, o no anular por cambio de pantalla), es una desviacion del
default -- confirmalo antes de quitar esa proteccion, porque usualmente es
justamente lo que se busca al usar esta skill.

### 3. Redactar el banco de preguntas

Sigue `references/question-writing-guide.md` al pie de la letra (estilo,
estructura, calibracion de dificultad, convencion de tildes, prohibicion de
apostrofes). Un bloque tipico necesita:

- Un **pool de al menos 8 preguntas** por bloque (el template muestra solo 6
  por intento, sorteadas de ese pool -- mas pool = examenes mas distintos
  entre estudiantes).
- Un tipo de pregunta por bloque: `multiple`, `multiselect`, `truefalse` o
  `dragdrop` (ver el esquema exacto de cada uno en
  `references/architecture.md#esquema-de-secciones`).
- Justificaciones completas: por que la correcta lo es, y por que CADA
  incorrecta falla especificamente (nunca un parrafo generico).
- **Redacciones alternativas anti-copia:** cada pregunta lleva `alts` con al
  menos 2 formulaciones equivalentes (sinonimos u otra estructura de frase,
  misma respuesta, mismas opciones, misma justificacion). El template elige una
  al azar en cada intento. Ver `references/question-writing-guide.md`
  (seccion "Redacciones alternativas") y `references/architecture.md`.

Escribe esto como un archivo `sections.js` que sea exactamente:
```js
const SECTIONS = [
  { id:0, title:'...', icon:'...', color:'blue', type:'multiple', desc:'...', questions:[ ... ] },
  { id:1, title:'...', icon:'...', color:'red', type:'multiselect', desc:'...', questions:[ ... ] },
  { id:2, title:'...', icon:'...', color:'teal', type:'dragdrop', desc:'...', questions:[ ... ] },
  { id:3, title:'...', icon:'...', color:'green', type:'truefalse', desc:'...', questions:[ ... ] }
];
```
(colores disponibles: `blue`, `purple`, `green`, `orange`, `teal`, `red`).

### 4. Preparar `config.json`

Un diccionario plano con los textos de la materia. Corre esto para ver
exactamente que tokens necesita la plantilla actual (por si cambia en el
futuro):
```bash
python3 -c "import re; print(sorted(set(re.findall(r'\{\{([A-Z0-9_]+)\}\}', open('assets/template.html', encoding='utf-8').read()))))"
```
No necesitas calcular `TOTAL_PREGUNTAS` a mano: `build_exam.py` lo deriva
automaticamente de `QUESTIONS_PER_SECTION x NUM_BLOQUES` para que el texto que
ve el estudiante nunca quede desincronizado del calculo real de la nota.

### 5. Ensamblar y validar (obligatorio, no te lo saltes)

```bash
cd scripts
python3 build_exam.py \
  --template ../assets/template.html \
  --config /ruta/a/config.json \
  --sections /ruta/a/sections.js \
  --output /mnt/user-data/outputs/index.html
```
El script ya corre, en este orden, y se detiene con un mensaje claro si algo
falla:
1. `node --check` sobre `sections.js` solo (sintaxis JS valida).
2. `scripts/validate_sections.js` (estructura: indices en rango, sin
   duplicados, justificaciones no vacias, terminos de dragdrop unicos).
3. Sustitucion de tokens (falla si falta alguno, avisa si sobra alguno).
4. `node --check` sobre el `<script>` final completo del HTML resultante.
5. Chequeo de que no quedo ningun `{{TOKEN}}` sin reemplazar.

Si `node` no esta disponible en el entorno, como minimo corre el paso 2
(`validate_sections.js`) manualmente antes de entregar -- es la validacion que
mas bugs reales detecto durante el desarrollo de esta skill.

Despues de ensamblar, corre la prueba de extremo a extremo (requiere
`jsdom`: `npm install jsdom --no-save` si no esta disponible):
```bash
node scripts/e2e_test_template.js /mnt/user-data/outputs/index.html
```
Esto simula un estudiante completo: llenar el formulario, responder las 4
secciones, entregar, generar el PDF, reintentar con el mismo correo (debe
bloquear), y cambiar de pestaña a mitad de examen (debe anular con nota 0).
Si algo de esto falla, el archivo tiene un bug real -- no lo entregues sin
arreglarlo primero.

### 6. Entregar

Copia el resultado a `/mnt/user-data/outputs/index.html` (si no lo generaste
ahi directamente) y usa `present_files`. En tu mensaje al usuario, menciona
explicitamente:
- Cuantas preguntas tiene el pool total y cuantas se muestran por intento.
- Que el examen se bloquea por correo (un intento) y se anula con nota 0 si el
  estudiante cambia de pestana/ventana -- y que esto es una proteccion de
  navegador (localStorage), no un backend: un estudiante que abra el archivo
  en otro dispositivo tecnicamente podria intentarlo de nuevo. El codigo de
  verificacion en el PDF es el respaldo manual para ese caso.

## Por que un script, y no editar el HTML a mano

Durante el desarrollo de esta skill, editar el archivo de casi 1400 lineas
directamente con reemplazos de texto genero DOS bugs reales y dificiles de
detectar, ambos por la misma razon de fondo (un "buscar y reemplazar" ingenuo
no entiende que esta dentro de un string de JS y que no):

1. **El cierre del arreglo `SECTIONS` duplicado.** Un primer intento de
   insertar el nuevo banco de preguntas dejo un `];` repetido, porque el
   reemplazo no calculo bien donde terminaba el arreglo viejo.
2. **Un `</body>` que rompio todo el `<script>`.** La funcion que genera el
   PDF arma un documento HTML completo como un string de JS, que termina en
   `'...</div></body></html>'`. Un `.replace('</body>', ...)` que busca la
   PRIMERA coincidencia encuentra ese `</body>` que esta DENTRO del string,
   no el `</body>` real del documento -- e inserta codigo a la mitad de un
   string, lo que corrompe el archivo completo y el navegador (o el parser de
   HTML) corta el `<script>` ahi mismo.

`scripts/build_exam.py` existe especificamente para no repetir estos dos
errores: usa `find()`/`lastIndexOf()` por indice de caracter en vez de
`replace()` por texto, y valida con `node --check` en cada paso. Si en algun
momento necesitas editar el HTML a mano de todas formas, replica esa misma
logica (buscar el `close_idx` del arreglo, usar `lastIndexOf` para el
`</body>` real) en vez de un `str_replace`/`sed` simple.

## Archivos de este paquete

- `assets/template.html` -- la plantilla base, ya probada, con `{{TOKENS}}`
  en vez de texto especifico de una materia.
- `assets/example_sections.js` -- ejemplo documentado del esquema exacto de
  cada tipo de pregunta (deliberadamente tiene muy pocas preguntas por bloque;
  fallara la validacion de "minimo 8 por bloque" a proposito, como recordatorio
  de que hay que reemplazarlo con contenido real).
- `scripts/build_exam.py` -- ensambla y valida el `index.html` final.
- `scripts/validate_sections.js` -- valida la estructura de un `sections.js`
  por separado (usalo tambien de forma independiente mientras redactas).
- `scripts/e2e_test_template.js` -- prueba de extremo a extremo con jsdom.
- `references/question-writing-guide.md` -- como redactar preguntas de alta
  complejidad, calibradas, sin alucinaciones ni trampas injustas.
- `references/architecture.md` -- referencia tecnica del `state`, el esquema
  exacto de `SECTIONS` por tipo, el mecanismo de bloqueo por correo, y el
  monitor de integridad (anulacion por cambio de pantalla).
