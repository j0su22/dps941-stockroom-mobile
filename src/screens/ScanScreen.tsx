import React, { useRef, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Field, Message, Screen } from '../components/UI';
import { useStockroom } from '../hooks/useStockroom';
import { findEquipment } from '../domain/inventory';
import { colors, ui } from '../theme/theme';
import type { RootParamList } from '../navigation/types';

export function ScanScreen() {
  const { db } = useStockroom(); const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const focused = useIsFocused(); const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState(''); const [error, setError] = useState(''); const [enabled, setEnabled] = useState(true);
  const scanning = useRef(false);
  function resolve(value: string) {
    if (scanning.current) return;
    scanning.current = true; setEnabled(false); setError('');
    // Solo identificadores exactos. El QR nunca se ejecuta ni se abre como URL externa.
    const equipment = findEquipment(db!, value);
    if (equipment) navigation.navigate('Equipment', { id: equipment.id });
    else setError('Código no encontrado. Prueba el código, la serie o la MAC del equipo.');
  }
  function resume() { scanning.current = false; setEnabled(true); setError(''); }
  return <Screen><Text style={ui.title}>Escanear código</Text><Text style={ui.body}>Coloca el QR o código de barras dentro del recuadro.</Text>
    {permission?.granted && focused && enabled ? <View style={{ height: 290, overflow: 'hidden', borderRadius: 20, borderColor: colors.yellow, borderWidth: 3 }}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }} onBarcodeScanned={result => resolve(result.data)} /></View> : <View style={[ui.card, { minHeight: 180, justifyContent: 'center' }]}><Text style={ui.muted}>{!enabled ? 'Escaneo pausado. Pulsa «Escanear de nuevo» para continuar.' : 'Permite el acceso a la cámara o ingresa el código manualmente.'}</Text>{!permission?.granted ? <Button title="Permitir cámara" secondary onPress={() => { void requestPermission().catch(() => setError('No fue posible solicitar la cámara. Usa el ingreso manual.')); }} /> : null}{permission && !permission.canAskAgain && Platform.OS !== 'web' ? <Button title="Abrir ajustes del dispositivo" secondary onPress={() => { void Linking.openSettings(); }} /> : null}</View>}
    {!enabled ? <Button title="Escanear de nuevo" secondary onPress={resume} /> : null}
    <Field label="Ingresar código manualmente" value={manual} onChangeText={value => { setManual(value); scanning.current = false; }} autoCapitalize="characters" maxLength={100} placeholder="EQ-001 o U7P-0001A2B3" />
    <Button title="Buscar equipo" disabled={!manual.trim()} onPress={() => { scanning.current = false; resolve(manual); }} />
    {error ? <Message text={error} tone="error" /> : null}<Message text="Códigos de prueba: EQ-001, EQ-002, MAT-002, MAT-003 y EQ-004. También se aceptan la serie o MAC exactas. Puedes generar un QR con cualquiera de estos textos." />
  </Screen>;
}
