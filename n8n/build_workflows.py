#!/usr/bin/env python3
"""Genera los 3 workflows de n8n (JSON importable, SIN secretos) a partir de n8n/src/*.js y agentes/*.md.
Uso:  python3 n8n/build_workflows.py
"""
import json, re, uuid, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SRC = RAIZ / "n8n" / "src"
OUT = RAIZ / "n8n"

def leer(n): return (SRC / n).read_text(encoding="utf-8")
LIB_COMUN = leer("lib_comun.js")
LIB_REGLAS = leer("lib_reglas.js")

def prompt(md):
    t = (RAIZ / "agentes" / md).read_text(encoding="utf-8")
    m = re.search(r"```text\n(.*?)\n```", t, re.S)
    assert m, md
    return m.group(1)

PROMPTS = {"__PROMPT_A1__": prompt("agente1_recepcion.md"), "__PROMPT_A2__": prompt("agente2_catalogo.md"),
           "__PROMPT_A3__": prompt("agente3_cotizador.md"), "__PROMPT_A4__": prompt("agente4_revisor.md")}

def js(nombre, libs=True, reemplazos=None):
    cuerpo = leer(nombre) if nombre.endswith(".js") else nombre
    for k, v in PROMPTS.items():
        cuerpo = cuerpo.replace(k, json.dumps(v, ensure_ascii=False))
    for k, v in (reemplazos or {}).items():
        cuerpo = cuerpo.replace(k, v)
    return (LIB_COMUN + "\n" + LIB_REGLAS + "\n" + cuerpo) if libs else cuerpo

class WF:
    def __init__(self, nombre):
        self.nombre, self.nodes, self.conn, self.x, self.y = nombre, [], {}, 0, 300
    def add(self, name, ntype, ver, params, pos, **extra):
        n = {"parameters": params, "id": str(uuid.uuid4()), "name": name, "type": ntype, "typeVersion": ver, "position": pos}
        n.update(extra); self.nodes.append(n); return name
    def link(self, a, b, out=0):
        m = self.conn.setdefault(a, {"main": []})["main"]
        while len(m) <= out: m.append([])
        m[out].append({"node": b, "type": "main", "index": 0})
    def code(self, name, src, pos, each=False, **kw):
        return self.add(name, "n8n-nodes-base.code", 2,
                        {"mode": "runOnceForEachItem" if each else "runOnceForAllItems", "jsCode": src}, pos, **kw)
    def switch(self, name, expr, n, pos):
        return self.add(name, "n8n-nodes-base.switch", 3.2,
                        {"mode": "expression", "numberOutputs": n, "output": "={{ " + expr + " }}", "options": {}}, pos)
    def dump(self, archivo, notas):
        data = {"name": self.nombre, "nodes": self.nodes, "connections": self.conn, "active": False,
                "settings": {"executionOrder": "v1", "saveManualExecutions": True}, "pinData": {},
                "meta": {"notas": notas, "generado_por": "n8n/build_workflows.py"}}
        (OUT / archivo).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

CRED_TG = {"telegramApi": {"id": "REVINCULAR", "name": "Telegram PapelSur Bot"}}
CRED_LLM = {"httpHeaderAuth": {"id": "REVINCULAR", "name": "Gemini API (Header Auth)"}}
CRED_VOZ = {"httpHeaderAuth": {"id": "REVINCULAR", "name": "Voz ElevenLabs (Header Auth)"}}

def tabla(nombre):
    return {"__rl": True, "mode": "list", "value": "", "cachedResultName": nombre}

def dt_insert(wf, name, tabla_n, pos):
    return wf.add(name, "n8n-nodes-base.dataTable", 1, {"resource": "row", "operation": "insert", "dataTableId": tabla(tabla_n),
                  "columns": {"mappingMode": "autoMapInputData", "value": {}, "matchingColumns": [], "schema": []}, "options": {}}, pos)

