// validate_sections.js -- valida la ESTRUCTURA de un archivo sections.js antes de
// usarlo (no solo que sea JS valido, sino que las respuestas "correct" tengan
// sentido para el tipo de pregunta). Uso:
//
//   node validate_sections.js <ruta/a/sections.js> [numBloquesEsperado] [minPreguntasPorBloque]
//
// Sale con codigo 0 y un resumen si todo esta bien; sale con codigo 1 y describe
// el primer problema encontrado si algo esta mal. Penso para que build_exam.py
// (o Claude directamente) lo corra como paso de seguridad antes de ensamblar el
// examen final, igual que se hizo a mano durante el desarrollo original.

const fs = require('fs');
const path = process.argv[2];
const expectedBlocks = process.argv[3] ? parseInt(process.argv[3], 10) : null;
const minPerBlock = process.argv[4] ? parseInt(process.argv[4], 10) : 8;

if (!path) {
  console.error('Uso: node validate_sections.js <ruta/a/sections.js> [numBloquesEsperado] [minPreguntasPorBloque]');
  process.exit(1);
}

const src = fs.readFileSync(path, 'utf-8');
let SECTIONS;
try {
  // OJO: "eval(src)" NO sirve aqui -- una declaracion "const"/"let" ejecutada via
  // eval() queda encerrada en el propio scope temporal del eval y desaparece al
  // terminar, incluso con eval directo. Por eso se compila como el CUERPO de una
  // funcion nueva y se retorna la variable al final, dentro del mismo scope de
  // ejecucion (esto SI funciona, porque ya no es una declaracion via eval).
  const fn = new Function(src + '\nreturn SECTIONS;');
  SECTIONS = fn();
} catch (err) {
  console.error('ERROR: el archivo no se pudo evaluar como JS:', err.message);
  process.exit(1);
}

if (typeof SECTIONS === 'undefined') {
  console.error('ERROR: el archivo no define "const SECTIONS".');
  process.exit(1);
}

const problems = [];
const VALID_TYPES = new Set(['multiple', 'multiselect', 'truefalse', 'dragdrop']);

if (expectedBlocks !== null && SECTIONS.length !== expectedBlocks) {
  problems.push(`Se esperaban ${expectedBlocks} bloques (secciones), pero SECTIONS tiene ${SECTIONS.length}.`);
}

