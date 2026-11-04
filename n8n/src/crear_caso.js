// Nodo: «Crear caso». Modo: Run Once for All Items.
// Entrada: salida de guardrails (Telegram o voz). Salida: EXACTAMENTE las columnas de la tabla «casos».
const g = $input.first().json;
const d = new Date();
const fecha = d.toISOString().slice(0, 10).replace(/-/g, '');
const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let suf = ''; for (let i = 0; i < 4; i++) suf += alfabeto[Math.floor(Math.random() * alfabeto.length)];
const caso_id = 'PS-' + fecha + '-' + suf;
const entrada = {
  caso_id,
  canal: g.canal || 'telegram',
  usuario: g.usuario,
  objetivo: 'cotizacion',
  texto: g.texto,
  modo: 'SIMULADO',
  limite_costo_usd: g.cfg.LIMITE_COSTO_USD,
  max_llamadas: g.cfg.MAX_LLAMADAS,
  tiempo_limite_ms: g.cfg.TIEMPO_LIMITE_MS,
  minutos_expiracion: g.cfg.MINUTOS_EXPIRACION,
  demo_v1: /#demo-loop/i.test(g.texto || ''),
  evento_id: g.evento_id,
  creado: d.toISOString()
};
return [{ json: {
  caso_id,
  canal: entrada.canal,
  usuario: g.usuario,
  chat_id: String(g.chat_id || ''),
  estado: 'recibido',
  version: 0,
  texto: g.texto,
  entrada_json: JSON.stringify(entrada),
  resultado_json: '',
  total_mxn: 0,
  expira_en: '',
  nonce: '',
  decision: '',
  decision_por: '',
  costo_usd: 0,
  evento_id: g.evento_id,
  creado: entrada.creado,
  actualizado: entrada.creado
} }];
