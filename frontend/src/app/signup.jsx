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
} from 'react-native';
import { useRouter, Link } from 'expo-router';

import { getTranslation } from '../../translations';
import { API_BASE_URL } from '../utils/api';
import { setItem } from '../utils/storage';

export default function SignupScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key) => getTranslation(key, language);

  const handleSignup = async () => {
    if (!email || !firstName || !lastName || !mobile || !dob || !district || !tehsil) {
      Alert.alert(t('error'), t('allFieldsRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, mobile, dob, district, tehsil }),
      });

      const data = await response.json();

      if (response.ok) {
        await setItem('token', data.token);
        if (data.user) {
          await setItem('user', JSON.stringify(data.user));
        }
        const passMsg = data.tempPassword
          ? `\n\n${language === 'hi' ? 'आपका पासवर्ड है:' : 'Your password is:'} ${data.tempPassword}`
          : '';
        Alert.alert(
          t('success'),
          (data.message || t('signupSuccess')) + passMsg,
          [{ text: 'OK', onPress: () => router.replace('/dashboard') }]
        );
      } else {
        Alert.alert(t('signupFailed'), data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert(t('error'), error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t('appName')}</Text>
          <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
            <Text style={styles.langText}>
              {language === 'en' ? t('languageHindi') : t('languageEnglish')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{t('createAccount')}</Text>
        <Text style={styles.note}>{t('signupNote')}</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>{t('userIdLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('emailPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('firstNameLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('firstNamePlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={firstName}
                onChangeText={setFirstName}
                autoCorrect={false}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('lastNameLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('lastNamePlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={lastName}
                onChangeText={setLastName}
                autoCorrect={false}
              />
            </View>
          </View>

          <Text style={styles.label}>{t('mobileLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('mobilePlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('dobLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('dobPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={dob}
            onChangeText={setDob}
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('districtLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('districtPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={district}
            onChangeText={setDistrict}
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('tehsilLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('tehsilPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={tehsil}
            onChangeText={setTehsil}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>
              {loading ? t('submitting') : t('submit')}
            </Text>
          </TouchableOpacity>
        </View>

        <Link href="/" asChild>
          <TouchableOpacity style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('alreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  signInButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
