# STOCKROOM · Grupo Dtech

Aplicación móvil de **Diseño y Programación de Software Multiplataforma (DPS941)**.
Entrega: **Etapa 3, Foro 1 — Diseño UX/UI y avance móvil con React Native**.

Código completo del avance móvil, construido con React Native, Expo y TypeScript. Implementa el flujo de campo definido en los documentos y mockups de Stockroom: identificar equipo, consultar asignaciones, registrar salidas, instalaciones y devoluciones, y consultar trazabilidad.

## 1. Alcance de esta entrega

- Inicio de sesión y registro funcionales, cambio de contraseña, sesión con vencimiento y cierre de sesión.
- Roles `ADMIN`, `WAREHOUSE` y `TECHNICIAN`. El registro público crea exclusivamente técnicos.
- Inicio con indicadores calculados a partir del inventario local.
- Inventario con búsqueda, filtro de asignaciones y detalle de equipos/materiales.
- Cámara para leer QR/código de barras y alternativa de ingreso manual.
- Salidas a proyectos, instalaciones y devoluciones con reglas de stock y responsabilidad.
- Evidencia fotográfica opcional desde cámara o galería; se conserva al guardar la instalación.
- Proyectos y detalle, asignación de técnicos por administración, alertas y trazabilidad.
- Validaciones, confirmación de operaciones y estados de carga, error y listas vacías.
- Datos persistentes en el dispositivo, incluso después de cerrar sesión.

**Modo local de demostración:** este avance funciona sin API ni credenciales externas. No hay sincronización con la web, autenticación de Google, Firebase, JWT de servidor ni Firestore. Esos servicios no se simulan como si ya existieran. La autenticación local sirve para demostrar el Foro 1, pero no es una frontera de seguridad de producción. Usa datos ficticios. Una autoridad de servidor y reglas de acceso remotas serán necesarias para producción y Foro 2.

## 2. Requisitos e instalación en Windows 11

Instala Node.js **22 LTS o 24 LTS** y Git. Abre PowerShell o la terminal de Visual Studio Code.

Después de extraer este proyecto o clonar su repositorio:

```powershell
cd stockroom-mobile
npm ci
npm run check
npm start
```

El archivo `package-lock.json` está incluido; `npm ci` reproduce las versiones entregadas. No copies `node_modules` al repositorio.

### Android físico

1. La app utiliza **Expo SDK 55**. Instala una versión de Expo Go compatible con ese SDK desde https://expo.dev/go . Si la tienda ofrece otra versión, selecciona SDK 55 en esa página o utiliza la compilación APK descrita abajo.
2. Conecta el teléfono y la computadora a la misma red Wi-Fi.
3. Ejecuta `npm start` y escanea el QR de desarrollo con Expo Go.
4. Autoriza a Node.js en el firewall de Windows para tu red privada si la conexión LAN se bloquea.

El QR que muestra Metro abre la aplicación. Los QR de `docs/qr/` identifican equipos dentro del escáner de Stockroom: son dos usos diferentes.

Para emulador Android, inicia primero el emulador de Android Studio y ejecuta:

```powershell
npm run android
```

### iPhone / iOS

Usa un cliente de desarrollo o Expo Go **compatible con SDK 55** según https://expo.dev/go . La versión de Expo Go distribuida en App Store puede no corresponder con este SDK. El simulador iOS requiere macOS; no se ejecuta en Windows. Una compilación iOS por EAS requiere configuración y cuenta Apple apropiadas.

### Vista web para revisión rápida

```powershell
npm run web
```

Abre la URL local indicada por Expo. La cámara web requiere un navegador compatible y un contexto seguro (localhost o HTTPS). Siempre está disponible la búsqueda manual. La demostración web complementa la prueba móvil; no la sustituye.

### APK de prueba mediante EAS (opcional)

Para generar un APK instalable sin depender de Expo Go:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

La primera configuración vincula el proyecto a tu cuenta Expo y puede solicitar un identificador propio. `eas.json` incluye el perfil `preview` con salida APK. La construcción se hace en tu cuenta y está sujeta a sus límites; este archivo no incluye una APK ni afirma que se haya construido en EAS.

## 3. Cuentas de demostración

| Rol | Correo | Contraseña inicial |
| --- | --- | --- |
| Técnico de campo | `tecnico@dtech.com` | `Stockroom2026!` |
| Administrador | `admin@dtech.com` | `Stockroom2026!` |
| Encargado de bodega | `bodega@dtech.com` | `Stockroom2026!` |
| Segundo técnico | `maria@dtech.com` | `Stockroom2026!` |

