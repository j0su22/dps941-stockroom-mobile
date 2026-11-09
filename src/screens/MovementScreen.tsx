import React, { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Button, Confirm, Empty, Field, Message, Screen, Select } from '../components/UI';
import { useStockroom } from '../hooks/useStockroom';
import { pendingQuantity } from '../domain/inventory';
import { errorMessage, parseQuantity } from '../domain/validation';
import { deleteEvidence, persistEvidence } from '../services/evidenceService';
import { movementLabel, ui } from '../theme/theme';
import type { RootParamList } from '../navigation/types';
import type { EquipmentCondition, MovementInput } from '../types/models';

export function MovementScreen({ route, navigation }: NativeStackScreenProps<RootParamList, 'Movement'>) {
  const { db, user, projects, assignments, users, save } = useStockroom();
  const type = route.params.type;
  const isExit = type === 'EXIT';
  const [equipmentId, setEquipmentId] = useState(route.params.equipmentId ?? '');
  const [assignmentId, setAssignmentId] = useState(route.params.assignmentId ?? '');
  const [projectId, setProjectId] = useState(''); const [technicianId, setTechnicianId] = useState(user.role === 'TECHNICIAN' ? user.id : '');
  const [quantity, setQuantity] = useState('1'); const [location, setLocation] = useState(type === 'RETURN' ? 'Bodega principal' : '');
  const [notes, setNotes] = useState(''); const [reason, setReason] = useState(''); const [condition, setCondition] = useState<EquipmentCondition>('GOOD');
  const [photo, setPhoto] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  const pendingInput = useRef<MovementInput | null>(null); const submitting = useRef(false);
  const assignment = assignments.find(a => a.id === assignmentId);
  const selectedId = isExit ? equipmentId : assignment?.equipmentId ?? '';
  const equipment = db!.equipment.find(e => e.id === selectedId);
  const selectedProject = isExit ? projectId : assignment?.projectId ?? '';
  const selectedTechnician = isExit ? technicianId : assignment?.technicianId ?? '';
  const availableProjects = projects.filter(p => p.status !== 'CLOSED');
  const selectedProjectRecord = projects.find(p => p.id === selectedProject);
  const technicians = users.filter(u => u.active && u.role === 'TECHNICIAN' && selectedProjectRecord?.technicianIds.includes(u.id) && (user.role !== 'TECHNICIAN' || user.id === u.id));
  const candidates = assignments.filter(a => pendingQuantity(a) > 0 && (!route.params.equipmentId || a.equipmentId === route.params.equipmentId));
  const maximum = isExit ? equipment?.stock ?? 0 : assignment ? pendingQuantity(assignment) : 0;

  async function choosePhoto(camera: boolean) {
    setError('');
    try {
      const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Permiso denegado. Puedes continuar sin fotografía o habilitar el permiso en Ajustes.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, allowsEditing: true };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) {
        if ((result.assets[0].fileSize ?? 0) > 3 * 1024 * 1024) throw new Error('La evidencia debe pesar como máximo 3 MB.');
        setPhoto(result.assets[0].uri);
      }
    } catch (e) { setError(errorMessage(e)); }
  }

  function review() {
    setError('');
    const amount = parseQuantity(quantity);
    if (!equipment || !selectedProject || !selectedTechnician) return setError('Selecciona equipo o asignación, proyecto y responsable.');
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > maximum) return setError(`Ingresa una cantidad entera entre 1 y ${maximum}.`);
    if (equipment.kind === 'SERIALIZED' && amount !== 1) return setError('Los equipos con serie se registran de uno en uno.');
    if (!location.trim() || location.length > 120) return setError('Indica la ubicación o destino (máximo 120 caracteres).');
    if (type === 'RETURN' && !reason) return setError('Selecciona un motivo de devolución.');
    if (type !== 'RETURN' && selectedProjectRecord?.status === 'CLOSED') return setError('El proyecto está cerrado.');
    pendingInput.current = { type, equipmentId: equipment.id, projectId: selectedProject, technicianId: selectedTechnician, assignmentId: assignment?.id, quantity: amount, location: location.trim(), notes, ...(type === 'RETURN' ? { condition, reason } : {}) };
    setConfirm(true);
  }

  async function commit() {
    if (submitting.current || !pendingInput.current) return;
    submitting.current = true; setBusy(true); setError('');
    let permanentPhoto = '';
    let persisted = false;
    try {
      if (type === 'INSTALL' && photo) permanentPhoto = await persistEvidence(photo);
      await save({ ...pendingInput.current, ...(permanentPhoto ? { evidenceUri: permanentPhoto } : {}) });
      persisted = true;
      setConfirm(false);
      navigation.replace('History', { equipmentId: pendingInput.current.equipmentId });
    } catch (e) {
      if (permanentPhoto && !persisted) await deleteEvidence(permanentPhoto).catch(() => undefined);
      setError(errorMessage(e)); setConfirm(false);
    } finally { submitting.current = false; setBusy(false); }
  }

  return <Screen><Text style={ui.title}>Registrar {movementLabel[type].toLowerCase()}</Text>
    {isExit ? <>
      <Select label="Equipo o material" value={equipmentId} onChange={value => { setEquipmentId(value); setQuantity('1'); }} options={db!.equipment.filter(e => e.stock > 0).map(e => ({ value: e.id, label: `${e.code} · ${e.name} (${e.stock} disponibles)` }))} />
      <Select label="Proyecto / destino" value={projectId} onChange={value => { setProjectId(value); setTechnicianId(user.role === 'TECHNICIAN' ? user.id : ''); setLocation(projects.find(p => p.id === value)?.name ?? ''); }} options={availableProjects.map(p => ({ value: p.id, label: p.name }))} />
      <Select label="Técnico responsable" value={technicianId} onChange={setTechnicianId} options={technicians.map(u => ({ value: u.id, label: u.name }))} />
      {!availableProjects.length ? <Empty title="No tienes proyectos activos" detail="Administración debe asignarte a un proyecto antes de registrar una salida." /> : null}
    </> : <>
      <Select label="Asignación pendiente" value={assignmentId} onChange={value => { setAssignmentId(value); setQuantity('1'); }} options={candidates.map(a => ({ value: a.id, label: `${db!.equipment.find(e => e.id === a.equipmentId)?.name} · ${projects.find(p => p.id === a.projectId)?.name} · ${users.find(u => u.id === a.technicianId)?.name} · ${pendingQuantity(a)} pendiente(s)` }))} />
      {assignment ? <View style={ui.card}><Text style={ui.heading}>{equipment?.name}</Text><Text style={ui.muted}>{selectedProjectRecord?.name}</Text><Text style={ui.muted}>Responsable: {users.find(u => u.id === selectedTechnician)?.name}</Text></View> : <Empty title="Selecciona una asignación" detail="Solo se puede instalar o devolver material pendiente bajo tu autorización." />}
    </>}
    <Field label={`Cantidad · máximo ${maximum}`} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" maxLength={6} />
    <Field label={type === 'RETURN' ? 'Ubicación de retorno' : type === 'INSTALL' ? 'Ubicación exacta de instalación' : 'Ubicación / destino'} value={location} onChangeText={setLocation} editable={type !== 'RETURN'} maxLength={120} placeholder="Ej.: Piso 2 · Sala de reuniones" />
    {type === 'RETURN' ? <><Select label="Motivo de devolución" value={reason} onChange={setReason} options={['No se utilizó', 'Sobrante de instalación', 'Cambio por falla'].map(value => ({ value, label: value }))} /><Select label="Estado del equipo o material" value={condition} onChange={value => setCondition(value as EquipmentCondition)} options={[{ value: 'GOOD', label: 'Buen estado' }, { value: 'REVIEW', label: 'Requiere revisión' }, { value: 'DAMAGED', label: 'Dañado' }]} /><Message text="Las unidades dañadas o en revisión quedan en cuarentena y no aumentan el stock disponible. Las unidades ya instaladas requieren un flujo de retiro futuro; este formulario devuelve únicamente lo pendiente." /></> : null}
    {type === 'INSTALL' ? <View style={{ gap: 10 }}><Text style={ui.section}>EVIDENCIA FOTOGRÁFICA · OPCIONAL</Text><Text style={ui.muted}>La fecha y hora se registran automáticamente al guardar.</Text>{photo ? <Image source={{ uri: photo }} style={{ height: 200, borderRadius: 12, width: '100%' }} resizeMode="contain" /> : null}<View style={ui.row}><View style={{ flex: 1 }}><Button title="Tomar foto" secondary onPress={() => void choosePhoto(true)} /></View><View style={{ flex: 1 }}><Button title="Galería" secondary onPress={() => void choosePhoto(false)} /></View></View>{photo ? <Button title="Quitar fotografía" secondary onPress={() => setPhoto('')} /> : null}</View> : null}
    <Field label="Observaciones (opcional)" value={notes} onChangeText={setNotes} maxLength={500} multiline placeholder="Detalle del movimiento…" /><Text style={ui.muted}>{notes.length}/500 caracteres</Text>
    <Message text={`Operación registrada por ${user.name}. Se guardarán existencias, asignación y trazabilidad en Firestore.`} />
    {error ? <Message text={error} tone="error" /> : null}
    <Button title="Guardar movimiento" disabled={!equipment || maximum < 1 || busy} loading={busy} onPress={review} />
    <Confirm visible={confirm} title={`Confirmar ${movementLabel[type].toLowerCase()}`} description={`${pendingInput.current?.quantity ?? quantity} unidad(es) de ${equipment?.name ?? ''}. Destino: ${pendingInput.current?.location ?? location}. Se actualizará el inventario compartido.`} busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void commit()} />
  </Screen>;
}
