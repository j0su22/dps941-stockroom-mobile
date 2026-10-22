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
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No fue posible completar la operación.';
