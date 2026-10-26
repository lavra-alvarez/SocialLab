# Implementation plan: SocialLab

## Estrategia

Implementar primero un núcleo ejecutable y probado en terminal. Conectar después una interfaz web pequeña al mismo contrato JSON. Entregar desde `codex/sociallab-mvp` mediante PR hacia `DEV`.

## Fases

### 1. Núcleo formal

- SL-F01: tipos y validaciones.
- SL-F02: similitud, afinidad dirigida y compatibilidad.
- SL-F03/SL-F05: utilidad y métricas agregadas.
- SL-F04: enumeración de asignaciones.
- SL-F06: desviaciones y Nash.

### 2. Integración

- Escenario ficticio verificable.
- API `health`, `scenario` y `analyze`.
- Modo de demostración JSON en terminal.

### 3. Interfaz

- Editor de preferencias.
- Comparación del óptimo social, solución equitativa y mejor Nash.
- Matriz de afinidades y explicación de desviaciones.
- Diseño responsive y accesible.

### 4. Calidad y entrega

- Ejecutar pruebas y compilación.
- Verificar API e interacción en navegador.
- Completar README y matriz de trazabilidad.
- Commit, push y PR hacia `DEV`.

## Plan de pruebas

- Rangos y coincidencia perfecta de similitud.
- Afinidad asimétrica y compatibilidad simétrica.
- Conteo `2^n` de perfiles.
- Utilidad de reserva para una persona sola.
- Equilibrios sin desviaciones rentables.
- Optimalidad exhaustiva del resultado social.
- Respuestas HTTP válidas y errores de validación.

## Definición de terminado

- SL-F01 a SL-F08 implementados.
- Pruebas verdes y aplicación compilada.
- README suficiente para instalar, ejecutar y exponer.
- Terminología matemática consistente.
- PR abierto hacia `DEV`.

