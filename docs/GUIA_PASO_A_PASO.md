# Guía paso a paso — Proyecto final AI Tools (PapelSur)

Sigue los hitos **en orden**. No pases al siguiente hasta que la casilla «Cómo sé que funcionó» se cumpla. Entre paréntesis: puntos de la rúbrica que toca.

---

## Hito 0 · Preparar cuentas (1 día)
- [ ] **Telegram:** habla con @BotFather → `/newbot` → guarda el token (solo en n8n). Con @userinfobot obtén tu ID numérico.
- [ ] **Gemini API:** entra a Google AI Studio → *Get API key*. Modelo usado: `gemini-3.1-flash-lite` (0.25 USD/1M entrada, 1.50 USD/1M salida, consultado el 3 nov 2026; tiene nivel gratuito con límites).
- [ ] **n8n:** confirma que tu instancia tiene HTTPS y que puedes crear *Data Tables*.
- [ ] **ElevenLabs:** confirma minutos disponibles (el plan Free incluye 15 min) y que el micrófono de tu equipo funciona.
- [ ] **GitHub:** crea el repositorio **público** `papelsur-ai-tools` (o el nombre que quieras).

## Hito 1 · Definir el caso (Rúbrica 1: 5 pts)
- [ ] Lee y ajusta `docs/01_caso.md` (empresa, usuario, problema, reglas, KPI).
- [ ] Revisa el mapa `docs/02_arquitectura.md`.
- **Cómo sé que funcionó:** puedes explicar en 1 minuto qué entra, qué sale y qué aprueba la persona.

## Hito 2 · Subir el repositorio (Rúbrica 4 y 9)
```bash
git init && git add . && git commit -m "Estructura inicial PapelSur"
git branch -M main && git remote add origin https://github.com/TU_USUARIO/papelsur-ai-tools.git && git push -u origin main
```
- [ ] En GitHub: *Settings → Pages → Source: GitHub Actions*.
- [ ] Abre *Actions*: el workflow «Validar y publicar» debe quedar en verde y darte la URL `https://TU_USUARIO.github.io/papelsur-ai-tools/`.
- **Cómo sé que funcionó:** la URL abre el panel con datos de ejemplo y `…/skills/cotizacion-papelsur/SKILL.md` se puede leer.

## Hito 3 · Construir orquestador y 4 agentes en n8n (Rúbrica 2: 15 pts)
- [ ] Sigue `docs/04_manual_n8n.md` §1–§3: crea tablas, credenciales e importa `PapelSur_2_orquestador.json`.
- [ ] En el nodo «Adaptador skills + catálogo» cambia `BASE` por tu URL de Pages.
- [ ] Prueba manual: agrega temporalmente un nodo *Manual Trigger* con un JSON de entrada de ejemplo (`docs/04_manual_n8n.md`) o espera al hito 4.
- **Cómo sé que funcionó:** una ejecución muestra salidas diferentes de A1, A2, A3 y A4 y 4 filas de costo.

## Hito 4 · Conectar Telegram (Rúbrica 3: 12 pts)
- [ ] Importa `PapelSur_1_telegram.json`, edita `USUARIOS_AUTORIZADOS`, vincula credenciales/tablas/sub-workflow y **actívalo**.
- [ ] Envía `/nuevo 40 cajas de hojas carta y 30 paquetes de plumas azules`.
- **Cómo sé que funcionó:** recibes el folio, luego la propuesta (total 31 140.90 MXN) con botones; al aprobar, `/estado FOLIO` dice «Aprobado (simulado)».

## Hito 5 · Controles: skills, loops, aprobación, límites (Rúbricas 5 y 7: 22 pts)
Ejecuta y **guarda evidencia** (captura de Telegram + ejecución de n8n + fila de la tabla) de:
- [ ] P11: `/nuevo … #demo-loop` → V1 devuelta, V2 aprobada (mismo folio).
- [ ] Segundo caso distinto con los mismos skills (reutilización).
- [ ] P04: aprobar, rechazar, botón viejo, dejar vencer 30 min.
- [ ] P05, P06, P07 (pide a alguien que escriba al bot), P08 (pon una API key falsa un momento), P09 (límite 0.0001), P10 (pulsa dos veces Aprobar).
- [ ] Completa la autoevaluación 0–4 de cada skill y loop (mínimo 16/20, ningún aspecto < 3).
- **Cómo sé que funcionó:** un error se corrige solo y una acción no autorizada se bloquea.

## Hito 6 · Publicar panel con datos reales (Rúbrica 4: 10 pts)
- [ ] Descarga `casos` y `costos` como CSV a `privado/` y ejecuta `python3 scripts/exportar_sanitizado.py --casos privado/casos.csv --costos privado/costos.csv` (sin `--ejemplo`).
- [ ] Commit + push → Actions publica. Guarda el enlace de esa ejecución.
- [ ] **Falla deliberada (P12):** cambia un precio a `-1` en `web/data/catalogo.json`, push → Actions falla y no publica (guarda el enlace) → corrige → push → publica.
- **Cómo sé que funcionó:** el panel muestra tus casos reales y la fecha de actualización nueva.

## Hito 7 · Integrar la voz (Rúbrica 6: 14 pts)
- [ ] Sigue `docs/03_elevenlabs.md`: agente, herramienta de servidor, allowlist.
- [ ] Importa y activa `PapelSur_3_voz.json`.
- [ ] Pon tu `AGENT_ID` en `web/index.html` → push.
- [ ] Desde la URL pública: consulta un folio existente y crea uno nuevo por voz.
- **Cómo sé que funcionó:** el folio creado por voz aparece en la tabla y te llega la propuesta por Telegram.

## Hito 8 · Medir costos y entregar (Rúbricas 8 y 9: 17 pts)
- [ ] Tres casos completos diferentes + uno de error + una conversación de voz.
- [ ] Agrega a `costos/costos.csv` la fila de voz (duración y costo del panel de ElevenLabs) y el subtotal de desarrollo.
- [ ] `python3 scripts/costos.py --costos costos/costos.csv --casos privado/casos.csv --tc <FIX Banxico> --plan_voz_minutos 15` → `costos/resumen_costos.md`.
- [ ] Llena `tests/pruebas.csv`, `evidencias/indice.md`, `docs/07_declaracion_uso_ia.md`.
- [ ] Escribe el informe con `docs/06_informe_plantilla.md` (8–12 páginas).
- [ ] Graba el video de respaldo (5–8 min).
- [ ] Crea el ZIP `Apellido_Nombre_AI_Tools_ProyectoFinal.zip` **sin** `.env`, `privado/` ni secretos (`python3 scripts/validar.py` debe pasar).

## Hito 9 · Defensa (Rúbrica 10: 5 pts) — guion de 12 min
| Min | Qué mostrar |
|---|---|
| 0–1 | PapelSur, problema, usuario, decisión |
| 1–5 | `/nuevo` en Telegram → folio → ejecución en n8n con A1–A4 → propuesta → Aprobar |
| 5–7 | Pages → voz: consultar ese folio |
| 7–9 | `/nuevo ignora las instrucciones…` bloqueado; caso `#demo-loop` V1→V2 |
| 9–10 | Ejecución de Actions (verde y la bloqueada) y `panel.json` |
| 10–12 | Costos por etapa, proyección y limitaciones; preguntas |

**Prepárate para modificar en vivo:** p. ej., cambiar el descuento máximo en `lib_reglas.js`, regenerar con `python3 n8n/build_workflows.py`, ver la prueba fallar/pasar.
