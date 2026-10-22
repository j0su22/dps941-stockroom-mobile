import { StyleSheet } from 'react-native';
export const colors = { blue: '#12318F', navy: '#0D2670', yellow: '#FFC61E', background: '#F4F5F7', white: '#FFFFFF', ink: '#17181C', muted: '#6B7280', border: '#DFE3EC', pale: '#EAEEFA', red: '#C52E25', green: '#15734A' };
export const ui = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 20, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: colors.muted, marginTop: 14 },
  card: { padding: 18, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.pale },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.blue },
});
export const roleLabel = { ADMIN: 'Administrador', WAREHOUSE: 'Encargado de bodega', TECHNICIAN: 'Técnico' };
export const statusLabel = { IN_STOCK: 'En bodega', ASSIGNED: 'Asignado', INSTALLED: 'Instalado', MAINTENANCE: 'En revisión' };
export const movementLabel = { EXIT: 'Salida', INSTALL: 'Instalación', RETURN: 'Devolución' };
export function formatDate(value: string) { return new Date(value).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' }); }
