# Stockroom móvil — Foro 2 · Firebase Spark

Versión 2.1.0 para continuar la actividad sin tarjeta ni plan Blaze. Conserva el proyecto Firebase creado, Authentication por correo/Google y Firestore. No usa Cloud Functions, Cloud Storage ni un servidor de pago.

## Continuar desde la versión anterior

1. Extrae este paquete en una carpeta nueva.
2. Copia tu `.env` ya completado a la raíz. No lo publiques.
3. Ejecuta `npm ci`.
4. Publica las reglas incluidas, carga los datos sintéticos y prueba la app siguiendo [CONFIGURACION_FIREBASE.md](docs/CONFIGURACION_FIREBASE.md).

El repositorio remoto no fue modificado. Para incorporar esta versión a tu copia Git, reemplaza el código y archivos de configuración sin borrar `.git` ni `.env`. Retira la antigua carpeta `functions`, `storage.rules` y `tests/server-parity.test.ts` si permanecen tras copiar; esta versión los sustituye. Conserva el nuevo package-lock.json.

## Funciones

- Registro TECHNICIAN, acceso por correo/Google, recuperación/cambio de contraseña y cierre de sesión.
- Inventario, lectura QR/códigos, equipos serializados y consumibles.
- Proyectos, asignación administrativa de técnicos, alertas e historial persistente.
- Salida, instalación y devolución mediante transacciones Firestore.
- Miniatura opcional de fotografía JPEG de hasta 180.000 caracteres, guardada en el documento del movimiento. No utiliza Storage. Es una solución para evidencia pequeña en esta demo, no un repositorio de fotografías originales.

## Datos y autorización

Colecciones `users`, `equipment`, `projects`, `assignments`, `movements`. Los modelos visibles de la app se conservan; el servicio reconstruye Database a partir de las colecciones. No se usa el agregado `stockroom/state` de la versión Blaze. Si solo creaste la base vacía, como en el flujo guiado, no necesitas migrar datos.

Las reglas verifican que inventario, asignación e historial se actualicen conjuntamente, cantidades positivas/stock no negativo, técnico y proyecto válidos, rol, devolución y campos inmutables. El historial no admite edición/borrado desde la app. Cada movimiento conserva `actorUserId`, `responsibleUserId` y `createdAt` con marca de tiempo del servidor. La hora local `date` facilita compatibilidad con la interfaz y no debe utilizarse como reloj de auditoría.

Como en la demo previa, los miembros activos comparten catálogo y directorio de Dtech; el técnico tiene una vista filtrada de sus proyectos/asignaciones. No es aislamiento de lectura por técnico ni un sistema multiorganización. El registro de cuenta técnica es abierto; no recibe proyectos automáticamente. Para producción se requiere aprobar miembros y diseñar permisos de lectura específicos. ADMIN y WAREHOUSE se asignan fuera del cliente, desde Firebase Console o la herramienta administrativa de demostración.

El ID de reintento se mantiene durante la sesión para evitar duplicados si se pierde una respuesta. Si reinicias tras un resultado incierto, verifica el historial antes de repetir. Las operaciones necesitan Internet y no existe una cola offline.

## Pruebas

```powershell
npm run check
npm --prefix tools ci
npm run test:firebase
npm run export:web
```

`tools` solo contiene utilidades locales para preparar datos y pruebas; no se despliega. No se ejecuta en el teléfono ni requiere Blaze.

Google nativo sigue requiriendo APK de desarrollo y configuración OAuth/SHA-1. Correo/Firestore pueden probarse con Expo Go compatible con SDK 55. Las miniaturas usan expo-image-manipulator, compatible con esa versión. Spark tiene cuotas gratuitas: no se prometen recursos ilimitados. Permanece en Spark para evitar vincular facturación.

## Entrega académica

Esta es Etapa 3 — Foro 2. El PDF de investigación Firebase en APA 7 y el video de máximo 15 minutos siguen siendo entregables separados. No se afirma que la web Next.js anterior ya esté conectada al mismo Firebase.

Guías: [Configuración](docs/CONFIGURACION_FIREBASE.md) · [Cambios](docs/CAMBIOS_FORO2.md) · [Validación](docs/VALIDACION.md) · [Video](docs/GUION_VIDEO.md).
