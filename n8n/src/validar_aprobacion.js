// Nodo: «Validar aprobación». Modo: Run Once for All Items.
// Solo el usuario autorizado, con la versión y el nonce vigentes y antes de expirar, puede aprobar.
const g = $('Guardrails de entrada').first().json;
const filas = $input.all().map(i => i.json).filter(f => f && f.caso_id === g.caso_id);
const ahoraIso = new Date().toISOString();
const r = (aplicar, mensaje, fila) => [{ json: { aplicar: aplicar ? 1 : 0, chat_id: g.chat_id, mensaje, fila: fila || null } }];
if (!filas.length) return r(false, 'No existe el folio ' + g.caso_id + '.');
const f = filas[filas.length - 1];
if (['aprobado', 'rechazado', 'vencido'].includes(f.estado)) return r(false, 'La decisión del folio ' + f.caso_id + ' ya estaba registrada (' + f.estado + '). No se repite la operación.');
if (f.estado !== 'pendiente_aprobacion') return r(false, 'El folio ' + f.caso_id + ' no está pendiente de aprobación (estado: ' + f.estado + ').');
if (Number(f.version) !== g.version || String(f.nonce) !== g.nonce) return r(false, 'Ese botón corresponde a una versión anterior de la propuesta. Usa el botón del mensaje más reciente.');
if (f.expira_en && new Date(f.expira_en).getTime() < Date.now()) {
  return r(true, '⌛ La aprobación del folio ' + f.caso_id + ' venció. No se ejecutó ninguna acción. Crea un nuevo caso con /nuevo.',
    { caso_id: f.caso_id, estado: 'vencido', decision: 'vencido', decision_por: 'sistema', actualizado: ahoraIso });
}
if (g.accion === 'rechazar') {
  return r(true, '❌ Propuesta v' + f.version + ' del folio ' + f.caso_id + ' rechazada. No se ejecutó ninguna acción.',
    { caso_id: f.caso_id, estado: 'rechazado', decision: 'rechazado', decision_por: g.usuario, actualizado: ahoraIso });
}
return r(true, '✅ RESULTADO SIMULADO: orden de prueba del folio ' + f.caso_id + ' (v' + f.version + ') aprobada y registrada. No se realizó ninguna compra, pago ni envío real.',
  { caso_id: f.caso_id, estado: 'aprobado', decision: 'aprobado', decision_por: g.usuario, actualizado: ahoraIso });
