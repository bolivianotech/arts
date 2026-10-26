// e2e_test_template.js -- Prueba de extremo a extremo para un index.html generado
// con esta skill. Corre con jsdom (npm install jsdom --no-save si no esta) y
// simula un estudiante real: llena el formulario, responde las 4 secciones,
// entrega, descarga el PDF, reintenta con el mismo correo (debe bloquear), y
// simula un cambio de pestaña a mitad de examen (debe anular con nota 0).
//
// Uso:
//   node e2e_test_template.js /ruta/al/index.html
//
// Ajusta TARGET_HTML abajo o pasalo como argumento de linea de comandos.
// Requiere que el archivo tenga exactamente 4 bloques (si tu examen usa un
// numero distinto de bloques, ajusta las aserciones marcadas con "// AJUSTAR").

const fs = require('fs');
const { JSDOM } = require('jsdom');

const TARGET_HTML = process.argv[2] || '/home/claude/index.html';

let baseHtml = fs.readFileSync(TARGET_HTML, 'utf-8');
// Puente: en un script clasico (no type=module), "let/const" de nivel superior
// NO quedan como propiedades de "window" -- solo las funciones declaradas si.
// Este pequeño script, insertado en el MISMO documento, comparte el scope
// lexico y puede leer las variables directamente.
const bridge = `<script>
window.__test = {
  get ACTIVE_SECTIONS(){ return ACTIVE_SECTIONS; },
  get state(){ return state; },
  get LOCK_STORAGE_KEY(){ return LOCK_STORAGE_KEY; },
  get TOTAL_QUESTIONS(){ return TOTAL_QUESTIONS; }
};
</script>`;
// OJO: usar lastIndexOf, no indexOf/replace -- el HTML generado por downloadPDF()
// contiene un "</body>" LITERAL dentro de un string de JS (es un documento HTML
// completo armado como texto). Un replace() ingenuo del primer "</body>" corta
// ese string a la mitad y corrompe el <script> completo.
baseHtml = baseHtml.slice(0, baseHtml.lastIndexOf('</body>')) + bridge + '\n' + baseHtml.slice(baseHtml.lastIndexOf('</body>'));

function makeStorage() {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}
const sharedStorage = makeStorage();

function setHidden(window, value) {
  Object.defineProperty(window.document, 'hidden', { value, configurable: true });
  Object.defineProperty(window.document, 'visibilityState', { value: value ? 'hidden' : 'visible', configurable: true });
}

async function newDom() {
  const dom = new JSDOM(baseHtml, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'file://' + TARGET_HTML });
  const { window } = dom;
  Object.defineProperty(window, 'localStorage', { value: sharedStorage });
  window.print = () => {};
  window.scrollTo = () => {};
  await new Promise(res => setTimeout(res, 50));
  return dom;
}

function fillIntake(dom, { nombre, codigo, email }) {
  const { window } = dom;
  const doc = window.document;
  const set = (id, val) => { const el = doc.getElementById(id); el.value = val; el.dispatchEvent(new window.Event('input')); el.dispatchEvent(new window.Event('change')); };
  set('inp-nombre', nombre);
  set('inp-codigo', codigo);
  set('inp-email', email);
  set('inp-fecha', window.formatDateTimeLocal(new Date()));
  const consent = doc.getElementById('inp-consent');
  consent.checked = true;
  consent.dispatchEvent(new window.Event('change'));
  window.checkIntake();
}

function answerEverythingCorrectly(window) {
  window.__test.ACTIVE_SECTIONS.forEach((sec, si) => {
    window.goSection(si);
    if (sec.type === 'multiple') sec.questions.forEach((q, qi) => window.selectSingle(si, qi, q.correct));
    else if (sec.type === 'multiselect') sec.questions.forEach((q, qi) => q.correct.forEach(oi => window.toggleMulti(si, qi, oi)));
    else if (sec.type === 'truefalse') sec.questions.forEach((q, qi) => window.selectTF(si, qi, q.correct));
    else if (sec.type === 'dragdrop') sec.questions.forEach((q, qi) => { window.__test.state.selectedChip = q.correct; window.blankClick(si, qi); });
  });
}

