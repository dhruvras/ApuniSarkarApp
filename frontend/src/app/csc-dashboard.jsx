import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

const SERVICES = [
  { id: 'income', name: 'Income Certificate', fee: 30 },
  { id: 'domicile', name: 'Domicile Certificate', fee: 30 },
  { id: 'caste', name: 'Caste Certificate', fee: 30 },
  { id: 'character', name: 'Character Certificate', fee: 20 },
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'new', label: 'New Application' },
  { id: 'applications', label: 'Applications' },
  { id: 'receipts', label: 'Receipts' },
];

const STATUS_COLORS = {
  Submitted: { bg: '#EFF6FF', text: '#1D4ED8' },
  'Under Review': { bg: '#FEF3C7', text: '#B45309' },
  Approved: { bg: '#DCFCE7', text: '#15803D' },
  Rejected: { bg: '#FEE2E2', text: '#B91C1C' },
};

const INITIAL_APPLICATIONS = [
  {
    id: 'CSC-2026-0001',
    citizen: 'Sunita Devi',
    mobile: '9876500011',
    aadhaar: 'XXXX-XXXX-4821',
    service: 'Income Certificate',
    fee: 30,
    status: 'Under Review',
    date: '05 Nov 2026',
  },
  {
    id: 'CSC-2026-0002',
    citizen: 'Mohan Singh',
    mobile: '9876500022',
    aadhaar: 'XXXX-XXXX-1190',
    service: 'Domicile Certificate',
    fee: 30,
    status: 'Approved',
    date: '03 Nov 2026',
  },
  {
    id: 'CSC-2026-0003',
    citizen: 'Kavita Rawat',
    mobile: '9876500033',
    aadhaar: 'XXXX-XXXX-7734',
    service: 'Caste Certificate',
    fee: 30,
    status: 'Submitted',
    date: '08 Nov 2026',
  },
];

const maskAadhaar = (value) => {
  const digits = value.replace(/\D/g, '');
  return `XXXX-XXXX-${digits.slice(-4)}`;
};

export default function CscDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);

  // New application form
  const [citizenName, setCitizenName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [serviceId, setServiceId] = useState(SERVICES[0].id);

  const stats = {
    total: applications.length,
    pending: applications.filter(
      (a) => a.status === 'Submitted' || a.status === 'Under Review'
    ).length,
    approved: applications.filter((a) => a.status === 'Approved').length,
    fees: applications.reduce((sum, a) => sum + a.fee, 0),
  };

  const handleSubmit = () => {
    const digits = aadhaar.replace(/\D/g, '');

    if (!citizenName.trim()) {
      Alert.alert('Missing details', 'Please enter the citizen name.');
      return;
    }
    if (mobile.replace(/\D/g, '').length !== 10) {
      Alert.alert('Invalid mobile', 'Please enter a 10-digit mobile number.');
      return;
    }
    if (digits.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Please enter a 12-digit Aadhaar number.');
      return;
    }

    const service = SERVICES.find((s) => s.id === serviceId);
    const nextNumber = String(applications.length + 1).padStart(4, '0');

    const newApplication = {
      id: `CSC-2026-${nextNumber}`,
      citizen: citizenName.trim(),
      mobile: mobile.replace(/\D/g, ''),
      aadhaar: maskAadhaar(digits),
      service: service.name,
      fee: service.fee,
      status: 'Submitted',
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    setApplications((prev) => [newApplication, ...prev]);
    setCitizenName('');
    setMobile('');
    setAadhaar('');
    setServiceId(SERVICES[0].id);
    setActiveTab('applications');

    Alert.alert('Application submitted', `Application ID: ${newApplication.id}`);
  };

  const renderStatus = (status) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.Submitted;
    return (
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
      </View>
    );
  };

  const renderOverview = () => (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Applications</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{stats.fees}</Text>
          <Text style={styles.statLabel}>Fees Collected (demo)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setActiveTab('new')}
      >
        <Text style={styles.primaryButtonText}>+ Register New Application</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Applications</Text>
      {applications.slice(0, 3).map((app) => (
        <View key={app.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{app.citizen}</Text>
            {renderStatus(app.status)}
          </View>
          <Text style={styles.cardMeta}>{app.service}</Text>
          <Text style={styles.cardMeta}>
            {app.id} · {app.date}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderNewApplication = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitleInCard}>Citizen Details</Text>

      <Text style={styles.label}>Citizen Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#9CA3AF"
        value={citizenName}
        onChangeText={setCitizenName}
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        placeholder="10-digit mobile number"
        placeholderTextColor="#9CA3AF"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <Text style={styles.label}>Aadhaar Number</Text>
      <TextInput
        style={styles.input}
        placeholder="12-digit Aadhaar number"
        placeholderTextColor="#9CA3AF"
        value={aadhaar}
        onChangeText={setAadhaar}
        keyboardType="number-pad"
        maxLength={12}
        secureTextEntry
      />
      <Text style={styles.hint}>
        Aadhaar is masked on screen and only the last 4 digits are kept.
      </Text>

      <Text style={[styles.sectionTitleInCard, { marginTop: 16 }]}>Service</Text>
      <View style={styles.chipRow}>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.chip, serviceId === service.id && styles.chipActive]}
            onPress={() => setServiceId(service.id)}
          >
            <Text
              style={[
                styles.chipText,
                serviceId === service.id && styles.chipTextActive,
              ]}
            >
              {service.name} · ₹{service.fee}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>Fees shown are demo values.</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
        <Text style={styles.primaryButtonText}>Submit Application</Text>
      </TouchableOpacity>
    </View>
  );

  const renderApplications = () => (
    <View>
      {applications.map((app) => (
        <View key={app.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{app.citizen}</Text>
            {renderStatus(app.status)}
          </View>
          <Text style={styles.cardMeta}>{app.service}</Text>
          <Text style={styles.cardMeta}>Aadhaar: {app.aadhaar}</Text>
          <Text style={styles.cardMeta}>Mobile: {app.mobile}</Text>
          <Text style={styles.cardMeta}>
            {app.id} · {app.date}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderReceipts = () => (
    <View>
      <Text style={styles.hint}>
        Demo receipts only. These are not official government receipts.
      </Text>
      {applications.map((app) => (
        <View key={app.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>RCPT-{app.id.slice(-4)}</Text>
            <Text style={styles.fee}>₹{app.fee}</Text>
          </View>
          <Text style={styles.cardMeta}>{app.citizen}</Text>
          <Text style={styles.cardMeta}>{app.service}</Text>
          <Text style={styles.cardMeta}>{app.date}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CSC Operator</Text>
          <Text style={styles.headerSubtitle}>
            ApuniSarkar · Demo mode
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'new' && renderNewApplication()}
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'receipts' && renderReceipts()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  tabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleInCard: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  fee: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#2563EB',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});