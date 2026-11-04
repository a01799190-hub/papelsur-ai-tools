// Nodo: «Formatear estado». Modo: Run Once for All Items. Entrada: fila(s) de «casos» (puede venir vacía).
const g = $('Guardrails de entrada').first().json;
const filas = $input.all().map(i => i.json).filter(f => f && f.caso_id === g.caso_id);
if (!filas.length) return [{ json: { chat_id: g.chat_id, mensaje: 'No existe el folio ' + g.caso_id + ' en el registro.' } }];
const f = filas[filas.length - 1];
const etiquetas = { recibido: 'Recibido', en_proceso: 'En proceso', pendiente_aprobacion: 'Pendiente de aprobación', aprobado: 'Aprobado (simulado)', rechazado: 'Rechazado', vencido: 'Aprobación vencida', requiere_aclaracion: 'Requiere aclaración', sin_coincidencias: 'Sin coincidencias en catálogo', escalado_humano: 'Escalado a persona', bloqueado_politica: 'Bloqueado por política', detenido_revision: 'Detenido en revisión', detenido_presupuesto: 'Detenido por límite', error: 'Error controlado', error_validacion: 'Error de validación' };
let msg = '📋 Folio ' + f.caso_id + '\nEstado: ' + (etiquetas[f.estado] || f.estado) + '\nVersión: ' + f.version;
if (Number(f.total_mxn) > 0) msg += '\nTotal: $' + Number(f.total_mxn).toFixed(2) + ' MXN (RESULTADO SIMULADO)';
msg += '\nActualizado: ' + String(f.actualizado).replace('T', ' ').slice(0, 16) + ' UTC';
return [{ json: { chat_id: g.chat_id, mensaje: msg } }];
