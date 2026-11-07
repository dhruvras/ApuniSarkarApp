import { useState } from 'react';
import {
  StatusBar,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';

import { getTranslation } from '../../translations';
import { API_BASE_URL } from '../utils/api';
import { setItem } from '../utils/storage';

const ROLES = ['citizen', 'csc', 'edc', 'officer'];

export default function IndexScreen() {
  const [language, setLanguage] = useState('en');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTab, setSelectedTab] = useState('citizen');
  const [loading, setLoading] = useState(false);

  // SSO Modal State
  const [ssoModalVisible, setSsoModalVisible] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('digilocker');
  const [ssoPin, setSsoPin] = useState('123456');
  const [ssoAuthenticating, setSsoAuthenticating] = useState(false);

  const t = (key) => getTranslation(key, language);

  const handleRoleChange = (role) => {
    setSelectedTab(role);
    if (role === 'officer') {
      setUserId('officer.dehradun@uk.gov.in');
    } else if (role === 'csc') {
      setUserId('csc.vle.9812@uk.gov.in');
    } else if (role === 'edc') {
      setUserId('edc.operator@uk.gov.in');
    } else {
      setUserId('');
    }
  };

  const handleLogin = async (bypass = false) => {
    if (bypass) {
      router.replace('/dashboard');
      return;
    }

    if (!userId.trim() || !password) {
      Alert.alert(
        t('error'),
        language === 'hi' ? 'कृपया यूजर आईडी और पासवर्ड दर्ज करें' : 'Please enter both User ID and Password',
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          {
            text: language === 'hi' ? 'डेमो मोड' : 'Demo Bypass',
            onPress: () => router.replace('/dashboard'),
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await setItem('token', data.token);
        if (data.user) {
          await setItem('user', JSON.stringify(data.user));
        }
        router.replace('/dashboard');
      } else {
        Alert.alert(
          t('error'),
          data.message || (language === 'hi' ? 'अमान्य क्रेडेंशियल्स' : 'Invalid credentials')
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(t('error'), error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSSO = (provider) => {
    setSsoProvider(provider);
    setSsoPin('123456');
    setSsoModalVisible(true);
  };

  const handleAuthenticateSSO = async () => {
    try {
      setSsoAuthenticating(true);
      // Simulate verified DigiLocker / Jan Parichay e-KYC response
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isJanParichay = ssoProvider === 'janparichay';
      const ssoUser = {
        firstName: isJanParichay ? 'Vikram' : 'Devendra',
        lastName: isJanParichay ? 'Singh' : 'Rawat',
        email: isJanParichay ? 'vikram.singh@meripehchaan.gov.in' : 'devendra.rawat@digilocker.gov.in',
        mobile: '+91 98765 43210',
        district: 'Dehradun',
        tehsil: 'Rishikesh',
        kycVerified: true,
        kycSource: isJanParichay ? 'Jan Parichay (MeriPehchaan)' : 'DigiLocker',
      };

      await setItem('token', 'mock-sso-jwt-verified-token');
      await setItem('user', JSON.stringify(ssoUser));
      setSsoModalVisible(false);
      router.replace('/dashboard');
    } catch (err) {
      console.error('SSO error:', err);
      Alert.alert(t('error'), 'SSO Authentication failed');
    } finally {
      setSsoAuthenticating(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t('appName')}</Text>
          <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
            <Text style={styles.langText}>{language === 'en' ? t('languageHindi') : t('languageEnglish')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{t('welcomeBack')}</Text>
        <Text style={styles.subtitleSecondary}>
          {selectedTab === 'officer'
            ? (language === 'hi' ? 'अधिकारी पोर्टल (राजस्व / ई-डिस्ट्रिक्ट)' : 'Officer Portal (Revenue / e-District)')
            : t('loginSubtitle')}
        </Text>

        <View style={styles.tabsContainer}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.tab, selectedTab === role && styles.tabActive]}
              onPress={() => handleRoleChange(role)}
            >
              <Text style={[styles.tabText, selectedTab === role && styles.tabTextActive]}>{t(role)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>{t('userIdLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={
              selectedTab === 'officer'
                ? 'officer.dehradun@uk.gov.in'
                : t('userIdLabel')
            }
            placeholderTextColor="#9CA3AF"
            value={userId}
            onChangeText={setUserId}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('passwordLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('passwordLabel')}
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.forgotContainer} onPress={() => Alert.alert(t('forgotPassword'), 'Password reset available via CLI: node reset_password.js')}>
            <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={() => handleLogin(false)}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>{loading ? t('signingIn') : t('signIn')}</Text>
          </TouchableOpacity>

          <View style={styles.ssoContainer}>
            <TouchableOpacity style={styles.ssoButton} onPress={() => handleOpenSSO('digilocker')}>
              <Text style={styles.ssoText}>🔐 {t('digilocker')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ssoButton} onPress={() => handleOpenSSO('janparichay')}>
              <Text style={styles.ssoText}>🆔 {t('janParichay')}</Text>
            </TouchableOpacity>
          </View>

          <Link href="/signup" asChild>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: '#0066cc', fontWeight: 'bold' }}>{t('registerNow')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      {/* DigiLocker & Jan Parichay SSO Modal */}
      <Modal
        visible={ssoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSsoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ssoModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.ssoHeader}>
                <Text style={styles.ssoEmblem}>🇮🇳</Text>
                <Text style={styles.ssoGovtTitle}>{t('ssoTitle')}</Text>
                <Text style={styles.ssoProviderBadge}>
                  {ssoProvider === 'janparichay' ? '🆔 Jan Parichay' : '🔐 DigiLocker Verified'}
                </Text>
              </View>

              <View style={styles.ssoCard}>
                <View style={styles.ssoRow}>
                  <Text style={styles.ssoLabel}>{t('aadhaarLinked')}:</Text>
                  <Text style={styles.ssoValue}>XXXX-XXXX-9021 (UIDAI)</Text>
                </View>
                <View style={styles.ssoRow}>
                  <Text style={styles.ssoLabel}>{t('firstNameLabel')}:</Text>
                  <Text style={styles.ssoValue}>
                    {ssoProvider === 'janparichay' ? 'Vikram Singh' : 'Devendra Rawat'}
                  </Text>
                </View>
                <View style={styles.ssoRow}>
                  <Text style={styles.ssoLabel}>{t('mobileLabel')}:</Text>
                  <Text style={styles.ssoValue}>+91 98765 43210</Text>
                </View>
                <View style={styles.ssoRow}>
                  <Text style={styles.ssoLabel}>{t('districtLabel')}:</Text>
                  <Text style={styles.ssoValue}>Dehradun, Uttarakhand</Text>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.ssoLabel}>{t('securityPin')}:</Text>
                  <TextInput
                    style={styles.ssoPinInput}
                    value={ssoPin}
                    onChangeText={setSsoPin}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.consentBox}>
                <Text style={styles.consentIcon}>🛡️</Text>
                <Text style={styles.consentText}>{t('consentNotice')}</Text>
              </View>

              <View style={styles.ssoActions}>
                <TouchableOpacity
                  style={styles.cancelSsoButton}
                  onPress={() => setSsoModalVisible(false)}
                >
                  <Text style={styles.cancelSsoText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.authSsoButton, ssoAuthenticating && styles.buttonDisabled]}
                  onPress={handleAuthenticateSSO}
                  disabled={ssoAuthenticating}
                >
                  {ssoAuthenticating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.authSsoText}>
                      {ssoProvider === 'janparichay' ? 'Jan Parichay Sign In →' : t('authorizeAndLogin') + ' →'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  appTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  langToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  langText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  subtitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitleSecondary: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  tabsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 8, marginBottom: 24 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, backgroundColor: '#FFFFFF' },
  tabActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#FFFFFF' },
  formContainer: { width: '100%', gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, alignSelf: 'flex-start' },
  input: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#111827' },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  signInButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  ssoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  ssoButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginHorizontal: 4 },
  ssoText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  registerContainer: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  registerText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  // SSO Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  ssoModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: 24,
  },
  ssoHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ssoEmblem: {
    fontSize: 32,
    marginBottom: 4,
  },
  ssoGovtTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  ssoProviderBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  ssoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  ssoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  ssoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  ssoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  ssoPinInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
  },
  consentBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    gap: 8,
    alignItems: 'flex-start',
  },
  consentIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '500',
  },
  ssoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelSsoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelSsoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  authSsoButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 140,
  },
  authSsoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
