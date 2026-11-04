// Nodo: «A3 preparar». Modo: Run Once for All Items. Recibe de A2 o del loop de calidad (A4 → A3).
const s = copia($input.first().json);
const SYSTEM = __PROMPT_A3__;
const calc = calcularCotizacion(s.a2.lineas);       // cálculo determinista verificable
if (calc.errores.length) { detener(s, 'error_validacion', 'Cálculo inválido: ' + calc.errores.join('; ')); return [{ json: s }]; }
if (calc.requiere_escalar) {
  s.mensaje_usuario = 'El total supera 100 000 MXN; un asesor humano revisará tu solicitud (simulado).';
  detener(s, 'escalado_humano', 'Total ' + calc.total + ' MXN fuera de política; se deriva a persona');
  return [{ json: s }];
}
s.a3_calc = calc;
const version = s.iter_calidad + 1;
// Demostración V1→V2: con #demo-loop la V1 se genera SIN las reglas del skill (falla forzada y declarada).
const usarSkill = !(s.demo_v1 && version === 1);
const reglas = usarSkill ? s.skills.negocio.reglas : '(V1 de demostración: reglas del skill no aplicadas)';
traza(s, 'A3', 'skill', usarSkill ? ('Aplica skill ' + s.skills.negocio.nombre + ' v' + s.skills.negocio.version) : 'V1 de demostración sin skill (#demo-loop)');
const user = JSON.stringify({
  caso_id: s.caso_id, version, calculo: calc, advertencias: calc.advertencias.concat(s.a2.advertencias || []),
  reglas_del_skill: reglas, correcciones: s.correcciones
});
const p = prepararLlamada(s, 'A3', 'agente_3_cotizador', SYSTEM, user, 600);
if (!p.ok) detener(s, 'detenido_presupuesto', p.motivo); else s.siguiente = 'llm';
return [{ json: s }];
