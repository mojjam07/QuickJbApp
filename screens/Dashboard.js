import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Dimensions, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import { SkeletonLine, StatusBadge, StarRating } from '../components/UIComponents';

const { width } = Dimensions.get('window');

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, gradient }) => (
  <LinearGradient colors={gradient} style={st.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
    <Text style={st.statIcon}>{icon}</Text>
    <Text style={st.statValue}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </LinearGradient>
);

// ─── Menu Tile ────────────────────────────────────────────────────────────────
const MenuTile = ({ icon, label, sublabel, gradient, onPress, badge }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={st.tileWrap}>
    <LinearGradient colors={gradient} style={st.tile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {badge != null && badge > 0 && (
        <View style={st.tileBadge}><Text style={st.tileBadgeText}>{badge}</Text></View>
      )}
      <Text style={st.tileIcon}>{icon}</Text>
      <Text style={st.tileLabel}>{label}</Text>
      {sublabel ? <Text style={st.tileSublabel}>{sublabel}</Text> : null}
    </LinearGradient>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const [latestJob, setLatestJob] = useState(null);
  const [latestTestimonial, setLatestTestimonial] = useState(null);
  const [stats, setStats] = useState({ posted: 0, applied: 0, completed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const user = auth.currentUser;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const allJobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const allTestimonials = [];

      // Compute stats for current user
      let posted = 0, applied = 0, completed = 0;
      allJobs.forEach(job => {
        if (job.postedBy === user?.uid) posted++;
        if (job.status === 'completed' && (job.postedBy === user?.uid || job.assignedUser === user?.uid)) completed++;
        if (job.applicants?.includes(user?.uid)) applied++;
        if (job.testimonials) {
          job.testimonials.forEach(t => allTestimonials.push({ ...t, jobTitle: job.title }));
        }
      });
      setStats({ posted, applied, completed });

      // Latest job
      const sorted = [...allJobs].sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setLatestJob(sorted[0] || null);

      // Latest testimonial
      allTestimonials.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLatestTestimonial(allTestimonials[0] || null);
      setLoading(false);
    }, (err) => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => auth.signOut() },
    ]);
  };

  const userName = user?.email?.split('@')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const menuItems = [
    { icon: '📍', label: 'Nearby Jobs', sublabel: 'Find local work', gradient: Colors.gradientNearby, screen: 'JobList' },
    { icon: '➕', label: 'Post a Job', sublabel: 'Hire someone', gradient: Colors.gradientPost, screen: 'PostJob' },
    { icon: '🔍', label: 'Search', sublabel: 'Browse all jobs', gradient: Colors.gradientSearch, screen: 'Search' },
    { icon: '👤', label: 'Profile', sublabel: 'Your account', gradient: Colors.gradientProfile, screen: 'Profile' },
  ];

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={st.scroll}
      >
        {/* Header */}
        <LinearGradient colors={Colors.gradientPrimary} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Animated.View style={{ opacity: headerAnim }}>
            <View style={st.headerTop}>
              <View>
                <Text style={st.greeting}>{greeting},</Text>
                <Text style={st.userName}>{userName}! 👋</Text>
              </View>
              <View style={st.headerActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AllTestimonials')}
                  style={st.headerBtn}
                >
                  <Text style={{ fontSize: 20 }}>⭐</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={[st.headerBtn, { marginLeft: 8 }]}>
                  <Text style={{ fontSize: 20 }}>🚪</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={st.headerSub}>Connect with workers and employers nearby</Text>
          </Animated.View>
        </LinearGradient>

        {/* Stats row */}
        <View style={st.statsRow}>
          <StatCard label="Posted" value={stats.posted} icon="📋" gradient={['#667EEA', '#764BA2']} />
          <StatCard label="Applied" value={stats.applied} icon="✋" gradient={['#43E97B', '#38F9D7']} />
          <StatCard label="Done" value={stats.completed} icon="✅" gradient={['#FA709A', '#FEE140']} />
        </View>

        {/* Menu grid */}
        <Text style={st.sectionTitle}>What do you need?</Text>
        <View style={st.grid}>
          {menuItems.map((item) => (
            <MenuTile
              key={item.screen}
              icon={item.icon}
              label={item.label}
              sublabel={item.sublabel}
              gradient={item.gradient}
              onPress={() => navigation.navigate(item.screen)}
            />
          ))}
        </View>

        {/* Latest Job */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Latest Job</Text>
            <TouchableOpacity onPress={() => navigation.navigate('JobList')}>
              <Text style={st.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={st.card}>
              <SkeletonLine width="60%" height={18} style={{ marginBottom: 10 }} />
              <SkeletonLine width="100%" height={13} style={{ marginBottom: 6 }} />
              <SkeletonLine width="40%" height={13} />
            </View>
          ) : latestJob ? (
            <TouchableOpacity
              style={st.card}
              onPress={() => navigation.navigate('JobDetails', { job: latestJob })}
              activeOpacity={0.85}
            >
              <View style={st.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardTitle}>{latestJob.title}</Text>
                  <Text style={st.cardDesc} numberOfLines={2}>{latestJob.description}</Text>
                </View>
                <StatusBadge status={latestJob.status} />
              </View>
              <View style={st.cardMeta}>
                <Text style={st.metaChip}>🏷️ {latestJob.jobType}</Text>
                <Text style={st.metaChip}>💰 ${latestJob.pay}/{latestJob.payFrequency || 'day'}</Text>
              </View>
              <Text style={st.cardLink}>View details →</Text>
            </TouchableOpacity>
          ) : (
            <View style={st.emptyCard}>
              <Text style={st.emptyIcon}>💼</Text>
              <Text style={st.emptyText}>No jobs posted yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PostJob')}>
                <Text style={st.emptyAction}>Post the first one →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Latest Testimonial */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Latest Review</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllTestimonials')}>
              <Text style={st.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {latestTestimonial ? (
            <View style={[st.card, st.testimonialCard]}>
              <StarRating rating={latestTestimonial.rating} size={16} />
              <Text style={st.testimonialJob}>for: {latestTestimonial.jobTitle}</Text>
              <Text style={st.testimonialComment} numberOfLines={3}>{latestTestimonial.comment}</Text>
            </View>
          ) : (
            <View style={st.emptyCard}>
              <Text style={st.emptyIcon}>⭐</Text>
              <Text style={st.emptyText}>No reviews yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = (width - Spacing[4] * 2 - Spacing[3]) / 2;
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing[6] },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: Spacing[8] },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[2] },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: Typography.base, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  statsRow: {
    flexDirection: 'row', gap: Spacing[3],
    marginHorizontal: Spacing[4], marginTop: -Spacing[5],
    marginBottom: Spacing[5],
  },
  statCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing[3],
    alignItems: 'center', ...Shadows.md,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: Colors.white },
  statLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.85)', fontWeight: Typography.semibold },
  section: { marginHorizontal: Spacing[4], marginBottom: Spacing[5] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginHorizontal: Spacing[4], marginBottom: Spacing[3] },
  seeAll: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginHorizontal: Spacing[4], marginBottom: Spacing[5] },
  tileWrap: { width: CARD_W },
  tile: { borderRadius: Radius.xl, padding: Spacing[4], minHeight: 120, justifyContent: 'flex-end', ...Shadows.md },
  tileBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: Colors.error, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tileBadgeText: { color: Colors.white, fontSize: 11, fontWeight: Typography.bold },
  tileIcon: { fontSize: 32, marginBottom: Spacing[2] },
  tileLabel: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  tileSublabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], ...Shadows.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginBottom: Spacing[3] },
  cardTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap', marginBottom: Spacing[2] },
  metaChip: { fontSize: Typography.xs, color: Colors.textSecondary, backgroundColor: Colors.gray100, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  cardLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold, marginTop: Spacing[2] },
  emptyCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[6], alignItems: 'center', ...Shadows.sm },
  emptyIcon: { fontSize: 36, marginBottom: Spacing[2] },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing[2] },
  emptyAction: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  testimonialCard: { gap: Spacing[2] },
  testimonialJob: { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic' },
  testimonialComment: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
});
