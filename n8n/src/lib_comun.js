// ===== Utilidades comunes del orquestador (se copian en los nodos Code) =====
// Tarifa verificada en https://ai.google.dev/gemini-api/docs/pricing el 2026-11-03. Vuelve a verificarla al implementar.
const CFG_LLM = {
  URL: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  PROVEEDOR: 'Google Gemini API',
  MODELO: 'gemini-3.1-flash-lite',
  TARIFA_IN: 0.25,   // USD por 1M tokens de entrada
  TARIFA_OUT: 1.50   // USD por 1M tokens de salida
};

function ahora() { return new Date().toISOString(); }

// Seudónimo no reversible a simple vista (FNV-1a). No es criptográfico: solo evita mostrar IDs reales.
function seudonimo(v) {
  let h = 0x811c9dc5; const s = String(v);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return 'u_' + h.toString(16).padStart(8, '0');
}

const PATRONES_INYECCION = [
  /ignor(a|ar|en|e)\s+(las\s+|todas\s+las\s+|tus\s+)?(instrucciones|reglas|pol[ií]ticas)/i,
  /ignore\s+(all\s+|previous\s+|the\s+)?(instructions|rules)/i,
  /(revela|muestra|dame|imprime|env[ií]a).{0,30}(token|clave|api.?key|secret|contrase[nñ]a|prompt)/i,
  /system\s*prompt|prompt\s+de\s+sistema/i,
  /(desactiva|apaga|omite|salta).{0,30}(control|regla|guardrail|revis|aprobaci)/i,
  /(act[uú]a|finge)\s+como\s+(administrador|desarrollador|root)/i,
  /<\s*script|javascript:|https?:\/\//i
];
function detectarInyeccion(texto) { return PATRONES_INYECCION.some(p => p.test(String(texto || ''))); }

function parseJsonLLM(texto) {
  if (typeof texto !== 'string') return null;
  const t = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch (e) {
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e2) { /* sigue */ } }
    return null;
  }
}

function costoUSD(tin, tout) { return (tin * CFG_LLM.TARIFA_IN + tout * CFG_LLM.TARIFA_OUT) / 1000000; }

function traza(s, agente, estado, resumen) {
  s.traza.push({ ts: ahora(), caso_id: s.caso_id, agente, estado, resumen: String(resumen).slice(0, 300) });
}

// Loop de seguridad y costo: evalúa permisos/presupuesto ANTES de llamar al modelo.
function prepararLlamada(s, agente, etapa, system, user, maxTokens) {
  const messages = [ { role: 'system', content: system }, { role: 'user', content: user } ];
  const estIn = Math.ceil(JSON.stringify(messages).length / 4);
  const reserva = 1.2; // margen del 20 %
  const estCosto = costoUSD(estIn, maxTokens) * reserva;
  if (s.llamadas >= s.max_llamadas) return { ok: false, motivo: 'Límite de llamadas alcanzado (' + s.max_llamadas + ')' };
  if (s.gastado_usd + estCosto > s.limite_costo_usd) {
    return { ok: false, motivo: 'Presupuesto insuficiente: gastado ' + s.gastado_usd.toFixed(6) + ' + estimado ' + estCosto.toFixed(6) + ' > límite ' + s.limite_costo_usd + ' USD' };
  }
  if (Date.now() - s.t_inicio_ms > s.tiempo_limite_ms) return { ok: false, motivo: 'Tiempo límite del caso agotado' };
  s.llamadas += 1;
  s.llamada_actual = {
    llamada_id: s.caso_id + '-' + agente + '-' + String(s.llamadas).padStart(2, '0'),
    agente, etapa, t0: Date.now(), est_in: estIn, max_tokens: maxTokens,
    reintento: (agente === 'A3' && s.iter_calidad > 0) ? 1 : 0
  };
  s.llm_request = { model: CFG_LLM.MODELO, messages, temperature: 0.2, max_tokens: maxTokens, response_format: { type: 'json_object' } };
  traza(s, 'ORQ', 'invoca', agente + ' (' + s.llamada_actual.llamada_id + '), estimado ' + estCosto.toFixed(6) + ' USD');
  return { ok: true };
}

// Registra consumo medido (usage del proveedor) o estimado si no viene.
function registrarRespuesta(s, r) {
  const c = s.llamada_actual || { llamada_id: s.caso_id + '-X', agente: '?', etapa: '?', t0: Date.now(), est_in: 0, reintento: 0 };
  const dur = Date.now() - c.t0;
  let estado = 'ok', contenido = null, tin, tout, origen = 'medido';
  if (!r || r.error || !Array.isArray(r.choices) || !r.choices.length) estado = 'error_api';
  else contenido = (r.choices[0].message || {}).content || null;
  if (r && r.usage && Number.isFinite(r.usage.prompt_tokens)) {
    tin = r.usage.prompt_tokens; tout = r.usage.completion_tokens || 0;
  } else {
    tin = c.est_in; tout = estado === 'ok' ? Math.ceil(String(contenido || '').length / 4) : 0; origen = 'estimado';
  }
  const usd = costoUSD(tin, tout);
  s.gastado_usd += usd;
  s.costos.push({
    fecha_hora: ahora(), caso_id: s.caso_id, llamada_id: c.llamada_id, etapa: c.etapa, agente: c.agente,
    proveedor: CFG_LLM.PROVEEDOR, modelo: CFG_LLM.MODELO, tokens_entrada: tin, tokens_salida: tout, tokens_cache: 0,
    duracion_voz_s: '', unidad_cobro: 'USD por 1M tokens', tarifa_entrada: CFG_LLM.TARIFA_IN, tarifa_salida: CFG_LLM.TARIFA_OUT,
    costo: Number(usd.toFixed(8)), moneda: 'USD', estado, reintento: c.reintento, origen, duracion_ms: dur
  });
  delete s.llm_request; delete s.llamada_actual;
  return { estado, json: estado === 'ok' ? parseJsonLLM(contenido) : null, dur, llamada_id: c.llamada_id };
}

function salida(s, agente, estado, resultado, fuentes, advertencias, dur, ref) {
  const o = { caso_id: s.caso_id, agente, estado, resultado, fuentes: fuentes || [], advertencias: advertencias || [], duracion_ms: dur || 0, ref_consumo: ref || null };
  s.salidas[agente] = o;
  return o;
}

function detener(s, estado, motivo) {
  s.estado = estado; s.motivo_cierre = motivo; s.siguiente = 'cierre';
  traza(s, 'ORQ', estado, motivo);
}

function copia(o) { return JSON.parse(JSON.stringify(o)); }
