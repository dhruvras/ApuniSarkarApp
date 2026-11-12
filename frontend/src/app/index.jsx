import { useState, useRef, useMemo } from 'react';
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
  Linking,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { getTranslation } from '../../translations';
import { API_BASE_URL } from '../utils/api';
import { setItem } from '../utils/storage';
import { getRoleRoute } from '../utils/roles';

const ROLES = ['citizen', 'csc', 'edc', 'officer'];

// ---------------------------------------------------------------------------
// BRAND ASSETS
// Drop the official files into  assets/images/  and swap each `null` for a
// require(), e.g.  emblem: require('../../assets/images/emblem.png')
// Until then a neutral vector placeholder is drawn (no emojis).
// ---------------------------------------------------------------------------
const LOGOS = {
  emblem: null, // Satyameva Jayate / Ashoka emblem
  state: null, // Uttarakhand Rajya logo
  digitalIndia: null, // Digital India logo
  hero: require('../../assets/images/apuni-sarkar-family.png'), // family + Himalaya hero photo (transparent-left PNG/JPG)
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
const NAV_LINKS = [
  { en: 'About Apuni Sarkar', hi: 'अपनी सरकार के बारे में' },
  { en: 'List of Services', hi: 'सेवाओं की सूची', target: 'services' },
  { en: 'FAQs', hi: 'सामान्य प्रश्न' },
  { en: "What's New", hi: 'नया क्या है' },
  { en: 'Important GOs', hi: 'महत्वपूर्ण शासनादेश' },
  { en: 'Contact Us', hi: 'संपर्क करें', target: 'footer' },
  { en: 'Dashboard', hi: 'डैशबोर्ड' },
];

const QUICK_ACTIONS = [
  {
    icon: 'file-text',
    tint: '#FDE8DC',
    accent: '#E07B3C',
    en: ['Track Application', 'Quickly check the real-time status of your submitted application.'],
    hi: ['आवेदन ट्रैक करें', 'अपने जमा किए गए आवेदन की स्थिति तुरंत देखें।'],
  },
  {
    icon: 'download',
    tint: '#DDF1E4',
    accent: '#2F9E5B',
    en: ['Download Certificates', 'Download your issued certificates directly from the portal.'],
    hi: ['प्रमाणपत्र डाउनलोड करें', 'अपने जारी प्रमाणपत्र सीधे पोर्टल से डाउनलोड करें।'],
  },
  {
    icon: 'shield',
    tint: '#DCE6F7',
    accent: '#3B6FD4',
    en: ['Verify Certificate', 'Verify the authenticity of your certificates issued online.'],
    hi: ['प्रमाणपत्र सत्यापित करें', 'ऑनलाइन जारी प्रमाणपत्रों की प्रामाणिकता जांचें।'],
  },
  {
    icon: 'edit-3',
    tint: '#F6EFC8',
    accent: '#C9A227',
    en: ['Citizen Survey', 'Your feedback is important to us. Participate in our citizen survey.'],
    hi: ['नागरिक सर्वेक्षण', 'आपकी प्रतिक्रिया हमारे लिए महत्वपूर्ण है। सर्वेक्षण में भाग लें।'],
  },
];

const FEATURES = [
  {
    icon: 'pie-chart',
    color: '#1E7A4F',
    en: ['All Services in One Place', 'Access multiple government services through a single platform — no need to visit different offices or websites.'],
    hi: ['सभी सेवाएं एक स्थान पर', 'एक ही प्लेटफ़ॉर्म से कई सरकारी सेवाएं पाएं — अलग-अलग कार्यालयों या वेबसाइटों पर जाने की ज़रूरत नहीं।'],
  },
  {
    icon: 'bar-chart-2',
    color: '#E5533D',
    en: ['Easy Application & Tracking', 'Apply for services online and track your application status in real-time with complete transparency.'],
    hi: ['आसान आवेदन और ट्रैकिंग', 'ऑनलाइन आवेदन करें और पूरी पारदर्शिता के साथ स्थिति रियल-टाइम में देखें।'],
  },
  {
    icon: 'check-circle',
    color: '#4B4FE0',
    en: ['Secure & Verified', 'Your data and documents are protected with secure systems and officially verified processes.'],
    hi: ['सुरक्षित और सत्यापित', 'आपका डेटा और दस्तावेज़ सुरक्षित प्रणालियों और आधिकारिक रूप से सत्यापित प्रक्रियाओं से सुरक्षित हैं।'],
  },
  {
    icon: 'sun',
    color: '#E2B100',
    en: ['Anytime, Anywhere Access', 'Use services anytime from your mobile or desktop — no queues, no travel, no hassle.'],
    hi: ['कभी भी, कहीं भी', 'मोबाइल या डेस्कटॉप से कभी भी सेवाएं लें — न कतार, न यात्रा, न परेशानी।'],
  },
];

const SERVICES = [
  { en: 'Domicile Certificate', hi: 'निवास प्रमाणपत्र', icon: 'home', color: '#D9534F' },
  { en: 'Caste Certificate', hi: 'जाति प्रमाणपत्र', icon: 'users', color: '#5B3FA0' },
  { en: 'Income Certificate', hi: 'आय प्रमाणपत्र', icon: 'credit-card', color: '#D98E04' },
  { en: 'Birth Certificate', hi: 'जन्म प्रमाणपत्र', icon: 'user-plus', color: '#2F9E5B' },
  { en: 'Death Certificate', hi: 'मृत्यु प्रमाणपत्र', icon: 'file-text', color: '#6B7280' },
  { en: 'Character Certificate', hi: 'चरित्र प्रमाणपत्र', icon: 'award', color: '#3B6FD4' },
  { en: 'Family Register (Parivar Register)', hi: 'परिवार रजिस्टर', icon: 'layers', color: '#8A4B2A' },
  { en: 'Land Records (Khatauni)', hi: 'भूमि अभिलेख (खतौनी)', icon: 'map', color: '#1E7A4F' },
];

const PARTNERS = ['india.gov.in', 'UMANG', 'API Setu', 'DigiLocker', 'eGazette', 'IRD Uttarakhand'];
const GALLERY = ['Digital Naavachar Samman Samaroh', 'Good Governance Conclave', 'e-District Awards'];

const FOOTER_LINKS_A = [
  { label: 'Home', icon: 'home' },
  { label: 'About Apuni Sarkar', icon: 'info' },
  { label: 'List of Services', icon: 'list' },
  { label: 'FAQs', icon: 'help-circle' },
  { label: 'Contact Us', icon: 'phone' },
  { label: 'Privacy Policy', icon: 'shield' },
  { label: 'Dashboard', icon: 'grid' },
];
const FOOTER_LINKS_B = [
  'Accessibility Statement (407KB)',
  'Cancellation and Refund Policy (406KB)',
  'Copyright Policy (406KB)',
  'Disclaimer (406KB)',
  'Hyperlink Policy (407KB)',
  'Terms and Conditions (407KB)',
  'Holidays List (95KB)',
  'Contingency Management Plan (112KB)',
];

// Palette sampled from the portal
const C = {
  brown: '#8A4B2A',
  brownDark: '#6E3A1F',
  brownTint: '#F3E4DA',
  heroBg: '#F3E6D6',
  page: '#F5F3EE',
  card: '#FFFFFF',
  ink: '#1F2937',
  muted: '#5B6470',
  line: '#E6E1D8',
  navy: '#0F4A6E',
  navyDark: '#09121F',
  whatsapp: '#25D366',
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
function LogoSlot({ source, width, height, fallback }) {
  if (source) {
    return <Image source={source} style={{ width, height }} resizeMode="contain" />;
  }
  return <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>{fallback}</View>;
}

function Emblem({ size = 40 }) {
  return (
    <LogoSlot
      source={LOGOS.emblem}
      width={size}
      height={size * 1.15}
      fallback={<MaterialCommunityIcons name="bank-outline" size={size * 0.85} color="#4B5563" />}
    />
  );
}

function StateLogo({ size = 44 }) {
  return (
    <LogoSlot
      source={LOGOS.state}
      width={size * 1.2}
      height={size}
      fallback={<MaterialCommunityIcons name="image-filter-hdr" size={size * 0.9} color="#1D3E8A" />}
    />
  );
}

function DigitalIndia({ compact }) {
  if (LOGOS.digitalIndia) {
    return <Image source={LOGOS.digitalIndia} style={{ width: compact ? 78 : 110, height: 36 }} resizeMode="contain" />;
  }
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.digitalIndiaText}>Digital India</Text>
      <Text style={styles.digitalIndiaSub}>Power To Empower</Text>
    </View>
  );
}