def dt_get(wf, name, expr, pos):
    return wf.add(name, "n8n-nodes-base.dataTable", 1, {"resource": "row", "operation": "get", "dataTableId": tabla("casos"),
                  "matchType": "allConditions", "filters": {"conditions": [{"keyName": "caso_id", "condition": "eq", "keyValue": "={{ " + expr + " }}"}]},
                  "limit": 5}, pos, alwaysOutputData=True)

def dt_update(wf, name, pos):
    return wf.add(name, "n8n-nodes-base.dataTable", 1, {"resource": "row", "operation": "update", "dataTableId": tabla("casos"),
                  "matchType": "allConditions", "filters": {"conditions": [{"keyName": "caso_id", "condition": "eq", "keyValue": "={{ $json.caso_id }}"}]},
                  "columns": {"mappingMode": "autoMapInputData", "value": {}, "matchingColumns": [], "schema": []}, "options": {}}, pos)

def tg_send(wf, name, pos, botones=False):
    p = {"chatId": "={{ $json.chat_id }}", "text": "={{ $json.mensaje }}", "additionalFields": {"appendAttribution": False}}
    if botones:
        p["replyMarkup"] = "inlineKeyboard"
        p["inlineKeyboard"] = {"rows": [{"row": {"buttons": [
            {"text": "✅ Aprobar", "additionalFields": {"callback_data": "={{ $json.cb_aprobar }}"}},
            {"text": "❌ Rechazar", "additionalFields": {"callback_data": "={{ $json.cb_rechazar }}"}}]}}]}
    return wf.add(name, "n8n-nodes-base.telegram", 1.2, p, pos, credentials=CRED_TG, onError="continueRegularOutput")

def exec_orq(wf, name, pos):
    return wf.add(name, "n8n-nodes-base.executeWorkflow", 1.2, {"workflowId": {"__rl": True, "mode": "list", "value": "",
                  "cachedResultName": "PapelSur – 2 Orquestador y agentes"}, "options": {"waitForSubWorkflow": True}}, pos)

def bloque_registro(wf, origen, nodo_caso, x, y, mensaje_sin_botones=True):
    """Registro del resultado: actualizar caso, insertar costos y enviar mensaje (con o sin botones)."""
    reg = wf.code("Registro de resultado" + ("" if nodo_caso == "Crear caso" else " (voz)"),
                  js("registro.js", libs=False, reemplazos={"__NODO_CASO__": json.dumps(nodo_caso), "__CHAT_DESTINO__": "caso.chat_id"}), [x, y])
    wf.link(origen, reg)
    suf = "" if nodo_caso == "Crear caso" else " (voz)"
    fila = wf.code("Fila caso" + suf, "return [{ json: $input.first().json.fila_caso }];", [x + 220, y - 160]); wf.link(reg, fila)
    upd = dt_update(wf, "Actualizar caso" + suf, [x + 440, y - 160]); wf.link(fila, upd)
    fc = wf.code("Filas de costo" + suf, "return ($input.first().json.filas_costos || []).map(c => ({ json: c }));", [x + 220, y]); wf.link(reg, fc)
    ins = dt_insert(wf, "Insertar costos" + suf, "costos", [x + 440, y]); wf.link(fc, ins)
    sw = wf.switch("¿Hay propuesta?" + suf, "$json.tiene_propuesta === 1 ? 0 : 1", 2, [x + 220, y + 180]); wf.link(reg, sw)
    b = tg_send(wf, "Telegram: propuesta con botones" + suf, [x + 440, y + 120], botones=True); wf.link(sw, b, 0)
    if mensaje_sin_botones:
        t = tg_send(wf, "Telegram: resultado sin propuesta" + suf, [x + 440, y + 260]); wf.link(sw, t, 1)

