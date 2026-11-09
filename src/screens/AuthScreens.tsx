import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Message } from '../components/UI';
import { colors } from '../theme/theme';
import { errorMessage, validateEmail, validateName, validatePassword } from '../domain/validation';
import type { AuthParamList } from '../navigation/types';

function AuthLayout({ children, subtitle }: React.PropsWithChildren<{ subtitle: string }>) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.blue }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 26, gap: 18, maxWidth: 500, width: '100%', alignSelf: 'center' }}>
      <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}><View style={{ backgroundColor: colors.white, borderRadius: 50, padding: 14 }}><Ionicons name="radio-button-on" size={42} color={colors.blue} /></View><Text style={{ fontSize: 25, fontWeight: '800', letterSpacing: 2, color: colors.white }}>GRUPO DTECH</Text><Text style={{ color: '#C7D4FF' }}>Stockroom · {subtitle}</Text></View>
      {children}
      <Text style={{ textAlign: 'center', color: '#C7D4FF', fontSize: 11 }}>DPS941 · Foro 2 · Firebase</Text>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthParamList, 'Login'>) {
  const { login, google } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  async function submit() {
    if (busy) return;
    setAttempted(true); setError('');
    if (validateEmail(email) || !password) return;
    setBusy(true);
    try { await login(email, password, true); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <AuthLayout subtitle="Inventario técnico">
    <Field dark label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} error={attempted ? validateEmail(email) : undefined} />
    <Field dark label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" maxLength={128} error={attempted && !password ? 'Ingresa tu contraseña.' : undefined} onSubmitEditing={() => void submit()} />

    {error ? <Message text={error} tone="error" /> : null}
    <Button title="Iniciar sesión" loading={busy} onPress={() => void submit()} />
    <Button title="Continuar con Google" secondary disabled={busy} onPress={() => { setBusy(true); setError(''); void google().catch(e => setError(errorMessage(e))).finally(() => setBusy(false)); }} />
    <Button title="Recuperar contraseña" secondary disabled={busy} onPress={() => { setBusy(true); setError(''); void authService.resetPassword(email).then(() => setError('Solicitud enviada. Revisa tu correo si existe una cuenta asociada.')).catch(e => setError(errorMessage(e))).finally(() => setBusy(false)); }} />
    <Button title="Crear cuenta de técnico" secondary disabled={busy} onPress={() => navigation.navigate('Register')} />
    <Message text="Ingresa con tu cuenta de Stockroom o crea una cuenta de técnico." />
  </AuthLayout>;
}

export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthParamList, 'Register'>) {
  const { register } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [attempted, setAttempted] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    setAttempted(true); setError('');
    if (validateName(name) || validateEmail(email) || validatePassword(password) || password !== confirm) return;
    setBusy(true);
    try { await register(name, email, password, confirm); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <AuthLayout subtitle="Crear cuenta">
    <Field dark label="Nombre completo" value={name} onChangeText={setName} autoComplete="name" maxLength={80} error={attempted ? validateName(name) : undefined} />
    <Field dark label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} error={attempted ? validateEmail(email) : undefined} />
    <Field dark label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" maxLength={128} error={attempted ? validatePassword(password) : undefined} />
    <Field dark label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry maxLength={128} error={attempted && confirm !== password ? 'Las contraseñas no coinciden.' : undefined} />
    <Message text="Las cuentas nuevas tienen rol Técnico. Administración debe asignarte a un proyecto para registrar operaciones. La cuenta y sus datos se almacenan en Firebase." />
    {error ? <Message text={error} tone="error" /> : null}
    <Button title="Registrarme" loading={busy} onPress={() => void submit()} /><Button title="Volver a iniciar sesión" secondary disabled={busy} onPress={() => navigation.goBack()} />
  </AuthLayout>;
}
