import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalletStore } from '../../store/useWalletStore';
import { Colors, Spacing, Radius, Fonts } from '../../constants/theme';
import { shortenAddress } from '../../utils/solana';

export default function ProfileScreen() {
  const { connected, publicKey, solBalance, skrBalance, disconnect } = useWalletStore();

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <Text style={styles.title}>Profile</Text>

          {/* Wallet Card */}
          <View style={styles.card}>
            <View style={styles.walletHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>◎</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>{connected ? 'Connected' : 'Not Connected'}</Text>
                {publicKey && <Text style={styles.walletAddr}>{shortenAddress(publicKey, 8)}</Text>}
              </View>
              <View style={[styles.statusDot, { backgroundColor: connected ? Colors.green : Colors.error }]} />
            </View>

            {connected && (
              <View style={styles.balancesRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceVal}>{solBalance.toFixed(4)}</Text>
                  <Text style={styles.balanceToken}>SOL</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceVal, { color: Colors.skrGold }]}>{skrBalance.toFixed(2)}</Text>
                  <Text style={styles.balanceToken}>SKR</Text>
                </View>
              </View>
            )}
          </View>

          {/* Network Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Network</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Cluster</Text>
              <Text style={styles.rowVal}>Devnet</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>RPC</Text>
              <Text style={styles.rowVal}>api.devnet.solana.com</Text>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>App</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowVal}>1.0.0</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Token</Text>
              <Text style={styles.rowVal}>SKR (Seeker)</Text>
            </View>
          </View>

          {connected && (
            <TouchableOpacity onPress={() => { Alert.alert('Disconnect', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Disconnect', onPress: disconnect, style: 'destructive' }]); }} style={styles.disconnectBtn} activeOpacity={0.8}>
              <Text style={styles.disconnectText}>Disconnect Wallet</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.textPrimary, padding: Spacing.screen, paddingBottom: 12 },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: 20, marginHorizontal: Spacing.screen, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  avatarText: { fontSize: 22 },
  walletLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
  walletAddr: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  balancesRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceVal: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textPrimary },
  balanceToken: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  balanceDivider: { width: 1, backgroundColor: Colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { fontSize: 14, color: Colors.textMuted },
  rowVal: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  disconnectBtn: { marginHorizontal: Spacing.screen, borderWidth: 1, borderColor: Colors.error, borderRadius: Radius.full, height: 48, alignItems: 'center', justifyContent: 'center' },
  disconnectText: { color: Colors.error, fontWeight: '700' },
});