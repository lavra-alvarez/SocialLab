# SocialLab

SocialLab es un simulador académico que combina compatibilidad ponderada y teoría de juegos. Permite comparar cómo cambia la satisfacción modelada de un conjunto de personas al distribuirlas entre dos grupos.

El objetivo no es predecir felicidad real. El programa hace explícitas sus reglas, enumera todas las asignaciones posibles y distingue entre:

- **Afinidad dirigida:** cuánto coinciden los rasgos de otra persona con mis preferencias.
- **Compatibilidad mutua:** promedio de las afinidades en ambas direcciones.
- **Utilidad individual:** satisfacción modelada dentro del grupo asignado.
- **Bienestar colectivo:** promedio de las utilidades individuales.
- **Equidad:** satisfacción mínima y brecha entre la utilidad mayor y menor.
- **Equilibrio de Nash:** asignación donde nadie mejora al cambiarse unilateralmente de grupo.

## Demostración principal

El escenario incluido contiene seis personas ficticias, cuatro criterios y dos grupos. SocialLab evalúa las `2^6 = 64` asignaciones posibles y presenta:

1. La asignación con mayor bienestar colectivo.
2. La asignación que maximiza la satisfacción de la persona menos satisfecha.
3. Los equilibrios de Nash puros, ordenados por bienestar.
4. La mejor desviación unilateral cuando una asignación no es Nash.

La interfaz permite modificar ideales, pesos y utilidad de reserva para observar cómo cambian los resultados.

## Modelo matemático

Cada rasgo e ideal utiliza una escala de 0 a 10. Para una persona `i`, otra persona `j` y un criterio `k`:

```text
sim(i,j,k) = 1 - |rasgo(j,k) - ideal(i,k)| / 10
```

La afinidad dirigida es el promedio ponderado:

```text
afinidad(i → j) = 100 × Σ(peso(i,k) × sim(i,j,k)) / Σ peso(i,k)
```

La utilidad de `i` es el promedio de sus afinidades hacia las demás personas de su grupo. Si queda sola, recibe su utilidad de reserva.

Una asignación `A` es equilibrio de Nash puro si ningún cambio individual de grupo aumenta estrictamente la utilidad:

```text
∀ persona i, ∀ grupo alternativo g:
utilidad(i, A) ≥ utilidad(i, mover(i,g,A))
```

## Arquitectura

```text
Navegador (HTML/CSS/JS)
        │ JSON
        ▼
API Scotty / Main.hs
        │
        ▼
Núcleo Haskell puro
Types → Validation → Compatibility → Assignments → Metrics → Nash → Analysis
```

La entrada/salida está aislada en `app/Main.hs`. Los módulos de `src/SocialLab` no dependen de HTTP, estado mutable ni de la interfaz.

## Requisitos

- GHC 9.6 o posterior.
- Cabal 3.10 o posterior.

En macOS con Homebrew:

```bash
brew install ghc cabal-install
```

## Ejecutar

```bash
cabal update
cabal test all
cabal run sociallab-server
```

Abrir [http://localhost:3000](http://localhost:3000).

Para ejecutar el análisis de ejemplo sin navegador:

```bash
cabal run sociallab-server -- --demo
```

## API

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/health` | Comprobar que el servidor responde |
| `GET` | `/api/scenario` | Obtener el escenario demostrativo |
| `POST` | `/api/analyze` | Validar y analizar un escenario |

El backend rechaza escenarios con identificadores duplicados, escalas inválidas, criterios incompatibles, pesos negativos o suma de pesos igual a cero.

## Programación funcional demostrada

- Tipos algebraicos para dominio, métricas, desviaciones y resultados.
- Funciones puras para compatibilidad, utilidad y equilibrio.
- `map`, `filter`, comprensiones de listas, `fold` implícito mediante `sum` y composición.
- Generación recursiva de combinaciones mediante `sequence`.
- Transformaciones inmutables con `Map.insert` para simular desviaciones.
- Separación entre núcleo, infraestructura e interfaz.

## Pruebas

```bash
cabal test all
```

Las pruebas verifican rangos de similitud, asimetría de afinidad, simetría de compatibilidad, conteo de asignaciones, utilidad de reserva, condición de Nash y optimalidad del resultado social.

## Trazabilidad

| ID | Requisito | Módulo | Evidencia |
|---|---|---|---|
| SL-F01 | Modelar y validar personas | `Types`, `Validation` | escenario válido y errores explícitos |
| SL-F02 | Calcular afinidad | `Compatibility` | extremos, asimetría y simetría mutua |
| SL-F03 | Calcular utilidad | `Metrics` | caso de persona sola |
| SL-F04 | Generar asignaciones | `Assignments` | prueba de `2^n` perfiles |
| SL-F05 | Medir bienestar y equidad | `Metrics`, `Analysis` | comparación exhaustiva |
| SL-F06 | Detectar Nash | `Nash` | ausencia de desviaciones rentables |
| SL-F07 | Exponer resultados JSON | `Main` | tres endpoints HTTP |
| SL-F08 | Editar y recalcular | `static/app.js` | interacción completa en navegador |
| SL-N01 | Núcleo funcional | `src/SocialLab` | módulos puros sin estado destructivo |
| SL-N02 | Presentación comprensible | UI y README | guion siguiente |

## Guion de exposición de cinco minutos

1. Explicar que compatibilidad, bienestar, equidad y Nash no son equivalentes.
2. Mostrar los rasgos y editar el peso de un criterio.
3. Recalcular las 64 asignaciones.
4. Comparar el óptimo social, la solución equitativa y el mejor Nash.
5. Enseñar una desviación rentable en una solución no estable.
6. Cerrar mostrando la función pura que prueba todas las desviaciones.

## Alcance y limitaciones

- Entre 2 y 8 personas.
- Exactamente 2 grupos en el MVP.
- Datos ficticios y sin persistencia.
- Solo estrategias puras; no calcula estrategias mixtas.
- Los nombres de los grupos son etiquetas, por lo que existen soluciones simétricas.
- El emparejamiento uno a uno requiere estudiar estabilidad por parejas y queda fuera del MVP.

## Documentación de decisiones

La iniciativa completa se encuentra en [`ai-context/initiatives/sociallab-functional-social-simulator`](ai-context/initiatives/sociallab-functional-social-simulator).

