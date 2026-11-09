import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
export async function persistEvidence(uri: string): Promise<string> {
  // Miniatura pequeña para la demo Spark; no depende de Cloud Storage.
  const result = await manipulateAsync(uri, [{ resize: { width: 640 } }], { compress: 0.35, format: SaveFormat.JPEG, base64: true });
  if (!result.base64) throw new Error('No se pudo procesar la fotografía.');
  const data = `data:image/jpeg;base64,${result.base64}`;
  if (data.length > 180000) throw new Error('La foto sigue siendo demasiado grande. Selecciona una imagen más sencilla o continúa sin evidencia.');
  return data;
}
export async function deleteEvidence(_uri: string): Promise<void> {}
