/* Ejecutar solo en un proyecto de demostración. No almacenes el JSON privado aquí. */
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { createSeedDatabase, demoUsers } = require('../lib/seed');
async function main() {
  const projectId = process.env.GCLOUD_PROJECT;
  const password = process.env.STOCKROOM_DEMO_PASSWORD;
  if (!projectId || !password || password.length < 12) throw new Error('Define GCLOUD_PROJECT y STOCKROOM_DEMO_PASSWORD (12 caracteres mínimo).');
  initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId } : { credential: applicationDefault(), projectId });
  const db = getFirestore();
  // Comprobar antes de crear usuarios o perfiles; no sobrescribir un inventario existente.
  if (!(await db.collection('equipment').limit(1).get()).empty) throw new Error('El inventario ya existe. No se modifica. Usa otro proyecto para una demo nueva.');
  const mapping = {};
  for (const sample of demoUsers) {
    let account;
    try { account = await getAuth().getUserByEmail(sample.email); }
    catch (e) { if (e.code !== 'auth/user-not-found') throw e; account = await getAuth().createUser({ email: sample.email, password, displayName: sample.name }); }
    mapping[sample.id] = account.uid;
    await db.doc(`users/${account.uid}`).set({ ...sample, id: account.uid });
  }
  const data = createSeedDatabase();
  for (const p of data.projects) p.technicianIds = p.technicianIds.map(id => mapping[id]);
  for (const a of data.assignments) a.technicianId = mapping[a.technicianId];
  for (const m of data.movements) { m.responsibleUserId = mapping[m.responsibleUserId]; m.actorUserId = mapping[m.actorUserId]; }
  const batch = db.batch();
  for (const table of ['equipment','projects','assignments','movements']) {
    for (const record of data[table]) batch.create(db.doc(`${table}/${record.id}`), record);
  }
  await batch.commit();
  console.log('Inventario sintético cargado; cuentas admin, bodega, tecnico y maria @dtech.com. No se imprime la contraseña.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
