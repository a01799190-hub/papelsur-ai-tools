#!/usr/bin/env python3
"""Controles previos a la publicación (GitHub Actions). Sale con código 1 si algo falla, lo que BLOQUEA el despliegue.
Uso: python3 scripts/validar.py
"""
import csv, json, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
fallas = []
def falla(m): fallas.append(m)

# 1. Archivos obligatorios
OBLIGATORIOS = ["README.md", "web/index.html", "web/data/panel.json", "web/data/catalogo.json",
    "skills/cotizacion-papelsur/SKILL.md", "skills/revision-propuesta/SKILL.md",
    "loops/loop_calidad.md", "loops/loop_seguridad_costo.md", "agentes/contratos/entrada.schema.json",
    "agentes/contratos/salida.schema.json", "n8n/PapelSur_1_telegram.json", "n8n/PapelSur_2_orquestador.json",
    "n8n/PapelSur_3_voz.json", "costos/tarifas.csv", "tests/pruebas.csv", "docs/credenciales_ejemplo.md"]
for f in OBLIGATORIOS:
    if not (RAIZ / f).exists(): falla("Falta archivo obligatorio: " + f)

# 2. Catálogo
try:
    cat = json.loads((RAIZ / "web/data/catalogo.json").read_text(encoding="utf-8"))
    skus = set()
    for it in cat["items"]:
        for k in ("sku", "descripcion", "unidad", "precio_mxn", "existencia"):
            if k not in it: falla(f"Catálogo: falta '{k}' en {it.get('sku')}")
        if not (isinstance(it.get("precio_mxn"), (int, float)) and it["precio_mxn"] > 0): falla("Catálogo: precio no positivo en " + str(it.get("sku")))
        if not (isinstance(it.get("existencia"), int) and it["existencia"] >= 0): falla("Catálogo: existencia inválida en " + str(it.get("sku")))
        if it.get("sku") in skus: falla("Catálogo: SKU duplicado " + it["sku"])
        skus.add(it.get("sku"))
except Exception as e:
    falla("Catálogo ilegible: " + str(e))

# 3. Panel público: estructura y SOLO campos públicos
PUBLICOS = {"caso_id", "fecha", "canal", "estado", "version", "total_mxn", "costo_usd"}
try:
    panel = json.loads((RAIZ / "web/data/panel.json").read_text(encoding="utf-8"))
    for k in ("empresa", "datos_ficticios", "fuente", "periodo", "actualizado", "kpis", "historial"):
        if k not in panel: falla("panel.json: falta " + k)
    for k in ("tiempo_ciclo_min", "aprobacion_primera_pct", "costo_promedio_usd"):
        if k not in panel.get("kpis", {}): falla("panel.json: falta KPI " + k)
    for h in panel.get("historial", []):
        extra = set(h) - PUBLICOS
        if extra: falla("panel.json publica campos no permitidos: " + ", ".join(sorted(extra)))
        if not re.fullmatch(r"PS-\d{8}-[A-Z0-9]{4}", h.get("caso_id", "")): falla("panel.json: caso_id inválido " + str(h.get("caso_id")))
except Exception as e:
    falla("panel.json ilegible: " + str(e))

# 4. Conciliación de costos (fórmula Ci y subtotales por caso)
try:
    filas = list(csv.DictReader(open(RAIZ / "costos/costos.csv", encoding="utf-8")))
    ids = set()
    por_caso = {}
    for r in filas:
        if r["llamada_id"] in ids: falla("costos: llamada_id duplicado " + r["llamada_id"])
        ids.add(r["llamada_id"])
        if r["unidad_cobro"].startswith("USD por 1M"):
            ci = (int(r["tokens_entrada"]) * float(r["tarifa_entrada"]) + int(r["tokens_salida"]) * float(r["tarifa_salida"])) / 1e6
            if abs(ci - float(r["costo"])) > 1e-8: falla(f"costos: {r['llamada_id']} costo {r['costo']} ≠ fórmula {ci:.8f}")
        por_caso[r["caso_id"]] = por_caso.get(r["caso_id"], 0) + float(r["costo"])
    for c in csv.DictReader(open(RAIZ / "datos/casos_sanitizados.csv", encoding="utf-8")):
        if abs(por_caso.get(c["caso_id"], 0) - float(c["costo_usd"])) > 1e-7:
            falla(f"costos: el caso {c['caso_id']} registra {c['costo_usd']} pero sus llamadas suman {por_caso.get(c['caso_id'], 0):.8f}")
except Exception as e:
    falla("No se pudo conciliar costos: " + str(e))

# 5. Workflows de n8n sin secretos y con los 5 roles
for f in ("n8n/PapelSur_1_telegram.json", "n8n/PapelSur_2_orquestador.json", "n8n/PapelSur_3_voz.json"):
    try:
        d = json.loads((RAIZ / f).read_text(encoding="utf-8"))
        for n in d["nodes"]:
            for cred in (n.get("credentials") or {}).values():
                if set(cred) - {"id", "name"}: falla(f"{f}: el nodo {n['name']} contiene datos de credencial")
        if d.get("pinData"): falla(f + ": contiene datos fijados (pinData); bórralos antes de exportar")
    except Exception as e:
        falla(f + " ilegible: " + str(e))
orq = (RAIZ / "n8n/PapelSur_2_orquestador.json").read_text(encoding="utf-8")
for rol in ("Orquestador – plan y presupuesto", "A1 validar", "A2 validar", "A3 validar", "A4 dictamen (loop de calidad)"):
    if rol not in orq: falla("Orquestador: falta el rol/nodo " + rol)

# 6. Búsqueda de secretos en todo lo que se versiona
PATRONES = {
    "token de bot de Telegram": r"\b\d{8,10}:[A-Za-z0-9_-]{35}\b",
    "API key de Google": r"AIza[0-9A-Za-z_-]{35}",
    "API key tipo sk-": r"\bsk-[A-Za-z0-9_-]{20,}",
    "API key de ElevenLabs": r"\bsk_[a-f0-9]{40,}\b",
    "clave privada": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
}
for p in RAIZ.rglob("*"):
    if p.is_dir() or ".git" in p.parts or p.suffix in {".png", ".jpg", ".zip", ".pdf"}: continue
    try: txt = p.read_text(encoding="utf-8")
    except Exception: continue
    for nombre, rx in PATRONES.items():
        if re.search(rx, txt): falla(f"Posible {nombre} en {p.relative_to(RAIZ)}")
if (RAIZ / ".env").exists(): falla("Existe un archivo .env real en el repositorio")

# 7. El HTML no debe contener API keys ni el endpoint privado de n8n
html = (RAIZ / "web/index.html").read_text(encoding="utf-8")
if re.search(r"xi-api-key|Authorization:|webhook/papelsur-voz", html, re.I): falla("index.html expone credenciales o el webhook privado")

if fallas:
    print("❌ VALIDACIÓN FALLIDA — no se publica:")
    for m in fallas: print("  -", m)
    sys.exit(1)
print("✅ Validación aprobada: estructura, cálculos, conciliación de costos, sanitización y ausencia de secretos.")
