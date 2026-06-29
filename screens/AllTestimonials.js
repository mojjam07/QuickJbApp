import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Colors, Typography, Spacing, Radius, Shadows } from '../src/shared/theme';
import { StarRating, EmptyState, SkeletonLine } from '../components/UIComponents';

const AVG_RATING = (items) => {
  if (!items.length) return 0;
  return (items.reduce((s, t) => s + t.rating, 0) / items.length).toFixed(1);
};

const TestimonialCard = ({ item }) => {
  const date = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const BG_COLORS = {
    5: Colors.successLight,
    4: '#EEF2FF',
    3: Colors.infoLight,
    2: Colors.warningLight,
    1: Colors.errorLight,
  };

  return (
    <View style={[s.card, { borderLeftColor: Colors.primary, borderLeftWidth: 3 }]}>
      <View style={s.cardTop}>
        <View style={[s.ratingBadge, { backgroundColor: BG_COLORS[item.rating] || Colors.gray100 }]}>
          <Text style={s.ratingNum}>{item.rating}</Text>
          <Text style={s.ratingStar}>★</Text>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing[3] }}>
          <Text style={s.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
          <StarRating rating={item.rating} size={13} />
        </View>
        {date ? <Text style={s.dateText}>{date}</Text> : null}
      </View>
      <Text style={s.comment}>{item.comment}</Text>
    </View>
  );
};

export default function AllTestimonialsScreen({ navigation }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [filterRating, setFilterRating] = useState(0); // 0 = all
  const PER_PAGE = 10;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'jobs'), (snap) => {
      const all = [];
      snap.forEach((doc) => {
        const job = doc.data();
        if (job.testimonials?.length) {
          job.testimonials.forEach((t) => {
            all.push({ ...t, jobTitle: job.title });
          });
        }
      });
      all.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setTestimonials(all);
      setLoading(false);
      setRefreshing(false);
    }, () => {
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  const filtered = filterRating === 0
    ? testimonials
    : testimonials.filter((t) => t.rating === filterRating);

  const paged = filtered.slice(0, page * PER_PAGE);
  const avg = AVG_RATING(testimonials);

  const onRefresh = () => setRefreshing(true); // snapshot will reset it

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientPrimary} style={s.header}>
        <Text style={s.headerTitle}>All Reviews</Text>
        {!loading && testimonials.length > 0 && (
          <View style={s.headerStats}>
            <Text style={s.avgRating}>{avg} ★</Text>
            <Text style={s.totalCount}>{testimonials.length} review{testimonials.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Rating filter chips */}
      {!loading && testimonials.length > 0 && (
        <View style={s.filterRow}>
          <TouchableOpacity
            onPress={() => { setFilterRating(0); setPage(1); }}
            style={[s.filterChip, filterRating === 0 && s.filterChipActive]}
          >
            <Text style={[s.filterChipText, filterRating === 0 && s.filterChipTextActive]}>
              All ({testimonials.length})
            </Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = testimonials.filter((t) => t.rating === star).length;
            if (count === 0) return null;
            return (
              <TouchableOpacity
                key={star}
                onPress={() => { setFilterRating(star); setPage(1); }}
                style={[s.filterChip, filterRating === star && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, filterRating === star && s.filterChipTextActive]}>
                  {star}★ ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={{ padding: Spacing[4] }}
          renderItem={() => (
            <View style={[s.card, { marginBottom: Spacing[3] }]}>
              <SkeletonLine width="40%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLine width="100%" height={13} style={{ marginBottom: 6 }} />
              <SkeletonLine width="80%" height={13} />
            </View>
          )}
        />
      ) : (
        <FlatList
          data={paged}
          keyExtractor={(item, idx) => `${item.jobTitle}-${idx}`}
          contentContainerStyle={{ padding: Spacing[4], paddingBottom: Spacing[10] }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="⭐"
              title="No reviews yet"
              message={
                filterRating > 0
                  ? `No ${filterRating}-star reviews yet.`
                  : 'Be the first to leave a review after completing a job.'
              }
              actionLabel={filterRating > 0 ? 'Show all reviews' : undefined}
              onAction={() => setFilterRating(0)}
            />
          }
          renderItem={({ item }) => <TestimonialCard item={item} />}
          ListFooterComponent={
            paged.length < filtered.length ? (
              <TouchableOpacity style={s.loadMore} onPress={() => setPage((p) => p + 1)}>
                <Text style={s.loadMoreText}>
                  Load more ({filtered.length - paged.length} remaining)
                </Text>
              </TouchableOpacity>
            ) : filtered.length > 0 ? (
              <Text style={s.endText}>— End of reviews —</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.white,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  avgRating: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: '#FCD34D',
  },
  totalCount: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    padding: Spacing[4],
    paddingTop: Spacing[3],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  filterChipTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    minWidth: 44,
    justifyContent: 'center',
  },
  ratingNum: {
    fontSize: Typography.md,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  ratingStar: {
    fontSize: Typography.sm,
    color: '#F59E0B',
    marginLeft: 2,
  },
  jobTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginLeft: Spacing[2],
  },
  comment: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  loadMore: { alignItems: 'center', paddingVertical: Spacing[5] },
  loadMoreText: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
    fontSize: Typography.sm,
  },
  endText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Typography.xs,
    paddingVertical: Spacing[5],
  },
});
