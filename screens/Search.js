import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { reverseGeocodeWithTimeout, getCurrentPositionAsync } from '../utils/geocoding';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import { JobCardSkeleton, StatusBadge, EmptyState } from '../components/UIComponents';

const STATUS_FILTERS = ['all', 'available', 'taken', 'completed'];
const STATUS_ICONS = { all: '🔎', available: '✅', taken: '🤝', completed: '🏆' };

const JobCard = ({ job, onPress }) => (
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
      <Text style={s.payText}>💰 ${job.pay}{job.payFrequency ? `/${job.payFrequency}` : ''}</Text>
      {job.address && <Text style={s.locText} numberOfLines={1}>📍 {job.address}</Text>}
    </View>
  </TouchableOpacity>
);

export default function SearchScreen({ navigation }) {
  const [allJobs, setAllJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userState, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const fetchAll = useCallback(async () => {
    try {
      // Get user location for state filtering
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await getCurrentPositionAsync({});
          const geo = await reverseGeocodeWithTimeout({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (geo[0]?.region) setUserState(geo[0].region);
        }
      } catch (_) {}

      const snap = await getDocs(collection(db, 'jobs'));
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const withAddr = await Promise.all(raw.map(async (job) => {
        try {
          const geo = await reverseGeocodeWithTimeout({ latitude: job.location.lat, longitude: job.location.lng });
          const r = geo[0];
          const addr = r ? (r.name && !/^\d+$/.test(r.name) ? `${r.name}, ${r.city || r.region}` : `${r.city || r.region}`) : `${job.location.lat.toFixed(3)}, ${job.location.lng.toFixed(3)}`;
          return { ...job, address: addr, state: r?.region || 'Unknown' };
        } catch (_) {
          return { ...job, address: `${job.location.lat.toFixed(3)}, ${job.location.lng.toFixed(3)}`, state: 'Unknown' };
        }
      }));
      setAllJobs(withAddr);
    } catch (_) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let result = allJobs;
    if (statusFilter !== 'all') result = result.filter(j => j.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.jobType?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      );
    }
    if (userState) result = result.filter(j => j.state === userState);
    setFiltered(result);
    setPage(1);
  }, [allJobs, query, statusFilter, userState]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
  }, [fetchAll]);

  const paged = filtered.slice(0, page * PER_PAGE);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <LinearGradient colors={Colors.gradientPrimary} style={s.header}>
        <Text style={s.headerTitle}>Search Jobs</Text>
        {userState && <Text style={s.headerSub}>📍 Showing jobs in {userState}</Text>}
      </LinearGradient>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search title, type, description…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ fontSize: 18, color: Colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter chips */}
      <View style={s.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[s.filterChip, statusFilter === f && s.filterChipActive]}
          >
            <Text style={[s.filterChipText, statusFilter === f && s.filterChipTextActive]}>
              {STATUS_ICONS[f]} {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      {!loading && (
        <Text style={s.resultCount}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
      )}

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
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
              icon="🔎"
              title="No results found"
              message={query ? `Nothing matched "${query}". Try different keywords.` : 'No jobs match your filters.'}
              actionLabel="Clear filters"
              onAction={() => { setQuery(''); setStatusFilter('all'); }}
            />
          }
          renderItem={({ item }) => (
            <JobCard job={item} onPress={() => navigation.navigate('JobDetails', { job: item })} />
          )}
          ListFooterComponent={paged.length < filtered.length ? (
            <TouchableOpacity style={s.loadMore} onPress={() => setPage(p => p + 1)}>
              <Text style={s.loadMoreText}>Load more ({filtered.length - paged.length} remaining)</Text>
            </TouchableOpacity>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[6] },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchWrap: { marginTop: -Spacing[4], paddingHorizontal: Spacing[4], marginBottom: Spacing[2] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4], height: 48, ...Shadows.md,
  },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing[4], gap: Spacing[2], marginBottom: Spacing[2] },
  filterChip: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.full,
    paddingHorizontal: Spacing[3], paddingVertical: 7, backgroundColor: Colors.white,
  },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  filterChipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semibold },
  filterChipTextActive: { color: Colors.white },
  resultCount: { fontSize: Typography.sm, color: Colors.textMuted, paddingHorizontal: Spacing[5], marginBottom: Spacing[1] },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], ...Shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginBottom: Spacing[2] },
  cardTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  cardType: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing[3] },
  cardFooter: { gap: 4 },
  payText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.success },
  locText: { fontSize: Typography.xs, color: Colors.textMuted },
  loadMore: { alignItems: 'center', paddingVertical: Spacing[4] },
  loadMoreText: { color: Colors.primary, fontWeight: Typography.semibold, fontSize: Typography.sm },
});
