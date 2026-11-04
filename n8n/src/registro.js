// Nodo: «Registro de resultado». Modo: Run Once for All Items.
// $json = respuesta del orquestador. Prepara fila del caso, filas de costo y mensaje de aprobación.
const res = $input.first().json;
const caso = $(__NODO_CASO__).first().json;               // fila creada al inicio (incluye chat_id privado)
const chatDestino = __CHAT_DESTINO__;                      // Telegram: chat del solicitante; Voz: chat del aprobador
const ahoraIso = new Date().toISOString();
const p = res.propuesta;
const nonce = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
const expira = new Date(Date.now() + (res.minutos_expiracion || 30) * 60000).toISOString();
const resultadoPrivado = { estado: res.estado, motivo: res.motivo, propuesta: p, historial_versiones: res.historial_versiones, traza: res.traza, resumen_costos: res.resumen_costos, duracion_ms: res.duracion_ms };
const fila_caso = {
  caso_id: res.caso_id, estado: res.estado, version: p ? p.version : 0,
  resultado_json: JSON.stringify(resultadoPrivado).slice(0, 60000),
  total_mxn: p ? p.total : 0, expira_en: p ? expira : '', nonce: p ? nonce : '',
  costo_usd: res.resumen_costos.total_usd, actualizado: ahoraIso
};
const fmt = n => Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let mensaje;
if (p) {
  const lineas = p.lineas.map(l => '• ' + l.cantidad + ' × ' + l.descripcion + ' = $' + fmt(l.importe)).join('\n');
  mensaje = '🧾 ' + p.etiqueta + ' — PapelSur (empresa ficticia)\nFolio: ' + res.caso_id + ' · versión ' + p.version + '\n\n' + lineas +
    '\n\nSubtotal: $' + fmt(p.subtotal) + '\nDescuento (' + (p.descuento_pct * 100) + '%): −$' + fmt(p.descuento) + '\nEnvío: $' + fmt(p.envio) +
    '\nIVA 16%: $' + fmt(p.iva) + '\nTOTAL: $' + fmt(p.total) + ' MXN\n\n' + p.resumen + '\n\nSupuestos:\n- ' + p.supuestos.join('\n- ') +
    '\n\nRevisada por el Agente 4. ¿Apruebas la orden de PRUEBA? Vence en ' + (res.minutos_expiracion || 30) + ' min.';
} else {
  mensaje = 'Folio ' + res.caso_id + ': ' + res.mensaje_usuario + (res.estado === 'requiere_aclaracion' ? '\nResponde con /nuevo y la solicitud completa.' : '');
}
return [{ json: {
  caso_id: res.caso_id, estado: res.estado, chat_id: chatDestino, mensaje: mensaje.slice(0, 4000),
  tiene_propuesta: p ? 1 : 0,
  cb_aprobar: p ? ('ap|' + res.caso_id + '|' + p.version + '|' + nonce) : '',
  cb_rechazar: p ? ('rc|' + res.caso_id + '|' + p.version + '|' + nonce) : '',
  fila_caso, filas_costos: res.costos
} }];
