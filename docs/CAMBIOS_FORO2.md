# Corrección Spark 2.1.0

El requisito del usuario es no pagar ni vincular tarjeta. El primer paquete incorporó Functions y Storage, que requerían Blaze. Esta corrección elimina ambas dependencias de despliegue.

- Authentication por correo y Google se conserva.
- Firestore usa colecciones por entidad y transacciones desde el cliente.
- Reglas validan permisos, stock, asignación y movimiento como una operación conjunta; no se depende solo de validaciones de pantalla.
- Fotos opcionales se comprimen como miniaturas JPEG pequeñas en el documento del movimiento; no se utiliza un proveedor externo ni Storage.
- La herramienta de carga es local (`tools`); no despliega servicios.
- Se conserva el diseño y el código de negocio del Foro 1.
- Se reutiliza la configuración Firebase que el usuario ya completó.

La Ruta de Aprendizaje exige correo/Google, datos asociados al usuario, módulos secundarios, historial, documento y video. No exige Functions ni Cloud Storage para este Foro 2. Esta versión no incluye aún el PDF académico ni la grabación.

El repositorio se mantuvo de solo lectura. Los 41 archivos del ZIP original coincidían con main en fe0ce87eea1a254b22c441186271eb9c598d2a52. Los diseños Figma móviles existentes siguen siendo suficientes.
