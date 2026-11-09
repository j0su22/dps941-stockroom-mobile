# Continuar con Firebase Spark — sin tarjeta

Ya puedes conservar stockroom-dps, la app web registrada, correo/Google habilitados y la base Firestore `(default)`. Cierra la ventana de facturación y permanece en Spark. No habilites Storage ni Functions.

## 1. Instalar el paquete corregido

Extrae en una carpeta nueva, abre stockroom-mobile en VS Code y copia allí tu `.env` anterior. Luego:

```powershell
npm ci
npm run check
```

Si no tienes `.env`: `Copy-Item .env.example .env` y completa los valores del registro web de Firebase. Deja EXPO_PUBLIC_EMULATOR_HOST vacío para usar el proyecto real. Reinicia Expo después de cambiar variables.

## 2. Publicar las reglas

Opción A: abre `firestore.rules` en VS Code, copia TODO su contenido y pégalo en Firebase Console → Firestore → Reglas. Pulsa Publicar.

Opción B: desde PowerShell en la raíz:

```powershell
npx firebase login
npx firebase deploy --only firestore:rules --project stockroom-dps
```

No uses `firebase init`: los archivos ya están preparados. Ninguno de estos pasos despliega Functions ni Storage. No reemplaces las reglas por `allow read, write: if true`.

## 3. Preparar datos y cuentas de prueba

La carpeta tools contiene una herramienta local con Admin SDK; no crea un servidor ni utiliza un servicio de pago.

```powershell
npm --prefix tools ci
```

Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar clave privada. Guarda el JSON fuera del repositorio, por ejemplo C:\Privado\stockroom-admin.json. No lo compartas ni lo subas a GitHub.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\Privado\stockroom-admin.json'
$env:GCLOUD_PROJECT = 'stockroom-dps'
$env:STOCKROOM_DEMO_PASSWORD = Read-Host 'Contraseña temporal de prueba (mínimo 12 caracteres)'
npm --prefix tools run seed
Remove-Item Env:STOCKROOM_DEMO_PASSWORD
Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS
```

Crea admin@dtech.com (ADMIN), bodega@dtech.com (WAREHOUSE), tecnico@dtech.com y maria@dtech.com (TECHNICIAN). La contraseña es la que indiques. No se cambian contraseñas de cuentas ya existentes. Se remapean todos los USR-* a UID Firebase reales. La carga se detiene si ya hay equipos para no sobrescribir operaciones. Los datos son sintéticos.

## 4. Abrir y probar por correo

```powershell
npx expo start --go --clear
```

Usa Expo Go compatible con SDK 55. Entra con tecnico@dtech.com. Comprueba equipos/proyectos/asignaciones; registra una salida o una instalación y verifica las colecciones en Firestore. Prueba devolución buena, dañada e historial. Cierra/abre la app y confirma persistencia. Registra una cuenta nueva y asígnala desde un proyecto accediendo como admin.

Las fotografías se reducen a miniaturas. Si una imagen excede 180.000 caracteres después de comprimirla, la app explica el límite; usa otra foto o continúa sin imagen. No necesitas configurar Storage ni crear otra cuenta de servicio para las fotos.

## 5. Google en Android

1. Agrega una app Android a tu proyecto: paquete com.dtech.stockroom.
2. Configura Authentication → Google (ya habilitado).
3. Obtén un OAuth Client ID de tipo Web y colócalo en EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. No es el ID Android ni un client secret.
4. Crea/consulta tu firma con `npx eas-cli credentials --platform android`, agrega su SHA-1/SHA-256 al registro Firebase Android y descarga nuevamente google-services.json.
5. Coloca google-services.json en la raíz local; no lo publiques. GOOGLE_SERVICES_JSON apunta a su ruta.
6. Si OAuth está en Testing, agrega tu correo a los usuarios de prueba.
7. Ejecuta `npx eas-cli build --platform android --profile development`, instala el APK y luego `npx expo start --dev-client --clear`.

EAS es un servicio separado de Firebase y sus límites/colas dependen de tu cuenta; no contrates un plan para seguir esta guía. Si no deseas usar EAS, puedes compilar localmente con Android Studio y `npx expo run:android`. Google no funciona en Expo Go. El build remoto debe recibir las variables EXPO_PUBLIC_* y google-services.json a través de su configuración de entorno/archivo; `.env` ignorado puede no viajar al builder.

Para iOS conserva la configuración de app com.dtech.stockroom, plist y REVERSED_CLIENT_ID descrita por el proveedor Google. Requiere entorno/firma iOS; no fue probado en dispositivo Apple.

## 6. Pruebas locales de reglas (opcional)

Con Java 21 instalado:

```powershell
npm --prefix tools ci
npm run test:firebase
```

El proyecto demo-stockroom-tests y Firestore emulado no se conectan al inventario real. Los rechazos PERMISSION_DENIED son esperados en las pruebas negativas. No necesitas activar Blaze para usar estos emuladores.

## 7. Guardar en Git

Incluye src, tools (sin node_modules/lib), firestore.rules, firebase.json, los lockfiles y docs. Excluye .env, claves privadas, google-services.json, plist, node_modules y exportaciones generadas. Si copias sobre la versión anterior, retira functions y storage.rules; no son parte del nuevo flujo.
