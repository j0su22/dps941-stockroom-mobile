import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Button, Confirm, Empty, EquipmentCard, Field, Message, Screen, Select } from '../components/UI';
import { useStockroom } from '../hooks/useStockroom';
import { useAuth } from '../context/AuthContext';
import { pendingQuantity } from '../domain/inventory';
import { errorMessage } from '../domain/validation';
import { authService } from '../services/authService';
import { colors, formatDate, movementLabel, roleLabel, ui } from '../theme/theme';
import type { RootParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootParamList>;
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { db, user, assignments, projects, alerts, refresh, loading } = useStockroom();
  const pending = assignments.filter(a => pendingQuantity(a) > 0);
  const total = pending.reduce((sum, a) => sum + pendingQuantity(a), 0);
  return <Screen refresh={() => void refresh()} refreshing={loading}>
    <View style={{ backgroundColor: colors.blue, borderRadius: 24, padding: 22, gap: 22 }}>
      <View style={[ui.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={{ fontSize: 27, color: colors.white, fontWeight: '800' }}>Hola, {user.name.split(' ')[0]}</Text><Text style={{ color: '#C7D4FF', marginTop: 5 }}>{roleLabel[user.role]} · Grupo Dtech</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`${alerts.length} alertas`} onPress={() => navigation.navigate('Main', { screen: 'Alerts' })} style={{ backgroundColor: '#FFFFFF22', padding: 12, borderRadius: 14 }}><Ionicons name="notifications-outline" size={24} color={colors.white} /><Text style={{ color: colors.yellow, textAlign: 'center', fontWeight: '800' }}>{alerts.length}</Text></Pressable></View>
      <View style={ui.row}>{[{ n: total, label: 'Pendientes' }, { n: projects.filter(p => p.status !== 'CLOSED').length, label: 'Proyectos activos' }, { n: pending.filter(a => a.dueDate).length, label: 'Con vencimiento' }].map(metric => <View key={metric.label} style={{ flex: 1, padding: 12, backgroundColor: '#FFFFFF18', borderRadius: 12 }}><Text style={{ color: colors.yellow, fontSize: 24, fontWeight: '800' }}>{metric.n}</Text><Text style={{ color: '#D9E1FF', fontSize: 11, marginTop: 4 }}>{metric.label}</Text></View>)}</View>
    </View>
    <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Main', { screen: 'Scan' })} style={[ui.row, { backgroundColor: colors.yellow, padding: 22, borderRadius: 20 }]}><Ionicons name="scan-outline" size={40} color={colors.blue} /><View><Text style={{ fontSize: 20, color: colors.blue, fontWeight: '800' }}>Escanear equipo</Text><Text style={{ color: colors.navy }}>QR o código de barras</Text></View></Pressable>
    <Text style={ui.section}>ACCIONES RÁPIDAS</Text>
    <View style={{ gap: 10 }}><Button title="Nueva salida" secondary onPress={() => navigation.navigate('Movement', { type: 'EXIT' })} /><View style={ui.row}><View style={{ flex: 1 }}><Button title="Instalación" secondary onPress={() => navigation.navigate('Movement', { type: 'INSTALL' })} /></View><View style={{ flex: 1 }}><Button title="Devolución" secondary onPress={() => navigation.navigate('Movement', { type: 'RETURN' })} /></View></View></View>
    <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.section}>{user.role === 'TECHNICIAN' ? 'MIS ASIGNACIONES' : 'ASIGNACIONES PENDIENTES'}</Text><Pressable accessibilityRole="button" onPress={() => navigation.navigate('Inventory', { filter: 'MINE' })} style={{ padding: 8 }}><Text style={{ color: colors.blue, fontWeight: '700' }}>Ver todas</Text></Pressable></View>
    {!pending.length ? <Empty title="Sin asignaciones pendientes" detail="Puedes consultar el inventario. Si tu cuenta es nueva, solicita asignación a un proyecto." /> : pending.slice(0, 4).map(a => {
      const equipment = db!.equipment.find(e => e.id === a.equipmentId)!;
      return <EquipmentCard key={a.id} equipment={equipment} detail={`${pendingQuantity(a)} pendiente(s) · ${projects.find(p => p.id === a.projectId)?.name ?? 'Proyecto'}`} onPress={() => navigation.navigate('Equipment', { id: equipment.id })} />;
    })}
    <Button title="Consultar inventario completo" secondary onPress={() => navigation.navigate('Inventory')} />
    <Message text="Avance local del Foro 1. Los cambios se guardan en este dispositivo; todavía no se sincronizan con la web ni con Firebase." />
  </Screen>;
}

