import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

export async function persistEvidence(uri: string): Promise<string> {
  // En web convertimos el blob temporal en data URL para que sobreviva a recargas.
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size > 3 * 1024 * 1024) throw new Error('La evidencia debe pesar como máximo 3 MB.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo guardar la imagen.'));
      reader.readAsDataURL(blob);
    });
  }
  const directory = `${FileSystem.documentDirectory}evidence/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = `${directory}${Crypto.randomUUID()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}
export async function deleteEvidence(uri: string): Promise<void> {
  if (Platform.OS !== 'web' && uri.startsWith(`${FileSystem.documentDirectory}evidence/`)) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