export default function IndexScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [language, setLanguage] = useState('en');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTab, setSelectedTab] = useState('citizen');
  const [loading, setLoading] = useState(false);

  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [query, setQuery] = useState('');

  // SSO Modal State
  const [ssoModalVisible, setSsoModalVisible] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('digilocker');
  const [ssoPin, setSsoPin] = useState('123456');
  const [ssoAuthenticating, setSsoAuthenticating] = useState(false);

  const scrollRef = useRef(null);
  const sectionY = useRef({ services: 0, footer: 0 });

  const t = (key) => getTranslation(key, language);
  const tx = (en, hi) => (language === 'hi' ? hi : en);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SERVICES.filter((s) => s.en.toLowerCase().includes(q) || s.hi.includes(query.trim()));
  }, [query]);

  const scrollTo = (key) => {
    setMenuOpen(false);
    scrollRef.current?.scrollTo({ y: Math.max(sectionY.current[key] - 70, 0), animated: true });
  };

  const openLogin = () => {
    setMenuOpen(false);
    setLoginVisible(true);
  };

  // Role Selection
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

  // Login Handler
  const handleLogin = async (bypass = false) => {
    // Temporary frontend development bypass
    if (bypass) {
      await setItem('role', selectedTab);
      setLoginVisible(false);
      router.replace(getRoleRoute(selectedTab));
      return;
    }

    if (!userId.trim() || !password) {
      Alert.alert(
        t('error'),
        language === 'hi'
          ? 'कृपया यूजर आईडी और पासवर्ड दर्ज करें'
          : 'Please enter both User ID and Password'
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
        await setItem('role', selectedTab);

        if (data.user) {
          await setItem('user', JSON.stringify(data.user));
        }

        setLoginVisible(false);
        router.replace(getRoleRoute(selectedTab));
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

  // SSO Handlers
  const handleOpenSSO = (provider) => {
    setSsoProvider(provider);
    setSsoPin('123456');
    // Close the login sheet first so two modals are never stacked
    setLoginVisible(false);
    setTimeout(() => setSsoModalVisible(true), 250);
  };

  const handleCancelSSO = () => {
    setSsoModalVisible(false);
    setTimeout(() => setLoginVisible(true), 250);
  };

  const handleAuthenticateSSO = async () => {
    try {
      setSsoAuthenticating(true);

      // Simulated DigiLocker / Jan Parichay response
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isJanParichay = ssoProvider === 'janparichay';

      const ssoUser = {
        firstName: isJanParichay ? 'Vikram' : 'Devendra',
        lastName: isJanParichay ? 'Singh' : 'Rawat',
        email: isJanParichay
          ? 'vikram.singh@meripehchaan.gov.in'
          : 'devendra.rawat@digilocker.gov.in',
        mobile: '+91 98765 43210',
        district: 'Dehradun',
        tehsil: 'Rishikesh',
        kycVerified: true,
        kycSource: isJanParichay ? 'Jan Parichay (MeriPehchaan)' : 'DigiLocker',
      };

      await setItem('token', 'mock-sso-jwt-verified-token');
      await setItem('role', 'citizen');
      await setItem('user', JSON.stringify(ssoUser));

      setSsoModalVisible(false);
      router.replace(getRoleRoute('citizen'));
    } catch (err) {
      console.error('SSO error:', err);
      Alert.alert(t('error'), 'SSO Authentication failed');
    } finally {
      setSsoAuthenticating(false);
    }
  };

  const cardWidth = isWide ? '23.5%' : '48.5%';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ======================== UTILITY BAR (navy) ======================== */}
      <View style={styles.utilBar}>
        {isWide ? (
          <View style={styles.utilLeft}>
            <Text style={styles.utilLink}>Skip to main content</Text>
            <View style={styles.utilSep} />
            <Text style={styles.utilLink}>Sitemap</Text>
          </View>
        ) : (
          <View />
        )}

        <View style={styles.utilRight}>
          <View style={styles.langGroup}>
            <TouchableOpacity
              onPress={() => setLanguage('en')}
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="English"
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>English</Text>
            </TouchableOpacity>
            <Text style={styles.langDivider}>|</Text>
            <TouchableOpacity
              onPress={() => setLanguage('hi')}
              style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Hindi"
            >
              <Text style={[styles.langBtnText, language === 'hi' && styles.langBtnTextActive]}>हिन्दी</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.a11yGroup}>
            {['A+', 'A=', 'A-'].map((l) => (
              <View key={l} style={styles.a11yBtn}>
                <Text style={styles.a11yText}>{l}</Text>
              </View>
            ))}
            <View style={styles.a11yBtn}>
              <Feather name="sliders" size={15} color={C.navy} />
            </View>
            <View style={styles.a11yBtn}>
              <MaterialCommunityIcons name="human-handsup" size={16} color={C.navy} />
            </View>
          </View>
        </View>
      </View>

      {/* ============================== HEADER ============================== */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Emblem size={isWide ? 44 : 34} />
          <StateLogo size={isWide ? 52 : 38} />
          <View style={{ marginLeft: 2 }}>
            <Text style={styles.brandTitle}>e-Services</Text>
            <Text style={styles.brandSub}>Apuni Sarkar</Text>
          </View>
        </View>

        {isWide && (
          <View style={styles.navInline}>
            {NAV_LINKS.map((item) => (
              <TouchableOpacity key={item.en} onPress={() => (item.target ? scrollTo(item.target) : openLogin())}>
                <Text style={styles.navInlineText}>{tx(item.en, item.hi)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.headerRight}>
          <DigitalIndia compact={!isWide} />
          {!isWide && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Menu"
            >
              <Feather name={menuOpen ? 'x' : 'menu'} size={20} color={C.ink} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {menuOpen && !isWide && (
        <View style={styles.dropdown}>
          {NAV_LINKS.map((item) => (
            <TouchableOpacity
              key={item.en}
              style={styles.dropdownItem}
              onPress={() => (item.target ? scrollTo(item.target) : openLogin())}
            >
              <Text style={styles.dropdownText}>{tx(item.en, item.hi)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* =============================== HERO =============================== */}
        <View style={styles.hero}>
          {LOGOS.hero ? (
            <>
              <Image
                source={LOGOS.hero}
                style={[
                  styles.heroImage,
                  isWide
                    ? styles.heroImageWide
                    : styles.heroImageMobile,
                ]}
                resizeMode="contain"
                blurRadius={1}
              />

              {isWide && (
                <View pointerEvents="none" style={styles.heroImageFade}>
                  {[
                    0.96, 0.88, 0.76, 0.62, 0.47,
                    0.33, 0.21, 0.12, 0.06, 0.02,
                  ].map((opacity, index) => (
                    <View
                      key={index}
                      style={[
                        styles.heroImageFadeBand,
                        {
                          left: `${index * 10}%`,
                          opacity,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.heroGlowA} />
              <View style={styles.heroGlowB} />
            </>
          )}

          <View style={styles.heroPill}>
            <MaterialCommunityIcons name="bank-outline" size={18} color={C.ink} />
            <Text style={styles.heroPillText}>{tx('Government of Uttarakhand', 'उत्तराखण्ड सरकार')}</Text>
          </View>

          <Text
            style={[styles.heroWordmark, { fontSize: isWide ? 96 : Math.min(54, width * 0.135) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {tx('APUNI SARKAR', 'अपनी सरकार')}
          </Text>

          <Text style={styles.heroTagline}>
            {tx('Get every service done from one single portal', 'हर सेवा, एक ही पोर्टल पर')}
          </Text>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Feather name="check-circle" size={18} color={C.brown} />
              <Text style={styles.trustText}>{tx('Secure Access', 'सुरक्षित पहुंच')}</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Feather name="zap" size={18} color={C.brown} />
              <Text style={styles.trustText}>{tx('Fast Processing', 'तेज़ प्रक्रिया')}</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Feather name="headphones" size={18} color={C.brown} />
              <Text style={styles.trustText}>{tx('Help Desk Support', 'हेल्प डेस्क सहायता')}</Text>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, isWide && styles.searchBoxWide]}>
            <TextInput
              style={[styles.searchInput, isWide && { flex: 1 }]}
              placeholder={tx(
                'Search Services (e.g., Caste Certificate, Domicile Certificate...)',
                'सेवाएं खोजें (जैसे जाति प्रमाणपत्र, निवास प्रमाणपत्र...)'
              )}
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchButton, isWide && { paddingHorizontal: 28 }]}
              onPress={() => {
                if (!query.trim()) scrollTo('services');
              }}
            >
              <Feather name="search" size={16} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>{tx('Search Services', 'सेवाएं खोजें')}</Text>
            </TouchableOpacity>
          </View>

          {query.trim().length > 0 && (
            <View style={styles.resultsBox}>
              {results.length === 0 ? (
                <Text style={styles.noResults}>
                  {tx('No services match your search.', 'आपकी खोज से कोई सेवा नहीं मिली।')}
                </Text>
              ) : (
                results.map((s) => (
                  <TouchableOpacity key={s.en} style={styles.resultRow} onPress={openLogin}>
                    <Feather name={s.icon} size={18} color={s.color} style={{ marginRight: 12 }} />
                    <Text style={styles.resultText}>{tx(s.en, s.hi)}</Text>
                    <Feather name="chevron-right" size={18} color={C.brown} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Hero CTAs */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.primaryCta} onPress={openLogin}>
              <Text style={styles.primaryCtaText}>{tx('Login/ Sign Up', 'लॉगिन / साइन अप')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} onPress={() => scrollTo('services')}>
              <Text style={styles.secondaryCtaText}>{tx('Explore Services', 'सेवाएं देखें')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================== QUICK ACTIONS ========================== */}
        <View style={styles.cardGrid}>
          {QUICK_ACTIONS.map((a) => {
            const [title, desc] = language === 'hi' ? a.hi : a.en;
            return (
              <TouchableOpacity
                key={a.en[0]}
                style={[styles.quickCard, { width: cardWidth }]}
                onPress={openLogin}
                activeOpacity={0.85}
              >
                <View style={[styles.quickIcon, { backgroundColor: a.tint }]}>
                  <Feather name={a.icon} size={20} color={a.accent} />
                </View>
                <Text style={styles.quickTitle}>{title}</Text>
                <Text style={styles.quickDesc}>{desc}</Text>
                <View style={[styles.arrowCircle, { borderColor: a.accent }]}>
                  <Feather name="arrow-right" size={14} color={a.accent} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ======================== MOST USED SERVICES ======================== */}
        <View
          style={styles.section}
          onLayout={(e) => (sectionY.current.services = e.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionTitle}>
            {tx('Most Used Services', 'सर्वाधिक उपयोग की जाने वाली सेवाएं')}
          </Text>
          <View style={styles.serviceGrid}>
            {SERVICES.map((s) => (
              <TouchableOpacity
                key={s.en}
                style={[styles.serviceTile, { width: cardWidth }]}
                onPress={openLogin}
                activeOpacity={0.85}
              >
                <Feather name={s.icon} size={26} color={s.color} style={{ marginBottom: 10 }} />
                <Text style={styles.serviceText}>{tx(s.en, s.hi)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ====================== DESIGNED FOR SIMPLER ====================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleBig}>
            {tx('Designed for Simpler Government Services', 'सरल सरकारी सेवाओं के लिए बनाया गया')}
          </Text>
          <View style={[styles.cardGrid, { paddingHorizontal: 0 }]}>
            {FEATURES.map((f) => {
              const [title, desc] = language === 'hi' ? f.hi : f.en;
              return (
                <View key={f.en[0]} style={[styles.featureCard, { width: cardWidth }]}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
                    <Feather name={f.icon} size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.featureTitle}>{title}</Text>
                  <Text style={styles.featureDesc}>{desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ========================== APP DOWNLOAD ========================== */}
        <View style={[styles.appCard, isWide && styles.appCardWide]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appCardTitle}>
              {tx('Download Apuni Sarkar App', 'अपनी सरकार ऐप डाउनलोड करें')}
            </Text>
            <Text style={styles.appCardDesc}>
              {tx(
                'Access government services anytime, anywhere with the Apuni Sarkar mobile app. Easily verify certificates, track application status, download documents, and stay updated with important services, all from your smartphone with a simple, secure, and user-friendly experience.',
                'अपनी सरकार मोबाइल ऐप से कभी भी, कहीं भी सरकारी सेवाएं पाएं। प्रमाणपत्र सत्यापित करें, आवेदन की स्थिति देखें, दस्तावेज़ डाउनलोड करें और महत्वपूर्ण सेवाओं की जानकारी पाएं — सब कुछ आपके स्मार्टफ़ोन से।'
              )}
            </Text>
            <View style={styles.storeRow}>
              <TouchableOpacity style={styles.storeBadge}>
                <Ionicons name="logo-google-playstore" size={22} color="#FFFFFF" />
                <View>
                  <Text style={styles.storeSmall}>GET IT ON</Text>
                  <Text style={styles.storeBig}>Google Play</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeBadge}>
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <View>
                  <Text style={styles.storeSmall}>Download on the</Text>
                  <Text style={styles.storeBig}>App Store</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.phoneMock}>
            <Text style={styles.phoneMockTitle}>e-Services</Text>
            <View style={styles.phoneMockBanner} />
            <View style={styles.phoneMockGrid}>
              {['home', 'users', 'credit-card', 'file-text'].map((i) => (
                <View key={i} style={styles.phoneMockTile}>
                  <Feather name={i} size={14} color={C.brown} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ========================== MEDIA GALLERY ========================== */}
        <View style={styles.section}>
          <Text style={styles.galleryTitle}>{tx('Media Gallery', 'मीडिया गैलरी')}</Text>
          <Text style={styles.gallerySub}>
            {tx('Glimpses of development and cultural heritage.', 'विकास और सांस्कृतिक विरासत की झलकियां।')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {GALLERY.map((g, i) => (
              <View key={g} style={[styles.galleryItem, { backgroundColor: ['#7A3B3B', '#3B3F7A', '#3B6A5A'][i] }]}>
                <Text style={styles.galleryCaption}>{g}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ====================== GOVERNMENT PARTNERS ====================== */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnerRow}>
          {PARTNERS.map((p) => (
            <View key={p} style={styles.partnerChip}>
              <Text style={styles.partnerText}>{p}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.badgeRow}>
          {['GIGW UC', 'W3C CSS', 'WAI-AA WCAG 2.0'].map((b) => (
            <View key={b} style={styles.complianceBadge}>
              <Text style={styles.complianceText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* ============================== FOOTER ============================== */}
        <View
          style={styles.footer}
          onLayout={(e) => (sectionY.current.footer = e.nativeEvent.layout.y)}
        >
          <View style={styles.footerBrand}>
            <View style={styles.footerEmblem}>
              <MaterialCommunityIcons name="bank-outline" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.footerBrandTitle}>e-Services</Text>
              <Text style={styles.footerBrandSub}>Apuni Sarkar</Text>
            </View>
          </View>

          <Text style={styles.footerAddress}>
            Information Technology Development Agency, Plot No IT 07 IT Park, Shastradhara Road,
            Dehradun, Dehradun, Uttarakhand, 248001
          </Text>
          <View style={styles.footerLinkRow}>
            <MaterialCommunityIcons name="human-handsup" size={15} color="#FFFFFF" />
            <Text style={styles.footerLink}>Screen Reader</Text>
          </View>
          <View style={styles.footerDivider} />
          <Text style={styles.footerMeta}>Last Updated At: 14/10/2026</Text>

          <View style={[styles.footerCols, isWide && { flexDirection: 'row' }]}>
            <View style={styles.footerCol}>
              {FOOTER_LINKS_A.map((l) => (
                <View key={l.label} style={styles.footerLinkRow}>
                  <Feather name={l.icon} size={14} color="#FFFFFF" />
                  <Text style={styles.footerLink}>{l.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.footerCol}>
              {FOOTER_LINKS_B.map((l) => (
                <View key={l} style={styles.footerLinkRow}>
                  <Feather name="file-text" size={14} color="#FFFFFF" />
                  <Text style={[styles.footerLink, { flex: 1 }]}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.helpline} onPress={() => Linking.openURL('tel:1905')}>
            <Text style={styles.helplineLabel}>{tx('Toll Free Helpline', 'टोल फ्री हेल्पलाइन')}</Text>
            <Text style={styles.helplineNumber}>1905</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.bottomText}>
            For the best experience, please view the site in 1024 x 768 resolution. It's optimized for
            modern browsers like Chrome (v84+), Safari (v14+), and Firefox (v90+).
          </Text>
          <Text style={styles.bottomText}>
            Contents of this website is published and managed by Information Technology Development
            Agency (ITDA), Department of IT, Good Governance & Science Technology, Government of
            Uttarakhand.
          </Text>
          <Text style={styles.bottomText}>
            Copyright © 2026 - Information Technology Development Agency | All rights reserved
          </Text>
        </View>
      </ScrollView>

      {/* WhatsApp floating button */}
      <TouchableOpacity
        style={styles.whatsapp}
        onPress={() => Linking.openURL('https://wa.me/')}
        accessibilityLabel="WhatsApp support"
      >
        <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ========================== LOGIN / SIGN UP ========================== */}
      <Modal
        visible={loginVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLoginVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.sheet, isWide && styles.sheetWide]}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.sheetTitle}>{t('welcomeBack')}</Text>
                <Text style={styles.sheetSub}>
                  {selectedTab === 'officer'
                    ? tx('Officer Portal (Revenue / e-District)', 'अधिकारी पोर्टल (राजस्व / ई-डिस्ट्रिक्ट)')
                    : t('loginSubtitle')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLoginVisible(false)} style={styles.sheetClose}>
                <Feather name="x" size={16} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Role Selection */}
              <View style={styles.tabsContainer}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.tab, selectedTab === role && styles.tabActive]}
                    onPress={() => handleRoleChange(role)}
                  >
                    <Text style={[styles.tabText, selectedTab === role && styles.tabTextActive]}>
                      {t(role)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('userIdLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={selectedTab === 'officer' ? 'officer.dehradun@uk.gov.in' : t('userIdLabel')}
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

              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={() =>
                  Alert.alert(t('forgotPassword'), 'Password reset available via CLI: node reset_password.js')
                }
              >
                <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signInButton, loading && styles.buttonDisabled]}
                onPress={() => handleLogin(false)}
                disabled={loading}
              >
                <Text style={styles.signInButtonText}>{loading ? t('signingIn') : t('signIn')}</Text>
              </TouchableOpacity>

              {/* Demo Mode */}
              <TouchableOpacity style={styles.demoButton} onPress={() => handleLogin(true)} disabled={loading}>
                <Text style={styles.demoButtonText}>Continue in Demo Mode</Text>
              </TouchableOpacity>
              <Text style={styles.demoNote}>Development access only — authentication is bypassed.</Text>

              {/* SSO */}
              <View style={styles.ssoContainer}>
                <TouchableOpacity style={styles.ssoButton} onPress={() => handleOpenSSO('digilocker')}>
                  <Feather name="lock" size={14} color="#374151" />
                  <Text style={styles.ssoText}>{t('digilocker')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ssoButton} onPress={() => handleOpenSSO('janparichay')}>
                  <Feather name="user-check" size={14} color="#374151" />
                  <Text style={styles.ssoText}>{t('janParichay')}</Text>
                </TouchableOpacity>
              </View>

              {/* Registration */}
              <Link href="/signup" asChild>
                <TouchableOpacity style={styles.registerLink} onPress={() => setLoginVisible(false)}>
                  <Text style={styles.registerText}>{t('registerNow')}</Text>
                </TouchableOpacity>
              </Link>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DigiLocker & Jan Parichay SSO Modal */}
      <Modal
        visible={ssoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelSSO}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ssoModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.ssoHeader}>
                <MaterialCommunityIcons name="bank-outline" size={34} color="#0F172A" style={{ marginBottom: 6 }} />
                <Text style={styles.ssoGovtTitle}>{t('ssoTitle')}</Text>
                <View style={styles.ssoProviderBadge}>
                  <Feather
                    name={ssoProvider === 'janparichay' ? 'user-check' : 'lock'}
                    size={12}
                    color="#2563EB"
                  />
                  <Text style={styles.ssoProviderBadgeText}>
                    {ssoProvider === 'janparichay' ? 'Jan Parichay' : 'DigiLocker Verified'}
                  </Text>
                </View>
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
                <Feather name="shield" size={16} color="#065F46" style={{ marginTop: 1 }} />
                <Text style={styles.consentText}>{t('consentNotice')}</Text>
              </View>

              <View style={styles.ssoActions}>
                <TouchableOpacity style={styles.cancelSsoButton} onPress={handleCancelSSO}>
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
                      {ssoProvider === 'janparichay' ? 'Jan Parichay Sign In' : t('authorizeAndLogin')}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.page },

  // Utility bar
  utilBar: {
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  utilLeft: { flexDirection: 'row', alignItems: 'center' },
  utilLink: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  utilSep: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 12 },
  utilRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' },
  langGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  langBtnActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  langBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  langBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  langDivider: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  a11yGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  a11yBtn: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 4,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  a11yText: { fontSize: 11, fontWeight: '800', color: C.navy },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  brandTitle: { fontSize: 20, fontWeight: '800', color: C.ink, lineHeight: 22 },
  brandSub: { fontSize: 12, color: C.muted, fontWeight: '500' },
  navInline: { flexDirection: 'row', gap: 22, flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  navInlineText: { fontSize: 14, color: C.ink, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  digitalIndiaText: { fontSize: 14, fontWeight: '800', color: '#1D3E8A', fontStyle: 'italic' },
  digitalIndiaSub: { fontSize: 9, color: C.muted },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingVertical: 4,
    zIndex: 10,
  },
  dropdownItem: { paddingHorizontal: 20, paddingVertical: 12 },
  dropdownText: { fontSize: 15, color: C.ink, fontWeight: '500' },

  // Hero
  hero: {
    backgroundColor: C.heroBg,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 28,
    minHeight: 680,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  heroImageWide: {
    right: 0,
    width: '58%',
    opacity: 1,
  },
  heroImageMobile: {
    right: 0,
    width: '85%',
    opacity: 0.22,
  },
  heroImageFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '42%',
    width: '25%',
    overflow: 'hidden',
  },
  heroImageFadeBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '10%',
    backgroundColor: C.heroBg,
  },
  heroGlowA: {
    position: 'absolute',
    right: -60,
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E9C9A6',
    opacity: 0.55,
  },
  heroGlowB: {
    position: 'absolute',
    right: 40,
    bottom: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F8EBDD',
    opacity: 0.8,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: '#E4D3C2',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  heroPillText: { fontSize: 14, color: C.ink, fontWeight: '500' },
  heroWordmark: {
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroTagline: { fontSize: 20, fontWeight: '600', color: C.brown, marginBottom: 16 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 8, marginBottom: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { fontSize: 14, color: C.ink, fontWeight: '500' },
  trustDivider: { width: 1, height: 22, backgroundColor: '#CDB9A4', marginHorizontal: 14 },

  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4C9B5',
    padding: 6,
    gap: 6,
  },
  searchBoxWide: { flexDirection: 'row', alignItems: 'center', maxWidth: 720 },
  searchInput: { paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, color: C.ink },
  searchButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: C.brown,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  resultsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  resultText: { flex: 1, fontSize: 14, color: C.ink },
  noResults: { padding: 14, color: C.muted, fontSize: 13 },

  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  primaryCta: { backgroundColor: C.brown, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 14 },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryCta: {
    backgroundColor: C.brownTint,
    borderWidth: 1.5,
    borderColor: C.brown,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12.5,
  },
  secondaryCtaText: { color: C.brownDark, fontWeight: '700', fontSize: 15 },

  // Cards
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  quickCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    minHeight: 170,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 4 },
  quickDesc: { fontSize: 12.5, color: C.muted, lineHeight: 18, marginBottom: 30 },
  arrowCircle: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: { paddingHorizontal: 12, marginTop: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 12 },
  sectionTitleBig: {
    fontSize: 24,
    fontWeight: '800',
    color: C.ink,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  serviceTile: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  serviceText: { fontSize: 13, fontWeight: '600', color: C.ink, textAlign: 'center' },

  featureCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, minHeight: 190 },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontSize: 14.5, fontWeight: '700', color: C.ink, marginBottom: 6 },
  featureDesc: { fontSize: 12.5, color: C.muted, lineHeight: 18 },

  // App download
  appCard: { backgroundColor: C.card, borderRadius: 16, marginHorizontal: 12, marginTop: 32, padding: 20, gap: 20 },
  appCardWide: { flexDirection: 'row', alignItems: 'center' },
  appCardTitle: { fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 10 },
  appCardDesc: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 16 },
  storeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  storeSmall: { color: '#FFFFFF', fontSize: 9 },
  storeBig: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  phoneMock: {
    alignSelf: 'center',
    width: 150,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  phoneMockTitle: { fontSize: 11, fontWeight: '800', color: C.ink, marginBottom: 6 },
  phoneMockBanner: { height: 44, borderRadius: 8, backgroundColor: '#DCE6F7', marginBottom: 8 },
  phoneMockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phoneMockTile: {
    width: '47%',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gallery
  galleryTitle: { fontSize: 26, fontWeight: '800', color: C.brown, textAlign: 'center' },
  gallerySub: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  galleryRow: { gap: 12, paddingHorizontal: 4 },
  galleryItem: { width: 280, height: 170, borderRadius: 14, justifyContent: 'flex-end', padding: 14 },
  galleryCaption: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Partners
  partnerRow: { gap: 10, paddingHorizontal: 12, paddingVertical: 24 },
  partnerChip: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  partnerText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  badgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 24 },
  complianceBadge: {
    backgroundColor: '#FBF3D3',
    borderWidth: 1,
    borderColor: '#D9C27A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  complianceText: { fontSize: 10, fontWeight: '700', color: '#5B4A12' },

  // Footer
  footer: { backgroundColor: C.navy, padding: 20 },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  footerEmblem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBrandTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  footerBrandSub: { color: '#C9D8E4', fontSize: 12 },
  footerAddress: { color: '#E5EEF5', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  footerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  footerMeta: { color: '#C9D8E4', fontSize: 11, marginBottom: 16 },
  footerCols: { gap: 16 },
  footerCol: { flex: 1, gap: 10 },
  footerLinkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  footerLink: { color: '#FFFFFF', fontSize: 13 },
  helpline: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  helplineLabel: { color: '#E5EEF5', fontSize: 13 },
  helplineNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 2 },
  bottomBar: { backgroundColor: C.navyDark, padding: 16, gap: 8, alignItems: 'center' },
  bottomText: { color: '#E5E7EB', fontSize: 11, lineHeight: 16, textAlign: 'center' },

  whatsapp: {
    position: 'absolute',
    left: 14,
    bottom: 22,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  // Login sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '92%',
  },
  sheetWide: { alignSelf: 'center', width: 480, borderRadius: 22, marginBottom: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  sheetSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  tabActive: { backgroundColor: C.brown, borderColor: C.brown },
  tabText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#FFFFFF' },

  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: C.ink,
    marginBottom: 10,
  },
  forgotContainer: { alignSelf: 'flex-end', marginBottom: 14 },
  forgotText: { fontSize: 13, color: C.brown, fontWeight: '600' },
  signInButton: { backgroundColor: C.brown, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  buttonDisabled: { opacity: 0.6 },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  demoButton: {
    backgroundColor: C.brownTint,
    borderWidth: 1,
    borderColor: '#E4C9B5',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 4,
  },
  demoButtonText: { color: C.brownDark, fontSize: 14, fontWeight: '700' },
  demoNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 14 },
  ssoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  ssoButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  ssoText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  registerLink: { alignItems: 'center', paddingVertical: 12 },
  registerText: { color: C.brown, fontWeight: '700', fontSize: 14 },

  // SSO modal
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
  ssoHeader: { alignItems: 'center', marginBottom: 16 },
  ssoGovtTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  ssoProviderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  ssoProviderBadgeText: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  ssoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  ssoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  ssoLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  ssoValue: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
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
  consentText: { flex: 1, fontSize: 11, color: '#065F46', lineHeight: 16, fontWeight: '500' },
  ssoActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelSsoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelSsoText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  authSsoButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 140,
  },
  authSsoText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});