import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useWalletStore } from '../store/useWalletStore';
import { Colors, Spacing, Radius } from '../constants/theme';
import { shortenAddress } from '../utils/solana';

export default function ReceiveScreen() {
  const router = useRouter();
  const { publicKey, connected } = useWalletStore();
  const [token, setToken] = useState<'SOL' | 'SKR'>('SOL');
  const [copied, setCopied] = useState(false);

  const displayAddress = publicKey || '';
  const qrValue = displayAddress ? `solana:${displayAddress}` : 'solana:connect-wallet';

  const handleCopy = async () => {
    if (!displayAddress) return;
    await Clipboard.setStringAsync(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!displayAddress) { Alert.alert('Connect wallet first'); return; }
    const { Share } = require('react-native');
    await Share.share({
      message: `My Solanape ${token} wallet address:\n\n${displayAddress}\n\nScan my QR in the Solanape app or send directly to this address on Solana.`,
      title: 'My Solanape Wallet',
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receive</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          {/* Token Toggle */}
          <View style={styles.tokenRow}>
            {(['SOL', 'SKR'] as const).map((t) => (
              <TouchableOpacity key={t} onPress={() => setToken(t)}
                style={[styles.tokenTab, token === t && (t === 'SOL' ? styles.tokenTabSol : styles.tokenTabSkr)]}
                activeOpacity={0.8}>
                <Text style={[styles.tokenText, token === t && { color: t === 'SOL' ? Colors.green : Colors.skrGold }]}>
                  {t === 'SOL' ? '◎ SOL' : '🔮 SKR'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* QR Card — captured for sharing */}
          <View style={styles.qrCardOuter}>
            <View style={[styles.qrCard, { borderColor: token === 'SOL' ? Colors.greenBorder : Colors.skrGoldBorder }]}>
              {connected && displayAddress ? (
                <>
                  <QRCode value={qrValue} size={200} backgroundColor="#ffffff" color="#000000" />
                  <View style={styles.qrFooter}>
                    <Text style={styles.qrFooterLabel}>Solanape · {token === 'SOL' ? 'SOL' : 'SKR'}</Text>
                    <Text style={styles.qrFooterAddr}>{shortenAddress(displayAddress, 8)}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.noWallet}>
                  <Text style={styles.noWalletEmoji}>🔗</Text>
                  <Text style={styles.noWalletText}>Connect wallet to show QR</Text>
                </View>
              )}
            </View>
          </View>

          {/* Address tap-to-copy */}
          {displayAddress ? (
            <TouchableOpacity onPress={handleCopy} style={styles.addressBox} activeOpacity={0.8}>
              <Text style={styles.addressText}>{shortenAddress(displayAddress, 12)}</Text>
              <Text style={[styles.addressHint, copied && { color: Colors.green }]}>
                {copied ? '✓ Copied!' : '📋 tap to copy'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.8}>
              <Text style={styles.copyBtnText}>{copied ? '✓ Copied!' : '📋 Copy Address'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>↑ Share QR</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Share your QR code to receive {token} on Solana</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: 8 },
  tokenRow: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, alignSelf: 'center' },
  tokenTab: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: Radius.md },
  tokenTabSol: { backgroundColor: Colors.greenDim, borderWidth: 1, borderColor: Colors.greenBorder },
  tokenTabSkr: { backgroundColor: Colors.skrGoldDim, borderWidth: 1, borderColor: Colors.skrGoldBorder },
  tokenText: { fontSize: 15, fontWeight: '800', color: Colors.textSecondary },
  qrCardOuter: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  qrCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, borderWidth: 2, alignItems: 'center', gap: 12 },
  qrFooter: { alignItems: 'center', gap: 2 },
  qrFooterLabel: { fontSize: 13, fontWeight: '800', color: '#333' },
  qrFooterAddr: { fontSize: 11, color: '#666', fontFamily: 'monospace' },
  noWallet: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noWalletEmoji: { fontSize: 40 },
  noWalletText: { color: Colors.textMuted, textAlign: 'center', fontSize: 14 },
  addressBox: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 16, alignItems: 'center', width: '100%', gap: 3 },
  addressText: { fontSize: 13, color: Colors.textPrimary, fontFamily: 'monospace', letterSpacing: 0.5 },
  addressHint: { fontSize: 11, color: Colors.textMuted },
  actionsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  copyBtn: { flex: 1, backgroundColor: Colors.green, paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' },
  copyBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  shareBtn: { flex: 1, backgroundColor: Colors.bgCard, paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.purple },
  shareBtnText: { color: Colors.purple, fontWeight: '800', fontSize: 15 },
  hint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});