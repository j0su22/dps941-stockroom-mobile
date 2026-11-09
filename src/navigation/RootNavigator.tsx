import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { InventoryProvider, useInventory } from '../context/InventoryContext';
import { Button, Loading, Message, Screen } from '../components/UI';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import { HomeScreen, ProjectsScreen, ProjectDetailScreen, AlertsScreen, ProfileScreen, HistoryScreen, ChangePasswordScreen } from '../screens/DashboardScreens';
import { EquipmentScreen, InventoryScreen } from '../screens/InventoryScreens';
import { MovementScreen } from '../screens/MovementScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { colors } from '../theme/theme';
import type { AuthParamList, RootParamList, TabsParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthParamList>();
const RootStack = createNativeStackNavigator<RootParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();
const screenOptions = { headerStyle: { backgroundColor: colors.blue }, headerTintColor: colors.white, headerTitleStyle: { fontWeight: '700' as const }, contentStyle: { backgroundColor: colors.background } };

function TabNavigator() {
  return <Tabs.Navigator screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { minHeight: 68, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 4 },
    tabBarIcon: ({ color, size }) => {
      const icons = { Home: 'home-outline', Projects: 'briefcase-outline', Scan: 'scan-outline', Alerts: 'notifications-outline', Profile: 'person-circle-outline' } as const;
      return <Ionicons name={icons[route.name]} color={route.name === 'Scan' ? colors.blue : color} size={route.name === 'Scan' ? 30 : size} />;
    },
  })}>
    <Tabs.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
    <Tabs.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Proyectos' }} />
    <Tabs.Screen name="Scan" component={ScanScreen} options={{ title: 'Escanear' }} />
    <Tabs.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alertas' }} />
    <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
  </Tabs.Navigator>;
}

function AuthenticatedApp() {
  const { db, error, refresh } = useInventory(); const { logout } = useAuth();
  if (!db && !error) return <Loading label="Consultando inventario en Firebase…" />;
  if (!db || error) return <Screen><Message text={error || 'No fue posible cargar los datos.'} tone="error" /><Button title="Reintentar" onPress={() => void refresh()} /><Button title="Cerrar sesión" secondary onPress={() => { void logout().catch(() => undefined); }} /></Screen>;
  return <RootStack.Navigator screenOptions={screenOptions}>
    <RootStack.Screen name="Main" component={TabNavigator} options={{ title: 'STOCKROOM · GRUPO DTECH' }} />
    <RootStack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventario' }} />
    <RootStack.Screen name="Equipment" component={EquipmentScreen} options={{ title: 'Detalle del equipo' }} />
    <RootStack.Screen name="Movement" component={MovementScreen} options={{ title: 'Registrar movimiento', gestureEnabled: false }} />
    <RootStack.Screen name="Project" component={ProjectDetailScreen} options={{ title: 'Detalle del proyecto' }} />
    <RootStack.Screen name="History" component={HistoryScreen} options={{ title: 'Historial de movimientos' }} />
    <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Mi contraseña' }} />
  </RootStack.Navigator>;
}

export function RootNavigator() {
  const { user, loading, error, initialize, logout } = useAuth();
  if (loading) return <Loading label="Preparando cuentas y sesión…" />;
  if (error) return <Screen><Message text={error} tone="error" /><Button title="Reintentar" onPress={() => void initialize()} /><Button title="Volver al inicio de sesión" secondary onPress={() => { void logout().then(() => initialize()); }} /></Screen>;
  return <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.blue, background: colors.background } }}>
    {user ? <InventoryProvider key={user.id}><AuthenticatedApp /></InventoryProvider> : <AuthStack.Navigator screenOptions={{ headerShown: false }}><AuthStack.Screen name="Login" component={LoginScreen} /><AuthStack.Screen name="Register" component={RegisterScreen} /></AuthStack.Navigator>}
  </NavigationContainer>;
}
