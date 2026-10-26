# Impact analysis: SocialLab

## Impacto académico

- Evidencia funciones puras, composición, listas, pattern matching y tipos algebraicos.
- Representa cada desviación mediante una asignación inmutable nueva.
- Permite demostrar que eficiencia, equidad y estabilidad son propiedades diferentes.
- Mantiene las fórmulas visibles y comprobables sin librerías de optimización.

## Impacto de portafolio

- Integra backend Haskell, API JSON e interfaz web responsive.
- Expone resultados interpretables en vez de una cifra de compatibilidad aislada.
- Incluye pruebas, documentación, trazabilidad y un flujo reproducible.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Confundir Nash con el mejor resultado | Mostrar bienestar, equidad y Nash por separado |
| Presentar utilidad como felicidad real | Usar siempre “satisfacción modelada” y datos ficticios |
| Explosión combinatoria | Limitar a 8 personas y 2 grupos |
| Perder tiempo en UI | Interfaz estática sin framework ni dependencias visuales |
| Dependencias de Haskell | Fijar rangos en Cabal y documentar instalación |
| Escenario poco ilustrativo | Incluir preferencias asimétricas y utilidades de reserva |

## Trazabilidad

| ID | Resultado verificable |
|---|---|
| SL-F01 | Personas y preferencias validadas |
| SL-F02 | Afinidad dirigida y compatibilidad mutua |
| SL-F03 | Utilidad individual por asignación |
| SL-F04 | Generación exhaustiva de perfiles |
| SL-F05 | Bienestar, piso y brecha |
| SL-F06 | Equilibrios y desviaciones rentables |
| SL-F07 | Contrato HTTP/JSON |
| SL-F08 | Edición y recálculo desde navegador |
| SL-N01 | Núcleo funcional sin estado destructivo |
| SL-N02 | Documentación y exposición de cinco minutos |

## Criterios de éxito

- Pruebas automatizadas verdes.
- Resultados deterministas y dentro del rango 0-100.
- Toda asignación Nash carece de desviaciones rentables.
- Aplicación ejecutable con comandos documentados.
- Pull request hacia `DEV` con la evidencia de validación.

