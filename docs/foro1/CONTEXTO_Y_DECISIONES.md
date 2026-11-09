# Revisión de material y decisiones del avance

## Fuentes revisadas

| Material | Uso en este código |
| --- | --- |
| Ruta de Aprendizaje DPS941 | Foro 1: autenticación, módulo principal, navegación, coherencia con Figma y validaciones. GitHub + video + PDF son entregables separados. Firebase corresponde expresamente al Foro 2. |
| Unidad 1 | JavaScript, estructuras de control y organización de la lógica. |
| Unidad 2 | Git/GitHub, componentes, estado y fundamentos React. |
| Unidad 3 | Componentes React Native, estilos y diseño multiplataforma. |
| Unidad 4 | React Navigation, navegación entre pantallas y separación de servicios/datos. |
| DPS941 1ra fase.pdf / .docx y modificaciones.docx | Grupo Dtech, inventario técnico, series/MAC frente a consumibles, roles y flujo de campo. |
| Mockups PNG de Etapa 1 | Pantallas móviles de login, inicio, escaneo, detalle, salida, instalación, devolución, proyectos, alertas y perfil. |
| Prototipos HTML móvil y web | Paleta #12318F / #FFC61E, superficies claras, tarjetas, jerarquía y navegación. El HTML se trata como referencia, no como código nativo reutilizable. |
| DPS - MockUp.pdf de Etapa 2 | Relación entre la app de campo y las vistas administrativas web. |
| CONTEXTO_PROYECTO_STOCKROOM.md | Roles ADMIN/WAREHOUSE/TECHNICIAN, modelos, reglas de stock, capas y contexto de dos integrantes. |
| GUIA_COMPANERO_PROYECTOS_DASHBOARD.md | Flujo por ramas, separación de responsabilidades y estados loading/error/empty. |
| Respaldo web development | Contratos reales Equipment/Movement/Project/User y servicios. `authService.ts` aún estaba pendiente; AuthContext guardaba usuario en memoria. |
| Respaldo feature-projects-dashboard | Vistas y selectores web, alcance del trabajo del compañero. |
| Respaldo template | Estructura base Next.js. No es un proyecto React Native reutilizable directamente. |
| Dos imágenes WhatsApp y ENtrega.pdf | Las imágenes no aportan una guía completa nueva; ENtrega.pdf tiene cero bytes y no contiene instrucciones legibles. |

Las copias repetidas de `DPS - MockUp.pdf` y de la entrega de Fase 1 no son actividades adicionales. Las versiones de respaldo no se declaran como el estado actual de un repositorio remoto.

## Decisiones explícitas

1. **App móvil independiente:** conserva la app Next.js y su contexto. Usa TypeScript por continuidad con la web; React Native admite TS y JSX.
2. **Expo SDK 55 fijado:** se usa una línea concreta y dependencias compatibles, sin comandos globales antiguos como `expo init`. El lockfile fija el conjunto probado. No se afirma que sea el SDK más reciente.
3. **Servicios locales para Foro 1:** no se inventa un endpoint JWT ni un servidor Spring Boot que no fue compartido. Las operaciones se pueden demostrar sin conexión. La arquitectura propuesta de Fase 1 era cliente/servidor, y este avance es una implementación local transitoria, no esa integración final.
4. **Contratos extendidos:** se mantienen nombres como UserRole, Equipment, Project y Movement. Se agrega `kind`, `maintenanceStock`, `Assignment` y tipo `INSTALL` porque la app debe distinguir unidades físicas, consumibles e instalaciones. Son contratos de esta app; no se sobrescriben los del respaldo web.
5. **Corrección de serialización:** el respaldo web mostraba 22 unidades para un registro con una serie única. Aquí cada equipo serializado representa una sola unidad. Los consumibles se controlan por cantidad.
6. **Roles:** un técnico ve todas las referencias del catálogo, pero solo sus proyectos y asignaciones. Admin y bodega pueden operar todas las asignaciones válidas; solo admin incorpora técnicos a proyectos. El almacenamiento local completo es accesible a quien controla el dispositivo, por lo que esto no sustituye autorización remota.
7. **Nueva salida móvil:** se conserva el botón del mockup. El técnico puede registrar una salida únicamente a sí mismo dentro de un proyecto asignado. Es un supuesto funcional que debe confirmarse si se requiere aprobación formal de bodega.
8. **Fotografía:** opcional en instalación; no se usa una imagen ficticia como evidencia. Se guarda una copia persistente al confirmar. El servicio intenta eliminar la copia si falla el guardado del movimiento.
9. **Retorno:** material no usado de una asignación vuelve a Bodega principal. Daño o revisión no repone stock utilizable. Desinstalación/retiro de unidades ya instaladas queda fuera del avance.
10. **Datos semilla ficticios:** nombres, fechas, cantidades y clientes sirven para ensayar. Indicadores y alertas se calculan, no se copian las cifras decorativas de los mockups.
11. **Pantallas:** React Navigation usa tabs para las cinco áreas principales y stack para detalle, formularios e historial. Solo se monta el árbol de datos tras autenticar; al cerrar sesión se desmonta.
12. **Fuera del código solicitado:** el PDF académico y el video deben elaborarse y grabarse con la app ya probada; no se fabrican capturas, resultados ni commits de integrantes.

## Trazabilidad con Foro 1

| Requisito | Implementación |
| --- | --- |
| Login/registro funcional | AuthScreens.tsx, AuthContext.tsx, authService.ts |
| Módulo principal | Inventario, asignaciones, movimientos, instalación y devolución |
| Navegación funcional | RootNavigator.tsx y navigation/types.ts |
| Coherencia con Figma | theme.ts y pantallas con azul/amarillo, tarjetas claras y tabs |
| Validaciones | domain/validation.ts, domain/inventory.ts y mensajes de formularios |
| Componentes reutilizables | components/UI.tsx |
| Explicar React Native/Figma | Este archivo y arquitectura del README como apoyo; el documento APA es un entregable posterior |
