export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export function validateEmail(value: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value)) && value.length <= 254
    ? undefined : 'Ingresa un correo electrónico válido.';
}
export function validatePassword(value: string): string | undefined {
  return value.length >= 8 && value.length <= 128 && /[A-Za-z]/.test(value) && /\d/.test(value)
    ? undefined : 'Usa de 8 a 128 caracteres, con al menos una letra y un número.';
}
export function validateName(value: string): string | undefined {
  return value.trim().length >= 3 && value.trim().length <= 80
    ? undefined : 'El nombre debe tener entre 3 y 80 caracteres.';
}
export function parseQuantity(value: string): number {
  return /^\d+$/.test(value.trim()) ? Number(value) : Number.NaN;
}
export function errorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code || '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
    'auth/network-request-failed': 'No fue posible conectar. Revisa tu conexión a Internet.',
    'auth/popup-closed-by-user': 'Inicio con Google cancelado.',
    'auth/popup-blocked': 'Permite ventanas emergentes para iniciar sesión con Google.',
    'auth/unauthorized-domain': 'Agrega este dominio a los dominios autorizados de Firebase Authentication.',
    'permission-denied': 'Acceso denegado. Revisa tu cuenta activa y las reglas de Firebase.',
    'functions/unavailable': 'El servidor no está disponible. Verifica el despliegue de Cloud Functions.',
  };
  return messages[code] || (error instanceof Error ? error.message : 'No fue posible completar la operación.');
}
