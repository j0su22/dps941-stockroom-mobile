import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, statusLabel, ui } from '../theme/theme';
import type { Equipment } from '../types/models';

export function Button({ title, onPress, secondary = false, danger = false, disabled = false, loading = false }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; loading?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [styles.button, { backgroundColor: danger ? '#FDEAE8' : secondary ? colors.white : colors.yellow, borderColor: danger ? '#F4BDB7' : secondary ? colors.blue : colors.yellow, opacity: disabled || loading ? 0.5 : pressed ? 0.75 : 1 }]}>
    {loading ? <ActivityIndicator color={colors.blue} /> : <Text style={[styles.buttonText, { color: danger ? colors.red : colors.blue }]}>{title}</Text>}
  </Pressable>;
}
export function Field({ label, error, dark = false, ...props }: TextInputProps & { label: string; error?: string; dark?: boolean }) {
  return <View style={{ gap: 7 }}>
    <Text style={[styles.label, dark && { color: '#D7E0FF' }]}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={dark ? '#A7B8E8' : '#89919F'} {...props}
      style={[styles.input, dark && { backgroundColor: colors.navy, color: colors.white, borderColor: '#4660AC' }, props.multiline && { minHeight: 110, textAlignVertical: 'top' }, error ? { borderColor: colors.red } : undefined, props.style]} />
    {error ? <Text accessibilityRole="alert" style={{ color: dark ? '#FFD1C9' : colors.red }}>{error}</Text> : null}
  </View>;
}
export function Message({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' | 'success' }) {
  return <View accessibilityLiveRegion="polite" style={{ padding: 14, borderRadius: 12, backgroundColor: tone === 'error' ? '#FDEAE8' : tone === 'success' ? '#E3F4EC' : colors.pale }}>
    <Text style={{ fontSize: 13, lineHeight: 20, color: tone === 'error' ? colors.red : tone === 'success' ? colors.green : colors.blue }}>{text}</Text>
  </View>;
}
export function Screen({ children, refresh, refreshing = false }: React.PropsWithChildren<{ refresh?: () => void; refreshing?: boolean }>) {
  // refresh se presenta como botón accesible también en web.
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={95}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center', paddingBottom: 36 }}>
      {refresh ? <Pressable accessibilityRole="button" onPress={refresh} disabled={refreshing} style={{ alignSelf: 'flex-end', padding: 8 }}><Text style={{ color: colors.blue, fontWeight: '600' }}>{refreshing ? 'Actualizando…' : 'Actualizar datos'}</Text></Pressable> : null}
      {children}
    </ScrollView>
  </KeyboardAvoidingView>;
}
export function Empty({ title, detail }: { title: string; detail?: string }) {
  return <View style={[ui.card, { alignItems: 'center', paddingVertical: 26 }]}><Ionicons name="file-tray-outline" size={30} color={colors.muted} /><Text style={ui.heading}>{title}</Text>{detail ? <Text style={[ui.muted, { textAlign: 'center' }]}>{detail}</Text> : null}</View>;
}
export function Loading({ label = 'Cargando Stockroom…' }: { label?: string }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.blue} /><Text style={ui.muted}>{label}</Text></View>;
}
export function Badge({ text }: { text: string }) { return <View style={ui.badge}><Text style={ui.badgeText}>{text}</Text></View>; }
export function EquipmentCard({ equipment, onPress, detail }: { equipment: Equipment; onPress: () => void; detail?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${equipment.name}, ${equipment.code}`} onPress={onPress} style={[ui.card, ui.row]}>
    <View style={{ width: 46, height: 50, backgroundColor: colors.pale, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={equipment.kind === 'SERIALIZED' ? 'hardware-chip-outline' : 'cube-outline'} size={24} color={colors.blue} /></View>
    <View style={{ flex: 1, gap: 4 }}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{equipment.name}</Text><Text style={ui.muted}>{equipment.serialNumber ?? equipment.code}</Text><Text style={ui.muted}>{detail ?? `${equipment.stock} disponibles · ${statusLabel[equipment.status]}`}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
  </Pressable>;
}
export function Select({ label, value, onChange, options, placeholder = 'Seleccionar…' }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 7 }}><Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${options.find(o => o.value === value)?.label ?? placeholder}`} onPress={() => setOpen(true)} style={[styles.input, ui.row]}>
      <Text style={{ flex: 1, color: value ? colors.ink : colors.muted, fontSize: 15 }}>{options.find(o => o.value === value)?.label ?? placeholder}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} />
    </Pressable>
    <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
      <View style={styles.scrim}><View style={styles.sheet}><Text style={ui.heading}>{label}</Text><ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 380 }}>
        {options.length ? options.map(o => <Pressable accessibilityRole="button" accessibilityState={{ selected: o.value === value }} key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={{ paddingVertical: 17, borderBottomWidth: 1, borderColor: colors.border }}><Text style={{ color: o.value === value ? colors.blue : colors.ink, fontWeight: o.value === value ? '700' : '400' }}>{o.label}</Text></Pressable>) : <Text style={[ui.muted, { marginVertical: 20 }]}>No hay opciones disponibles.</Text>}
      </ScrollView><Button title="Cancelar" secondary onPress={() => setOpen(false)} /></View></View>
    </Modal>
  </View>;
}
export function Confirm({ visible, title, description, busy, onCancel, onConfirm }: { visible: boolean; title: string; description: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}><View style={styles.scrim}><View style={styles.sheet}>
    <Text style={ui.heading}>{title}</Text><Text style={ui.body}>{description}</Text><Button title="Confirmar" loading={busy} onPress={onConfirm} /><Button title="Cancelar" secondary disabled={busy} onPress={onCancel} />
  </View></View></Modal>;
}
const styles = StyleSheet.create({
  button: { minHeight: 50, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, color: colors.ink, padding: 14, fontSize: 15 },
  scrim: { flex: 1, backgroundColor: '#00000077', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 500, backgroundColor: colors.white, borderRadius: 18, padding: 22, gap: 16 },
});
