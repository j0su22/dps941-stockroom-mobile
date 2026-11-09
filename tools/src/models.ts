export type UserRole = 'ADMIN' | 'WAREHOUSE' | 'TECHNICIAN';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}
export type EquipmentStatus = 'IN_STOCK' | 'ASSIGNED' | 'INSTALLED' | 'MAINTENANCE';
export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  kind: 'SERIALIZED' | 'CONSUMABLE';
  serialNumber?: string;
  macAddress?: string;
  model: string;
  location: string;
  stock: number;
  maintenanceStock: number;
  minimumStock: number;
  status: EquipmentStatus;
}
export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CLOSED';
  technicianIds: string[];
}
export interface Assignment {
  id: string;
  equipmentId: string;
  projectId: string;
  technicianId: string;
  quantity: number;
  installedQuantity: number;
  returnedQuantity: number;
  dueDate?: string;
}
export type MovementType = 'EXIT' | 'INSTALL' | 'RETURN';
export type EquipmentCondition = 'GOOD' | 'REVIEW' | 'DAMAGED';
export interface Movement {
  id: string;
  type: MovementType;
  equipmentId: string;
  assignmentId: string;
  projectId: string;
  quantity: number;
  origin: string;
  destination: string;
  responsibleUserId: string;
  responsibleName: string;
  actorUserId: string;
  date: string;
  notes: string;
  condition?: EquipmentCondition;
  reason?: string;
  evidenceUri?: string;
}
export interface Database {
  version: 1;
  equipment: Equipment[];
  projects: Project[];
  assignments: Assignment[];
  movements: Movement[];
}
export interface MovementInput {
  type: MovementType;
  equipmentId: string;
  projectId: string;
  technicianId: string;
  assignmentId?: string;
  quantity: number;
  location: string;
  notes: string;
  condition?: EquipmentCondition;
  reason?: string;
  evidenceUri?: string;
}
export interface AppAlert {
  id: string;
  title: string;
  description: string;
  tone: 'danger' | 'warning' | 'info';
  equipmentId: string;
}
