# PapelSur — Proyecto final individual de AI Tools

Sistema de cotizaciones para una distribuidora **ficticia** de papelería: una solicitud entra por **Telegram** o por **voz (ElevenLabs)**, un **orquestador** coordina **4 agentes** (recepción, catálogo, cotizador, revisor), una persona **aprueba en Telegram** y el resultado se publica sanitizado en **GitHub Pages** mediante **GitHub Actions**. Todo en modo **SIMULADO**.

👉 Empieza por **[docs/GUIA_PASO_A_PASO.md](docs/GUIA_PASO_A_PASO.md)**.

## Dónde corre cada componente
| Componente | Lugar |
|---|---|
| Bot, orquestador, agentes, tablas `casos`/`costos` | n8n (HTTPS) — `n8n/*.json` |
| Modelo | Gemini API `gemini-3.1-flash-lite` (endpoint compatible con OpenAI) |
| Panel, catálogo y skills públicos | GitHub Pages — `web/`, `skills/` |
| Validación y despliegue | `.github/workflows/validar-y-publicar.yml` |
| Voz | ElevenLabs (widget en `web/index.html` + herramienta → `n8n/PapelSur_3_voz.json`) |

## Requisitos y versiones
Python 3.12+, Node 20+ (solo para pruebas locales y Actions), n8n con Data Tables, cuenta de Telegram, Gemini API, ElevenLabs y GitHub. Anota aquí las versiones exactas de tu instancia: n8n `____`, modelo `gemini-3.1-flash-lite`, fecha de verificación de tarifas `2026-11-03`.

## Estructura
```
agentes/      prompts de los 5 roles y contratos JSON
n8n/          workflows exportables (sin secretos), src/ con el código de los nodos y build_workflows.py
skills/       2 skills (negocio y calidad) con ejemplos
loops/        definición de los 2 loops y evidencia
web/          index.html (panel + voz) y data/ (panel.json, catalogo.json)
scripts/      validar.py, exportar_sanitizado.py, costos.py
tests/        pruebas automáticas, simulaciones y matriz pruebas.csv
datos/        muestra sanitizada y casos de referencia
costos/       tarifas.csv, costos.csv, resumen_costos.md
docs/         guía, caso, arquitectura, ElevenLabs, manual n8n, diccionario, informe, declaración IA
evidencias/   índice por criterio de la rúbrica
```

## Credenciales (solo por nombre; ver `.env.example`)
`Telegram PapelSur Bot`, `Gemini API (Header Auth)`, `Voz ElevenLabs (Header Auth)` en n8n; `AGENT_ID` público en `web/index.html`. Nunca se versionan valores.

## Probar sin servicios externos
```bash
python3 n8n/build_workflows.py      # regenera los JSON de n8n desde n8n/src
node tests/test_reglas.js           # cálculos deterministas
node tests/simular_orquestador.js   # orquestador + 4 agentes con modelo simulado (13 verificaciones)
node tests/simular_telegram.js      # guardrails y aprobaciones (12 verificaciones)
python3 scripts/validar.py          # los mismos controles que bloquean la publicación
```

## Caso de prueba y resultado esperado
Telegram: `/nuevo 40 cajas de hojas carta y 30 paquetes de plumas azules` → folio `PS-AAAAMMDD-XXXX` → propuesta: subtotal 29 180.00, descuento 8 % (2 334.40), envío 0, IVA 4 295.30, **total 31 140.90 MXN** → «✅ Aprobar» → `/estado FOLIO` = Aprobado (simulado).

## Actualización del panel
Manual y reproducible: exportar CSV de n8n a `privado/` → `scripts/exportar_sanitizado.py` → commit → Actions valida y publica (retraso: minutos).

## Parada
Desactiva los workflows 1 y 3 en n8n; Pages queda publicado solo con datos estáticos.

## Solución de problemas
Ver la sección «Errores frecuentes» de la guía del curso y `docs/04_manual_n8n.md` §4. Limitaciones conocidas: seudónimo no criptográfico; deduplicación en static data de n8n; parámetros de nodos Data Table/Telegram pueden requerir ajuste según la versión de n8n; exportación del panel manual.
