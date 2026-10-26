# Guia de redaccion de preguntas

Esta guia captura el estilo que realmente funciono bien en los examenes ya
generados con esta arquitectura (Inteligencia Artificial I, Auditoria de
Sistemas I). Sigue este nivel de calidad; no bajes la vara "para ir mas
rapido" -- un banco de preguntas mediocre es peor que no tener examen.

## Principio general: escenario, no definicion

Mal (definicion suelta, se responde por memoria pura, sin razonamiento):
> ¿Que es un ataque de ransomware de doble extorsion?

Bien (escenario aplicado, exige aplicar el concepto a un caso):
> Una cooperativa de ahorro y credito boliviana descubre que sus archivos
> estan cifrados y que, ademas, el atacante amenaza con publicar los datos de
> sus socios si no se paga el rescate en 48 horas. El equipo de TI confirma
> que existen backups locales intactos. ¿Por que la organizacion sigue en
> riesgo critico de continuidad de negocio a pesar de tener backups?

La pregunta buena obliga a razonar sobre el escenario, no a reconocer una
frase del material. Casi todas las preguntas deben tener 2-4 lineas de
contexto aplicado antes de la pregunta en si.

## Las opciones incorrectas deben ser trampas reales, no rellenos

Cada distractor debe fallar por una razon especifica y explicable, tomada de
alguno de estos patrones (usalos, mezclados, a lo largo del banco):

- **Inversion de roles/definiciones.** Intercambiar dos conceptos relacionados
  (causa por efecto, auditor interno por externo, Base de Conocimiento por
  Memoria de Trabajo). Es el error mas comun que comete un estudiante que
  estudio por encima.
- **Concepto real pero de otro bloque/tema.** Un dato verdadero, pero que no
  aplica a lo que se pregunta (ej. "COBIT 2019" como opcion en una pregunta
  sobre el bloque de riesgos ciberneticos, cuando en el material pertenece al
  bloque de CAATs). Ademas de probar conocimiento, entrena a distinguir de
  donde viene cada dato -- una habilidad de auditor real.
- **Dato plausible pero no verificado (alucinacion tipica de IA).** Un hecho
  que suena creible y hasta puede ser cierto en general, pero que el material
  del curso NUNCA menciono. Sirve para reforzar la idea de auditar criticamente
  lo que sugiere un asistente de IA, si el curso toca ese tema.
- **Generalizacion excesiva o absoluta.** Afirmaciones con "siempre", "nunca",
  "el unico objetivo es...", que ignoran matices que el material si reconoce.
- **Simplificacion que ignora el matiz clave del escenario.** Una opcion que
  seria razonable en un contexto MAS SIMPLE que el planteado, pero que pasa
  por alto el detalle especifico que hace complejo a este escenario en
  particular.

Evita distractores absurdos o que ningun estudiante que estudio un poco
elegiria ("la auditoria de sistemas es un baile tradicional boliviano"). No
suman dificultad real, solo regalan la respuesta por descarte.

## La justificacion ("just") es tan importante como la pregunta

Debe:
1. Explicar por que la respuesta correcta lo es, citando el concepto o el
   dato especifico del material que la sustenta.
