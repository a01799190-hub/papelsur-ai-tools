#!/usr/bin/env python3
"""Convierte la exportación PRIVADA de las tablas de n8n (casos.csv y costos.csv) en web/data/panel.json SANITIZADO.

Uso:
  python3 scripts/exportar_sanitizado.py --casos datos/muestra/casos.csv --costos datos/muestra/costos.csv [--ejemplo]

Solo publica: caso_id, fecha, canal, estado, versión, total y costo. NUNCA usuario, chat_id ni texto.
"""
import argparse, csv, json, datetime, pathlib, statistics

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FINALES = {"aprobado", "rechazado", "vencido"}            # casos completos (recorrieron el proceso hasta la decisión humana)
CON_PROPUESTA = FINALES | {"pendiente_aprobacion"}
PUBLICOS = ["caso_id", "fecha", "canal", "estado", "version", "total_mxn", "costo_usd"]

def ts(s): return datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--casos", required=True); ap.add_argument("--costos", required=True)
    ap.add_argument("--salida", default=str(RAIZ / "web/data/panel.json"))
    ap.add_argument("--ejemplo", action="store_true", help="marca el panel como datos de ejemplo")
    a = ap.parse_args()
    casos = list(csv.DictReader(open(a.casos, encoding="utf-8")))
    costos = list(csv.DictReader(open(a.costos, encoding="utf-8")))

    completos = [c for c in casos if c["estado"] in FINALES]
    con_prop = [c for c in casos if c["estado"] in CON_PROPUESTA]
    ciclos = [(ts(c["actualizado"]) - ts(c["creado"])).total_seconds() / 60 for c in completos]
    primera = [c for c in con_prop if int(c["version"]) == 1]
    costo_comp = sum(float(c["costo_usd"]) for c in completos)
    fallidos = [c for c in casos if c["estado"] not in CON_PROPUESTA]

    por_estado = {}
    for c in casos: por_estado[c["estado"]] = por_estado.get(c["estado"], 0) + 1
    por_agente = {}
    for r in costos: por_agente[r["agente"]] = round(por_agente.get(r["agente"], 0) + float(r["costo"]), 8)

    fechas = sorted(c["creado"] for c in casos)
    panel = {
        "empresa": "PapelSur Distribuidora (empresa ficticia)",
        "proposito": "Cotizaciones B2B de papelería con 4 agentes y aprobación humana",
        "datos_ficticios": True,
        "es_ejemplo": a.ejemplo,
        "fuente": "Exportación sanitizada de las tablas privadas 'casos' y 'costos' de n8n",
        "periodo": {"desde": fechas[0][:10] if fechas else None, "hasta": fechas[-1][:10] if fechas else None},
        "actualizado": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "kpis": {
            "tiempo_ciclo_min": {"valor": round(statistics.mean(ciclos), 2) if ciclos else None, "unidad": "min",
                                  "formula": "Σ(actualizado − creado) de casos completos / casos completos", "denominador": len(completos)},
            "aprobacion_primera_pct": {"valor": round(100 * len(primera) / len(con_prop), 1) if con_prop else None, "unidad": "%",
                                        "formula": "casos con propuesta aprobada por A4 en la versión 1 / casos con propuesta × 100", "denominador": len(con_prop)},
            "costo_promedio_usd": {"valor": round(costo_comp / len(completos), 6) if completos else None, "unidad": "USD por caso",
                                    "formula": "costo variable medido de casos completos / casos completos", "denominador": len(completos),
                                    "costo_fallidos_usd": round(sum(float(c["costo_usd"]) for c in fallidos), 6), "fallidos": len(fallidos)}
        },
        "por_estado": por_estado,
        "costo_por_agente_usd": por_agente,
        "historial": [{
            "caso_id": c["caso_id"], "fecha": c["creado"][:16].replace("T", " "), "canal": c["canal"], "estado": c["estado"],
            "version": int(c["version"]), "total_mxn": float(c["total_mxn"]), "costo_usd": float(c["costo_usd"])} for c in casos]
    }
    for h in panel["historial"]: assert set(h) == set(PUBLICOS)
    pathlib.Path(a.salida).write_text(json.dumps(panel, ensure_ascii=False, indent=2), encoding="utf-8")
    # Copias públicas para conciliación en Actions: casos SOLO con campos públicos y registro de costos (sin datos personales)
    with open(RAIZ / "datos/casos_sanitizados.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=PUBLICOS); w.writeheader()
        for h in panel["historial"]: w.writerow(h)
    with open(RAIZ / "costos/costos.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(costos[0].keys()) if costos else []); w.writeheader(); w.writerows(costos)
    print("Panel sanitizado escrito en", a.salida, "con", len(casos), "casos")

if __name__ == "__main__":
    main()
