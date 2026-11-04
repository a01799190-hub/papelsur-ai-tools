# Manual de importación y operación en n8n

> Los JSON se generan con `python3 n8n/build_workflows.py` desde `n8n/src/*.js`. Fueron validados en sintaxis y con simulación local, pero **no** en tu instancia: al importar revisa cada nodo marcado en rojo. Los parámetros de los nodos Data Table y Telegram pueden variar según tu versión de n8n.

## 1. Tablas de datos (Data Tables)
Crea en *Overview → Data Tables*:

**casos:** `caso_id` (string), `canal`, `usuario`, `chat_id`, `estado`, `version` (number), `texto`, `entrada_json`, `resultado_json`, `total_mxn` (number), `expira_en`, `nonce`, `decision`, `decision_por`, `costo_usd` (number), `evento_id`, `creado`, `actualizado`.

**costos:** `fecha_hora`, `caso_id`, `llamada_id`, `etapa`, `agente`, `proveedor`, `modelo`, `tokens_entrada` (number), `tokens_salida` (number), `tokens_cache` (number), `duracion_voz_s`, `unidad_cobro`, `tarifa_entrada` (number), `tarifa_salida` (number), `costo` (number), `moneda`, `estado`, `reintento` (number), `origen`, `duracion_ms` (number).

(Las columnas sin tipo son string.)

## 2. Credenciales (Settings → Credentials)
| Nombre exacto | Tipo | Valor |
|---|---|---|
| Telegram PapelSur Bot | Telegram API | token de @BotFather |
| Gemini API (Header Auth) | Header Auth | Name `Authorization`, Value `Bearer TU_CLAVE` (Google AI Studio) |
| Voz ElevenLabs (Header Auth) | Header Auth | Name `X-PapelSur-Key`, Value secreto largo |

## 3. Importar en este orden
1. `PapelSur_2_orquestador.json` → en «Adaptador skills + catálogo» cambia `BASE` por tu URL de Pages. Selecciona la credencial Gemini en los 4 nodos «LLM A1..A4». Guarda.
2. `PapelSur_1_telegram.json` → en «Guardrails de entrada» pon tu ID numérico de Telegram (obtenlo con @userinfobot). Selecciona credencial Telegram en todos los nodos Telegram, las tablas en los nodos Data Table y el workflow 2 en «Ejecutar orquestador». **Actívalo.**
3. `PapelSur_3_voz.json` → pon `APROBADOR_CHAT_ID` (tu chat). Selecciona credenciales, tablas y el workflow 2. **Actívalo** y copia la *Production URL* del webhook.

### Prueba aislada del workflow 2 (opcional)
Agrega un *Manual Trigger* + nodo *Code* que devuelva este JSON y conéctalo a «Adaptador skills + catálogo»:
```json
{ "caso_id": "PS-20261103-TEST", "canal": "telegram", "usuario": "u_prueba01", "objetivo": "cotizacion",
  "texto": "40 cajas de hojas carta y 30 paquetes de plumas azules", "modo": "SIMULADO",
  "limite_costo_usd": 0.02, "max_llamadas": 10, "tiempo_limite_ms": 120000, "minutos_expiracion": 30, "demo_v1": false }
```
Bórralo antes de exportar el workflow.

## 4. Reglas de operación
- Un solo receptor por bot: no uses otro webhook ni polling con el mismo token. Para pruebas aisladas crea un segundo bot.
- La deduplicación usa *static data*, que solo persiste en ejecuciones de producción (workflow activo).
- Las URL de prueba (`/webhook-test/`) solo sirven mientras pulsas «Listen»; ElevenLabs debe usar la de producción (`/webhook/`).
- Mantén n8n disponible durante la evaluación (Cloud, o equipo encendido con HTTPS si es autohospedado).

## 5. Ejecutar un caso
En Telegram: `/nuevo 40 cajas de hojas carta y 30 paquetes de plumas azules` → recibes folio → propuesta con botones → «✅ Aprobar» → confirmación → `/estado FOLIO` muestra «Aprobado (simulado)».

## 6. Exportar evidencias y datos
- *Executions*: guarda capturas de una ejecución exitosa y una con rama de error.
- Descarga las tablas `casos` y `costos` como CSV a una carpeta `privado/` (ignorada por git) y ejecuta:
  `python3 scripts/exportar_sanitizado.py --casos privado/casos.csv --costos privado/costos.csv`
  Luego `git add web/data/panel.json datos/casos_sanitizados.csv costos/costos.csv && git commit && git push`. Actions valida y publica. **Frecuencia:** manual tras cada sesión de pruebas (retraso esperado: minutos).
- Antes de exportar workflows desde n8n, borra datos fijados (*pinned data*) y revisa que no haya valores secretos; `scripts/validar.py` lo vuelve a comprobar.
