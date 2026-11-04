// ===== Nodo «Respuesta consulta voz» (Run Once for All Items) =====
// __CONSULTA__
const g = $('Guardrails voz').first().json;
const filas = $input.all().map(i => i.json).filter(f => f && f.caso_id === g.caso_id);
if (!filas.length) return [{ json: { respuesta: { ok: false, folio: g.caso_id, mensaje: 'No existe ese folio en el registro de prueba. No inventes un estado.' } } }];
const f = filas[filas.length - 1];
return [{ json: { respuesta: { ok: true, folio: f.caso_id, estado: f.estado, version: Number(f.version), total_mxn: Number(f.total_mxn), actualizado: f.actualizado, nota: 'RESULTADO SIMULADO de empresa ficticia' } } }];
// ===== Nodo «Respuesta creación voz» (Run Once for All Items) =====
// __CREACION__
const c = $('Crear caso (voz)').first().json;
return [{ json: { respuesta: { ok: true, folio: c.caso_id, estado: 'en_proceso', mensaje: 'Caso creado. La propuesta se revisa y la aprueba una persona por Telegram. Consulta el folio en un minuto.' } } }];