(async () => {
  try {
    console.log('Probando:', TARGET_HTML, '\n');

    // ---- 1) Flujo normal: responder todo correcto -> nota maxima, sin anular ----
    let dom = await newDom();
    let { window } = dom, doc = window.document;
    const total = window.__test.TOTAL_QUESTIONS;
    fillIntake(dom, { nombre: 'Estudiante Uno', codigo: 'TEST-0001', email: 'estudiante.uno@upds.edu.bo' });
    if (doc.getElementById('btn-start').disabled) throw new Error('El boton deberia estar habilitado con todos los campos validos');
    window.handleStartClick();
    console.log('[1] Bloques activos:', window.__test.ACTIVE_SECTIONS.length, '| preguntas totales:', total);
    answerEverythingCorrectly(window);
    if (window.countAnswered() !== total) throw new Error(`Esperaba ${total} respondidas, hay ${window.countAnswered()}`);
    window.doSubmit();
    const score1 = doc.getElementById('score-num').textContent;
    const code1 = doc.getElementById('res-veriCode').textContent;
    console.log('[2] Nota con todo correcto:', score1, '/', total, '| codigo:', code1);
    if (score1 !== String(total)) throw new Error(`Nota deberia ser ${total}, fue ${score1}`);
    if (!code1 || code1 === '--') throw new Error('Falta el codigo de verificacion');
    let blobRef;
    const origCreate = window.URL.createObjectURL;
    window.URL.createObjectURL = (b) => { blobRef = b; return 'blob:x'; };
    window.downloadPDF();
    const pdfText = await blobRef.text();
    console.log('[3] PDF generado sin errores, incluye el codigo:', pdfText.includes(code1));
    window.URL.createObjectURL = origCreate;
    dom.window.close();

    // ---- 2) Reintentar con el MISMO correo (distinto navegador simulado = misma storage) ----
    dom = await newDom();
    window = dom.window; doc = window.document;
    fillIntake(dom, { nombre: 'Otro Nombre Cualquiera', codigo: 'OTRO-CODIGO', email: '  ESTUDIANTE.UNO@upds.edu.bo  ' });
    const btn = doc.getElementById('btn-start');
    console.log('[4] Boton al reintentar con el mismo correo:', btn.textContent.trim());
    if (!btn.textContent.includes('Ver mi resultado')) throw new Error('Deberia bloquear el reintento y ofrecer ver el resultado ya registrado');
    window.handleStartClick();
    console.log('[5] Nota mostrada al reabrir (debe ser la ORIGINAL, no un examen nuevo):', doc.getElementById('score-num').textContent, '| nombre:', doc.getElementById('res-nombre').textContent);
    if (doc.getElementById('res-nombre').textContent !== 'Estudiante Uno') throw new Error('Deberia mostrar los datos de la entrega original, no los recien tipeados');
    dom.window.close();

    // ---- 3) Cambio de pestaña a mitad de examen -> anulado con 0 ----
    dom = await newDom();
    window = dom.window; doc = window.document;
    fillIntake(dom, { nombre: 'Estudiante Dos', codigo: 'TEST-0002', email: 'estudiante.dos@upds.edu.bo' });
    window.handleStartClick();
    window.goSection(0);
    const sec0 = window.__test.ACTIVE_SECTIONS[0];
    if (sec0.type === 'multiple') window.selectSingle(0, 0, sec0.questions[0].correct);
    setHidden(window, true);
    doc.dispatchEvent(new window.Event('visibilitychange'));
    console.log('[6] Anulado tras cambiar de pestaña:', window.__test.state.annulled, '| nota:', doc.getElementById('score-num').textContent);
    if (!window.__test.state.annulled) throw new Error('Deberia anularse al cambiar de pestaña');
    if (doc.getElementById('score-num').textContent !== '0') throw new Error('La nota anulada debe mostrarse como 0');
    dom.window.close();

    // ---- 4) Cambio de ventana/aplicacion (blur) -> tambien anula ----
    dom = await newDom();
    window = dom.window; doc = window.document;
    fillIntake(dom, { nombre: 'Estudiante Tres', codigo: 'TEST-0003', email: 'estudiante.tres@upds.edu.bo' });
    window.handleStartClick();
    window.document.hasFocus = () => false;
    window.dispatchEvent(new window.Event('blur'));
    await new Promise(r => setTimeout(r, 80));
    console.log('[7] Anulado tras perder el foco de la ventana:', window.__test.state.annulled);
    if (!window.__test.state.annulled) throw new Error('Deberia anularse al perder el foco de la ventana');
    dom.window.close();

    console.log('\n=== TODO PASO: el examen generado funciona correctamente ===');
  } catch (err) {
    console.error('\n=== FALLO LA PRUEBA ===');
    console.error(err);
    process.exit(1);
  }
})();
