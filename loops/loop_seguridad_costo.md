# Loop 2 — Seguridad y costo

**Secuencia:** Evaluar permisos y presupuesto → ejecutar paso autorizado → registrar consumo → revisar límite y resultado → continuar o detener.

| Elemento | Definición |
|---|---|
| Entrada | Estado del caso antes de cada llamada al modelo |
| Responsable | Orquestador (`prepararLlamada` y `registrarRespuesta` en `n8n/src/lib_comun.js`) |
| Criterios para continuar | llamadas < 10; gastado + estimado × 1.2 ≤ 0.02 USD; tiempo < 120 s; salida válida del agente |
| Máximo de iteraciones | 10 llamadas por caso (4 normales + hasta 2 correcciones + margen) |
| Tiempo límite | 120 s por caso; 30 s por llamada HTTP; 2 intentos con 2 s de espera |
| Presupuesto | 0.02 USD por caso con reserva del 20 % |
| Acción de retorno | Si la API falla, un reintento acotado (nodo HTTP); si persiste, error controlado |
| Estado al agotar el límite | `detenido_presupuesto` o `error` — se registra la causa en la traza |

**Antes de cualquier llamada** se aplican guardrails sin costo: usuario autorizado, longitud, inyección de instrucciones y URLs. Si fallan, no se llama al modelo (costo 0, `bloqueado_politica`).

**Prueba P09:** crea un caso con `limite_costo_usd` muy bajo (cámbialo temporalmente en «Guardrails de entrada» a 0.0001): el caso termina en `detenido_presupuesto` sin llamadas.

## Autoevaluación (0–4)
| Claridad | Contexto/secuencia | Evidencia | Control/retorno | Utilidad | Total |
|---|---|---|---|---|---|
| 4 | 4 | 3 (completar con tu traza real) | 4 | 4 | 19/20 |
