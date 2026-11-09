const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, runTransaction, serverTimestamp } = require('firebase/firestore');
const { createSeedDatabase, demoUsers } = require('../tools/lib/seed');
const { applyMovement } = require('../tools/lib/inventory');
const clean = v => JSON.parse(JSON.stringify(v));
async function main() {
 const env = await initializeTestEnvironment({projectId:'demo-stockroom-tests',firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')}});
 try {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
   const db=context.firestore();
   for(const u of demoUsers) await setDoc(doc(db,'users',u.id),u);
   const seed=createSeedDatabase();
   for(const table of ['equipment','projects','assignments','movements']) for(const record of seed[table]) await setDoc(doc(db,table,record.id),record);
  });
  const tech=env.authenticatedContext('USR-003',{email:'tecnico@dtech.com'}).firestore();
  const admin=env.authenticatedContext('USR-001',{email:'admin@dtech.com'}).firestore();
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'equipment','EQ-001')));
  await assertSucceeds(getDoc(doc(tech,'equipment','EQ-001')));
  await assertFails(updateDoc(doc(tech,'users','USR-003'),{role:'ADMIN'}));
  await assertFails(updateDoc(doc(tech,'equipment','EQ-001'),{stock:100}));
  await assertFails(updateDoc(doc(tech,'projects','PRJ-001'),{technicianIds:['USR-003','USR-004'],addedTechnicianId:'USR-004'}));
  await assertSucceeds(updateDoc(doc(admin,'projects','PRJ-001'),{technicianIds:['USR-003','USR-004'],addedTechnicianId:'USR-004'}));
  console.log('PASS: sin sesión, lectura activa, rol protegido, stock protegido y asignación administrativa.');
  async function save(input,id, tamper) {
   return runTransaction(tech,async tx=>{
    const er=doc(tech,'equipment',input.equipmentId),pr=doc(tech,'projects',input.projectId),ar=doc(tech,'assignments',input.type==='EXIT'?`ASG-${id}`:input.assignmentId),mr=doc(tech,'movements',id);
    const [e,p,a,m]=await Promise.all([tx.get(er),tx.get(pr),tx.get(ar),tx.get(mr)]);
    if(m.exists())return;
    const state={version:1,equipment:[e.data()],projects:[p.data()],assignments:a.exists()?[a.data()]:[],movements:[]};
    const next=applyMovement(state,input,demoUsers[2],demoUsers,id,new Date().toISOString());
    tx.set(er,clean({...next.equipment[0],lastMovementId:id}));
    tx.set(ar,clean({...next.assignments[0],lastMovementId:id}));
    tx.set(mr,{...clean(next.movements[0]),...(tamper||{}),createdAt:serverTimestamp()});
   });
  }
  const exit={type:'EXIT',equipmentId:'EQ-001',projectId:'PRJ-001',technicianId:'USR-003',quantity:1,location:'Torre 1',notes:'Concurrente'};
  const result=await Promise.allSettled([save(exit,'test-exit-001'),save(exit,'test-exit-002')]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await getDoc(doc(tech,'equipment','EQ-001'))).data().stock,0);
  const win=result[0].status==='fulfilled'?'test-exit-001':'test-exit-002';
  await save(exit,win);
  await save({type:'INSTALL',equipmentId:'EQ-001',projectId:'PRJ-001',technicianId:'USR-003',assignmentId:`ASG-${win}`,quantity:1,location:'Piso 1',notes:'Instalado',evidenceUri:'data:image/jpeg;base64,YWJj'},'test-install-001');
  assert.equal((await getDoc(doc(tech,'equipment','EQ-001'))).data().status,'INSTALLED');
  await save({type:'RETURN',equipmentId:'EQ-002',projectId:'PRJ-001',technicianId:'USR-003',assignmentId:'ASG-001',quantity:1,location:'Bodega principal',notes:'Devuelto',condition:'DAMAGED',reason:'Falla'},'test-return-001');
  const returned=(await getDoc(doc(tech,'equipment','EQ-002'))).data();assert.equal(returned.stock,0);assert.equal(returned.maintenanceStock,1);
  console.log('PASS: concurrencia sin sobreventa, reintento, instalación con miniatura y devolución dañada.');
  await assertFails(save({...exit,equipmentId:'MAT-003'},'test-forged-001',{actorUserId:'USR-004'}));
  await assertFails(updateDoc(doc(tech,'movements',win),{quantity:100}));
  await assertFails(setDoc(doc(tech,'movements','standalone'),{id:'standalone',type:'EXIT',actorUserId:'USR-003',quantity:1}));
  console.log('PASS: autor falsificado, historial alterado y movimiento sin transacción rechazados.');
 } finally {await env.cleanup();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
