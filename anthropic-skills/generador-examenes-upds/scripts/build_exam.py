#!/usr/bin/env python3
"""
build_exam.py -- Ensambla el index.html final de un examen a partir de:
  1. la plantilla generica (assets/template.html), y
  2. un archivo de configuracion JSON con los textos de la materia, y
  3. un archivo .js con el nuevo "const SECTIONS = [ ... ];" ya escrito por Claude.

Existe porque hacer estas dos operaciones a mano con str_replace es propenso a errores
sutiles y dificiles de depurar:
  - Si reemplazas el primer "</body>" que encuentres con un editor de texto ingenuo,
    puede que en realidad estes reemplazando un "</body>" que aparece DENTRO de un
    string de JS (downloadPDF() genera un documento HTML completo como texto), lo
    cual corrompe el archivo entero.
  - Si reemplazas el bloque SECTIONS con un simple "buscar y reemplazar" de todo el
    texto, es facil dejar un "];" duplicado o cortar el string en un punto equivocado.

Este script hace ambas operaciones por indice de caracter (no por regex ingenuo),
tal como se valido manualmente durante el desarrollo original de este archivo.

Uso:
    python3 build_exam.py \
        --template ../assets/template.html \
        --config config.json \
        --sections sections.js \
        --output index.html

`config.json` es un diccionario simple {"NOMBRE_TOKEN": "valor"} -- una entrada por
cada {{NOMBRE_TOKEN}} que aparezca en la plantilla. El script falla con un mensaje
claro si falta algun token o si sobra alguno sin usar.

`sections.js` debe ser un archivo que contenga EXACTAMENTE una declaracion:
    const SECTIONS = [ ... ];
y nada mas (se valida con `node --check` antes y despues del ensamblado).
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def find_all_tokens(text):
    return set(re.findall(r'\{\{([A-Z0-9_]+)\}\}', text))


def substitute_tokens(html, config):
    tokens_in_template = find_all_tokens(html)
    tokens_in_config = set(config.keys())

    missing = tokens_in_template - tokens_in_config
    unused = tokens_in_config - tokens_in_template
    if missing:
        sys.exit(f"[build_exam] ERROR: faltan valores para estos tokens en config.json: {sorted(missing)}")
    if unused:
        print(f"[build_exam] AVISO: estos tokens de config.json no se usan en la plantilla (revisa si es intencional): {sorted(unused)}", file=sys.stderr)

    for key, value in config.items():
        html = html.replace('{{' + key + '}}', str(value))
    return html


def splice_sections(html, new_sections_js):
    """Reemplaza el bloque 'const SECTIONS = [ ... ];' completo por indice de caracter,
    nunca por texto que pueda coincidir accidentalmente dentro de un string de JS."""
    start = html.find('const SECTIONS = [')
    if start == -1:
        sys.exit("[build_exam] ERROR: no se encontro 'const SECTIONS = [' en la plantilla.")
    close_idx = html.find('\n];\n', start)
    if close_idx == -1:
        sys.exit("[build_exam] ERROR: no se encontro el cierre '\\n];\\n' del arreglo SECTIONS.")

    new_sections_js = new_sections_js.rstrip('\n')
    if not new_sections_js.startswith('const SECTIONS = ['):
        sys.exit("[build_exam] ERROR: sections.js debe empezar con 'const SECTIONS = ['.")
    if not new_sections_js.endswith('];'):
        sys.exit("[build_exam] ERROR: sections.js debe terminar exactamente con '];' (sin salto de linea extra).")

    before = html[:start]
    after = html[close_idx + 3:]  # +3 salta el '\n];' original; conserva '\n\nfunction shuffle...'
    return before + new_sections_js + after


def node_check(js_source, label):
    # tempfile (no '/tmp' fijo) para que funcione tambien en Windows.
    safe_label = re.sub(r'[^A-Za-z0-9_.-]', '_', label)
    tmp_path = Path(tempfile.gettempdir()) / f'_build_exam_check_{safe_label}.js'
    tmp_path.write_text(js_source, encoding='utf-8')
    result = subprocess.run(['node', '--check', str(tmp_path)], capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"[build_exam] ERROR: '{label}' no es JS valido segun `node --check`:\n{result.stderr}")
    print(f"[build_exam] OK: {label} pasa `node --check`.")


def extract_main_script(html):
    scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
    if not scripts:
        sys.exit("[build_exam] ERROR: no se encontro ningun bloque <script> en el HTML final.")
    return scripts[-1]  # el ultimo <script> es el que contiene toda la logica de la app


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--template', required=True, help='Ruta a assets/template.html')
    ap.add_argument('--config', required=True, help='Ruta a config.json con los valores de los {{TOKENS}}')
    ap.add_argument('--sections', required=True, help='Ruta al archivo .js con el nuevo const SECTIONS = [...]')
    ap.add_argument('--output', required=True, help='Ruta de salida para el index.html final')
    args = ap.parse_args()

    template_html = Path(args.template).read_text(encoding='utf-8')
    config = json.loads(Path(args.config).read_text(encoding='utf-8'))
    new_sections_js = Path(args.sections).read_text(encoding='utf-8')

    # TOTAL_PREGUNTAS (el texto que ve el estudiante) SIEMPRE se deriva de
    # QUESTIONS_PER_SECTION x NUM_BLOQUES (los mismos numeros que maneja el JS real
    # para calificar). Nunca se toma un valor suelto de config.json para evitar que
    # el texto mostrado y la nota real calculada queden desincronizados.
    try:
        qps = int(config['QUESTIONS_PER_SECTION'])
        nb = int(config['NUM_BLOQUES'])
    except (KeyError, ValueError) as e:
        sys.exit(f"[build_exam] ERROR: config.json debe traer QUESTIONS_PER_SECTION y NUM_BLOQUES como numeros enteros. ({e})")
    derived_total = qps * nb
    if 'TOTAL_PREGUNTAS' in config and str(config['TOTAL_PREGUNTAS']) != str(derived_total):
        print(f"[build_exam] AVISO: TOTAL_PREGUNTAS en config.json ({config['TOTAL_PREGUNTAS']}) no coincide con QUESTIONS_PER_SECTION x NUM_BLOQUES ({derived_total}). Se usa el valor derivado ({derived_total}), que es el que realmente calcula el JS.", file=sys.stderr)
    config['TOTAL_PREGUNTAS'] = derived_total

    # 1) Validar el nuevo SECTIONS por separado ANTES de tocar nada (falla rapido y claro).
    node_check(new_sections_js, 'sections.js')
    validator = Path(__file__).parent / 'validate_sections.js'
    result = subprocess.run(
        ['node', str(validator), args.sections, str(nb), '8'],
        capture_output=True, text=True
    )
    print(result.stdout)
    if result.returncode != 0:
        sys.exit(f"[build_exam] ERROR: sections.js no paso la validacion estructural:\n{result.stderr}{result.stdout}")

    # 2) Empalmar SECTIONS primero (mientras el archivo aun tiene los {{TOKENS}} literales,
    #    que no interfieren con la busqueda de 'const SECTIONS = [').
    html = splice_sections(template_html, new_sections_js)

    # 3) Sustituir los tokens de texto de la materia.
    html = substitute_tokens(html, config)

    # 4) Validacion final: el <script> completo del archivo resultante debe ser JS valido.
    node_check(extract_main_script(html), 'index.html (script final)')

    # 5) Chequeo de sanidad: no debe quedar ningun {{TOKEN}} sin resolver.
    leftover = find_all_tokens(html)
    if leftover:
        sys.exit(f"[build_exam] ERROR: quedaron tokens sin reemplazar en el resultado final: {sorted(leftover)}")

    Path(args.output).write_text(html, encoding='utf-8')
    print(f"[build_exam] Listo. Archivo final escrito en: {args.output}")


if __name__ == '__main__':
    main()