# ---------------- Workflow 2: Orquestador y agentes ----------------
o = WF("PapelSur – 2 Orquestador y agentes")
o.add("Entrada orquestador", "n8n-nodes-base.executeWorkflowTrigger", 1.1, {"inputSource": "passthrough"}, [0, 300])
o.code("Adaptador skills + catálogo", js("orq_adaptador.js", libs=False), [220, 300]); o.link("Entrada orquestador", "Adaptador skills + catálogo")
o.code("Orquestador – plan y presupuesto", js("orq_plan.js"), [440, 300]); o.link("Adaptador skills + catálogo", "Orquestador – plan y presupuesto")
cierre = o.code("Orquestador – cierre", js("orq_cierre.js"), [3700, 700], each=True)
sw0 = o.switch("¿Continuar? (plan)", "$json.siguiente === 'cierre' ? 1 : 0", 2, [660, 300]); o.link("Orquestador – plan y presupuesto", sw0); o.link(sw0, cierre, 1)
prev = sw0
x = 880
for ag, nom in [("A1", "A1"), ("A2", "A2"), ("A3", "A3")]:
    prep = o.code(f"{ag} preparar", js(f"{ag.lower()}_preparar.js"), [x, 300]); o.link(prev, prep, 0)
    swp = o.switch(f"¿Llamar modelo {ag}?", "$json.siguiente === 'llm' ? 0 : 1", 2, [x + 200, 300]); o.link(prep, swp); o.link(swp, cierre, 1)
    http = o.add(f"LLM {ag}", "n8n-nodes-base.httpRequest", 4.2, {"method": "POST", "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                 "authentication": "genericCredentialType", "genericAuthType": "httpHeaderAuth", "sendBody": True, "specifyBody": "json",
                 "jsonBody": "={{ JSON.stringify($json.llm_request) }}", "options": {"timeout": 30000}}, [x + 400, 300],
                 credentials=CRED_LLM, retryOnFail=True, maxTries=2, waitBetweenTries=2000, onError="continueRegularOutput")
    o.link(swp, http, 0)
    val = o.code(f"{ag} validar", js(f"{ag.lower()}_validar.js"), [x + 600, 300], each=True); o.link(http, val)
    swv = o.switch(f"¿Continuar tras {ag}?", "$json.siguiente === 'cierre' ? 1 : 0", 2, [x + 800, 300]); o.link(val, swv); o.link(swv, cierre, 1)
    prev = swv
    x += 1000
# A4
p4 = o.code("A4 preparar", js("a4_preparar.js"), [x, 300]); o.link(prev, p4, 0)
sw4 = o.switch("¿Revisión con modelo?", "$json.siguiente === 'llm' ? 0 : ($json.siguiente === 'dictamen' ? 1 : 2)", 3, [x + 200, 300]); o.link(p4, sw4)
h4 = o.add("LLM A4", "n8n-nodes-base.httpRequest", 4.2, {"method": "POST", "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
           "authentication": "genericCredentialType", "genericAuthType": "httpHeaderAuth", "sendBody": True, "specifyBody": "json",
           "jsonBody": "={{ JSON.stringify($json.llm_request) }}", "options": {"timeout": 30000}}, [x + 400, 220],
           credentials=CRED_LLM, retryOnFail=True, maxTries=2, waitBetweenTries=2000, onError="continueRegularOutput")
o.link(sw4, h4, 0)
d4 = o.code("A4 dictamen (loop de calidad)", js("a4_dictamen.js"), [x + 600, 300], each=True)
o.link(h4, d4); o.link(sw4, d4, 1); o.link(sw4, cierre, 2)
swd = o.switch("Loop de calidad", "$json.siguiente === 'liberar' ? 0 : ($json.siguiente === 'corregir' ? 1 : 2)", 3, [x + 800, 300]); o.link(d4, swd)
o.link(swd, cierre, 0); o.link(swd, "A3 preparar", 1); o.link(swd, cierre, 2)
for n in o.nodes:
    if n["name"] == "Orquestador – cierre": n["position"] = [x + 1050, 300]
