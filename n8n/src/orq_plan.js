// Nodo: «Orquestador – plan y presupuesto». Modo: Run Once for All Items.
const e = $input.first().json;
const s = {
  caso_id: e.caso_id, canal: e.canal, usuario: e.usuario, objetivo: e.objetivo, texto: e.texto, modo: e.modo,
  limite_costo_usd: Math.min(Number(e.limite_costo_usd) || 0.02, 0.05),
  max_llamadas: Math.min(Number(e.max_llamadas) || 10, 12),
  tiempo_limite_ms: Math.min(Number(e.tiempo_limite_ms) || 120000, 180000),
  minutos_expiracion: Number(e.minutos_expiracion) || 30,
  max_versiones: 3,
  demo_v1: !!e.demo_v1,
  skills: e.skills || null, catalogo: e.catalogo || null, adaptador: e.adaptador,
  plan: ['A1', 'A2', 'A3', 'A4'],
  estado: 'en_proceso', siguiente: 'A1', motivo_cierre: '',
  traza: [], costos: [], salidas: {}, historial_versiones: [], correcciones: [],
  gastado_usd: 0, llamadas: 0, iter_calidad: 0,
  t_inicio_ms: Date.now(), t_inicio: ahora()
};
traza(s, 'ORQ', 'inicio', 'Plan A1→A2→A3→A4; límite ' + s.limite_costo_usd + ' USD, ' + s.max_llamadas + ' llamadas, ' + s.max_versiones + ' versiones');

// Validación del contrato de entrada (rechaza sin enviar al modelo)
const errores = [];
if (!/^PS-\d{8}-[A-Z0-9]{4}$/.test(String(s.caso_id))) errores.push('caso_id inválido');
if (!['telegram', 'voz'].includes(s.canal)) errores.push('canal no permitido');
if (s.objetivo !== 'cotizacion') errores.push('objetivo no permitido');
if (s.modo !== 'SIMULADO') errores.push('solo se permite modo SIMULADO');
if (typeof s.texto !== 'string' || s.texto.length < 5 || s.texto.length > 1200) errores.push('texto fuera de longitud');
if (errores.length) { detener(s, 'error_validacion', 'Contrato de entrada inválido: ' + errores.join('; ')); return [{ json: s }]; }

// Guardrail de inyección del lado servidor (aplica a todos los canales)
if (detectarInyeccion(s.texto)) { detener(s, 'bloqueado_politica', 'Inyección de instrucciones o enlace detectado; no se llamó al modelo'); return [{ json: s }]; }

if (!s.adaptador || !s.adaptador.ok) { detener(s, 'error', 'No se pudieron cargar skills/catálogo: ' + ((s.adaptador || {}).error || 'desconocido')); return [{ json: s }]; }
traza(s, 'ORQ', 'skills', 'Cargados ' + s.skills.negocio.nombre + ' v' + s.skills.negocio.version + ' y ' + s.skills.calidad.nombre + ' v' + s.skills.calidad.version + '; ' + s.catalogo.version);
return [{ json: s }];
