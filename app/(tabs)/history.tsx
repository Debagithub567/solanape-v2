import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalletStore } from '../../store/useWalletStore';
import { Colors, Spacing, Radius, Fonts } from '../../constants/theme';
import { shortenAddress, timeAgo, getTxExplorerUrl } from '../../utils/solana';

type Filter = 'all' | 'sent' | 'received' | 'SOL' | 'SKR';
const FILTERS: Filter[] = ['all', 'sent', 'received', 'SOL', 'SKR'];

export default function HistoryScreen() {
  const { transactions } = useWalletStore();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'sent' || filter === 'received') return tx.type === filter;
    return tx.token === filter;
  });

  const sent = transactions.filter((t) => t.type === 'sent').length;
  const received = transactions.filter((t) => t.type === 'received').length;
  const totalSol = transactions.filter(t => t.token === 'SOL').reduce((a, t) => a + parseFloat(t.amount), 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{transactions.length} txs</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.border }]}>
            <Text style={styles.statVal}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(255,77,109,0.3)', backgroundColor: 'rgba(255,77,109,0.06)' }]}>
            <Text style={[styles.statVal, { color: '#FF6B6B' }]}>↑ {sent}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.greenBorder, backgroundColor: Colors.greenDim }]}>
            <Text style={[styles.statVal, { color: Colors.green }]}>↓ {received}</Text>
            <Text style={styles.statLabel}>Received</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(153,69,255,0.3)', backgroundColor: Colors.purpleDim }]}>
            <Text style={[styles.statVal, { color: Colors.purple, fontSize: 14 }]}>{totalSol.toFixed(2)}</Text>
            <Text style={styles.statLabel}>SOL vol.</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              activeOpacity={0.8}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.screen, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your history will appear here</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSent = item.type === 'sent';
            const iconBg = isSent ? 'rgba(255,107,107,0.15)' : Colors.greenDim;
            const iconColor = isSent ? '#FF6B6B' : Colors.green;
            const amtColor = isSent ? '#FF6B6B' : Colors.green;
            const statusColor = item.status === 'confirmed' ? Colors.green : item.status === 'failed' ? Colors.error : Colors.skrGold;
            const statusBg = item.status === 'confirmed' ? Colors.greenDim : item.status === 'failed' ? 'rgba(255,77,109,0.12)' : Colors.skrGoldDim;

            return (
              <TouchableOpacity
                onPress={() => item.txSignature && Linking.openURL(getTxExplorerUrl(item.txSignature))}
                style={styles.txCard}
                activeOpacity={0.85}
              >
                {/* Left icon */}
                <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
                  <Text style={[styles.txIconText, { color: iconColor }]}>{isSent ? '↑' : '↓'}</Text>
                </View>

                {/* Middle */}
                <View style={{ flex: 1 }}>
                  <View style={styles.txTopRow}>
                    <Text style={styles.txName}>{(item as any).label || shortenAddress(item.address)}</Text>
                    <Text style={[styles.txAmt, { color: amtColor }]}>
                      {isSent ? '-' : '+'}{item.amount} {item.token}
                    </Text>
                  </View>
                  <View style={styles.txBottomRow}>
                    <Text style={styles.txTime}>{timeAgo(item.timestamp)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.screen, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  countBadge: { backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  countText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.screen, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1 },
  statVal: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },

  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.screen, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.greenDim, borderColor: Colors.greenBorder },
  filterText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', textTransform: 'capitalize' },
  filterTextActive: { color: Colors.green },

  txCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  txIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 22, fontWeight: '900' },
  txTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  txName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  txAmt: { fontSize: 15, fontWeight: '900' },
  txBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTime: { fontSize: 12, color: Colors.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: Colors.textMuted },
});