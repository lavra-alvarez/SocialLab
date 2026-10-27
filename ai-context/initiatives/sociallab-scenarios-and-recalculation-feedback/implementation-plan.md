# Implementation plan: escenarios y retroalimentación del recálculo

## Estado

- Implementado el 2026-10-27.
- Validación funcional completada; publicación preparada mediante PR hacia `DEV`.

## Fase 1: modelo funcional

1. Definir `ScenarioMode = TeamFormation | PairFormation`.
2. Extender `Scenario` con el modo de formación.
3. Separar la generación de perfiles de equipo y matchings perfectos.
4. Hacer explícita la recursión del generador para acercarla al estilo trabajado en clase.

## Fase 2: estabilidad

1. Mantener desviaciones unilaterales y Nash para equipos.
2. Definir pareja bloqueante con afinidades dirigidas.
3. Calcular asignaciones estables de parejas sin etiquetarlas como Nash.
4. Generalizar la respuesta de análisis sin ocultar la diferencia matemática.

## Fase 3: escenarios y API

1. Crear los dos escenarios demostrativos con las mismas seis personas.
2. Exponer la lista de escenarios y permitir analizar cualquiera de ellos.
3. Validar cada modo antes de enumerar resultados.

## Fase 4: interfaz

1. Incorporar el selector `Dos equipos` / `Tres parejas`.
2. Adaptar tarjetas, pestañas y etiquetas de estabilidad.
3. Dibujar una capa base de compatibilidad y otra de relaciones activas.
4. Animar conexiones nuevas, eliminadas y conservadas al recalcular.
5. Aplicar una alternativa sin movimiento para accesibilidad.

## Fase 5: evidencia académica

1. Añadir pruebas de conteo, validez y estabilidad para ambos modos.
2. Mantener una prueba pequeña por función principal, con entradas y salidas comprensibles.
3. Documentar las fórmulas, tipos inferidos o declarados y fuentes consultadas.
4. Actualizar trazabilidad, guion de demostración y limitaciones.
5. Ejecutar compilación, pruebas, revisión visual y abrir PR hacia `DEV`.

## Criterios de aceptación

- Se seleccionan dos equipos o tres parejas desde la misma pantalla.
- Ambos escenarios usan exactamente seis personas.
- Ningún resultado de parejas contiene grupos con tamaño distinto de dos.
- El escenario de equipos conserva un análisis de Nash no trivial.
- El escenario de parejas informa estabilidad por parejas bloqueantes.
- El recálculo destaca visualmente solo las relaciones que cambiaron.
- La interfaz no incorpora párrafos explicativos nuevos.
- Todas las pruebas pasan y existe un PR dirigido a `DEV`.
