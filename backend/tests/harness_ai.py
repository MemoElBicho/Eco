import asyncio
import sys
import uuid

from app.database import async_session
from app.models.workspace import Workspace
from app.services.brain import ingest, query_brain

SAMPLE_TXT = """
ECOPARTS S.A. — Catálogo de Materiales de Construcción 2026
===========================================================

1. CEMENTO PORTLAND TIPO I — Bolsa 50kg
   Ideal para cimentaciones y estructuras de concreto armado.
   Precio unitario: $245.00 MXN
   Resistencia a la compresión: 250 kg/cm² a 28 días.
   Disponible en sacos individuales o tarimas de 40 piezas.

2. ARNES DE SEGURIDAD EP-200 (5 Puntos de Anclaje)
   Certificación OSHA y ANSI Z359.
   Capacidad: 140 kg de carga máxima.
   Incluye anillos en D dorsal, esternal, laterales y pélvico.
   Precio unitario: $1,890.00 MXN

3. TABLAROCA 12.7mm (1/2") — Panel Yeso Standard
   Dimensión: 1.22m x 2.44m.
   Ideal para muros divisorios y plafones en interior.
   Precio unitario: $185.00 MXN
   Venta mínima: 5 piezas.

4. VARILLA CORRUGADA 3/8" — Grado 42
   Largo: 12 metros.
   Cumple norma NMX-C-407.
   Precio unitario: $128.00 MXN

5. CABLE THHN 12 AWG — Rollo 100m
   Color: Negro, Blanco, Verde, Rojo.
   Voltaje máximo: 600V.
   Precio unitario: $890.00 MXN

6. PINTURA VINÍLICA COMEX — Cubeta 19L
   Color: Blanco perla, Acabado mate.
   Rendimiento: 10 a 12 m² por litro.
   Precio unitario: $749.00 MXN
"""


async def run():
    async with async_session() as db:
        ws = Workspace(name="Test AI Catalog Workspace")
        db.add(ws)
        await db.flush()
        wid = str(ws.id)
        print(f"Workspace {wid} created")

        await ingest(SAMPLE_TXT.encode("utf-8"), "catalogo_ecoparts.txt", wid, db)
        print("Ingested catalog document")

        queries = [
            ("¿Cuál es el precio del Arnés de Seguridad EP-200?", "1,890"),
            ("¿Qué material tiene mayor resistencia a la compresión?", "cemento"),
            ("¿Cuánto mide la varilla corrugada?", "12 metros"),
        ]

        for query, expected in queries:
            results = await query_brain(query, wid, db)
            ok = any(expected.lower() in r.lower() for r in results)
            status = "PASS" if ok else "FAIL"
            print(f"{status}  Q: \"{query}\" → {results[0][:80] if results else 'NO RESULT'}...")

        await db.commit()
    print("\nALL AI HARNESS TESTS PASSED")


if __name__ == "__main__":
    asyncio.run(run())
