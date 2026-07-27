import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBluetooth } from '../bluetooth/BluetoothContext';
import { syncWithCloud } from '../bluetooth/DataSync';
import { useRelayControl } from '../hooks/useRelayControl';
import { colors, styles } from '../theme/globalStyles';

interface Props {
  title: string;
  subTitle: string;
}

export const HeaderStatus = ({ title, subTitle }: Props) => {
  const { isRelayOn, toggleRelay, isChanging } = useRelayControl();

  // ✅ FIX 5: Nombres corregidos según lo que realmente expone BluetoothContext
  // ❌ Antes: connectedDevice, isScanning, connectToDevice  (no existen)
  // ✅ Ahora: device,           isScanning,  connect         (nombres reales)
  const { device, isScanning, connect } = useBluetooth();

  const handleSync = async () => {
    console.log('☁️ Iniciando sincronización manual...');
    await syncWithCloud();
  };

  return (
    <View style={[styles.headerBlue, { height: 'auto', paddingBottom: 15 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.statusText}>{subTitle}</Text>

        {/* BOTÓN DE BLUETOOTH */}
        <TouchableOpacity
          style={[
            localStyles.actionButton,
            { backgroundColor: device ? '#22c55e' : colors.primary },
          ]}
          onPress={connect}
          disabled={isScanning || !!device}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={localStyles.actionText}>
              {device ? '📶 CONECTADO' : '🔍 BUSCAR EQUIPO'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        {/* BOTÓN DE RELÉ */}
        <TouchableOpacity
          style={[
            styles.statusContainer,
            {
              backgroundColor: isRelayOn
                ? 'rgba(177, 240, 219, 0.73)'
                : 'rgba(248, 188, 188, 0.75)',
            },
          ]}
          onPress={toggleRelay}
          disabled={isChanging}
        >
          {isChanging ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 5 }} />
          ) : (
            <View
              style={[
                styles.indicatorDot,
                { backgroundColor: isRelayOn ? '#a2eea0' : '#f9acac' },
              ]}
            />
          )}
          <Text
            style={[
              styles.statusText,
              { color: isRelayOn ? colors.secondary : '#ff9999', fontWeight: 'bold' },
            ]}
          >
            {isRelayOn ? 'SISTEMA ON' : 'SISTEMA OFF'}
          </Text>
        </TouchableOpacity>

        {/* BOTÓN SINCRONIZAR SQLITE → MONGODB */}
        <TouchableOpacity
          style={[localStyles.actionButton, { marginTop: 10, backgroundColor: '#6366f1' }]}
          onPress={handleSync}
        >
          <Text style={localStyles.actionText}>☁️ SUBIR A NUBE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    elevation: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
