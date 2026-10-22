import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { getAlerts, visibleAssignments, visibleMovements, visibleProjects } from '../domain/inventory';

export function useStockroom() {
  const auth = useAuth();
  const inventory = useInventory();
  const { db } = inventory;
  const user = auth.user!;
  return { ...inventory, user,
    projects: db ? visibleProjects(db, user) : [],
    assignments: db ? visibleAssignments(db, user) : [],
    movements: db ? visibleMovements(db, user) : [],
    alerts: db ? getAlerts(db, user) : [],
  };
}
