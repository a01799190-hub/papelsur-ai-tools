# Credenciales del proyecto (solo nombres, sin valores)

Los valores reales viven en las credenciales de n8n y en el panel de ElevenLabs. Nunca se guardan en el repositorio ni en el ZIP. El archivo `.env.example` de la raíz contiene la misma lista.

| Nombre | Dónde se configura | Formato |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | n8n → Credentials → «Telegram PapelSur Bot» (tipo Telegram API) | Token que entrega @BotFather |
| `GEMINI_API_KEY` | n8n → Credentials → «Gemini API (Header Auth)» | Name = `Authorization`, Value = `Bearer <clave>` |
| `VOZ_WEBHOOK_SECRET` | n8n → Credentials → «Voz ElevenLabs (Header Auth)» y el mismo encabezado en la herramienta `papelsur_casos` de ElevenLabs | Name = `X-PapelSur-Key`, Value = secreto largo |
| `ELEVENLABS_AGENT_ID` | `web/index.html` (constante `AGENT_ID`) | Público; se recomienda restringir por dominio |
| `TELEGRAM_USUARIOS_AUTORIZADOS` | Nodo «Guardrails de entrada» del workflow 1 | Lista de IDs numéricos de Telegram (no se publica) |
| `APROBADOR_CHAT_ID` | Nodo «Guardrails voz» del workflow 3 | ID numérico de Telegram de la persona aprobadora (no se publica) |

Los JSON de `n8n/` se entregan con estas listas vacías. Tras importarlos, captura tus propios IDs (por ejemplo, con @userinfobot) y vuelve a vincular las tres credenciales.