o.dump("PapelSur_2_orquestador.json", "Sub-workflow con orquestador determinista y 4 agentes. Revincular credencial 'Gemini API (Header Auth)' en los 4 nodos LLM y editar BASE en el Adaptador.")

# ---------------- Workflow 1: Telegram ----------------
t = WF("PapelSur – 1 Telegram (entrada única)")
t.add("Telegram Trigger", "n8n-nodes-base.telegramTrigger", 1.1, {"updates": ["message", "callback_query"], "additionalFields": {}}, [0, 400],
      credentials=CRED_TG, webhookId=str(uuid.uuid4()))
t.code("Guardrails de entrada", js("tg_guardrails.js"), [220, 400]); t.link("Telegram Trigger", "Guardrails de entrada")
t.switch("Ruta", "$json.ruta", 4, [440, 400]); t.link("Guardrails de entrada", "Ruta")
# 0 nuevo
t.code("Crear caso", js("crear_caso.js", libs=False), [660, 100]); t.link("Ruta", "Crear caso", 0)
dt_insert(t, "Insertar caso", "casos", [880, 100]); t.link("Crear caso", "Insertar caso")
t.code("Aviso de folio", "const c = $('Crear caso').first().json;\nreturn [{ json: { chat_id: c.chat_id, mensaje: '📄 Folio ' + c.caso_id + ' creado. Procesando con 4 agentes (modo SIMULADO)…' } }];", [1100, 100])
t.link("Insertar caso", "Aviso de folio")
tg_send(t, "Telegram: folio", [1320, 100]); t.link("Aviso de folio", "Telegram: folio")
t.code("Entrada para orquestador", "return [{ json: JSON.parse($('Crear caso').first().json.entrada_json) }];", [1540, 100]); t.link("Telegram: folio", "Entrada para orquestador")
exec_orq(t, "Ejecutar orquestador", [1760, 100]); t.link("Entrada para orquestador", "Ejecutar orquestador")
bloque_registro(t, "Ejecutar orquestador", "Crear caso", 1980, 100)
# 1 estado
dt_get(t, "Buscar caso (estado)", "$('Guardrails de entrada').first().json.caso_id", [660, 500]); t.link("Ruta", "Buscar caso (estado)", 1)
t.code("Formatear estado", js("estado_formato.js", libs=False), [880, 500]); t.link("Buscar caso (estado)", "Formatear estado")
tg_send(t, "Telegram: estado", [1100, 500]); t.link("Formatear estado", "Telegram: estado")
# 2 decisión
t.add("Responder botón", "n8n-nodes-base.telegram", 1.2, {"resource": "callback", "queryId": "={{ $json.callback_id }}", "additionalFields": {"text": "Procesando decisión…"}},
      [660, 700], credentials=CRED_TG, onError="continueRegularOutput")
t.link("Ruta", "Responder botón", 2)
dt_get(t, "Buscar caso (aprobación)", "$('Guardrails de entrada').first().json.caso_id", [880, 700]); t.link("Responder botón", "Buscar caso (aprobación)")
t.code("Validar aprobación", js("validar_aprobacion.js", libs=False), [1100, 700]); t.link("Buscar caso (aprobación)", "Validar aprobación")
t.switch("¿Aplicar decisión?", "$json.aplicar === 1 ? 0 : 1", 2, [1320, 700]); t.link("Validar aprobación", "¿Aplicar decisión?")
t.code("Fila decisión", "return [{ json: $input.first().json.fila }];", [1540, 640]); t.link("¿Aplicar decisión?", "Fila decisión", 0)
dt_update(t, "Registrar decisión", [1760, 640]); t.link("Fila decisión", "Registrar decisión")
t.code("Mensaje de decisión", "const v = $('Validar aprobación').first().json;\nreturn [{ json: { chat_id: v.chat_id, mensaje: v.mensaje } }];", [1980, 640]); t.link("Registrar decisión", "Mensaje de decisión")
tg_send(t, "Telegram: decisión", [2200, 640]); t.link("Mensaje de decisión", "Telegram: decisión")
tg_send(t, "Telegram: decisión no aplicada", [1540, 800]); t.link("¿Aplicar decisión?", "Telegram: decisión no aplicada", 1)
# 3 mensajes directos (ayuda, no autorizado, inválido, inyección)
tg_send(t, "Telegram: mensaje directo", [660, 900]); t.link("Ruta", "Telegram: mensaje directo", 3)
t.dump("PapelSur_1_telegram.json", "Entrada única de Telegram. Revincular credencial 'Telegram PapelSur Bot', elegir tablas 'casos'/'costos' en nodos Data Table y el sub-workflow en 'Ejecutar orquestador'. Editar USUARIOS_AUTORIZADOS.")

