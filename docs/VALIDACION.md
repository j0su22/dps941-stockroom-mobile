# Validación Spark 2.1.0

## Comprobado

- TypeScript cliente sin errores; 14 pruebas unitarias aprobadas (negocio y referencias de la semilla).
- Empaquetado web y Android aprobado; no equivale a compilar/instalar un APK.
- Reglas Firestore cargadas en emulador y probadas con contextos autenticados.
- Lectura sin sesión rechazada; lectura de miembro activo admitida.
- Cambio de rol y modificación directa de stock rechazados.
- Técnico no puede agregar técnicos a proyectos; ADMIN sí puede.
- Dos salidas concurrentes del mismo serial: solo una se confirma, stock final cero.
- Reintento con el mismo ID no vuelve a descontar.
- Instalación con miniatura y devolución dañada: escrituras atómicas aprobadas.
- Alterar autor, editar historial o crear movimiento aislado se rechaza.

Las pruebas de Spark utilizan el SDK cliente y reglas reales del emulador de Firestore. No usan handlers Admin para simular una escritura del teléfono. El servidor Firebase valida las reglas; no se confía solamente en la UI.

## Pendiente con tu configuración

- Login/registro/recuperación y Google real con tu proyecto.
- Imagen comprimida real de cámara/galería en teléfono y visualización en otro dispositivo.
- Firma SHA-1/OAuth, compilación APK e instalación.
- Sincronización visual con dos teléfonos, permisos y lectura QR.
- iOS en hardware/simulador Apple.

La prueba de miniatura en reglas valida estructura/tamaño, no decodifica una fotografía real. El paquete no habilita facturación y no hizo cambios remotos. El video y documento académico deben registrar resultados reales.

## Repetir

```powershell
npm ci
npm run check
npm --prefix tools ci
npm run test:firebase
npm run export:web
npx expo export --platform android --output-dir native-export
```

Mensajes PERMISSION_DENIED son esperados en pruebas negativas; la suite debe terminar con código 0. Para reglas usa Java 21. El código conserva Expo SDK 55.
