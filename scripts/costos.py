#!/usr/bin/env python3
"""Resumen de costos por etapa/caso y proyección mensual (100, 1 000 y 10 000 casos).
Uso: python3 scripts/costos.py --costos datos/muestra/costos.csv --casos datos/muestra/casos.csv [--tc 18.50]
Escribe costos/resumen_costos.md. Las tarifas salen de costos/tarifas.csv.
"""
import argparse, csv, pathlib, statistics

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FINALES = {"aprobado", "rechazado", "vencido"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--costos", required=True); ap.add_argument("--casos", required=True)
    ap.add_argument("--tc", type=float, default=None, help="MXN por USD (Banxico FIX con fecha)")
    ap.add_argument("--plan_voz_minutos", type=int, default=15, help="minutos incluidos en tu plan de ElevenLabs")
    ap.add_argument("--plan_voz_usd", type=float, default=0.0, help="cargo fijo mensual de tu plan de ElevenLabs")
    ap.add_argument("--fijo_otros_usd", type=float, default=0.0, help="n8n u otros cargos fijos mensuales")
    a = ap.parse_args()
    tar = {r["producto"]: r for r in csv.DictReader(open(RAIZ / "costos/tarifas.csv", encoding="utf-8"))}
    min_usd = float(tar["ElevenAgents minuto de conversación"]["tarifa_usd"])
    filas = list(csv.DictReader(open(a.costos, encoding="utf-8")))
    casos = {c["caso_id"]: c for c in csv.DictReader(open(a.casos, encoding="utf-8"))}

    por_etapa, por_caso, voz_s = {}, {}, []
    for r in filas:
        por_etapa.setdefault(r["etapa"], [0, 0, 0, 0.0])
        e = por_etapa[r["etapa"]]; e[0] += 1; e[1] += int(r["tokens_entrada"] or 0); e[2] += int(r["tokens_salida"] or 0); e[3] += float(r["costo"])
        por_caso[r["caso_id"]] = por_caso.get(r["caso_id"], 0) + float(r["costo"])
        if r["duracion_voz_s"]: voz_s.append(float(r["duracion_voz_s"]))
    comp = [cid for cid, c in casos.items() if c["estado"] in FINALES]
    fall = [cid for cid in casos if cid not in comp]
    c_llm = statistics.mean(por_caso.get(cid, 0) for cid in comp) if comp else 0
    min_voz = (statistics.mean(voz_s) / 60) if voz_s else 2.0
    L = ["# Resumen de costos — PapelSur", "", "Fórmula por llamada: Cᵢ = (T_entrada × P_entrada + T_salida × P_salida) / 1 000 000", "",
         "## Por etapa", "", "| Etapa | Llamadas | Tokens entrada | Tokens salida | Costo USD |", "|---|---|---|---|---|"]
    for k, e in sorted(por_etapa.items()): L.append(f"| {k} | {e[0]} | {e[1]} | {e[2]} | {e[3]:.6f} |")
    L += ["", "## Por caso", "", "| Caso | Estado | Costo LLM USD |", "|---|---|---|"]
    for cid, c in casos.items(): L.append(f"| {cid} | {c['estado']} | {por_caso.get(cid, 0):.6f} |")
    L += ["", f"- Casos completos: {len(comp)} · costo LLM promedio: **{c_llm:.6f} USD/caso**",
          f"- Casos fallidos/rechazados por control: {len(fall)} · costo total: {sum(por_caso.get(c, 0) for c in fall):.6f} USD (se reporta aparte)",
          f"- Duración de voz promedio medida: {min_voz:.2f} min (si no hay medición se usa 2 min como supuesto declarado)", "",
          "## Proyección mensual", "", "Supuestos: mezcla 70 % Telegram / 30 % voz; el escenario alto duplica tokens (más correcciones) y usa 4 min de voz.", "",
          "| Casos/mes | Escenario | LLM USD | Minutos voz | Voz USD (sobre lo incluido) | Fijos USD | Total USD |" + (" Total MXN |" if a.tc else ""),
          "|---|---|---|---|---|---|---|" + ("---|" if a.tc else "")]
    for n in (100, 1000, 10000):
        for esc, mult, mv in (("base", 1, min_voz), ("alto", 2, 4.0)):
            llm = n * c_llm * mult
            minutos = n * 0.30 * mv
            extra = max(0, minutos - a.plan_voz_minutos) * min_usd
            fijos = a.plan_voz_usd + a.fijo_otros_usd
            tot = llm + extra + fijos
            L.append(f"| {n:,} | {esc} | {llm:.2f} | {minutos:,.0f} | {extra:.2f} | {fijos:.2f} | {tot:.2f} |" + (f" {tot * a.tc:,.2f} |" if a.tc else ""))
    L += ["", "Notas: el plan gratuito de Gemini no se extrapola como permanente (se usa la tarifa pagada). El LLM interno del agente de voz de ElevenLabs se cobra aparte y debe tomarse de su panel de uso.",
          "Optimización aplicada: el Agente 4 no llama al modelo cuando la capa determinista ya encontró fallas; compara el costo de casos con y sin esta regla en tu informe."]
    out = RAIZ / "costos/resumen_costos.md"
    out.write_text("\n".join(L) + "\n", encoding="utf-8")
    print("Escrito", out)

if __name__ == "__main__":
    main()