SECTIONS.forEach((sec, si) => {
  if (!VALID_TYPES.has(sec.type)) {
    problems.push(`Bloque ${si} ("${sec.title}"): tipo "${sec.type}" invalido. Debe ser uno de: ${[...VALID_TYPES].join(', ')}.`);
    return;
  }
  if (!Array.isArray(sec.questions) || sec.questions.length === 0) {
    problems.push(`Bloque ${si} ("${sec.title}"): no tiene preguntas.`);
    return;
  }
  if (sec.questions.length < minPerBlock) {
    problems.push(`Bloque ${si} ("${sec.title}"): tiene ${sec.questions.length} preguntas en el pool; se recomiendan al menos ${minPerBlock} para que el sorteo por intento tenga variedad real.`);
  }

  sec.questions.forEach((q, qi) => {
    const where = `Bloque ${si} pregunta ${qi}`;
    if (sec.type === 'multiple') {
      if (!Array.isArray(q.opts) || q.opts.length < 2) problems.push(`${where}: "opts" debe tener al menos 2 elementos.`);
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= (q.opts || []).length) {
        problems.push(`${where}: "correct" (${q.correct}) esta fuera de rango de "opts" (0..${(q.opts || []).length - 1}).`);
      }
    } else if (sec.type === 'multiselect') {
      if (!Array.isArray(q.opts) || q.opts.length < 2) problems.push(`${where}: "opts" debe tener al menos 2 elementos.`);
      if (!Array.isArray(q.correct) || q.correct.length === 0) {
        problems.push(`${where}: "correct" debe ser un arreglo con al menos un indice.`);
      } else {
        const seen = new Set();
        q.correct.forEach(c => {
          if (typeof c !== 'number' || c < 0 || c >= (q.opts || []).length) {
            problems.push(`${where}: indice "correct" (${c}) fuera de rango de "opts".`);
          }
          if (seen.has(c)) problems.push(`${where}: indice "correct" (${c}) esta duplicado.`);
          seen.add(c);
        });
        if (q.correct.length >= (q.opts || []).length) {
          problems.push(`${where}: "correct" incluye todas (o mas de) las opciones -- revisa que realmente sea seleccion multiple con distractores validos.`);
        }
      }
    } else if (sec.type === 'truefalse') {
      if (typeof q.correct !== 'boolean') problems.push(`${where}: "correct" debe ser true o false, no ${JSON.stringify(q.correct)}.`);
      if (typeof q.text !== 'string' || !q.text.trim()) problems.push(`${where}: falta "text".`);
    } else if (sec.type === 'dragdrop') {
      if (typeof q.correct !== 'string' || !q.correct.trim()) problems.push(`${where}: "correct" debe ser un string no vacio con el termino a completar.`);
      if (typeof q.before !== 'string' || typeof q.after !== 'string') problems.push(`${where}: faltan "before" y/o "after".`);
    }
    if (typeof q.just !== 'string' || q.just.trim().length < 40) {
      problems.push(`${where}: "just" (justificacion) falta o es demasiado corta; debe explicar por que la correcta lo es Y por que las demas opciones fallan.`);
    }
  });

  // Para dragdrop: los terminos "correct" deben ser unicos dentro del bloque (se
  // usan como el banco de palabras arrastrables; duplicados generan un banco con
  // palabras repetidas que no coinciden 1 a 1 con los espacios).
  if (sec.type === 'dragdrop') {
    const terms = sec.questions.map(q => q.correct);
    const dup = terms.filter((t, i) => terms.indexOf(t) !== i);
    if (dup.length) problems.push(`Bloque ${si}: hay terminos "correct" duplicados en dragdrop: ${[...new Set(dup)].join(', ')}.`);
  }

  // "alts" (opcional): redacciones alternativas del enunciado. Para text/opts/correct
  // la respuesta es la misma; para dragdrop cada alternativa es {before, after}.
  sec.questions.forEach((q, qi) => {
    if (q.alts === undefined) return;
    const where = `Bloque ${si} pregunta ${qi}`;
    if (!Array.isArray(q.alts) || q.alts.length === 0) {
      problems.push(`${where}: "alts" debe ser un arreglo con al menos una redaccion alternativa.`);
      return;
    }
    q.alts.forEach((alt, ai) => {
      if (sec.type === 'dragdrop') {
        if (!alt || typeof alt.before !== 'string' || typeof alt.after !== 'string') {
          problems.push(`${where}: alts[${ai}] debe ser un objeto {before, after} para dragdrop.`);
        } else if (!alt.before.trim() && !alt.after.trim()) {
          problems.push(`${where}: alts[${ai}] esta vacio.`);
        }
      } else if (typeof alt !== 'string' || !alt.trim()) {
        problems.push(`${where}: alts[${ai}] debe ser un string no vacio con el enunciado alternativo.`);
      } else if (alt.includes("'")) {
        problems.push(`${where}: alts[${ai}] contiene un apostrofe; usa comillas dobles (ver question-writing-guide.md).`);
      }
    });
  });
});

if (problems.length) {
  console.error(`Se encontraron ${problems.length} problema(s):\n`);
  problems.forEach(p => console.error(' - ' + p));
  process.exit(1);
}

console.log('OK. Resumen:');
SECTIONS.forEach((sec, si) => {
  console.log(`  Bloque ${si} [${sec.type}] "${sec.title}": pool de ${sec.questions.length} preguntas`);
});
process.exit(0);
