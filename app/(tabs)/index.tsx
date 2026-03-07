import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../store/useWalletStore';
import { Colors, Spacing, Radius, Fonts } from '../../constants/theme';
import { shortenAddress, formatBalance, formatUSD, getSOLBalance, timeAgo } from '../../utils/solana';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

const APP_IDENTITY = { name: 'Solanape', uri: 'https://solanape.app', icon: 'favicon.ico' };
const NETWORKS = ['devnet', 'testnet', 'mainnet-beta'] as const;
type Network = typeof NETWORKS[number];

export default function HomeScreen() {
  const router = useRouter();
  const { connected, publicKey, solBalance, skrBalance, solPriceUSD, transactions, connect, disconnect, setSolBalance } = useWalletStore();
  const [network, setNetwork] = useState<Network>('devnet');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleConnect = async () => {
    if (connected) { disconnect(); return; }
    try {
      await transact(async (wallet: any) => {
        const auth = await wallet.authorize({ cluster: network, identity: APP_IDENTITY });
        // MWA returns base64 — convert to base58 for Solana
        const rawAddress = auth.accounts[0].address;
        let pubkey = rawAddress;
        try {
          const bs58 = await import('bs58');
          const { Buffer } = await import('buffer');
          const bytes = Buffer.from(rawAddress, 'base64');
          pubkey = bs58.default.encode(bytes);
        } catch {}
        connect(pubkey);
        const bal = await getSOLBalance(pubkey).catch(() => 0);
        setSolBalance(bal);
      });
    } catch (e: any) {
      if (!e?.message?.includes('dismissed')) console.log('Connect error:', e?.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (publicKey) {
      const bal = await getSOLBalance(publicKey).catch(() => solBalance);
      setSolBalance(bal);
    }
    setRefreshing(false);
  };

  const networkColor = network === 'mainnet-beta' ? '#14F195' : network === 'testnet' ? '#FFB800' : '#9945FF';
  const recentTxs = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
        >
          {/* ── Header ── */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.logoRow}>
              <Image source={require('../../assets/logo-header.png')} style={styles.logoImg} />
              <View>
                <Text style={styles.logoName}>Solanape</Text>
                <Text style={styles.logoSub}>UPI-style Solana payments</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleConnect} style={[styles.connectBtn, connected && styles.connectBtnActive]} activeOpacity={0.8}>
              <View style={[styles.dot, { backgroundColor: connected ? Colors.green : '#666' }]} />
              <Text style={[styles.connectText, connected && { color: Colors.green }]}>
                {connected ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Network Switcher ── */}
          <Animated.View style={[styles.networkRow, { opacity: fadeAnim }]}>
            {NETWORKS.map((n) => (
              <TouchableOpacity key={n} onPress={() => setNetwork(n)} style={[styles.networkChip, network === n && { borderColor: networkColor, backgroundColor: networkColor + '18' }]} activeOpacity={0.8}>
                <View style={[styles.networkDot, { backgroundColor: n === 'mainnet-beta' ? '#14F195' : n === 'testnet' ? '#FFB800' : '#9945FF' }]} />
                <Text style={[styles.networkText, network === n && { color: networkColor }]}>
                  {n === 'mainnet-beta' ? 'Mainnet' : n === 'testnet' ? 'Testnet' : 'Devnet'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── Balance Card ── */}
          <Animated.View style={[styles.balanceCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Glow blobs */}
            <View style={[styles.blob, { backgroundColor: Colors.green, top: -30, right: -20 }]} />
            <View style={[styles.blob, { backgroundColor: Colors.purple, bottom: -20, left: 10 }]} />

            {!connected ? (
              <View style={styles.disconnected}>
                <Text style={styles.disconnectedTitle}>Connect your wallet</Text>
                <Text style={styles.disconnectedSub}>Link Phantom or any MWA-compatible wallet</Text>
                <TouchableOpacity onPress={handleConnect} style={styles.connectLargeBtn} activeOpacity={0.85}>
                  <Text style={styles.connectLargeBtnText}>Connect Wallet →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.balLabel}>Total Balance</Text>
                <Text style={styles.balAmount}>{formatBalance(solBalance, 4)}<Text style={styles.balSymbol}> SOL</Text></Text>
                <Text style={styles.balUSD}>{formatUSD(solBalance, solPriceUSD)}</Text>
                <View style={styles.balFooter}>
                  <View style={styles.skrBadge}>
                    <Text style={styles.skrText}>🔮 {formatBalance(skrBalance, 0)} SKR</Text>
                  </View>
                  <View style={[styles.networkBadge, { borderColor: networkColor + '50', backgroundColor: networkColor + '15' }]}>
                    <View style={[styles.networkDot, { backgroundColor: networkColor, width: 5, height: 5 }]} />
                    <Text style={[styles.networkBadgeText, { color: networkColor }]}>
                      {network === 'mainnet-beta' ? 'Mainnet' : network === 'testnet' ? 'Testnet' : 'Devnet'}
                    </Text>
                  </View>
                </View>
                {publicKey && <Text style={styles.address}>{shortenAddress(publicKey, 8)}</Text>}
              </>
            )}
          </Animated.View>

          {/* ── Quick Actions ── */}
          <Animated.View style={[styles.actionsGrid, { opacity: fadeAnim }]}>
            {[
              { label: 'Send', icon: '↗', color: Colors.green, bg: Colors.greenDim, border: Colors.greenBorder, route: '/send' },
              { label: 'Receive', icon: '↙', color: Colors.purple, bg: Colors.purpleDim, border: Colors.purpleBorder, route: '/receive' },
              { label: 'Scan', icon: '▦', color: Colors.blue, bg: 'rgba(0,194,255,0.1)', border: 'rgba(0,194,255,0.25)', route: '/(tabs)/scan' },
              { label: 'History', icon: '◷', color: Colors.skrGold, bg: Colors.skrGoldDim, border: Colors.skrGoldBorder, route: '/(tabs)/history' },
            ].map((a) => (
              <TouchableOpacity key={a.label} onPress={() => router.push(a.route as any)} style={styles.actionBtn} activeOpacity={0.75}>
                <View style={[styles.actionIcon, { backgroundColor: a.bg, borderColor: a.border }]}>
                  <Text style={[styles.actionEmoji, { color: a.color }]}>{a.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── SKR Banner ── */}
          <TouchableOpacity onPress={() => router.push({ pathname: '/send', params: { token: 'SKR' } } as any)} style={styles.skrBanner} activeOpacity={0.85}>
            <View style={styles.skrBannerLeft}>
              <View style={styles.skrIconWrap}><Text style={{ fontSize: 22 }}>🔮</Text></View>
              <View>
                <Text style={styles.skrBannerTitle}>Send SKR to Seeker users</Text>
                <Text style={styles.skrBannerSub}>Native Seeker ecosystem token</Text>
              </View>
            </View>
            <Text style={styles.skrArrow}>→</Text>
          </TouchableOpacity>

          {/* ── Recent Txs ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
            </View>
            {recentTxs.length === 0 ? (
              <View style={styles.emptyTx}><Text style={styles.emptyTxText}>No transactions yet</Text></View>
            ) : recentTxs.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'sent' ? 'rgba(153,69,255,0.15)' : 'rgba(20,241,149,0.15)' }]}>
                  <Text style={[styles.txArrow, { color: tx.type === 'sent' ? Colors.purple : Colors.green }]}>
                    {tx.type === 'sent' ? '↑' : '↓'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName}>{(tx as any).label || shortenAddress(tx.address)}</Text>
                  <Text style={styles.txTime}>{timeAgo(tx.timestamp)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txAmt, { color: tx.type === 'sent' ? Colors.error : Colors.green }]}>
                    {tx.type === 'sent' ? '-' : '+'}{tx.amount} {tx.token}
                  </Text>
                  <View style={[styles.txBadge, { backgroundColor: tx.status === 'confirmed' ? Colors.greenDim : tx.status === 'failed' ? 'rgba(255,77,109,0.12)' : Colors.purpleDim }]}>
                    <Text style={[styles.txBadgeText, { color: tx.status === 'confirmed' ? Colors.green : tx.status === 'failed' ? Colors.error : Colors.purple }]}>{tx.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: 8, paddingBottom: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 44, height: 44, borderRadius: 12 },
  logoName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  logoSub: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  connectBtnActive: { borderColor: Colors.green, backgroundColor: Colors.greenDim },
  dot: { width: 6, height: 6, borderRadius: 3 },
  connectText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  networkRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.screen, marginBottom: 12 },
  networkChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  networkDot: { width: 6, height: 6, borderRadius: 3 },
  networkText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  balanceCard: { marginHorizontal: Spacing.screen, borderRadius: 24, backgroundColor: Colors.bgCard, padding: 24, borderWidth: 1, borderColor: Colors.greenBorder, overflow: 'hidden', marginBottom: 20 },
  blob: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.07 },
  disconnected: { alignItems: 'center', paddingVertical: 16 },
  disconnectedTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  disconnectedSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 18, lineHeight: 18 },
  connectLargeBtn: { backgroundColor: Colors.green, paddingHorizontal: 28, paddingVertical: 12, borderRadius: Radius.full },
  connectLargeBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  balLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  balAmount: { fontSize: 44, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  balSymbol: { fontSize: 20, color: Colors.green, fontWeight: '600' },
  balUSD: { fontSize: 15, color: Colors.textSecondary, marginTop: 2, marginBottom: 14 },
  balFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skrBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.skrGoldDim, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.skrGoldBorder },
  skrText: { fontSize: 13, color: Colors.skrGold, fontWeight: '700' },
  networkBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  networkBadgeText: { fontSize: 11, fontWeight: '700' },
  address: { marginTop: 12, fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace', letterSpacing: 0.5 },

  actionsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: Spacing.screen, marginBottom: 20 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 62, height: 62, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionEmoji: { fontSize: 26, fontWeight: '700' },
  actionLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  skrBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.screen, marginBottom: 20, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.skrGoldBorder },
  skrBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skrIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.skrGoldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.skrGoldBorder },
  skrBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  skrBannerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  skrArrow: { fontSize: 20, color: Colors.skrGold, fontWeight: '700' },

  section: { marginHorizontal: Spacing.screen },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.green, fontWeight: '600' },
  emptyTx: { alignItems: 'center', paddingVertical: 32 },
  emptyTxText: { color: Colors.textMuted, fontSize: 14 },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txArrow: { fontSize: 20, fontWeight: '700' },
  txName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  txTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  txBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
  txBadgeText: { fontSize: 10, fontWeight: '700' },
});