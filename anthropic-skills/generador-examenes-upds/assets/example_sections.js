// =====================================================================================
// REEMPLAZAR ESTE BLOQUE COMPLETO con las preguntas reales de la materia.
// Reglas obligatorias (ver references/question-writing-guide.md para el detalle):
//  - 4 secciones (bloques), una por cada tema grande del avance/silabo indicado.
//  - Cada seccion necesita un POOL de al menos 8 preguntas (aqui solo hay 2-3 de
//    ejemplo por brevedad); QUESTIONS_PER_SECTION elige un subconjunto al azar de
//    ese pool en cada intento, para que el examen varie entre estudiantes.
//  - Preguntas de escenario (2-4 lineas de contexto aplicado), nunca definiciones
//    sueltas. Las opciones incorrectas deben ser trampas plausibles, no absurdas.
//  - El campo "just" explica por que la correcta es correcta Y por que cada
//    incorrecta falla especificamente (no un parrafo generico).
//  - Sin tildes ni caracteres acentuados en los strings de preguntas (se usa asi en
//    todo el archivo por convencion/compatibilidad); la ñ SI se conserva cuando
//    cambia el significado de la palabra (año, diseño, etc.).
//  - NUNCA uses un apostrofe (') dentro del texto: las cadenas usan comillas
//    simples como delimitador JS. Si necesitas comillas dentro del texto, usa
//    comillas dobles rectas (") -- nunca seas literal con ' en contracciones etc.
// =====================================================================================
const SECTIONS = [

{ id:0, title:'{{BLOQUE_1_TITULO}}', icon:'\uD83D\uDCD8', color:'blue', type:'multiple',
  desc:'{{BLOQUE_1_DESCRIPCION_CORTA}}',
  questions:[
    { text:'[EJEMPLO opcion multiple] Enunciado de escenario aplicado con contexto boliviano/real, terminando en una pregunta concreta.',
      opts:['Opcion A -- distractor plausible pero incorrecto por razon especifica.','Opcion B -- la correcta, con la explicacion tecnica precisa incorporada en el propio enunciado de la opcion.','Opcion C -- distractor que invierte un concepto clave.','Opcion D -- distractor que aplica un concepto real pero fuera de contexto.'],
      correct:1,
      just:'Explicacion de por que B es correcta, y luego, opcion por opcion, por que A, C y D fallan especificamente (no un parrafo generico).'
    },
    { text:'[EJEMPLO opcion multiple 2] Otro escenario distinto que cubra un segundo subtema del bloque.',
      opts:['Opcion A.','Opcion B.','Opcion C -- correcta.','Opcion D.'],
      correct:2,
      just:'Justificacion completa opcion por opcion.'
    }
  ]
},

{ id:1, title:'{{BLOQUE_2_TITULO}}', icon:'\uD83D\uDD0D', color:'red', type:'multiselect',
  desc:'{{BLOQUE_2_DESCRIPCION_CORTA}}',
  questions:[
    { text:'[EJEMPLO seleccion multiple] Selecciona las N opciones correctas de una lista de M (indicar el numero exacto en el enunciado).',
      opts:['Opcion correcta 1.','Opcion correcta 2.','Distractor plausible pero de otro bloque/tema.','Distractor con dato real pero no mencionado en el material del curso.'],
      correct:[0,1],
      just:'Por que 0 y 1 son correctas; por que 2 y 3 NO lo son, cada una con su razon especifica (p.ej. "pertenece a otro bloque", "es un dato real pero no citado en el curso, alucinacion tipica a auditar").'
    }
  ]
},

{ id:2, title:'{{BLOQUE_3_TITULO}}', icon:'\uD83E\uDDE9', color:'teal', type:'dragdrop',
  desc:'{{BLOQUE_3_DESCRIPCION_CORTA}} -- completa cada enunciado con el termino correcto',
  questions:[
    { before:'[EJEMPLO completar espacios] Texto de contexto que termina justo antes del termino a completar: ',
      after:' -- clausula final que refuerza o contrasta el concepto.',
      correct:'Termino Exacto',
      just:'Por que ese es el termino correcto y que lo distingue de conceptos relacionados vistos en el mismo bloque.'
    },
    { before:'[EJEMPLO 2] Otro enunciado de completar espacios sobre un subtema distinto: ',
      after:'.',
      correct:'Otro Termino',
      just:'Justificacion completa.'
    }
  ]
},

{ id:3, title:'{{BLOQUE_4_TITULO}}', icon:'\u2696\uFE0F', color:'green', type:'truefalse',
  desc:'{{BLOQUE_4_DESCRIPCION_CORTA}}',
  questions:[
    { text:'[EJEMPLO verdadero/falso] Afirmacion tecnica completa que puede ser verdadera o (mas interesante pedagogicamente) una version sutilmente invertida de un concepto real del curso.',
      correct:false,
      just:'FALSO. Explicar cual es el error exacto de la afirmacion y cual es la version correcta del concepto.'
    },
    { text:'[EJEMPLO 2] Otra afirmacion, esta vez verdadera, sobre un caso aplicado visto en el curso.',
      correct:true,
      just:'VERDADERO. Explicar por que, citando el material especifico del curso que lo sustenta.'
    }
  ]
}

];