export function ProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const { projects, assignments, refresh, loading } = useStockroom();
  const [tab, setTab] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const filtered = projects.filter(p => tab === 'CLOSED' ? p.status === 'CLOSED' : p.status !== 'CLOSED');
  return <Screen refresh={() => void refresh()} refreshing={loading}>
    <Text style={ui.title}>Mis proyectos</Text><View style={ui.row}><View style={{ flex: 1 }}><Button title="En ejecución" secondary={tab !== 'ACTIVE'} onPress={() => setTab('ACTIVE')} /></View><View style={{ flex: 1 }}><Button title="Completados" secondary={tab !== 'CLOSED'} onPress={() => setTab('CLOSED')} /></View></View>
    {filtered.length ? filtered.map(p => {
      const related = assignments.filter(a => a.projectId === p.id);
      const total = related.reduce((n, a) => n + a.quantity, 0);
      const installed = related.reduce((n, a) => n + a.installedQuantity, 0);
      const percent = total ? Math.round(installed / total * 100) : 0;
      return <Pressable key={p.id} accessibilityRole="button" onPress={() => navigation.navigate('Project', { id: p.id })} style={ui.card}><Text style={ui.heading}>{p.name}</Text><Text style={ui.muted}>{p.client} · {p.location}</Text><Badge text={p.status === 'CLOSED' ? 'Cerrado' : 'En ejecución'} /><View style={{ height: 6, backgroundColor: colors.pale, borderRadius: 4 }}><View style={{ width: `${percent}%`, height: 6, borderRadius: 4, backgroundColor: colors.blue }} /></View><Text style={ui.muted}>Asignados: {total} · Instalados: {installed} · {percent}% instalado</Text></Pressable>;
    }) : <Empty title="Sin proyectos en esta sección" detail="Las cuentas nuevas requieren que administración las agregue a un proyecto." />}
  </Screen>;
}

