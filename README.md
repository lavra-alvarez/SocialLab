# SocialLab

SocialLab es un simulador académico que combina compatibilidad ponderada, teoría de juegos y matching. Permite comparar cómo cambia la satisfacción modelada de seis personas al distribuirlas entre dos equipos o tres parejas.

El objetivo no es predecir felicidad real. El programa hace explícitas sus reglas, enumera todas las asignaciones posibles y distingue entre:

- **Afinidad dirigida:** cuánto coinciden los rasgos de otra persona con mis preferencias.
- **Compatibilidad mutua:** promedio de las afinidades en ambas direcciones.
- **Utilidad individual:** satisfacción modelada dentro del grupo asignado.
- **Bienestar colectivo:** promedio de las utilidades individuales.
- **Equidad:** satisfacción mínima y brecha entre la utilidad mayor y menor.
- **Equilibrio de Nash:** distribución de equipos donde nadie mejora al cambiarse unilateralmente.
- **Matching estable:** formación de parejas sin dos personas que prefieran elegirse mutuamente frente a sus parejas actuales.

## Demostración principal

Los dos escenarios incluidos comparten seis personas ficticias y cuatro criterios:

- **Dos equipos:** 62 distribuciones donde ambos equipos tienen integrantes.
- **Tres parejas:** 15 matchings perfectos, sin duplicar una misma formación por el nombre de sus parejas.

SocialLab presenta:

1. La asignación con mayor bienestar colectivo.
2. La asignación que maximiza la satisfacción de la persona menos satisfecha.
3. Los equilibrios de Nash de equipos o los matchings estables, ordenados por bienestar.
4. La mejor desviación unilateral o la primera pareja bloqueante.
5. Una red interactiva con grupos, utilidades y compatibilidades mutuas.

La interfaz permite seleccionar el modo, modificar ideales, pesos y utilidad de reserva, alternar entre soluciones y seleccionar personas dentro de la red. Al recalcular, las conexiones nuevas se iluminan y las eliminadas se desvanecen.

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

En el modo de parejas, `(i,j)` es una pareja bloqueante si no están juntas y ambas obtendrían una afinidad estrictamente mayor al emparejarse. Un matching es estable cuando no contiene ninguna pareja bloqueante.

## Arquitectura

```text
Navegador (HTML/CSS/JS)
        │ JSON
        ▼
API Scotty / Main.hs
        │
        ▼
Núcleo Haskell puro
Types → Validation → Compatibility → Assignments → Metrics → Nash/Matching → Analysis
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
| `GET` | `/api/scenarios` | Obtener los dos escenarios seleccionables |
| `POST` | `/api/analyze` | Validar y analizar un escenario |

El backend rechaza escenarios con identificadores duplicados, escalas inválidas, criterios incompatibles, pesos negativos o suma de pesos igual a cero.

## Programación funcional demostrada

- Tipos algebraicos para dominio, métricas, desviaciones y resultados.
- Funciones puras para compatibilidad, utilidad y equilibrio.
- `map`, `filter`, comprensiones de listas, `fold` implícito mediante `sum` y composición.
- Generación recursiva explícita de perfiles de equipo y matchings.
- Transformaciones inmutables con `Map.insert` para simular desviaciones.
- Separación entre núcleo, infraestructura e interfaz.

## Pruebas

```bash
cabal test all
```

Las pruebas verifican rangos de similitud, afinidades, 62 distribuciones de equipos, 15 matchings perfectos, utilidad de reserva, Nash, parejas bloqueantes y optimalidad social.

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
| SL-F09 | Visualizar la red | `static/app.js`, `static/styles.css` | grupos, aristas y selección interactiva |
| SL-F10 | Seleccionar formación | `Example`, `Main`, `static/app.js` | dos escenarios con seis personas |
| SL-F11 | Formar parejas estables | `Assignments`, `Matching` | 15 matchings y ausencia de bloqueos |
| SL-F12 | Mostrar el recálculo | `static/app.js`, `static/styles.css` | transiciones de relaciones y puntuaciones |
| SL-F13 | Priorizar resultados | `static/index.html`, `static/styles.css` | vista sin cabecera ni campos decorativos |
| SL-N01 | Núcleo funcional | `src/SocialLab` | módulos puros sin estado destructivo |
| SL-N02 | Presentación comprensible | UI y README | guion siguiente |

## Guion de exposición de cinco minutos

1. Explicar que compatibilidad, bienestar, equidad y Nash no son equivalentes.
2. Mostrar los rasgos y editar el peso de un criterio.
3. Recalcular las 62 distribuciones de equipos y observar las conexiones que cambian.
4. Alternar la red entre óptimo social, equidad y Nash.
5. Seleccionar tres parejas y mostrar los 15 matchings posibles.
6. Comparar una desviación unilateral con una pareja bloqueante.
7. Cerrar mostrando la recursión que genera los resultados y las funciones puras de estabilidad.

## Alcance y limitaciones

- Exactamente seis personas en los escenarios demostrativos.
- Dos equipos no vacíos o tres parejas exactas.
- Datos ficticios y sin persistencia.
- Solo estrategias puras; no calcula estrategias mixtas.
- Los nombres de los grupos son etiquetas, por lo que existen soluciones simétricas.
- Nash se aplica a equipos; las parejas usan estabilidad de matching para no confundir ambos conceptos.

## Referencias

- John F. Nash Jr., [“Equilibrium Points in N-Person Games”](https://www.pnas.org/doi/10.1073/pnas.36.1.48), *PNAS* 36(1), 1950.
- Robert W. Irving, [“An Efficient Algorithm for the Stable Roommates Problem”](https://doi.org/10.1016/0196-6774(85)90033-1), *Journal of Algorithms* 6(4), 1985.

## Documentación de decisiones

Las decisiones se encuentran en:

- [`ai-context/initiatives/sociallab-functional-social-simulator`](ai-context/initiatives/sociallab-functional-social-simulator)
- [`ai-context/initiatives/sociallab-network-visualization`](ai-context/initiatives/sociallab-network-visualization)
- [`ai-context/initiatives/sociallab-scenarios-and-recalculation-feedback`](ai-context/initiatives/sociallab-scenarios-and-recalculation-feedback)
- [`ai-context/initiatives/sociallab-results-only-visual-refresh`](ai-context/initiatives/sociallab-results-only-visual-refresh)

