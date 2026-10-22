import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedDatabase, demoUsers } from '../src/data/seed';
import { applyMovement, findEquipment, getAlerts, pendingQuantity, visibleAssignments, visibleMovements, visibleProjects } from '../src/domain/inventory';
import { parseQuantity, validateEmail, validatePassword } from '../src/domain/validation';
import type { MovementInput } from '../src/types/models';

const tech = demoUsers[2]!;
const otherTech = demoUsers[3]!;
const warehouse = demoUsers[1]!;
const base: MovementInput = { type: 'EXIT', equipmentId: 'EQ-001', projectId: 'PRJ-001', technicianId: tech.id, quantity: 1, location: 'Torre 1', notes: 'Prueba' };
const run = (input: MovementInput, db = createSeedDatabase(), actor = tech, id = 'test-1') => applyMovement(db, input, actor, demoUsers, id, '2026-10-21T18:00:00Z');

test('salida serializada conserva stock, asignación e historial coherentes', () => {
  const before = createSeedDatabase(); const db = run(base, before);
  assert.equal(before.equipment[0]!.stock, 1);
  assert.equal(db.equipment[0]!.stock, 0); assert.equal(db.equipment[0]!.status, 'ASSIGNED');
  assert.equal(db.assignments.at(-1)!.quantity, 1); assert.equal(db.movements[0]!.actorUserId, tech.id);
});
test('rechaza sobreventa y segundo movimiento del mismo serial', () => {
  const db = run(base); assert.throws(() => run(base, db, tech, 'test-2'), /existencias/);
  assert.throws(() => run({ ...base, quantity: 2 }), /individualmente/);
});
test('rechaza cantidades cero, negativas, decimales y no numéricas', () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => run({ ...base, quantity }), /entero/);
});
test('instalar no vuelve a descontar stock y no permite duplicar instalación', () => {
  const db = run(base); const input: MovementInput = { ...base, type: 'INSTALL', assignmentId: 'ASG-test-1', location: 'Piso 2' };
  const installed = run(input, db, tech, 'test-2');
  assert.equal(installed.equipment[0]!.stock, 0); assert.equal(installed.equipment[0]!.status, 'INSTALLED');
  assert.equal(pendingQuantity(installed.assignments.at(-1)!), 0);
  assert.throws(() => run(input, installed, tech, 'test-3'), /pendiente/);
});
test('devolución en buen estado repone stock una sola vez', () => {
  const db = run(base); const input: MovementInput = { ...base, type: 'RETURN', assignmentId: 'ASG-test-1', location: 'Bodega principal', condition: 'GOOD', reason: 'Sobrante' };
  const returned = run(input, db, tech, 'test-2'); assert.equal(returned.equipment[0]!.stock, 1); assert.equal(returned.equipment[0]!.status, 'IN_STOCK');
  assert.throws(() => run(input, returned, tech, 'test-3'), /pendiente/);
});
test('devolución dañada no aumenta disponibilidad', () => {
  const db = run(base); const returned = run({ ...base, type: 'RETURN', assignmentId: 'ASG-test-1', location: 'Bodega principal', condition: 'DAMAGED', reason: 'Falla' }, db, tech, 'test-2');
  assert.equal(returned.equipment[0]!.stock, 0); assert.equal(returned.equipment[0]!.maintenanceStock, 1); assert.equal(returned.equipment[0]!.status, 'MAINTENANCE');
});
test('consumible admite instalación y devolución parciales', () => {
  const input: MovementInput = { ...base, equipmentId: 'MAT-002', type: 'RETURN', assignmentId: 'ASG-002', quantity: 3, location: 'Bodega principal', condition: 'GOOD', reason: 'Sobrante' };
  const db = run(input); assert.equal(db.equipment.find(e => e.id === 'MAT-002')!.stock, 48); assert.equal(pendingQuantity(db.assignments[1]!), 1);
  assert.throws(() => run({ ...input, quantity: 5 }), /pendiente/);
});
test('un técnico no opera como otro técnico ni en proyectos ajenos', () => {
  assert.throws(() => run({ ...base, technicianId: otherTech.id, projectId: 'PRJ-002' }), /Solo puedes/);
  assert.throws(() => run(base, createSeedDatabase(), otherTech), /Solo puedes/);
  assert.throws(() => run({ ...base, technicianId: otherTech.id }, createSeedDatabase(), warehouse), /no pertenece/);
});
test('cuentas inactivas, proyecto cerrado y asignación inválida se rechazan', () => {
  assert.throws(() => run(base, createSeedDatabase(), { ...tech, active: false }), /inactiva/);
  assert.throws(() => run({ ...base, projectId: 'PRJ-003' }), /cerrado/);
  assert.throws(() => run({ ...base, type: 'INSTALL', assignmentId: 'invalid' }), /asignación válida/);
});
test('un fallo no modifica la base original y rechaza IDs duplicados', () => {
  const db = createSeedDatabase(); const copy = JSON.stringify(db);
  assert.throws(() => run({ ...base, quantity: 99 }, db)); assert.equal(JSON.stringify(db), copy);
  assert.throws(() => run(base, db, tech, 'MOV-SEED-001'), /ya fue registrado/);
});
test('selectores restringen historial, asignaciones y proyectos a cada técnico', () => {
  const db = createSeedDatabase();
  assert.ok(visibleAssignments(db, tech).every(a => a.technicianId === tech.id));
  assert.ok(visibleMovements(db, tech).every(m => m.responsibleUserId === tech.id || m.actorUserId === tech.id));
  assert.ok(visibleProjects(db, otherTech).every(p => p.technicianIds.includes(otherTech.id)));
});
test('alertas y búsqueda exacta por código, serie y MAC', () => {
  const db = createSeedDatabase(); assert.equal(findEquipment(db, ' u7p-0001a2b3 ')?.id, 'EQ-001'); assert.equal(findEquipment(db, 'A1:B2:C3:D4:E5:F6')?.id, 'EQ-001');
  assert.equal(findEquipment(db, 'https://example.com/EQ-001'), undefined);
  assert.ok(getAlerts(db, tech, new Date('2026-10-21')).some(a => a.id === 'stock-MAT-002'));
});
test('validación de correo, contraseña y cantidades', () => {
  assert.equal(validateEmail(' TECNICO@dtech.com '), undefined); assert.ok(validateEmail('correo-invalido'));
  assert.ok(validatePassword('12345678')); assert.equal(validatePassword('Stockroom2026!'), undefined);
  assert.ok(Number.isNaN(parseQuantity('1.5'))); assert.ok(Number.isNaN(parseQuantity('1e2'))); assert.equal(parseQuantity('12'), 12);
});
