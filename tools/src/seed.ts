import type { Database, User } from './models';

// Datos sintéticos de demostración, inspirados en los mockups. No son un inventario real.
export const demoUsers: User[] = [
  { id: 'USR-001', name: 'Ana Martínez', email: 'admin@dtech.com', role: 'ADMIN', active: true },
  { id: 'USR-002', name: 'Carlos López', email: 'bodega@dtech.com', role: 'WAREHOUSE', active: true },
  { id: 'USR-003', name: 'Juan Pérez', email: 'tecnico@dtech.com', role: 'TECHNICIAN', active: true },
  { id: 'USR-004', name: 'María García', email: 'maria@dtech.com', role: 'TECHNICIAN', active: true },
];

export function createSeedDatabase(): Database {
  return {
    version: 1,
    equipment: [
      { id: 'EQ-001', code: 'EQ-001', name: 'Ubiquiti U7 Pro XG', category: 'Redes', brand: 'Ubiquiti', model: 'U7 Pro XG', kind: 'SERIALIZED', serialNumber: 'U7P-0001A2B3', macAddress: 'A1:B2:C3:D4:E5:F6', location: 'Bodega principal', stock: 1, maintenanceStock: 0, minimumStock: 0, status: 'IN_STOCK' },
      { id: 'EQ-002', code: 'EQ-002', name: 'Switch 24p Gigabit', category: 'Redes', brand: 'TP-Link', model: 'TL-SG1024', kind: 'SERIALIZED', serialNumber: 'TPL-24G-0117', location: 'Torre 1', stock: 0, maintenanceStock: 0, minimumStock: 0, status: 'ASSIGNED' },
      { id: 'MAT-002', code: 'MAT-002', name: 'Conector RJ45 Cat6', category: 'Cableado', brand: 'Genérico', model: 'RJ45 Cat6', kind: 'CONSUMABLE', location: 'Bodega principal', stock: 45, maintenanceStock: 0, minimumStock: 100, status: 'IN_STOCK' },
      { id: 'MAT-003', code: 'MAT-003', name: 'Cable UTP Cat6 · rollo 305 m', category: 'Cableado', brand: 'Nexxt', model: 'Cat6', kind: 'CONSUMABLE', location: 'Bodega principal', stock: 8, maintenanceStock: 0, minimumStock: 3, status: 'IN_STOCK' },
      { id: 'EQ-004', code: 'EQ-004', name: 'Cámara IP PoE', category: 'CCTV', brand: 'Hikvision', model: 'DS-2CD', kind: 'SERIALIZED', serialNumber: 'CAM-2026-004', location: 'Plaza Central', stock: 0, maintenanceStock: 0, minimumStock: 0, status: 'ASSIGNED' },
    ],
    projects: [
      { id: 'PRJ-001', name: 'Torre 1 · Instalación de red', client: 'Constructora ABC', location: 'San Salvador', status: 'IN_PROGRESS', technicianIds: ['USR-003'] },
      { id: 'PRJ-002', name: 'Plaza Central · CCTV', client: 'Plaza Central S. A.', location: 'Santa Tecla', status: 'IN_PROGRESS', technicianIds: ['USR-003', 'USR-004'] },
      { id: 'PRJ-003', name: 'Oficinas Dtech · Control de acceso', client: 'Grupo Dtech', location: 'San Salvador', status: 'CLOSED', technicianIds: ['USR-003'] },
    ],
    assignments: [
      { id: 'ASG-001', equipmentId: 'EQ-002', projectId: 'PRJ-001', technicianId: 'USR-003', quantity: 1, installedQuantity: 0, returnedQuantity: 0, dueDate: '2026-10-17' },
      { id: 'ASG-002', equipmentId: 'MAT-002', projectId: 'PRJ-001', technicianId: 'USR-003', quantity: 10, installedQuantity: 6, returnedQuantity: 0 },
      { id: 'ASG-003', equipmentId: 'EQ-004', projectId: 'PRJ-002', technicianId: 'USR-004', quantity: 1, installedQuantity: 0, returnedQuantity: 0 },
    ],
    movements: [
      { id: 'MOV-SEED-001', type: 'EXIT', equipmentId: 'EQ-002', assignmentId: 'ASG-001', projectId: 'PRJ-001', quantity: 1, origin: 'Bodega principal', destination: 'Torre 1', responsibleUserId: 'USR-003', responsibleName: 'Juan Pérez', actorUserId: 'USR-002', date: '2026-10-15T14:00:00.000Z', notes: 'Equipo asignado para instalación de red.' },
      { id: 'MOV-SEED-002', type: 'EXIT', equipmentId: 'MAT-002', assignmentId: 'ASG-002', projectId: 'PRJ-001', quantity: 10, origin: 'Bodega principal', destination: 'Torre 1', responsibleUserId: 'USR-003', responsibleName: 'Juan Pérez', actorUserId: 'USR-002', date: '2026-10-15T14:10:00.000Z', notes: 'Material para puntos de red.' },
      { id: 'MOV-SEED-003', type: 'INSTALL', equipmentId: 'MAT-002', assignmentId: 'ASG-002', projectId: 'PRJ-001', quantity: 6, origin: 'Torre 1', destination: 'Piso 2 · Sala de reuniones', responsibleUserId: 'USR-003', responsibleName: 'Juan Pérez', actorUserId: 'USR-003', date: '2026-10-16T16:00:00.000Z', notes: 'Seis conectores utilizados en la instalación.' },
      { id: 'MOV-SEED-004', type: 'EXIT', equipmentId: 'EQ-004', assignmentId: 'ASG-003', projectId: 'PRJ-002', quantity: 1, origin: 'Bodega principal', destination: 'Plaza Central', responsibleUserId: 'USR-004', responsibleName: 'María García', actorUserId: 'USR-002', date: '2026-10-15T14:20:00.000Z', notes: 'Asignación CCTV.' },
    ],
  };
}
