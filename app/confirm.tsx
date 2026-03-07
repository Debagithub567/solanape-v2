import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, Radius, Fonts } from '../constants/theme';
import { getTxExplorerUrl } from '../utils/solana';

export default function ConfirmScreen() {
  const router = useRouter();
  const { status, amount, token, toAddress, txSignature } = useLocalSearchParams<{ status: string; amount: string; token: string; toAddress: string; txSignature: string }>();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isSuccess = status === 'confirmed';
  const isPending = status === 'pending';

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCopy = async () => {
    if (!txSignature) return;
    await Clipboard.setStringAsync(txSignature);
    Alert.alert('Copied!', 'Transaction signature copied');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Status Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }], backgroundColor: isSuccess ? Colors.greenDim : isPending ? Colors.purpleDim : 'rgba(255,77,109,0.12)' }]}>
            <Text style={styles.iconText}>{isSuccess ? '✓' : isPending ? '◷' : '✕'}</Text>
          </Animated.View>

          <Text style={[styles.statusText, { color: isSuccess ? Colors.green : isPending ? Colors.purple : Colors.error }]}>
            {isSuccess ? 'Payment Sent!' : isPending ? 'Pending...' : 'Failed'}
          </Text>
          <Text style={styles.amountText}>{amount} {token}</Text>
          <Text style={styles.toText}>To {toAddress}</Text>

          {/* Details Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <Text style={[styles.rowVal, { color: isSuccess ? Colors.green : Colors.error }]}>{status}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Token</Text>
              <Text style={styles.rowVal}>{token}</Text>
            </View>
            {txSignature ? (
              <TouchableOpacity onPress={handleCopy} style={styles.row}>
                <Text style={styles.rowLabel}>Tx Signature</Text>
                <Text style={[styles.rowVal, { color: Colors.blue }]}>{txSignature.slice(0, 12)}... 📋</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Explorer Link */}
          {txSignature && isSuccess && (
            <TouchableOpacity onPress={() => Linking.openURL(getTxExplorerUrl(txSignature))} style={styles.explorerBtn} activeOpacity={0.8}>
              <Text style={styles.explorerText}>View on Explorer ↗</Text>
            </TouchableOpacity>
          )}

          {/* Done Button */}
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.doneBtn} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>

          {!isSuccess && (
            <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn} activeOpacity={0.8}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screen },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconText: { fontSize: 36, color: Colors.textPrimary },
  statusText: { fontSize: Fonts.sizes.xxl, fontWeight: '800', marginBottom: 8 },
  amountText: { fontSize: Fonts.sizes.hero, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  toText: { fontSize: Fonts.sizes.md, color: Colors.textSecondary, marginBottom: 28 },
  card: { width: '100%', backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { fontSize: 14, color: Colors.textMuted },
  rowVal: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  explorerBtn: { marginBottom: 16 },
  explorerText: { fontSize: 14, color: Colors.blue, fontWeight: '600' },
  doneBtn: { width: '100%', backgroundColor: Colors.green, height: 56, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  doneBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 16 },
  retryBtn: { width: '100%', borderWidth: 1, borderColor: Colors.border, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: Colors.textSecondary, fontWeight: '600' },
});