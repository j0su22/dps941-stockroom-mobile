import type { AppAlert, Assignment, Database, MovementInput, User } from './models';

export const pendingQuantity = (a: Assignment) => a.quantity - a.installedQuantity - a.returnedQuantity;
export function visibleProjects(db: Database, user: User) {
  return db.projects.filter(p => user.role !== 'TECHNICIAN' || p.technicianIds.includes(user.id));
}
export function visibleAssignments(db: Database, user: User) {
  return db.assignments.filter(a => user.role !== 'TECHNICIAN' || a.technicianId === user.id);
}
export function visibleMovements(db: Database, user: User) {
  return db.movements.filter(m => user.role !== 'TECHNICIAN' || m.responsibleUserId === user.id || m.actorUserId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function findEquipment(db: Database, code: string) {
  const query = code.trim().toUpperCase();
  return db.equipment.find(e => [e.id, e.code, e.serialNumber, e.macAddress].some(v => v?.toUpperCase() === query));
}
export function getAlerts(db: Database, user: User, now = new Date()): AppAlert[] {
  const alerts: AppAlert[] = db.equipment.filter(e => e.kind === 'CONSUMABLE' && e.stock <= e.minimumStock).map(e => ({
    id: `stock-${e.id}`, title: `Stock mínimo · ${e.name}`, description: `${e.stock} disponibles de ${e.minimumStock} como mínimo.`, tone: 'danger', equipmentId: e.id,
  }));
  for (const a of visibleAssignments(db, user)) {
    if (pendingQuantity(a) > 0 && a.dueDate && new Date(`${a.dueDate}T23:59:59-06:00`) < now) {
      alerts.push({ id: `due-${a.id}`, title: 'Asignación pendiente de resolver', description: `${db.equipment.find(e => e.id === a.equipmentId)?.name}: ${pendingQuantity(a)} pendiente(s) desde ${a.dueDate}.`, tone: 'warning', equipmentId: a.equipmentId });
    }
  }
  return alerts;
}

// Función pura: valida y modifica un clon; un rechazo nunca altera el inventario original.
export function applyMovement(db: Database, input: MovementInput, actor: User, users: User[], id: string, now: string): Database {
  if (!actor.active) throw new Error('La cuenta está inactiva.');
  if (!['EXIT', 'INSTALL', 'RETURN'].includes(input.type)) throw new Error('Tipo de movimiento inválido.');
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new Error('La cantidad debe ser un entero mayor que cero.');
  if (input.notes.length > 500) throw new Error('Las observaciones admiten hasta 500 caracteres.');
  if (!input.location.trim() || input.location.trim().length > 120) throw new Error('Indica una ubicación de hasta 120 caracteres.');
  if (db.movements.some(m => m.id === id)) throw new Error('El movimiento ya fue registrado.');
  const next: Database = JSON.parse(JSON.stringify(db));
  const equipment = next.equipment.find(e => e.id === input.equipmentId);
  const project = next.projects.find(p => p.id === input.projectId);
  const technician = users.find(u => u.id === input.technicianId && u.active && u.role === 'TECHNICIAN');
  if (!equipment || !project || !technician) throw new Error('Selecciona equipo, proyecto y técnico válidos.');
  if (!project.technicianIds.includes(technician.id)) throw new Error('El técnico no pertenece al proyecto.');
  if (actor.role === 'TECHNICIAN' && actor.id !== technician.id) throw new Error('Solo puedes registrar movimientos de tus asignaciones.');
  if (equipment.kind === 'SERIALIZED' && input.quantity !== 1) throw new Error('Un equipo serializado se mueve individualmente: cantidad 1.');
  if (input.type !== 'RETURN' && project.status === 'CLOSED') throw new Error('No se permiten salidas o instalaciones en un proyecto cerrado.');

  let assignment: Assignment;
  let origin = equipment.location;
  if (input.type === 'EXIT') {
    if (equipment.stock < input.quantity) throw new Error('La salida supera las existencias disponibles.');
    if (equipment.kind === 'SERIALIZED' && equipment.status !== 'IN_STOCK') throw new Error('Este equipo no está disponible en bodega.');
    equipment.stock -= input.quantity;
    assignment = { id: `ASG-${id}`, equipmentId: equipment.id, projectId: project.id, technicianId: technician.id, quantity: input.quantity, installedQuantity: 0, returnedQuantity: 0 };
    next.assignments.push(assignment);
    if (equipment.kind === 'SERIALIZED') {
      equipment.status = 'ASSIGNED';
      equipment.location = input.location.trim();
    }
  } else {
    const found = next.assignments.find(a => a.id === input.assignmentId && a.equipmentId === equipment.id && a.projectId === project.id && a.technicianId === technician.id);
    if (!found) throw new Error('Selecciona una asignación válida.');
    assignment = found;
    if (input.quantity > pendingQuantity(assignment)) throw new Error('La cantidad supera lo pendiente de la asignación.');
    origin = project.name;
    if (input.type === 'INSTALL') {
      assignment.installedQuantity += input.quantity;
      if (equipment.kind === 'SERIALIZED') {
        equipment.status = 'INSTALLED';
        equipment.location = input.location.trim();
      }
    } else {
      if (!input.reason?.trim() || input.reason.length > 200) throw new Error('Indica un motivo de devolución de hasta 200 caracteres.');
      if (!input.condition || !['GOOD', 'REVIEW', 'DAMAGED'].includes(input.condition)) throw new Error('Selecciona el estado de devolución.');
      if (input.location !== 'Bodega principal') throw new Error('En este avance las devoluciones se reciben en Bodega principal.');
      assignment.returnedQuantity += input.quantity;
      if (input.condition === 'GOOD') equipment.stock += input.quantity;
      else equipment.maintenanceStock += input.quantity;
      if (equipment.kind === 'SERIALIZED') {
        equipment.status = input.condition === 'GOOD' ? 'IN_STOCK' : 'MAINTENANCE';
        equipment.location = input.location;
      }
    }
  }
  next.movements.unshift({
    id, type: input.type, equipmentId: equipment.id, assignmentId: assignment.id, projectId: project.id,
    quantity: input.quantity, origin, destination: input.location.trim(), responsibleUserId: technician.id,
    responsibleName: technician.name, actorUserId: actor.id, date: now, notes: input.notes.trim(),
    ...(input.type === 'RETURN' ? { condition: input.condition, reason: input.reason?.trim() } : {}),
    ...(input.type === 'INSTALL' && input.evidenceUri ? { evidenceUri: input.evidenceUri } : {}),
  });
  return next;
}