2. Explicar, opcion por opcion, por que CADA incorrecta falla -- no un
   parrafo generico tipo "las demas opciones son incorrectas". Si una opcion
   es un distractor de "otro bloque", dilo explicitamente ("pertenece al
   bloque de..., no a este").
3. Tener sustancia real: en la practica, esto termina siendo un parrafo de
   3-6 lineas por pregunta. Si tu justificacion cabe en una linea, la
   pregunta probablemente es demasiado simple.

Esto no es solo pedagogia: la retroalimentacion detallada del PDF depende
enteramente de este campo. Un "just" pobre produce un PDF de estudio pobre.

## Esquema exacto por tipo de pregunta

Ver `architecture.md` para el JSON/JS exacto. Resumen de reglas especificas
de redaccion por tipo:

- **`multiple`** (opcion multiple, 1 correcta): 4 opciones. La opcion
  correcta NO debe ser sistematicamente la mas larga o la mas tecnica --
  varia el estilo para que la longitud no delate la respuesta.
- **`multiselect`** (seleccion multiple, N correctas): el enunciado SIEMPRE
  debe decir explicitamente cuantas opciones hay que marcar ("Selecciona las
  3 que..."). El estudiante ve un contador de "seleccionadas: X de N" en
  pantalla, asi que el numero debe ser exacto y verificable contra el
  material real.
- **`truefalse`** (verdadero/falso): las afirmaciones FALSAS mas efectivas
  son una version del concepto real con UN detalle invertido o cambiado
  (ver "Inversion de roles" arriba), no afirmaciones obviamente descabelladas.
  Alterna V/F sin patron predecible (no "V,F,V,F,...").
- **`dragdrop`** (completar espacios): el termino a completar (`correct`)
  se vuelve una palabra arrastrable en el banco de palabras del examen. Que
  sea:
  - Unico dentro del bloque (no repetir el mismo termino en dos preguntas del
    mismo bloque -- rompe el sorteo 1 a 1 entre espacios y banco).
  - Un termino corto (1-4 palabras), no una oracion.
  - Facil de diferenciar de otros terminos del mismo pool por escrito (evita
    dos terminos casi identicos en el mismo bloque, como "Auditoria Continua"
    y "Auditoria Interna", que confundirian el banco de palabras).

## Convenciones de escritura del texto (obligatorias)

Estas convenciones existen porque el archivo completo las sigue de forma
consistente y mezclar estilos se nota:

- **Sin tildes en el texto de las preguntas** (`auditoria` no `auditoría`,
  `numero` no `número`). Se aplica a `text`, `opts`, `just`, `before`,
  `after`, `title`, `desc`.
- **La `ñ` SI se conserva** cuando quitarla cambia el significado o crea una
  palabra distinta (`diseño`, `año`, `pequeña`). No es una tilde, es una letra
  distinta.
- **Nunca uses un apostrofe (`'`) dentro del texto.** Todas las cadenas usan
  comilla simple como delimitador de JS (`text:'...'`). Un apostrofe interno
  (aunque sea de una contraccion en ingles tipo "it's", o una comilla tipografica)
  rompe la cadena y produce un error de sintaxis que a veces ni `node --check`
  marca claramente. Si necesitas comillas dentro del texto, usa comillas
  dobles rectas (`"asi"`), nunca simples.
- Los numeros con guion como "3-2-1-1" o codigos como "SIS-0400" son seguros
  (el guion no es un caracter problematico).

## Redacciones alternativas (anti-copia, obligatorio)

Cada pregunta del banco debe tener **al menos 2 redacciones alternativas**
en `alts` (ver `architecture.md#esquema-de-secciones`). Asi, dos estudiantes
que rinden el mismo examen no leen exactamente el mismo texto, y copiarse
las respuestas por texto exacto se vuelve menos util.

Reglas para escribirlas:

- **Misma pregunta, otras palabras.** Cambia el vocabulario y la estructura
  de la frase (sinonimos, orden de la oracion, pasar de pregunta directa a
  "Cual de las siguientes..." o viceversa), sin cambiar el concepto evaluado.
  Ejemplo: "¿Que control detecta primero un acceso no autorizado?" puede
  pasar a "Entre los siguientes controles, ¿cual identifica antes un acceso
  no autorizado?".
- **Mismo nivel de exigencia.** Una alternativa no puede ser mas facil (pista
  disfrazada, por ejemplo mencionar la respuesta en el enunciado) ni mas
  dificil que el original.
- **Mismo escenario y mismos datos.** No cambies cifras, nombres de
  organizacion, plazos ni condiciones del escenario: solo la formulacion.
- **Respuesta intacta.** Las opciones (`opts`), el indice `correct` y el
  campo `just` no cambian entre redacciones. En `multiselect` el enunciado
  alternativo debe mantener "Selecciona las N..." con el mismo N. En
  `truefalse` la afirmacion alternativa debe ser igual de verdadera o falsa.
  En `dragdrop` cada alternativa usa el mismo `correct` y debe dejar un solo
  hueco.
- **Sin apostrofes ni tildes**, igual que el resto del banco. En `alts` tambien
  se usan comillas dobles para citas internas.
- Si una alternativa cambia el sentido de la pregunta, descartala y escribe
  otra. Nunca inventes una redaccion que pida otra cosa.

## Calibracion de dificultad y volumen

- Pool minimo por bloque: **8 preguntas** (`validate_sections.js` lo exige
  por defecto). Mas pool = mas variedad real entre estudiantes que rinden al
  mismo tiempo.
- Evita que dos preguntas del mismo bloque prueben literalmente el mismo
  concepto con distinto ejemplo -- diversifica los subtemas cubiertos dentro
  del pool.
- Si el usuario pide "lo mas dificil posible" o "preguntas complejas", el
  patron que mejor funciono es: escenarios largos (3-5 lineas), varias capas
  de razonamiento (el estudiante debe primero identificar el concepto correcto
  y LUEGO aplicarlo al detalle especifico del escenario), y distractores que
  mezclan datos reales de otros bloques del mismo curso (obliga a saber no
  solo el concepto sino donde encaja dentro del silabo completo).
- No sacrifiques precision tecnica por dificultad artificial: cada pregunta
  debe tener una unica respuesta defendible con el material real del curso.
  Si dudas entre dos opciones al redactar la justificacion, la pregunta esta
  mal planteada -- ajustala antes de incluirla en el pool.
