import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MovementType } from '../types/models';
export type TabsParamList = { Home: undefined; Projects: undefined; Scan: undefined; Alerts: undefined; Profile: undefined };
export type RootParamList = {
  Main: NavigatorScreenParams<TabsParamList> | undefined;
  Inventory: { filter?: 'ALL' | 'MINE' } | undefined;
  Equipment: { id: string };
  Movement: { type: MovementType; equipmentId?: string; assignmentId?: string };
  Project: { id: string };
  History: { equipmentId?: string } | undefined;
  ChangePassword: undefined;
};
export type AuthParamList = { Login: undefined; Register: undefined };
