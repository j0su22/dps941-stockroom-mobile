# Validación del código entregado

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto, TypeScript sin errores. |
| `npm test` | 13 pruebas aprobadas de reglas de negocio y validación. |
| `npx expo install --check` | Versiones compatibles con el Expo SDK instalado. |
| `npm run export:web` | Bundle web generado correctamente con Metro. |
| Exportación Android | Bundle Hermes generado correctamente. No es una APK. |
| Exportación iOS | Bundle Hermes generado correctamente. No es una IPA. |
| Prueba de integración DOM del bundle web | Login incorrecto/correcto, salida, rechazo de sobrestock, instalación, registro, estado vacío, cambio de contraseña y restauración de cuentas/inventario después de reiniciar el entorno. |

La prueba DOM no usa un navegador visual y no prueba APIs nativas. Está incluida en `tests/ui-smoke.cjs` y se reproduce con:

```powershell
npm run test:ui
```

Este comando genera `dist/` y ejecuta el bundle con un entorno DOM, almacenamiento web y primitivas criptográficas de Node. No necesita Python ni un servidor externo.

## Qué cubren las 13 pruebas de dominio

1. Salida de un serial con stock, asignación e historial coherentes.
2. Rechazo de sobreventa y segunda salida del mismo serial.
3. Rechazo de cantidades cero, negativas, decimales o no numéricas.
4. Instalación sin descontar stock dos veces ni duplicar instalación.
5. Devolución en buen estado que repone stock una sola vez.
6. Devolución dañada que no aumenta disponibilidad.
7. Instalación y devolución parciales de consumibles.
8. Restricción de técnico y pertenencia al proyecto.
9. Rechazo de cuenta inactiva, proyecto cerrado y asignación inválida.
10. Inmutabilidad de la base original ante un fallo e IDs duplicados.
11. Selectores de proyectos/asignaciones/historial por técnico.
12. Alertas y resolución exacta de código, serie y MAC.
13. Validaciones de correo, contraseña y cantidad.

## Pendiente de verificar en el teléfono

Estas pruebas no se marcaron como realizadas:

- Instalación y arranque en tu Android o iPhone con cliente compatible con SDK 55.
- Login/registro con teclado nativo y navegación con botón Atrás o gesto.
- Lectura de los QR incluidos y códigos impresos con cámara real.
- Permisos concedidos, rechazados y bloqueados de cámara/galería.
- Tomar y elegir una foto, guardarla y verla de nuevo tras reiniciar la app.
- Restauración de sesión mediante SecureStore nativo y vencimiento de 12 horas.
- Verificación visual en distintos tamaños, tipografía ampliada y lector de pantalla.
- Grabación del video, publicación del repositorio y evaluación por el docente.

## Límites conocidos del avance

- La persistencia es local; no hay coordinación ni consistencia entre dos dispositivos o dos pestañas web concurrentes.
- Los roles se comprueban en servicios locales y UI; quien controla el almacenamiento del dispositivo puede modificarlo. No sustituye un backend con autorización.
- La evidencia permanece en el almacenamiento de la app. Borrar datos o desinstalarla puede eliminar evidencia e inventario.
- El catálogo, proyectos y cuentas iniciales contienen datos ficticios. No existe integración con los datos del respaldo web.
- No hay entrada de compras, traslados, retiro de equipos instalados, administración completa de catálogos ni reportes empresariales; el módulo de campo solicitado se concentra en salida, instalación y devolución.
- La librería de hash puede producir un aviso de resolución de `@noble/hashes/crypto.js` en Metro. Las exportaciones finalizaron correctamente y las operaciones de contraseña se probaron en DOM. No se modifican archivos de `node_modules` para ocultar el aviso.

## Ensayo manual antes de entregar

| Caso | Resultado esperado |
| --- | --- |
| Registrar correo inválido | Mensaje de validación; no se crea una cuenta. |
| Registrar correo ya existente | Rechazo explícito. |
| Acceder con contraseña incorrecta | Rechazo sin ingresar a pantallas privadas. |
| Escanear EQ-001 | Detalle del equipo Ubiquiti. |
| Denegar cámara | Continúa disponible el ingreso manual. |
| Intentar cantidad 0, 1.5 o superior al stock | Operación rechazada. |
| Salida de EQ-001 a Torre 1 | Stock pasa de 1 a 0; se crea asignación e historial. |
| Instalar esa asignación | Pendiente pasa a 0 y equipo queda instalado; stock sigue en 0. |
| Devolver una unidad dañada de EQ-002 | Stock utilizable no aumenta; unidad en revisión. |
| Devolver más de 4 unidades del MAT-002 inicial | Rechazo: solo hay 4 pendientes en la asignación inicial. |
| Entrar como María | No aparecen asignaciones personales de Juan. |
| Registrar un técnico nuevo | Inicia sin proyectos ni asignaciones. |
| Administración agrega ese técnico a un proyecto | El técnico lo ve al volver a ingresar. |
| Cerrar y abrir sesión | Se conservan movimientos e inventario. |