# ---------------- Workflow 3: Voz (herramienta de servidor de ElevenLabs) ----------------
v = WF("PapelSur – 3 Voz ElevenLabs (herramienta)")
v.add("Webhook voz", "n8n-nodes-base.webhook", 2, {"httpMethod": "POST", "path": "papelsur-voz", "authentication": "headerAuth", "responseMode": "responseNode", "options": {}},
      [0, 300], credentials=CRED_VOZ, webhookId=str(uuid.uuid4()))
v.code("Guardrails voz", js("voz_guardrails.js"), [220, 300]); v.link("Webhook voz", "Guardrails voz")
v.switch("Acción voz", "$json.ruta", 3, [440, 300]); v.link("Guardrails voz", "Acción voz")
vr = leer("voz_respuestas.js").split("// ===== Nodo «Respuesta creación voz»"); vr[1] = "//" + vr[1]
RESP = lambda name, pos: v.add(name, "n8n-nodes-base.respondToWebhook", 1.1, {"respondWith": "json", "responseBody": "={{ JSON.stringify($json.respuesta) }}", "options": {"responseCode": 200}}, pos)
dt_get(v, "Buscar caso (voz)", "$('Guardrails voz').first().json.caso_id", [660, 120]); v.link("Acción voz", "Buscar caso (voz)", 0)
v.code("Respuesta consulta voz", vr[0], [880, 120]); v.link("Buscar caso (voz)", "Respuesta consulta voz")
RESP("Responder consulta", [1100, 120]); v.link("Respuesta consulta voz", "Responder consulta")
v.code("Crear caso (voz)", js("crear_caso.js", libs=False), [660, 320]); v.link("Acción voz", "Crear caso (voz)", 1)
dt_insert(v, "Insertar caso (voz)", "casos", [880, 320]); v.link("Crear caso (voz)", "Insertar caso (voz)")
v.code("Respuesta creación voz", vr[1], [1100, 320]); v.link("Insertar caso (voz)", "Respuesta creación voz")
RESP("Responder creación", [1320, 320]); v.link("Respuesta creación voz", "Responder creación")
v.code("Entrada para orquestador (voz)", "return [{ json: JSON.parse($('Crear caso (voz)').first().json.entrada_json) }];", [1540, 320]); v.link("Responder creación", "Entrada para orquestador (voz)")
exec_orq(v, "Ejecutar orquestador (voz)", [1760, 320]); v.link("Entrada para orquestador (voz)", "Ejecutar orquestador (voz)")
bloque_registro(v, "Ejecutar orquestador (voz)", "Crear caso (voz)", 1980, 320)
RESP("Responder error", [660, 520]); v.link("Acción voz", "Responder error", 2)
v.dump("PapelSur_3_voz.json", "Webhook autenticado por encabezado para la herramienta de servidor de ElevenLabs. Revincular 'Voz ElevenLabs (Header Auth)', 'Telegram PapelSur Bot' y tablas. Editar APROBADOR_CHAT_ID.")
print("Workflows generados en", OUT)
