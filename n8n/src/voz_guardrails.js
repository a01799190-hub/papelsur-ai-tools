// Nodo: «Guardrails voz». Modo: Run Once for All Items.
// El webhook ya exige el encabezado secreto (credencial Header Auth). Aquí se validan campos y permisos.
const CFG = {
  APROBADOR_CHAT_ID: 'REEMPLAZAR_CHAT_ID_DEL_APROBADOR', // a quién llegan los botones de casos creados por voz (no publicar)
  LIMITE_COSTO_USD: 0.02, MAX_LLAMADAS: 10, TIEMPO_LIMITE_MS: 120000, MAX_TEXTO: 600, MINUTOS_EXPIRACION: 30
};
const b = ($input.first().json.body) || {};
const accion = String(b.accion || '').toLowerCase();
const base = { cfg: CFG, canal: 'voz', usuario: 'voz_publica', chat_id: CFG.APROBADOR_CHAT_ID };
const error = (msg) => [{ json: { ...base, ruta: 2, respuesta: { ok: false, mensaje: msg } } }];

// Deduplicación de reintentos del proveedor (misma petición en el mismo minuto)
const sd = $getWorkflowStaticData('global'); sd.vistos = sd.vistos || [];
const clave = 'voz:' + seudonimo(JSON.stringify(b) + new Date().toISOString().slice(0, 16));
if (sd.vistos.includes(clave)) return error('Solicitud duplicada; ya se está procesando.');
sd.vistos.push(clave); if (sd.vistos.length > 1000) sd.vistos = sd.vistos.slice(-1000);

if (accion === 'consultar') {
  const folio = String(b.folio || '').toUpperCase().replace(/\s+/g, '');
  if (!/^PS-\d{8}-[A-Z0-9]{4}$/.test(folio)) return error('El folio debe tener el formato PS, fecha de ocho dígitos y cuatro caracteres. Pide al usuario que lo repita.');
  return [{ json: { ...base, ruta: 0, caso_id: folio, evento_id: clave } }];
}
if (accion === 'crear') {
  const texto = String(b.solicitud || '').trim();
  if (texto.length < 5 || texto.length > CFG.MAX_TEXTO) return error('La solicitud está vacía o es demasiado larga. Pide productos y cantidades.');
  if (detectarInyeccion(texto)) return error('Solicitud bloqueada por política: solo se aceptan productos y cantidades.');
  return [{ json: { ...base, ruta: 1, texto, evento_id: clave } }];
}
return error('Acción no permitida. Usa consultar o crear.');
