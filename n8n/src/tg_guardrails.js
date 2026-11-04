// Nodo: «Guardrails de entrada» (Telegram). Modo: Run Once for All Items.
// Configuración NO secreta. Reemplaza los valores marcados antes de activar.
const CFG = {
  USUARIOS_AUTORIZADOS: ['REEMPLAZAR_TU_ID_NUMERICO_DE_TELEGRAM'], // IDs de prueba autorizados (no publicar)
  LIMITE_COSTO_USD: 0.02,
  MAX_LLAMADAS: 10,
  TIEMPO_LIMITE_MS: 120000,
  MAX_TEXTO: 1200,
  MINUTOS_EXPIRACION: 30
};
const u = $input.first().json;
const sd = $getWorkflowStaticData('global');
sd.vistos = sd.vistos || [];

// Deduplicación persistente por update_id (clave de evento). Persiste en ejecuciones de producción.
const claveEvento = 'tg:' + u.update_id;
if (sd.vistos.includes(claveEvento)) return []; // evento repetido: no produce una segunda operación
sd.vistos.push(claveEvento);
if (sd.vistos.length > 1000) sd.vistos = sd.vistos.slice(-1000);

const base = { cfg: CFG, evento_id: claveEvento, recibido: ahora() };
const cq = u.callback_query;
const msg = u.message;
const from = cq ? cq.from : (msg ? msg.from : null);
const chat = cq ? (cq.message && cq.message.chat) : (msg ? msg.chat : null);
if (!from || !chat) return [];
const userId = String(from.id);
const out = { ...base, chat_id: chat.id, usuario: seudonimo(userId) };

// Control de acceso del servidor
if (!CFG.USUARIOS_AUTORIZADOS.includes(userId)) {
  return [{ json: { ...out, ruta: 3, motivo: 'no_autorizado', mensaje: '⛔ Este bot es un entorno de prueba y tu usuario no está autorizado.' } }];
}

// Botones de aprobación: ap|CASO|VERSION|NONCE o rc|CASO|VERSION|NONCE
if (cq) {
  const m = /^(ap|rc)\|(PS-\d{8}-[A-Z0-9]{4})\|(\d{1,2})\|([a-z0-9]{6})$/.exec(String(cq.data || ''));
  if (!m) return [{ json: { ...out, ruta: 3, motivo: 'callback_invalido', mensaje: 'Botón no válido.' } }];
  return [{ json: { ...out, ruta: 2, accion: m[1] === 'ap' ? 'aprobar' : 'rechazar', caso_id: m[2], version: Number(m[3]), nonce: m[4], callback_id: cq.id } }];
}

const texto = String(msg.text || '').trim();
if (!texto) return [{ json: { ...out, ruta: 3, motivo: 'vacio', mensaje: 'Envía /nuevo seguido de tu solicitud, o /estado FOLIO.' } }];
if (texto.length > CFG.MAX_TEXTO) return [{ json: { ...out, ruta: 3, motivo: 'muy_largo', mensaje: 'Tu mensaje supera ' + CFG.MAX_TEXTO + ' caracteres. Resúmelo, por favor.' } }];

if (/^\/(start|ayuda|help)\b/i.test(texto)) {
  return [{ json: { ...out, ruta: 3, motivo: 'ayuda', mensaje: 'PapelSur (empresa ficticia, modo SIMULADO)\n• /nuevo <solicitud> — crea una cotización. Ej.: /nuevo 40 cajas de hojas carta y 30 paquetes de plumas azules\n• /estado PS-AAAAMMDD-XXXX — consulta un folio' } }];
}
const mEstado = /^\/estado\s+(PS-\d{8}-[A-Z0-9]{4})\s*$/i.exec(texto);
if (/^\/estado/i.test(texto)) {
  if (!mEstado) return [{ json: { ...out, ruta: 3, motivo: 'folio_invalido', mensaje: 'Formato de folio no válido. Ejemplo: /estado PS-20261103-AB12' } }];
  return [{ json: { ...out, ruta: 1, caso_id: mEstado[1].toUpperCase() } }];
}
const mNuevo = /^\/nuevo\s+([\s\S]{5,})$/i.exec(texto);
if (/^\/nuevo/i.test(texto)) {
  if (!mNuevo) return [{ json: { ...out, ruta: 3, motivo: 'incompleto', mensaje: 'Falta la solicitud. Ejemplo: /nuevo 10 cajas de hojas carta' } }];
  const solicitud = mNuevo[1].trim();
  if (detectarInyeccion(solicitud)) {
    return [{ json: { ...out, ruta: 3, motivo: 'inyeccion', mensaje: '🛡️ Solicitud bloqueada: contiene instrucciones o enlaces no permitidos. Describe solo los productos y cantidades.' } }];
  }
  return [{ json: { ...out, ruta: 0, texto: solicitud } }];
}
return [{ json: { ...out, ruta: 3, motivo: 'comando_desconocido', mensaje: 'No entendí. Usa /nuevo <solicitud> o /estado FOLIO. Escribe /ayuda.' } }];
