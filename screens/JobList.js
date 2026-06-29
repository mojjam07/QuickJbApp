import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { reverseGeocodeWithTimeout, getCurrentPositionAsync, openLocationSettings } from '../utils/geocoding';
import { Colors, Typography, Spacing, Radius, Shadows } from '../src/shared/theme';
import { JobCardSkeleton, StatusBadge, EmptyState } from '../components/UIComponents';

const { width } = Dimensions.get('window');

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const JobCard = ({ job, onPress, distance }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={s.card}>
    <View style={s.cardHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle} numberOfLines={1}>{job.title}</Text>
        <Text style={s.cardType}>🏷️ {job.jobType}</Text>
      </View>
      <StatusBadge status={job.status} />
    </View>
    <Text style={s.cardDesc} numberOfLines={2}>{job.description}</Text>
    <View style={s.cardFooter}>
      <View style={s.footerLeft}>
        <Text style={s.payText}>💰 ${job.pay}{job.payFrequency ? `/${job.payFrequency}` : ''}</Text>
        {job.address && <Text style={s.locText} numberOfLines={1}>📍 {job.address}</Text>}
      </View>
      {distance != null && (
        <View style={s.distBadge}>
          <Text style={s.distText}>{distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

export default function JobListScreen({ navigation }) {
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [userState, setUserState] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const PER_PAGE = 8;

  const showToast = (msg) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  const initLocation = useCallback(async () => {
    try {
      const loc = await getCurrentPositionAsync({});
      setLocation(loc.coords);
      try {
        const geo = await reverseGeocodeWithTimeout({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo[0]?.region) setUserState(geo[0].region);
      } catch (_) {}
      setLocationError(null);
    } catch (err) {
      setLocationError(err.userMessage || 'Could not get location');
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'jobs'));
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(j => j.status === 'available');
      const withAddr = await Promise.all(raw.map(async (job) => {
        try {
          const geo = await reverseGeocodeWithTimeout({ latitude: job.location.lat, longitude: job.location.lng });
          const r = geo[0];
          const addr = r ? (r.name && !/^\d+$/.test(r.name) ? `${r.name}, ${r.city || r.region}` : `${r.street || r.city || r.region}`) : `${job.location.lat.toFixed(3)}, ${job.location.lng.toFixed(3)}`;
          return { ...job, address: addr, state: r?.region || 'Unknown' };
        } catch (_) {
          return { ...job, address: `${job.location.lat.toFixed(3)}, ${job.location.lng.toFixed(3)}`, state: 'Unknown' };
        }
      }));
      setAllJobs(withAddr);
    } catch (err) {
      showToast('Failed to load jobs. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    initLocation();
    fetchJobs();
  }, []);

  useEffect(() => {
    let result = allJobs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.jobType?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      );
    }
    if (location && userState) {
      result = result.filter(j => j.state === userState || getDistance(location.latitude, location.longitude, j.location.lat, j.location.lng) <= 50);
    }
    // Sort by distance if location available
    if (location) {
      result = [...result].sort((a, b) =>
        getDistance(location.latitude, location.longitude, a.location.lat, a.location.lng) -
        getDistance(location.latitude, location.longitude, b.location.lat, b.location.lng)
      );
    }
    setFilteredJobs(result);
    setPage(1);
  }, [allJobs, searchQuery, location, userState]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
  }, [fetchJobs]);

  const paged = filteredJobs.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filteredJobs.length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientPrimary} style={s.header}>
        <Text style={s.headerTitle}>Nearby Jobs</Text>
        <Text style={s.headerSub}>
          {location ? `📍 ${filteredJobs.length} jobs found` : '🔍 Searching your area…'}
        </Text>
      </LinearGradient>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by title, type…"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 18, color: Colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {locationError && (
        <TouchableOpacity style={s.errorBanner} onPress={openLocationSettings}>
          <Text style={s.errorBannerText}>⚠️ {locationError} — tap to open Settings</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={i => String(i)}
          renderItem={() => <JobCardSkeleton />}
          contentContainerStyle={{ padding: Spacing[4] }}
        />
      ) : (
        <FlatList
          data={paged}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing[4], paddingBottom: Spacing[10] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="🗺️"
              title="No jobs nearby"
              message={searchQuery ? 'Try a different search term.' : 'No available jobs in your area right now.'}
              actionLabel="Post a Job"
              onAction={() => navigation.navigate('PostJob')}
            />
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => navigation.navigate('JobDetails', { job: item })}
              distance={location ? getDistance(location.latitude, location.longitude, item.location.lat, item.location.lng) : null}
            />
          )}
          ListFooterComponent={hasMore ? (
            <TouchableOpacity style={s.loadMore} onPress={() => setPage(p => p + 1)}>
              <Text style={s.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          ) : null}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('PostJob')} activeOpacity={0.9}>
        <LinearGradient colors={Colors.gradientPrimary} style={s.fabGrad}>
          <Text style={s.fabIcon}>＋</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Toast */}
      {toastMsg && (
        <Animated.View style={[s.toast, { opacity: toastAnim }]}>
          <Text style={s.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[6] },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchWrap: { marginTop: -Spacing[4], paddingHorizontal: Spacing[4], marginBottom: Spacing[3] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4], height: 48, ...Shadows.md,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  errorBanner: { backgroundColor: Colors.warningLight, padding: Spacing[3], marginHorizontal: Spacing[4], borderRadius: Radius.md, marginBottom: Spacing[3] },
  errorBannerText: { fontSize: Typography.sm, color: Colors.warning, textAlign: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], ...Shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginBottom: Spacing[2] },
  cardTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  cardType: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing[3] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerLeft: { flex: 1, gap: 3 },
  payText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.success },
  locText: { fontSize: Typography.xs, color: Colors.textMuted },
  distBadge: { backgroundColor: Colors.primaryLight + '22', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  distText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.semibold },
  loadMore: { alignItems: 'center', paddingVertical: Spacing[4] },
  loadMoreText: { color: Colors.primary, fontWeight: Typography.semibold },
  fab: { position: 'absolute', right: Spacing[5], bottom: Spacing[6], borderRadius: 28, overflow: 'hidden', ...Shadows.lg },
  fabGrad: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 28, color: Colors.white, fontWeight: Typography.bold, lineHeight: 34 },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: Colors.gray800, borderRadius: Radius.lg, paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] },
  toastText: { color: Colors.white, fontSize: Typography.sm },
});