export function ProjectDetailScreen({ route, navigation }: NativeStackScreenProps<RootParamList, 'Project'>) {
  const { db, user, projects, assignments, users, addTechnician } = useStockroom();
  const [technician, setTechnician] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const project = projects.find(p => p.id === route.params.id);
  if (!project) return <Screen><Empty title="Proyecto no disponible" detail="No tienes acceso a este proyecto." /></Screen>;
  async function add() {
    if (busy) return; setBusy(true); setMessage('');
    try { await addTechnician(project!.id, technician); setMessage('Técnico agregado al proyecto.'); setTechnician(''); }
    catch (e) { setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  return <Screen><Text style={ui.title}>{project.name}</Text><Text style={ui.body}>{project.client} · {project.location}</Text><Badge text={project.status === 'CLOSED' ? 'Cerrado' : 'En ejecución'} />
    <Text style={ui.section}>EQUIPO DE TRABAJO</Text><View style={ui.card}>{project.technicianIds.map(id => <Text key={id} style={ui.body}>{users.find(u => u.id === id)?.name ?? id}</Text>)}</View>
    {user.role === 'ADMIN' && project.status !== 'CLOSED' ? <View style={ui.card}><Text style={ui.heading}>Asignar técnico</Text><Select label="Técnico" value={technician} onChange={setTechnician} options={users.filter(u => u.active && u.role === 'TECHNICIAN' && !project.technicianIds.includes(u.id)).map(u => ({ value: u.id, label: u.name }))} /><Button title="Agregar al proyecto" disabled={!technician} loading={busy} onPress={() => void add()} />{message ? <Message text={message} /> : null}</View> : null}
    <Text style={ui.section}>EQUIPOS Y MATERIALES ASIGNADOS</Text>
    {assignments.filter(a => a.projectId === project.id).map(a => <EquipmentCard key={a.id} equipment={db!.equipment.find(e => e.id === a.equipmentId)!} detail={`Asignado ${a.quantity} · Instalado ${a.installedQuantity} · Devuelto ${a.returnedQuantity} · Pendiente ${pendingQuantity(a)}`} onPress={() => navigation.navigate('Equipment', { id: a.equipmentId })} />)}
    {!assignments.some(a => a.projectId === project.id) ? <Empty title="Todavía no hay asignaciones" /> : null}
  </Screen>;
}

export function AlertsScreen() {
  const { alerts, refresh, loading } = useStockroom(); const navigation = useNavigation<Nav>();
  return <Screen refresh={() => void refresh()} refreshing={loading}><Text style={ui.title}>Alertas</Text><Text style={ui.muted}>Calculadas a partir de existencias y asignaciones actuales.</Text>{alerts.length ? alerts.map(a => <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Equipment', { id: a.equipmentId })} key={a.id} style={ui.card}><View style={ui.row}><Ionicons name="alert-circle" size={22} color={a.tone === 'danger' ? colors.red : '#A66D00'} /><Text style={[ui.heading, { flex: 1, fontSize: 16 }]}>{a.title}</Text></View><Text style={ui.muted}>{a.description}</Text></Pressable>) : <Empty title="Todo al día" detail="No hay alertas activas." />}</Screen>;
}

export function HistoryScreen({ route }: NativeStackScreenProps<RootParamList, 'History'>) {
  const { movements, db } = useStockroom();
  const filtered = movements.filter(m => !route.params?.equipmentId || m.equipmentId === route.params.equipmentId);
  return <Screen><Text style={ui.title}>Trazabilidad</Text>{filtered.length ? filtered.map(m => <View key={m.id} style={ui.card}><View style={[ui.row, { justifyContent: 'space-between' }]}><Badge text={movementLabel[m.type]} /><Text style={ui.muted}>{m.quantity} unidad(es)</Text></View><Text style={ui.heading}>{db!.equipment.find(e => e.id === m.equipmentId)?.name}</Text><Text style={ui.muted}>{formatDate(m.date)}</Text><Text style={ui.body}>{m.origin} → {m.destination}</Text><Text style={ui.muted}>Responsable: {m.responsibleName}</Text><Text style={ui.muted}>Proyecto: {db!.projects.find(p => p.id === m.projectId)?.name}</Text>{m.notes ? <Text style={ui.body}>{m.notes}</Text> : null}{m.reason ? <Text style={ui.muted}>Motivo: {m.reason}</Text> : null}{m.condition ? <Text style={ui.muted}>Estado: {{ GOOD: 'Buen estado', REVIEW: 'Revisión', DAMAGED: 'Dañado' }[m.condition]}</Text> : null}{m.evidenceUri ? <Image accessibilityLabel="Evidencia de instalación" source={{ uri: m.evidenceUri }} style={{ width: '100%', height: 190, borderRadius: 12 }} resizeMode="contain" /> : null}</View>) : <Empty title="Sin movimientos registrados" />}</Screen>;
}

export function ProfileScreen() {
  const { user, assignments, movements } = useStockroom(); const { logout } = useAuth(); const navigation = useNavigation<Nav>();
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function exit() { setBusy(true); try { await logout(); } catch (e) { setError(errorMessage(e)); setConfirm(false); } finally { setBusy(false); } }
  return <Screen><View style={[ui.card, { backgroundColor: colors.blue, borderColor: colors.blue }]}><View style={ui.row}><View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.yellow, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 19, fontWeight: '800', color: colors.blue }}>{user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</Text></View><View style={{ flex: 1 }}><Text style={{ color: colors.white, fontSize: 21, fontWeight: '800' }}>{user.name}</Text><Text style={{ color: '#D7E0FF' }}>{roleLabel[user.role]}</Text></View></View><Text style={{ color: '#D7E0FF' }}>{user.email}</Text></View>
    <View style={ui.row}><View style={[ui.card, { flex: 1 }]}><Text style={ui.title}>{movements.length}</Text><Text style={ui.muted}>Movimientos visibles</Text></View><View style={[ui.card, { flex: 1 }]}><Text style={ui.title}>{assignments.reduce((n, a) => n + pendingQuantity(a), 0)}</Text><Text style={ui.muted}>Unidades pendientes</Text></View></View>
    <Button title="Mis movimientos registrados" secondary onPress={() => navigation.navigate('History')} /><Button title="Equipos bajo responsabilidad" secondary onPress={() => navigation.navigate('Inventory', { filter: 'MINE' })} /><Button title="Cambiar contraseña" secondary onPress={() => navigation.navigate('ChangePassword')} />
    <Message text="Modo local · Sin sincronización con servidor. Las cuentas, movimientos y evidencias se conservan en este dispositivo. Cerrar sesión no elimina el inventario." />
    {error ? <Message text={error} tone="error" /> : null}<Button title="Cerrar sesión" danger onPress={() => setConfirm(true)} /><Confirm visible={confirm} title="Cerrar sesión" description="Se cerrará tu acceso y se conservarán los movimientos guardados." busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void exit()} />
  </Screen>;
}

export function ChangePasswordScreen() {
  const [old, setOld] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [success, setSuccess] = useState(false);
  async function save() { if (busy) return; setBusy(true); setMessage(''); setSuccess(false); try { await authService.changePassword(old, password, confirm); setSuccess(true); setMessage('Contraseña actualizada.'); setOld(''); setPassword(''); setConfirm(''); } catch (e) { setMessage(errorMessage(e)); } finally { setBusy(false); } }
  return <Screen><Text style={ui.title}>Cambiar contraseña</Text><Field label="Contraseña actual" value={old} onChangeText={setOld} secureTextEntry maxLength={128} /><Field label="Nueva contraseña" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} /><Field label="Confirmar nueva contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry maxLength={128} /><Text style={ui.muted}>Mínimo 8 caracteres, una letra y un número.</Text>{message ? <Message text={message} tone={success ? 'success' : 'error'} /> : null}<Button title="Guardar contraseña" loading={busy} onPress={() => void save()} /></Screen>;
}
