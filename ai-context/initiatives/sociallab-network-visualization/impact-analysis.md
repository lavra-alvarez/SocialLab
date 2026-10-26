# Impact analysis: visualización interactiva de redes

## Impacto funcional

- Permite comparar visualmente cómo cambia la composición de grupos entre soluciones.
- Hace visibles las relaciones fuertes y débiles sin sustituir las métricas numéricas.
- Añade interacción por selección de solución y persona.

## Impacto técnico

- Cambios limitados a `static/index.html`, `static/styles.css` y `static/app.js`.
- Sin cambios en el contrato JSON ni en el núcleo Haskell.
- SVG generado de forma determinista a partir de `compatibilities` y `assignment`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Red saturada | Máximo de ocho nodos y quince a veintiocho aristas |
| Colores insuficientes | Letras A/B dentro de cada nodo y leyenda compacta |
| Pérdida de precisión | Detalle numérico al seleccionar un nodo y matriz existente |
| Texto excesivo | Eliminar introducción, metodología y notas explicativas |
| Dependencia visual | Mantener todas las métricas y controles accesibles |

## Validación

- Comprobar sintaxis JavaScript.
- Ejecutar la suite Haskell para evitar regresiones.
- Validar en navegador cambio de asignación, selección de nodo y recálculo del escenario.
- Revisar visualmente escritorio y ancho reducido.

