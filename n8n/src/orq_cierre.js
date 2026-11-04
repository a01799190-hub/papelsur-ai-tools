// Nodo: «Orquestador – cierre». Modo: Run Once for Each Item. Respuesta final del sub-workflow.
const s = copia($json);
if (s.estado === 'en_proceso') detener(s, 'error', 'Cierre inesperado sin estado final');
const fin = Date.now();
const porAgente = {};
for (const c of s.costos) porAgente[c.agente] = Number(((porAgente[c.agente] || 0) + c.costo).toFixed(8));
const mensajes = {
  pendiente_aprobacion: 'Propuesta lista y revisada. Pendiente de aprobación humana.',
  requiere_aclaracion: s.mensaje_usuario || 'Necesitamos más información.',
  sin_coincidencias: s.mensaje_usuario || 'Sin coincidencias en el catálogo.',
  escalado_humano: s.mensaje_usuario || 'Derivado a un asesor humano (simulado).',
  bloqueado_politica: 'Solicitud bloqueada por política de seguridad.',
  detenido_revision: 'El revisor no aprobó la propuesta tras 3 versiones; el caso se detuvo.',
  detenido_presupuesto: 'El caso se detuvo al alcanzar el límite de costo, llamadas o tiempo.',
  error: 'Ocurrió un error controlado; el caso se detuvo. Intenta más tarde.',
  error_validacion: 'La solicitud no pasó la validación; el caso se detuvo.'
};
return { json: {
  caso_id: s.caso_id, canal: s.canal, estado: s.estado, motivo: s.motivo_cierre || '',
  mensaje_usuario: mensajes[s.estado] || 'Caso cerrado.',
  propuesta: s.estado === 'pendiente_aprobacion' ? s.propuesta : null,
  historial_versiones: s.historial_versiones,
  salidas: s.salidas, traza: s.traza, costos: s.costos,
  resumen_costos: { total_usd: Number(s.gastado_usd.toFixed(8)), llamadas: s.llamadas, por_agente: porAgente },
  duracion_ms: fin - s.t_inicio_ms, minutos_expiracion: s.minutos_expiracion
} };
