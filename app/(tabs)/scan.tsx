import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, Animated, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../store/useWalletStore';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { isValidSolanaAddress } from '../../utils/solana';

export default function ScanScreen() {
  const router = useRouter();
  const { connected } = useWalletStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualAddr, setManualAddr] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const navigateToSend = (address: string) => {
    router.push({ pathname: '/send', params: { address } });
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(100);
    let address = data;
    if (data.startsWith('solana:')) address = data.replace('solana:', '').split('?')[0];
    if (isValidSolanaAddress(address)) {
      navigateToSend(address);
    } else {
      Alert.alert('Invalid QR', 'Not a valid Solana address', [{ text: 'OK', onPress: () => setScanned(false) }]);
    }
  };

  const handleGallery = () => {
    Alert.alert('QR from Gallery', 'Automatic QR decoding from gallery is not supported yet. Enter address manually or use camera.', [
      { text: 'Enter Manually', onPress: () => setShowManual(true) },
      { text: 'Use Camera', style: 'cancel' },
    ]);
  };

  const handleManualSubmit = () => {
    if (isValidSolanaAddress(manualAddr.trim())) {
      setShowManual(false);
      navigateToSend(manualAddr.trim());
    } else {
      Alert.alert('Invalid Address', 'Please enter a valid Solana wallet address');
    }
  };

  const handleMyQR = () => router.push('/receive');

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.permText}>Camera permission needed</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 240] });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanBox}>
            {/* Corner markers */}
            {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
              <View key={i} style={[styles.corner, pos,
                i === 0 && { borderRightWidth: 0, borderBottomWidth: 0 },
                i === 1 && { borderLeftWidth: 0, borderBottomWidth: 0 },
                i === 2 && { borderRightWidth: 0, borderTopWidth: 0 },
                i === 3 && { borderLeftWidth: 0, borderTopWidth: 0 },
              ]} />
            ))}
            {/* Scan line */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* UI */}
      <SafeAreaView style={styles.ui}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan to Pay</Text>
          {connected && (
            <View style={styles.connectedBadge}>
              <View style={[styles.dot, { backgroundColor: Colors.green }]} />
              <Text style={styles.connectedText}>Wallet Connected</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 16 }}>
          <Text style={styles.hint}>Point at a Solana wallet or payment QR code</Text>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity onPress={() => setTorch(!torch)} style={[styles.actionCard, torch && styles.actionCardActive]} activeOpacity={0.8}>
            <Text style={[styles.actionCardIcon, torch && {color: Colors.green}]}>⚡</Text>
            <Text style={[styles.actionCardLabel, torch && { color: Colors.green }]}>Torch</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGallery} style={styles.actionCard} activeOpacity={0.8}>
            <Text style={styles.actionCardIcon}>🖼️</Text>
            <Text style={styles.actionCardLabel}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowManual(true)} style={styles.actionCard} activeOpacity={0.8}>
            <Text style={styles.actionCardIcon}>✏️</Text>
            <Text style={styles.actionCardLabel}>Manual</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMyQR} style={styles.actionCard} activeOpacity={0.8}>
            <Text style={styles.actionCardIcon}>🔲</Text>
            <Text style={styles.actionCardLabel}>My QR</Text>
          </TouchableOpacity>
        </View>

        {scanned && (
          <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanBtn}>
            <Text style={styles.rescanText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Manual Entry Modal */}
      <Modal visible={showManual} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Address Manually</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Solana wallet address..."
              placeholderTextColor={Colors.textMuted}
              value={manualAddr}
              onChangeText={setManualAddr}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowManual(false)} style={styles.modalBtnCancel}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleManualSubmit} style={styles.modalBtnConfirm}>
                <Text style={styles.modalBtnConfirmText}>Send →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const BOX = 260;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { fontSize: 16, color: '#fff', marginBottom: 16, textAlign: 'center' },
  permBtn: { backgroundColor: Colors.green, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },
  permBtnText: { color: '#000', fontWeight: '800' },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: BOX },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox: { width: BOX, height: BOX, overflow: 'hidden' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: Colors.green, borderWidth: 3 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: Colors.green, shadowColor: Colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },

  ui: { ...StyleSheet.absoluteFillObject },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.greenDim, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.greenBorder },
  dot: { width: 6, height: 6, borderRadius: 3 },
  connectedText: { fontSize: 12, color: Colors.green, fontWeight: '600' },
  hint: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16, marginTop: 24, paddingHorizontal: 24 },

  bottomActions: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(10,10,18,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingVertical: 16, paddingHorizontal: 12 },
  actionCard: { alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  actionCardActive: { opacity: 1 },
  actionCardIcon: { fontSize: 26 },
  actionCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  rescanBtn: { backgroundColor: Colors.green, margin: 16, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center' },
  rescanText: { color: '#000', fontWeight: '800', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  modalInput: { backgroundColor: Colors.bgInput, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, color: Colors.textPrimary, fontSize: 14, marginBottom: 16, fontFamily: 'monospace' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancelText: { color: Colors.textSecondary, fontWeight: '600' },
  modalBtnConfirm: { flex: 1, backgroundColor: Colors.green, borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center' },
  modalBtnConfirmText: { color: '#000', fontWeight: '800' },
});