Las cuentas se crean una sola vez al primer inicio. Si cambias una contraseña, la tabla deja de describir esa cuenta. El registro crea una cuenta nueva en este dispositivo; administración debe agregarla a un proyecto desde **Proyectos → detalle → Asignar técnico**. Después, el nuevo técnico verá ese proyecto al iniciar sesión.

Las contraseñas se guardan como PBKDF2-SHA256 con sal aleatoria (100 000 iteraciones), no como texto. El repositorio contiene contraseñas conocidas únicamente para cuentas ficticias. Las sesiones recordadas vencen a las 12 horas y se guardan con SecureStore en Android/iOS; en la vista web se utiliza sessionStorage y se conservan solo en la pestaña correspondiente. Si desmarcas «Recordarme», la sesión queda únicamente en memoria.

## 4. Recorrido recomendado para el Foro 1

1. Inicia sesión con `tecnico@dtech.com`.
2. Revisa Inicio, Proyectos y Equipos bajo responsabilidad.
3. Abre **Escanear**. Lee el QR `docs/qr/EQ-001.png` mostrado en otra pantalla o escribe `EQ-001` manualmente.
4. Revisa el detalle del Ubiquiti y registra una salida de **1** unidad a **Torre 1**. Confirma la operación.
5. Abre el historial: aparece la salida con usuario, proyecto, fecha, origen y destino. El disponible del Ubiquiti queda en cero.
6. Vuelve al detalle y registra la instalación de esa asignación indicando una ubicación, por ejemplo `Piso 2 · Sala de reuniones`. Puedes adjuntar una foto real de prueba.
7. Demuestra que el equipo instalado no puede salir nuevamente ni instalarse dos veces.
8. Usa el **Switch 24p Gigabit (EQ-002)**, ya asignado al técnico, para demostrar una devolución. «Buen estado» repone stock; «Revisión» o «Dañado» lo aparta de disponibilidad.
9. Usa `MAT-002` para probar cantidades parciales. La asignación inicial tiene **10** unidades, **6 instaladas** y **4 pendientes**. No permite devolver 5 de esa asignación.
10. Cierra sesión, vuelve a ingresar y comprueba que los movimientos persisten.

Para volver al estado inicial durante ensayos, borra el almacenamiento de esta app desde el dispositivo, o limpia los datos del sitio en la vista web. Esto elimina las cuentas nuevas, contraseñas cambiadas, inventario y evidencias locales; hazlo solo con datos de prueba. No hay botón de borrado dentro de la aplicación.

## 5. Reglas de negocio y permisos

| Operación | ADMIN / WAREHOUSE | TECHNICIAN |
| --- | --- | --- |
| Consultar catálogo y alertas de stock | Sí | Sí |
| Consultar proyectos, asignaciones e historial | Todos | Proyectos propios, asignaciones propias e historial donde es responsable o autor |
| Registrar salida | A un técnico activo del proyecto | Solo a sí mismo, en un proyecto al que pertenece |
| Instalar o devolver | Sobre una asignación válida | Sobre su asignación válida |
| Agregar técnico a proyecto | Solo ADMIN | No |
| Crear cuentas mediante registro | Técnico | Técnico |

La salida directa de un técnico a sí mismo es un **supuesto de este avance**, tomado del botón «Nueva salida» del mockup móvil. No incorpora una aprobación de bodega. Si el docente exige aprobación, debe implementarse explícitamente en el servicio y en el flujo.

- Un equipo serializado representa **una unidad física**, con stock disponible 0 o 1.
- Los materiales consumibles admiten cantidades enteras y salidas parciales.
- Una salida no puede exceder stock ni usar un proyecto cerrado.
- `Pendiente = asignado - instalado - devuelto`.
- Instalar utiliza pendientes; no descuenta stock por segunda vez.
- Solo se devuelven pendientes no instalados. El retiro de un equipo instalado se deja para un flujo posterior.
- Una devolución en buen estado incrementa disponibilidad; en revisión o dañada incrementa cuarentena.
- Las devoluciones se reciben en **Bodega principal** en este avance. Se permiten desde proyectos cerrados para resolver pendientes.
- Movimientos, stock y asignaciones se validan juntos y se guardan en una sola escritura local. Las operaciones se serializan en la instancia de la app para evitar carreras por doble envío.
- Las fechas reales de movimientos nuevos se generan al confirmar. Las fechas de los registros semilla son ficticias.

El porcentaje mostrado en Proyectos representa unidades instaladas / unidades asignadas **visibles para la cuenta actual**. No pretende medir el avance contractual completo de una obra ni sumar equivalencias entre materiales distintos.

