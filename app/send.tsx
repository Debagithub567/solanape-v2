import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { useWalletStore } from '../store/useWalletStore';
import { Colors, Spacing, Radius } from '../constants/theme';
import { shortenAddress, isValidSolanaAddress, formatBalance } from '../utils/solana';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

const APP_IDENTITY = { name: 'Solanape', uri: 'https://solanape.app', icon: 'favicon.ico' };

export default function SendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ address?: string; token?: string; label?: string }>();
  const { contacts, solBalance, skrBalance, publicKey, connected, addTransaction, setSolBalance } = useWalletStore();
  const [token, setToken] = useState<'SOL' | 'SKR'>((params.token as any) || 'SOL');
  const [toAddress, setToAddress] = useState(params.address || '');
  const [toLabel, setToLabel] = useState(params.label || '');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (params.address) setToAddress(params.address);
    if (params.label) setToLabel(params.label);
    if (params.token) setToken(params.token as 'SOL' | 'SKR');
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [params.address, params.label, params.token]);

  const maxBalance = token === 'SOL' ? solBalance : skrBalance;
  const addressValid = isValidSolanaAddress(toAddress);

  const handleSend = async () => {
    if (!connected || !publicKey) { Alert.alert('Connect wallet first'); return; }
    if (!addressValid) { Alert.alert('Invalid address'); return; }
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Enter a valid amount'); return; }
    if (parseFloat(amount) > maxBalance) { Alert.alert('Insufficient balance'); return; }

    setSending(true);
    const txId = Date.now().toString();

    try {
      const connection = new Connection(DEVNET_RPC, 'confirmed');
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(toAddress);
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);

      // Build transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: fromPubkey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
      );

      // Sign and send via MWA (Phantom)
      let signature = '';
      await transact(async (wallet: any) => {
        const auth = await wallet.authorize({ cluster: 'devnet', identity: APP_IDENTITY });
        const [signedTx] = await wallet.signTransactions({ transactions: [tx] });
        signature = await connection.sendRawTransaction(signedTx.serialize());
      });

      // Confirm
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

      // Update balance
      const newBal = await connection.getBalance(fromPubkey);
      setSolBalance(newBal / LAMPORTS_PER_SOL);

      addTransaction({
        id: txId, type: 'sent', token, amount,
        address: toAddress, label: toLabel || undefined,
        timestamp: new Date(), status: 'confirmed', txSignature: signature,
      });

      router.push({ pathname: '/confirm', params: { status: 'confirmed', amount, token, toAddress: toLabel || shortenAddress(toAddress), txSignature: signature } });

    } catch (err: any) {
      console.error('Send error:', err);
      addTransaction({
        id: txId, type: 'sent', token, amount,
        address: toAddress, label: toLabel || undefined,
        timestamp: new Date(), status: 'failed',
      });
      Alert.alert('Transaction Failed', err?.message || 'Could not complete transaction');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Send Payment</Text>
            <View style={{ width: 44 }} />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Token Switcher */}
              <View style={styles.tokenRow}>
                {(['SOL', 'SKR'] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => setToken(t)}
                    style={[styles.tokenTab, token === t && (t === 'SOL' ? styles.tokenTabSol : styles.tokenTabSkr)]}
                    activeOpacity={0.8}>
                    <Text style={[styles.tokenEmoji]}>{t === 'SOL' ? '◎' : '🔮'}</Text>
                    <Text style={[styles.tokenText, token === t && { color: t === 'SOL' ? Colors.green : Colors.skrGold }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.available}>
                Available: <Text style={{ color: token === 'SOL' ? Colors.green : Colors.skrGold, fontWeight: '700' }}>{formatBalance(maxBalance)} {token}</Text>
              </Text>

              {/* Quick Contacts */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll}>
                {contacts.map((c) => (
                  <TouchableOpacity key={c.id} onPress={() => { setToAddress(c.address); setToLabel(c.name); }}
                    style={[styles.contactChip, toAddress === c.address && styles.contactChipActive]} activeOpacity={0.8}>
                    <View style={[styles.contactAvatar, toAddress === c.address && styles.contactAvatarActive]}>
                      <Text style={styles.contactInitial}>{c.name[0]}</Text>
                    </View>
                    <Text style={[styles.contactName, toAddress === c.address && { color: Colors.green }]}>{c.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* To Address */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>TO ADDRESS</Text>
                {toLabel ? (
                  <View style={styles.resolvedRow}>
                    <View style={styles.resolvedLeft}>
                      <View style={styles.resolvedAvatar}><Text style={{ fontSize: 16, color: '#000' }}>{toLabel[0]}</Text></View>
                      <View>
                        <Text style={styles.resolvedName}>{toLabel}</Text>
                        <Text style={styles.resolvedAddr}>{shortenAddress(toAddress, 6)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => { setToAddress(''); setToLabel(''); }} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.inputBox, addressValid && styles.inputBoxValid]}>
                    <TextInput style={styles.input} placeholder="Wallet address or scan QR"
                      placeholderTextColor={Colors.textMuted} value={toAddress}
                      onChangeText={(v) => { setToAddress(v); setToLabel(''); }}
                      autoCapitalize="none" autoCorrect={false} />
                    <TouchableOpacity onPress={() => router.push('/(tabs)/scan')} style={styles.scanBtn}>
                      <Text style={styles.scanBtnText}>▦</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {toAddress.length > 3 && !toLabel && !addressValid && <Text style={styles.fieldError}>⚠ Invalid Solana address</Text>}
                {addressValid && !toLabel && <Text style={styles.fieldOk}>✓ Valid address</Text>}
              </View>

              {/* Amount */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>AMOUNT</Text>
                <View style={[styles.inputBox, amount && parseFloat(amount) > 0 && styles.inputBoxValid]}>
                  <TextInput style={[styles.input, styles.amountInput]} placeholder="0.00"
                    placeholderTextColor={Colors.textMuted} value={amount}
                    onChangeText={setAmount} keyboardType="decimal-pad" />
                  <TouchableOpacity onPress={() => setAmount(String(maxBalance))} style={styles.maxBtn}>
                    <Text style={styles.maxBtnText}>MAX</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Summary */}
              {addressValid && amount && parseFloat(amount) > 0 && (
                <View style={styles.summary}>
                  <Text style={styles.summaryTitle}>Transaction Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>To</Text>
                    <Text style={styles.summaryVal}>{toLabel || shortenAddress(toAddress)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount</Text>
                    <Text style={[styles.summaryVal, { color: Colors.error }]}>{amount} {token}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.summaryLabel}>Network fee</Text>
                    <Text style={styles.summaryVal}>~0.000005 SOL</Text>
                  </View>
                  <View style={styles.onChainBadge}>
                    <Text style={styles.onChainText}>⛓ Real on-chain transaction via Phantom</Text>
                  </View>
                </View>
              )}

              {/* Send Button */}
              <TouchableOpacity onPress={handleSend} disabled={sending || !addressValid || !amount}
                style={[styles.sendBtn, (sending || !addressValid || !amount) && styles.sendBtnDisabled]}
                activeOpacity={0.85}>
                <Text style={[styles.sendBtnText, (sending || !addressValid || !amount) && { color: Colors.textMuted }]}>
                  {sending ? '⏳ Signing in Phantom...' : `Send ${token} →`}
                </Text>
              </TouchableOpacity>

              {sending && (
                <Text style={styles.sendingHint}>Approve the transaction in your Phantom wallet</Text>
              )}

            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
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
  scroll: { padding: Spacing.screen, paddingTop: 8 },
  tokenRow: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  tokenTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: Radius.md },
  tokenTabSol: { backgroundColor: Colors.greenDim, borderWidth: 1, borderColor: Colors.greenBorder },
  tokenTabSkr: { backgroundColor: Colors.skrGoldDim, borderWidth: 1, borderColor: Colors.skrGoldBorder },
  tokenEmoji: { fontSize: 18, color: Colors.textPrimary },
  tokenText: { fontSize: 16, fontWeight: '800', color: Colors.textSecondary },
  available: { fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginBottom: 14 },
  contactsScroll: { marginBottom: 20 },
  contactChip: { alignItems: 'center', marginRight: 16, gap: 6 },
  contactChipActive: {},
  contactAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  contactAvatarActive: { borderColor: Colors.green, backgroundColor: Colors.green },
  contactInitial: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  contactName: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, minHeight: 54 },
  inputBoxValid: { borderColor: Colors.greenBorder },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 14, paddingVertical: 14, fontFamily: 'monospace' },
  amountInput: { fontSize: 24, fontWeight: '700', fontFamily: undefined },
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 5, marginLeft: 4 },
  fieldOk: { fontSize: 12, color: Colors.green, marginTop: 5, marginLeft: 4 },
  resolvedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.greenDim, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.greenBorder, padding: 14 },
  resolvedLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  resolvedAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  resolvedName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  resolvedAddr: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontFamily: 'monospace' },
  clearBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: Colors.textMuted, fontSize: 13 },
  scanBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scanBtnText: { fontSize: 22, color: Colors.purple },
  maxBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.greenDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.greenBorder },
  maxBtnText: { fontSize: 12, color: Colors.green, fontWeight: '800' },
  summary: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontSize: 13, color: Colors.textMuted },
  summaryVal: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  onChainBadge: { marginTop: 10, backgroundColor: Colors.greenDim, borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.greenBorder },
  onChainText: { fontSize: 11, color: Colors.green, fontWeight: '600', textAlign: 'center' },
  sendBtn: { backgroundColor: Colors.green, borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center', marginTop: 4 },
  sendBtnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  sendBtnText: { fontSize: 17, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  sendingHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },
});