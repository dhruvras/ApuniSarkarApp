import { useState, useEffect, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import { getTranslation } from '../../translations';
import { API_BASE_URL } from '../utils/api';
import { getItem, setItem, removeItem } from '../utils/storage';

const CASTE_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS'];

export default function DashboardScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState({
    firstName: 'Citizen',
    lastName: 'User',
    mobile: '+91 98765 43210',
    district: 'Dehradun',
    tehsil: 'Dehradun',
  });

  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [applications, setApplications] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);

  // Apply Modal state
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [applyForm, setApplyForm] = useState({
    fatherOrHusbandName: '',
    annualIncome: '',
    casteCategory: 'General',
    purpose: '',
  });
  const [submittingApp, setSubmittingApp] = useState(false);

  // Tracking Modal state
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [activeApp, setActiveApp] = useState(null);
  const [advancingStage, setAdvancingStage] = useState(false);

  // Certificate Modal state
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const t = useCallback((key) => getTranslation(key, language), [language]);

  const SERVICES = [
    {
      id: 'income',
      titleKey: 'incomeCertificate',
      descKey: 'incomeDesc',
      icon: '📄',
      dept: 'Revenue Department (राजस्व विभाग)',
      sla: '15 Days',
      fee: 'Free (₹0)',
    },
    {
      id: 'domicile',
      titleKey: 'domicileCertificate',
      descKey: 'domicileDesc',
      icon: '🏠',
      dept: 'Revenue Department (राजस्व विभाग)',
      sla: '15 Days',
      fee: 'Free (₹0)',
    },
    {
      id: 'caste',
      titleKey: 'casteCertificate',
      descKey: 'casteDesc',
      icon: '📜',
      dept: 'Social Welfare (समाज कल्याण)',
      sla: '21 Days',
      fee: 'Free (₹0)',
    },
    {
      id: 'character',
      titleKey: 'characterCertificate',
      descKey: 'characterDesc',
      icon: '🛡️',
      dept: 'Home / Police (गृह विभाग)',
      sla: '15 Days',
      fee: 'Free (₹0)',
    },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = await getItem('token');
      if (!token) return;

      setLoadingStats(true);
      setLoadingApps(true);

      // Fetch Stats
      try {
        const statsRes = await fetch(`${API_BASE_URL}/api/applications/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.stats) {
            setStats(statsData.stats);
          }
        }
      } catch (err) {
        console.warn('Could not fetch stats:', err);
      } finally {
        setLoadingStats(false);
      }

      // Fetch Applications
      try {
        const appsRes = await fetch(`${API_BASE_URL}/api/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          if (Array.isArray(appsData.applications)) {
            setApplications(appsData.applications);
          }
        }
      } catch (err) {
        console.warn('Could not fetch applications:', err);
      } finally {
        setLoadingApps(false);
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    }
  }, []);

  useEffect(() => {
    async function initDashboard() {
      try {
        const cachedUser = await getItem('user');
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser((prev) => ({ ...prev, ...parsed }));
          } catch {
            // ignore JSON parse error
          }
        }

        const token = await getItem('token');
        if (token) {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser((prev) => ({ ...prev, ...data.user }));
              await setItem('user', JSON.stringify(data.user));
            }
          }
        }
      } catch (err) {
        console.warn('Could not load user profile:', err);
      }

      await fetchDashboardData();
    }

    initDashboard();
  }, [fetchDashboardData]);

  const handleOpenApply = (service) => {
    setSelectedService(service);
    setApplyForm({
      fatherOrHusbandName: '',
      annualIncome: '',
      casteCategory: 'General',
      purpose: '',
    });
    setApplyModalVisible(true);
  };

  const handleSubmitApplication = async () => {
    if (!applyForm.fatherOrHusbandName.trim()) {
      Alert.alert(t('error'), `${t('fatherNameLabel')} ${t('allFieldsRequired').toLowerCase()}`);
      return;
    }
    if (selectedService?.id === 'income' && !applyForm.annualIncome.trim()) {
      Alert.alert(t('error'), `${t('annualIncomeLabel')} ${t('allFieldsRequired').toLowerCase()}`);
      return;
    }

    try {
      setSubmittingApp(true);
      const token = await getItem('token');
      const applicantFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Citizen Applicant';

      const payload = {
        serviceType: selectedService.id,
        applicantName: applicantFullName,
        mobile: user.mobile || '+91 9876543210',
        district: user.district || 'Dehradun',
        tehsil: user.tehsil || 'Dehradun',
        details: {
          fatherOrHusbandName: applyForm.fatherOrHusbandName.trim(),
          annualIncome: applyForm.annualIncome ? applyForm.annualIncome.trim() : undefined,
          casteCategory: selectedService.id === 'caste' ? applyForm.casteCategory : undefined,
          purpose: applyForm.purpose ? applyForm.purpose.trim() : 'Official Verification',
        },
      };

      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.application) {
        setApplyModalVisible(false);
        Alert.alert(
          t('success'),
          `${t('applicationSuccess')} ${data.application.applicationId}`
        );
        await fetchDashboardData();
      } else {
        Alert.alert(t('error'), data.message || 'Could not submit application');
      }
    } catch (err) {
      console.error('Submit application error:', err);
      Alert.alert(t('error'), 'Network error submitting application');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleOpenTracking = (app) => {
    setActiveApp(app);
    setTrackingModalVisible(true);
  };

  const handleAdvanceStage = async () => {
    if (!activeApp) return;
    try {
      setAdvancingStage(true);
      const token = await getItem('token');
      const res = await fetch(
        `${API_BASE_URL}/api/applications/${activeApp.applicationId || activeApp._id}/advance`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok && data.application) {
        setActiveApp(data.application);
        await fetchDashboardData();
        if (data.application.status === 'approved') {
          Alert.alert(t('success'), t('approvedSuccess'));
        }
      } else {
        Alert.alert(t('error'), data.message || 'Could not advance stage');
      }
    } catch (err) {
      console.error('Advance stage error:', err);
      Alert.alert(t('error'), 'Network error advancing stage');
    } finally {
      setAdvancingStage(false);
    }
  };

  const handleOpenCertificate = (app) => {
    setSelectedCert(app);
    setCertificateModalVisible(true);
  };

  const handleLogout = useCallback(async () => {
    try {
      let confirmed = true;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        confirmed = window.confirm(t('logoutConfirm'));
      } else {
        confirmed = await new Promise((resolve) => {
          Alert.alert(t('logout'), t('logoutConfirm'), [
            { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('yes'), onPress: () => resolve(true) },
          ]);
        });
      }

      if (!confirmed) return;

      await removeItem('token');
      await removeItem('user');
      router.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
      try {
        await removeItem('token');
        await removeItem('user');
      } catch {}
      router.replace('/');
    }
  }, [t, router]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const statItems = [
    { label: t('totalApplications'), value: stats.total, color: '#2563EB', bg: '#EFF6FF' },
    { label: t('approved'), value: stats.approved, color: '#059669', bg: '#ECFDF5' },
    { label: t('pending'), value: stats.pending, color: '#D97706', bg: '#FFFBEB' },
    { label: t('rejected'), value: stats.rejected, color: '#DC2626', bg: '#FEF2F2' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <Text style={styles.govBadge}>GOVERNMENT OF UTTARAKHAND</Text>
            </View>
            <Text style={styles.appTitle}>{t('appName')}</Text>
            <Text style={styles.subtitle}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.mobileText}>📱 {user.mobile}</Text>
            {user.district ? (
              <Text style={styles.locationText}>📍 {user.district}{user.tehsil ? `, ${user.tehsil}` : ''}</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
              <Text style={styles.langText}>
                {language === 'en' ? t('languageHindi') : t('languageEnglish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stat Cards Grid */}
        <View style={styles.statsContainer}>
          {statItems.map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: stat.bg, borderColor: stat.color + '33' }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {loadingStats ? '-' : stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Citizen Services Catalog Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t('citizenServices')}</Text>
            <Text style={styles.sectionSubtitle}>{t('servicesSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.servicesGrid}>
          {SERVICES.map((srv) => (
            <View key={srv.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceIcon}>{srv.icon}</Text>
                <View style={styles.serviceMeta}>
                  <Text style={styles.serviceTitle}>{t(srv.titleKey)}</Text>
                  <Text style={styles.serviceDept}>{srv.dept}</Text>
                </View>
              </View>
              <Text style={styles.serviceDesc}>{t(srv.descKey)}</Text>
              <View style={styles.serviceFooter}>
                <View style={styles.slaBadge}>
                  <Text style={styles.slaText}>⏱️ {srv.sla} • {srv.fee}</Text>
                </View>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => handleOpenApply(srv)}
                >
                  <Text style={styles.applyButtonText}>{t('applyNow')} →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* My Applications Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t('myApplications')}</Text>
            <Text style={styles.sectionSubtitle}>{t('applicationStatus')}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchDashboardData}>
            <Text style={styles.refreshText}>🔄 {t('refresh')}</Text>
          </TouchableOpacity>
        </View>

        {loadingApps ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : applications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>{t('noApplicationsYet')}</Text>
          </View>
        ) : (
          <View style={styles.appList}>
            {applications.map((app) => {
              const isApproved = app.status === 'approved';
              const statusColor = isApproved
                ? '#059669'
                : app.status === 'rejected'
                ? '#DC2626'
                : '#D97706';
              const statusBg = isApproved
                ? '#ECFDF5'
                : app.status === 'rejected'
                ? '#FEF2F2'
                : '#FFFBEB';

              return (
                <View key={app._id || app.applicationId} style={styles.appCard}>
                  <View style={styles.appCardTop}>
                    <View>
                      <Text style={styles.appCardId}>{app.applicationId}</Text>
                      <Text style={styles.appCardName}>{app.serviceName}</Text>
                      {app.certificateNumber ? (
                        <Text style={styles.certNoTag}>📜 {app.certificateNumber}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {app.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.appCardMeta}>
                    <Text style={styles.appCardDate}>
                      📅 {new Date(app.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.appCardLocation}>
                      📍 {app.district}, {app.tehsil}
                    </Text>
                  </View>

                  <View style={styles.appCardActions}>
                    <TouchableOpacity
                      style={styles.trackButton}
                      onPress={() => handleOpenTracking(app)}
                    >
                      <Text style={styles.trackButtonText}>🔍 {t('trackStatus')}</Text>
                    </TouchableOpacity>

                    {isApproved && (
                      <TouchableOpacity
                        style={styles.certButton}
                        onPress={() => handleOpenCertificate(app)}
                      >
                        <Text style={styles.certButtonText}>📜 {t('viewCertificate')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Apply Modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{t('applyModalTitle')}</Text>
                  <Text style={styles.modalSubTitle}>
                    {selectedService ? t(selectedService.titleKey) : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setApplyModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Prefilled Applicant Details */}
              <View style={styles.prefillSection}>
                <Text style={styles.prefillLabel}>
                  {t('applicant')}: <Text style={styles.prefillVal}>{user.firstName} {user.lastName}</Text>
                </Text>
                <Text style={styles.prefillLabel}>
                  {t('mobileLabel')}: <Text style={styles.prefillVal}>{user.mobile}</Text>
                </Text>
                <Text style={styles.prefillLabel}>
                  {t('districtLabel')}: <Text style={styles.prefillVal}>{user.district}, {user.tehsil}</Text>
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('fatherNameLabel')} *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('fatherNameLabel')}
                  placeholderTextColor="#9CA3AF"
                  value={applyForm.fatherOrHusbandName}
                  onChangeText={(text) =>
                    setApplyForm((prev) => ({ ...prev, fatherOrHusbandName: text }))
                  }
                />
              </View>

              {selectedService?.id === 'income' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('annualIncomeLabel')} *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 120000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={applyForm.annualIncome}
                    onChangeText={(text) =>
                      setApplyForm((prev) => ({ ...prev, annualIncome: text }))
                    }
                  />
                </View>
              )}

              {selectedService?.id === 'caste' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('casteCategoryLabel')} *</Text>
                  <View style={styles.casteChipRow}>
                    {CASTE_OPTIONS.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.casteChip,
                          applyForm.casteCategory === cat && styles.casteChipActive,
                        ]}
                        onPress={() =>
                          setApplyForm((prev) => ({ ...prev, casteCategory: cat }))
                        }
                      >
                        <Text
                          style={[
                            styles.casteChipText,
                            applyForm.casteCategory === cat && styles.casteChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('purposeLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Higher Education, Govt. Scheme, Employment"
                  placeholderTextColor="#9CA3AF"
                  value={applyForm.purpose}
                  onChangeText={(text) =>
                    setApplyForm((prev) => ({ ...prev, purpose: text }))
                  }
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={() => setApplyModalVisible(false)}
                >
                  <Text style={styles.cancelModalText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitModalButton, submittingApp && styles.disabledButton]}
                  onPress={handleSubmitApplication}
                  disabled={submittingApp}
                >
                  {submittingApp ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitModalText}>{t('submit')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tracking Modal */}
      <Modal
        visible={trackingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{t('trackApplication')}</Text>
                  <Text style={styles.modalSubTitle}>{activeApp?.applicationId}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setTrackingModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {activeApp && (
                <>
                  <View style={styles.trackDetailsBox}>
                    <Text style={styles.trackDetailRow}>
                      <Text style={styles.trackDetailBold}>{t('applicant')}:</Text> {activeApp.applicantName}
                    </Text>
                    <Text style={styles.trackDetailRow}>
                      <Text style={styles.trackDetailBold}>{t('department')}:</Text> {activeApp.serviceName}
                    </Text>
                    <Text style={styles.trackDetailRow}>
                      <Text style={styles.trackDetailBold}>{t('districtLabel')}:</Text> {activeApp.district}, {activeApp.tehsil}
                    </Text>
                    <Text style={styles.trackDetailRow}>
                      <Text style={styles.trackDetailBold}>{t('status')}:</Text>{' '}
                      <Text
                        style={{
                          fontWeight: '800',
                          color: activeApp.status === 'approved' ? '#059669' : '#D97706',
                        }}
                      >
                        {activeApp.status.toUpperCase()}
                      </Text>
                    </Text>
                    {activeApp.certificateNumber ? (
                      <Text style={styles.trackDetailRow}>
                        <Text style={styles.trackDetailBold}>{t('certNo')}:</Text>{' '}
                        <Text style={{ fontWeight: '700', color: '#2563EB' }}>
                          {activeApp.certificateNumber}
                        </Text>
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.timelineTitle}>{t('trackingTimeline')}</Text>

                  <View style={styles.timelineList}>
                    {activeApp.timeline?.map((step, idx) => {
                      const isCompleted = step.status === 'completed';
                      const isCurrent = step.status === 'current';
                      const badgeColor = isCompleted
                        ? '#059669'
                        : isCurrent
                        ? '#2563EB'
                        : '#9CA3AF';

                      return (
                        <View key={idx} style={styles.timelineRow}>
                          <View style={styles.timelineIndicatorCol}>
                            <View
                              style={[
                                styles.timelineDot,
                                { backgroundColor: badgeColor },
                              ]}
                            >
                              <Text style={styles.dotIcon}>
                                {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                              </Text>
                            </View>
                            {idx < activeApp.timeline.length - 1 && (
                              <View
                                style={[
                                  styles.timelineLine,
                                  {
                                    backgroundColor: isCompleted
                                      ? '#059669'
                                      : '#E5E7EB',
                                  },
                                ]}
                              />
                            )}
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineStageTitle}>
                              {step.stage}
                            </Text>
                            {step.remarks ? (
                              <Text style={styles.timelineRemarks}>
                                {step.remarks}
                              </Text>
                            ) : null}
                            {step.updatedAt ? (
                              <Text style={styles.timelineDate}>
                                🕒 {new Date(step.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Officer Simulation Button */}
                  {activeApp.status !== 'approved' ? (
                    <TouchableOpacity
                      style={[styles.advanceButton, advancingStage && styles.disabledButton]}
                      onPress={handleAdvanceStage}
                      disabled={advancingStage}
                    >
                      {advancingStage ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.advanceButtonText}>
                          ⚡ {t('advanceStage')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.viewCertModalButton}
                      onPress={() => {
                        setTrackingModalVisible(false);
                        handleOpenCertificate(activeApp);
                      }}
                    >
                      <Text style={styles.viewCertModalText}>
                        📜 {t('viewCertificate')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity
                style={styles.closeTrackingButton}
                onPress={() => setTrackingModalVisible(false)}
              >
                <Text style={styles.closeTrackingText}>{t('close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Official Certificate Modal */}
      <Modal
        visible={certificateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCertificateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.certInnerBorder}>
                {/* Certificate Header */}
                <View style={styles.certHeader}>
                  <Text style={styles.emblemIcon}>🏛️</Text>
                  <Text style={styles.certGovtTitle}>{t('govtOfUttarakhand')}</Text>
                  <Text style={styles.certSubPortal}>{t('eDistrictPortal')}</Text>
                  <View style={styles.certDividerLine} />
                  <Text style={styles.certMainTitle}>
                    {selectedCert?.serviceName || 'OFFICIAL CERTIFICATE'}
                  </Text>
                  <Text style={styles.certNumberText}>
                    {t('certNo')}: {selectedCert?.certificateNumber || 'UK-CERT-2026-000000'}
                  </Text>
                </View>

                {/* Body Text */}
                <Text style={styles.certPreamble}>{t('certifiedThat')}</Text>

                <View style={styles.certDetailsGrid}>
                  <View style={styles.certRow}>
                    <Text style={styles.certFieldLabel}>{t('applicant')}:</Text>
                    <Text style={styles.certFieldVal}>{selectedCert?.applicantName}</Text>
                  </View>
                  <View style={styles.certRow}>
                    <Text style={styles.certFieldLabel}>{t('fatherNameLabel')}:</Text>
                    <Text style={styles.certFieldVal}>
                      {selectedCert?.details?.fatherOrHusbandName || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.certRow}>
                    <Text style={styles.certFieldLabel}>{t('districtLabel')}:</Text>
                    <Text style={styles.certFieldVal}>
                      {selectedCert?.district}, {selectedCert?.tehsil}
                    </Text>
                  </View>
                  {selectedCert?.details?.annualIncome ? (
                    <View style={styles.certRow}>
                      <Text style={styles.certFieldLabel}>{t('annualIncomeLabel')}:</Text>
                      <Text style={[styles.certFieldVal, { color: '#059669', fontWeight: '800' }]}>
                        ₹{selectedCert.details.annualIncome}
                      </Text>
                    </View>
                  ) : null}
                  {selectedCert?.details?.casteCategory ? (
                    <View style={styles.certRow}>
                      <Text style={styles.certFieldLabel}>{t('casteCategoryLabel')}:</Text>
                      <Text style={styles.certFieldVal}>
                        {selectedCert.details.casteCategory}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.certRow}>
                    <Text style={styles.certFieldLabel}>{t('applicationId')}:</Text>
                    <Text style={styles.certFieldVal}>{selectedCert?.applicationId}</Text>
                  </View>
                  <View style={styles.certRow}>
                    <Text style={styles.certFieldLabel}>{t('issuedOn')}:</Text>
                    <Text style={styles.certFieldVal}>
                      {selectedCert?.issuedAt
                        ? new Date(selectedCert.issuedAt).toLocaleDateString()
                        : new Date().toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Security & Verification Footer */}
                <View style={styles.certSecuritySection}>
                  <View style={styles.qrCodeBox}>
                    <Text style={styles.qrIcon}>📱</Text>
                    <Text style={styles.qrText}>QR VERIFIED</Text>
                    <Text style={styles.qrSubText}>eservices.uk.gov.in</Text>
                  </View>
                  <View style={styles.digitalSignBox}>
                    <Text style={styles.stampIcon}>🛡️ DIGITALLY VERIFIED</Text>
                    <Text style={styles.digitalSignText}>{t('digitalSignature')}</Text>
                    <Text style={styles.digitalSignGovt}>Govt. of Uttarakhand</Text>
                  </View>
                </View>
              </View>

              <View style={styles.certModalActions}>
                <TouchableOpacity
                  style={styles.downloadCertButton}
                  onPress={() => {
                    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.print) {
                      window.print();
                    } else {
                      Alert.alert(t('success'), 'Certificate downloaded to your device!');
                    }
                  }}
                >
                  <Text style={styles.downloadCertText}>🖨️ {t('downloadCertificate')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeCertButton}
                  onPress={() => setCertificateModalVisible(false)}
                >
                  <Text style={styles.closeCertText}>{t('close')}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
      : {}),
  },
  headerLeft: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  govBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#1E40AF',
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
  },
  mobileText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  langToggle: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 28,
  },
  serviceCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  serviceMeta: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  serviceDept: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  slaBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  applyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  appList: {
    gap: 12,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  appCardId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
  appCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  certNoTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appCardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  appCardDate: {
    fontSize: 12,
    color: '#64748B',
  },
  appCardLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  appCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  trackButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  certButton: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  certButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 360,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  prefillSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 4,
  },
  prefillLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  prefillVal: {
    fontWeight: '600',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  casteChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  casteChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  casteChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  casteChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  casteChipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitModalButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitModalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    gap: 6,
  },
  trackDetailRow: {
    fontSize: 13,
    color: '#334155',
  },
  trackDetailBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  timelineList: {
    paddingLeft: 4,
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    marginRight: 14,
    width: 28,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineStageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineRemarks: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  advanceButton: {
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  viewCertModalButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewCertModalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  closeTrackingButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeTrackingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Official Certificate Styling
  certContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    padding: 16,
  },
  certInnerBorder: {
    borderWidth: 3,
    borderColor: '#1E3A8A',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#FFFEFA',
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emblemIcon: {
    fontSize: 34,
    marginBottom: 4,
  },
  certGovtTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 1,
    textAlign: 'center',
  },
  certSubPortal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  certDividerLine: {
    height: 2,
    width: 140,
    backgroundColor: '#D97706',
    marginVertical: 10,
  },
  certMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  certNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 4,
  },
  certPreamble: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  certDetailsGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    gap: 8,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  certFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  certFieldVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  certSecuritySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  qrCodeBox: {
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    minWidth: 110,
  },
  qrIcon: {
    fontSize: 22,
  },
  qrText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  qrSubText: {
    fontSize: 8,
    color: '#64748B',
  },
  digitalSignBox: {
    alignItems: 'flex-end',
  },
  stampIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  digitalSignText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 2,
    textAlign: 'right',
  },
  digitalSignGovt: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  certModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  downloadCertButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadCertText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeCertButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeCertText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