## 6. Arquitectura

```text
App.tsx
src/
  components/    Controles reutilizables, tarjetas, mensajes y confirmaciones
  screens/       Pantallas React Native
  navigation/    Stack autenticado, stack público y tabs tipados
  context/       Sesión y estado de inventario
  hooks/         Selectores para la cuenta actual
  domain/        Reglas puras de inventario y validación
  services/      Autenticación, almacenamiento, inventario y evidencias
  types/         Contratos compartidos
  data/          Semilla ficticia
  theme/         Tokens visuales y etiquetas
tests/           Pruebas de reglas de negocio
docs/            Alcance, revisión de fuentes, pruebas y guion de video
```

Flujo: **Pantalla → Hook / Context → Servicio → Persistencia**. El servicio aplica las funciones de `domain/` antes de persistir. Las pantallas no escriben AsyncStorage directamente.

El proyecto web sigue siendo una app independiente de Next.js. No reemplaces su `package.json` ni copies esta app encima de él. Puedes crear un repositorio móvil independiente llamado `dps941-stockroom-mobile`; si prefieres un monorepo, coloca este código en `mobile/` sin mezclar dependencias ni archivos raíz.

## 7. Subir a GitHub desde Windows

Crea un repositorio vacío en GitHub, sin agregar otro README durante su creación. Ejecuta desde la raíz de esta app:

```powershell
git init -b development
git add .
git commit -m "feat(mobile): implement Stockroom Foro 1"
git remote add origin https://github.com/TU_USUARIO/dps941-stockroom-mobile.git
git push -u origin development
```

Reemplaza `TU_USUARIO` y la URL por los de tu repositorio. No he creado ni publicado un repositorio en tu cuenta.

Para cambios posteriores, conserva el flujo de ramas del equipo:

```powershell
git checkout development
git pull origin development
git checkout -b feature/mobile-foro1-adjustments
# Realiza y revisa tus cambios
npm run check
git add .
git commit -m "feat(mobile): refine Foro 1 demonstration"
git push -u origin feature/mobile-foro1-adjustments
```

Abre un Pull Request hacia `development`. Agrega al compañero como colaborador y realiza commits propios y explicables. Este ZIP no crea commits ficticios ni evidencia de participación de otras personas.

## 8. Comprobaciones

```powershell
npm run check
npx expo install --check
npm run export:web
npm run test:ui
npx expo export --platform android --platform ios --output-dir native-export
```

Consulta `docs/VALIDACION.md` para los resultados realmente comprobados y pruebas pendientes en teléfono. Exportar los bundles de Android/iOS comprueba la compilación JavaScript/Hermes, no equivale a generar ni instalar una APK/IPA.

## 9. Lo que todavía debes completar para entregar la actividad

- Ejecutar y revisar la app en tu teléfono, incluida cámara, permisos y foto persistente.
- Publicar tu repositorio y configurar colaboradores.
- Grabar el video de máximo 15 minutos con una demostración real.
- Elaborar el PDF de React Native y Figma aplicados al proyecto con APA 7 y capturas reales.
- Entregar los enlaces y el PDF en Aula Digital.

La app cubre el código del avance. No se incluyen un video, un PDF académico terminado ni afirmaciones de que el docente haya aceptado el alcance.

## 10. Fuentes y próximos pasos

Se consultaron la Ruta de Aprendizaje, Unidades 1–4, la propuesta y modificaciones de Etapa 1, mockups móviles y web, contexto del proyecto, guía de colaboración y los tres respaldos web. La interpretación y diferencias están en `docs/CONTEXTO_Y_DECISIONES.md`. Los archivos del curso se usan como referencia y no se redistribuyen dentro del repositorio.

Referencias técnicas oficiales:

- https://docs.expo.dev/versions/v55.0.0/
- https://docs.expo.dev/versions/v55.0.0/sdk/camera/
- https://docs.expo.dev/versions/v55.0.0/sdk/securestore/
- https://docs.expo.dev/versions/v55.0.0/sdk/imagepicker/
- https://docs.expo.dev/versions/v55.0.0/sdk/filesystem-legacy/
- https://reactnavigation.org/docs/getting-started/
- https://expo.dev/go

Para Foro 2: reemplazar los servicios locales por Firebase Authentication y Firestore, incorporar Google, reglas de seguridad por rol/usuario, carga de evidencias a almacenamiento remoto y sincronización web/móvil. Mantener la validación del lado servidor; esconder botones no protege datos remotos.
