import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedDatabase, demoUsers } from '../src/data/seed';
test('semilla por colecciones tiene IDs únicos y referencias válidas', () => {
 const db = createSeedDatabase();
 for (const table of [db.equipment,db.projects,db.assignments,db.movements,demoUsers]) assert.equal(new Set(table.map(x=>x.id)).size,table.length);
 for (const a of db.assignments) {
  assert.ok(db.equipment.some(e=>e.id===a.equipmentId));
  assert.ok(db.projects.some(p=>p.id===a.projectId && p.technicianIds.includes(a.technicianId)));
  assert.ok(demoUsers.some(u=>u.id===a.technicianId));
 }
 for (const m of db.movements) assert.ok(db.assignments.some(a=>a.id===m.assignmentId && a.equipmentId===m.equipmentId));
});
