import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Badge, Button, Empty, EquipmentCard, Field, Screen } from '../components/UI';
import { useStockroom } from '../hooks/useStockroom';
import { pendingQuantity } from '../domain/inventory';
import { formatDate, movementLabel, statusLabel, ui } from '../theme/theme';
import type { RootParamList } from '../navigation/types';

export function InventoryScreen({ route, navigation }: NativeStackScreenProps<RootParamList, 'Inventory'>) {
  const { db, assignments, refresh, loading } = useStockroom(); const [query, setQuery] = useState(''); const [mine, setMine] = useState(route.params?.filter === 'MINE');
  const ownedIds = new Set(assignments.filter(a => pendingQuantity(a) > 0).map(a => a.equipmentId));
  const data = db!.equipment.filter(e => (!mine || ownedIds.has(e.id)) && `${e.name} ${e.code} ${e.serialNumber ?? ''} ${e.macAddress ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <Screen refresh={() => void refresh()} refreshing={loading}><Text style={ui.title}>Equipos y materiales</Text><Field label="Buscar por nombre, código, serie o MAC" value={query} onChangeText={setQuery} autoCapitalize="none" maxLength={100} /><View style={ui.row}><View style={{ flex: 1 }}><Button title="Todos" secondary={mine} onPress={() => setMine(false)} /></View><View style={{ flex: 1 }}><Button title="Asignados" secondary={!mine} onPress={() => setMine(true)} /></View></View>{data.length ? data.map(e => <EquipmentCard key={e.id} equipment={e} onPress={() => navigation.navigate('Equipment', { id: e.id })} />) : <Empty title="Sin resultados" detail="Prueba otra búsqueda o cambia el filtro." />}</Screen>;
}

export function EquipmentScreen({ route, navigation }: NativeStackScreenProps<RootParamList, 'Equipment'>) {
  const { db, user, assignments, movements, projects, users } = useStockroom();
  const equipment = db!.equipment.find(e => e.id === route.params.id);
  if (!equipment) return <Screen><Empty title="Equipo no encontrado" /></Screen>;
  const pending = assignments.filter(a => a.equipmentId === equipment.id && pendingQuantity(a) > 0);
  const canExit = equipment.stock > 0 && projects.some(p => p.status !== 'CLOSED');
  return <Screen><View style={ui.card}><Text style={ui.title}>{equipment.name}</Text><Text style={ui.muted}>{equipment.brand} · {equipment.model} · {equipment.category}</Text><Badge text={statusLabel[equipment.status]} /></View>
    <View style={ui.card}>{[
      ['Código', equipment.code], ['Tipo', equipment.kind === 'SERIALIZED' ? 'Equipo individual con serie' : 'Consumible por cantidad'], ['Serie', equipment.serialNumber ?? 'No aplica'], ['MAC', equipment.macAddress ?? 'No aplica'], ['Ubicación', equipment.location], ['Disponible en bodega', String(equipment.stock)], ['Mínimo', String(equipment.minimumStock)], ['En revisión / dañado', String(equipment.maintenanceStock)],
    ].map(([label, value]) => <View key={label} style={[ui.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}><Text style={[ui.muted, { flex: 1 }]}>{label}</Text><Text style={[ui.body, { flex: 1, fontSize: 13, textAlign: 'right' }]}>{value}</Text></View>)}</View>
    <Text style={ui.section}>ASIGNACIONES PENDIENTES VISIBLES</Text>
    {pending.length ? pending.map(a => <View style={ui.card} key={a.id}><Text style={ui.heading}>{projects.find(p => p.id === a.projectId)?.name}</Text><Text style={ui.muted}>{users.find(u => u.id === a.technicianId)?.name} · {pendingQuantity(a)} pendiente(s)</Text><Button title="Registrar instalación" secondary onPress={() => navigation.navigate('Movement', { type: 'INSTALL', equipmentId: equipment.id, assignmentId: a.id })} /><Button title="Registrar devolución" secondary onPress={() => navigation.navigate('Movement', { type: 'RETURN', equipmentId: equipment.id, assignmentId: a.id })} /></View>) : <Empty title="Sin asignaciones pendientes" />}
    <Button title="Registrar salida" disabled={!canExit} onPress={() => navigation.navigate('Movement', { type: 'EXIT', equipmentId: equipment.id })} />
    {!canExit ? <Text style={ui.muted}>Se requiere stock disponible y un proyecto activo autorizado.</Text> : null}
    <Text style={ui.section}>ÚLTIMOS MOVIMIENTOS {user.role === 'TECHNICIAN' ? 'VISIBLES PARA TI' : ''}</Text>
    {movements.filter(m => m.equipmentId === equipment.id).slice(0, 3).map(m => <View key={m.id} style={ui.card}><Badge text={movementLabel[m.type]} /><Text style={ui.muted}>{formatDate(m.date)} · {m.quantity} unidad(es)</Text><Text style={ui.body}>{m.destination}</Text></View>)}
    <Button title="Ver trazabilidad completa" secondary onPress={() => navigation.navigate('History', { equipmentId: equipment.id })} />
  </Screen>;
}
