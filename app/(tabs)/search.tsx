import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../store/useWalletStore';
import { Colors, Spacing, Radius, Fonts } from '../../constants/theme';
import { shortenAddress, isValidSolanaAddress } from '../../utils/solana';

export default function SearchScreen() {
  const router = useRouter();
  const { contacts } = useWalletStore();
  const [query, setQuery] = useState('');

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.address.includes(query)
  );
  const isAddress = isValidSolanaAddress(query);

  const goToSend = (address: string, label?: string) => {
    router.push({ pathname: '/send', params: { address, label: label || '' } });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.sub}>Find contacts or enter a wallet address</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Name or wallet address..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Direct address CTA */}
        {isAddress && (
          <TouchableOpacity onPress={() => goToSend(query)} style={styles.addressCard} activeOpacity={0.85}>
            <View style={styles.addressCardLeft}>
              <View style={styles.addressIcon}><Text style={{ fontSize: 18 }}>◎</Text></View>
              <View>
                <Text style={styles.addressCardLabel}>Send to this address</Text>
                <Text style={styles.addressCardVal}>{shortenAddress(query, 10)}</Text>
              </View>
            </View>
            <View style={styles.sendPill}><Text style={styles.sendPillText}>Send →</Text></View>
          </TouchableOpacity>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.address}
          contentContainerStyle={{ padding: Spacing.screen }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={filtered.length > 0 ? <Text style={styles.sectionLabel}>CONTACTS</Text> : null}
          ListEmptyComponent={
            !isAddress && query.length > 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🤷</Text>
                <Text style={styles.emptyText}>No contacts found</Text>
                <Text style={styles.emptySub}>Paste a wallet address above to send directly</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => goToSend(item.address, item.name)} style={styles.contactRow} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.emoji || item.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactAddr}>{shortenAddress(item.address, 8)}</Text>
              </View>
              <View style={styles.sendBtn}>
                <Text style={styles.sendBtnText}>Send</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, paddingHorizontal: Spacing.screen, paddingTop: 8 },
  sub: { fontSize: 13, color: Colors.textMuted, paddingHorizontal: Spacing.screen, marginTop: 2, marginBottom: 14 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginHorizontal: Spacing.screen, paddingHorizontal: 14, marginBottom: 14 },
  searchIcon: { fontSize: 18 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 14 },
  clearBtn: { padding: 4 },
  clearBtnText: { color: Colors.textMuted, fontSize: 15 },

  addressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.greenDim, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.greenBorder, marginHorizontal: Spacing.screen, padding: 14, marginBottom: 10 },
  addressCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  addressIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.green + '20', borderWidth: 1, borderColor: Colors.greenBorder, alignItems: 'center', justifyContent: 'center' },
  addressCardLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  addressCardVal: { fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  sendPill: { backgroundColor: Colors.green, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  sendPillText: { fontSize: 13, color: '#000', fontWeight: '800' },

  sectionLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: Colors.purpleDim, borderWidth: 1, borderColor: Colors.purpleBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20 },
  contactName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  contactAddr: { fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  sendBtn: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.greenBorder, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  sendBtnText: { fontSize: 13, color: Colors.green, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});