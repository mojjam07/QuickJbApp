import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import { StarRating, GradientButton, OutlineButton, SkeletonLine } from '../components/UIComponents';

const StatPill = ({ icon, label, value }) => (
  <View style={s.statPill}>
    <Text style={s.statIcon}>{icon}</Text>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const SectionCard = ({ title, children, action, onAction }) => (
  <View style={s.sectionCard}>
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={s.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
    {children}
  </View>
);

const JobRow = ({ job, onPress }) => (
  <TouchableOpacity onPress={onPress} style={s.listRow} activeOpacity={0.8}>
    <View style={{ flex: 1 }}>
      <Text style={s.listRowTitle} numberOfLines={1}>{job.title}</Text>
      <Text style={s.listRowSub}>💰 ${job.pay} • {job.status}</Text>
    </View>
    <Text style={s.listRowArrow}>›</Text>
  </TouchableOpacity>
);

const ChatRow = ({ chat, onPress }) => (
  <TouchableOpacity onPress={onPress} style={s.listRow} activeOpacity={0.8}>
    <View style={s.chatAvatar}>
      <Text style={{ fontSize: 18 }}>💬</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.listRowTitle} numberOfLines={1}>{chat.jobTitle}</Text>
      <Text style={s.listRowSub} numberOfLines={1}>{chat.otherUserEmail} · {chat.lastMessage}</Text>
    </View>
    <Text style={s.listRowArrow}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const [userJobs, setUserJobs] = useState([]);
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const user = auth.currentUser;
  const userName = user?.email?.split('@')[0] || 'User';
  const initials = userName.slice(0, 2).toUpperCase();

  const buildChats = useCallback(async (postedJobs, assignedJobs) => {
    const all = [...postedJobs, ...assignedJobs];
    const chats = [];
    for (const job of all) {
      try {
        const isOwner = job.postedBy === user.uid;
        const otherUserId = isOwner ? job.assignedUser : job.postedBy;
        if (!otherUserId) continue;
        const chatId = [job.id, user.uid, otherUserId].sort().join('_');
        const msgSnap = await getDocs(query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(1)));
        const lastMsg = msgSnap.empty ? 'No messages yet' : msgSnap.docs[0].data().text || '…';
        const lastTime = msgSnap.empty ? null : msgSnap.docs[0].data().timestamp;
        chats.push({ chatId, jobId: job.id, jobTitle: job.title, otherUserId, otherUserEmail: isOwner ? 'Job Taker' : 'Job Poster', lastMessage: lastMsg, lastMessageTime: lastTime });
      } catch (_) {}
    }
    chats.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      const ta = a.lastMessageTime?.toDate?.() || new Date(a.lastMessageTime);
      const tb = b.lastMessageTime?.toDate?.() || new Date(b.lastMessageTime);
      return tb - ta;
    });
    setActiveChats(chats);
  }, [user]);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    setLoading(true);

    const unsubJobs = onSnapshot(query(collection(db, 'jobs'), where('postedBy', '==', user.uid)), snap => {
      setUserJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAll = onSnapshot(collection(db, 'jobs'), snap => {
      const testimonials = [];
      snap.forEach(d => {
        const job = d.data();
        job.testimonials?.forEach(t => {
          if (t.userId === user.uid) testimonials.push({ ...t, jobTitle: job.title });
        });
      });
      setUserTestimonials(testimonials);
    });

    // Build chats from posted + assigned jobs
    const loadChats = async () => {
      try {
        const postedSnap = await getDocs(query(collection(db, 'jobs'), where('postedBy', '==', user.uid)));
        const assignedSnap = await getDocs(query(collection(db, 'jobs'), where('assignedUser', '==', user.uid)));
        const posted = postedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const assigned = assignedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        await buildChats(posted, assigned);
      } catch (_) {}
      setLoading(false);
      setRefreshing(false);
    };
    loadChats();

    return () => { unsubJobs(); unsubAll(); };
  }, [user, buildChats]));

  const handleVerifyEmail = async () => {
    setSendingVerification(true);
    try {
      await sendEmailVerification(user);
      Alert.alert('Email Sent ✅', 'Check your inbox to verify your email.');
    } catch (_) {
      Alert.alert('Error', 'Could not send verification email. Please try again.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => auth.signOut() },
    ]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Trigger re-fetch via useFocusEffect when it runs again
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const completedJobs = userJobs.filter(j => j.status === 'completed').length;
  const activeJobs = userJobs.filter(j => j.status === 'available' || j.status === 'taken').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing[10] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={Colors.gradientPrimary} style={s.header}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={s.userName}>{userName}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.verifiedRow}>
            {user?.emailVerified
              ? <View style={s.verifiedBadge}><Text style={s.verifiedText}>✅ Verified</Text></View>
              : <TouchableOpacity onPress={handleVerifyEmail} style={s.unverifiedBadge} disabled={sendingVerification}>
                  {sendingVerification
                    ? <ActivityIndicator size="small" color={Colors.warning} />
                    : <Text style={s.unverifiedText}>⚠️ Verify Email</Text>}
                </TouchableOpacity>}
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatPill icon="📋" label="Posted" value={userJobs.length} />
          <StatPill icon="✅" label="Completed" value={completedJobs} />
          <StatPill icon="⭐" label="Reviews" value={userTestimonials.length} />
          <StatPill icon="💬" label="Chats" value={activeChats.length} />
        </View>

        {/* Posted Jobs */}
        <SectionCard
          title={`Jobs Posted (${userJobs.length})`}
          action="+ Post Job"
          onAction={() => navigation.navigate('PostJob')}
        >
          {loading ? (
            <>
              <SkeletonLine width="80%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLine width="60%" height={12} />
            </>
          ) : userJobs.length === 0 ? (
            <Text style={s.emptyText}>You haven't posted any jobs yet.</Text>
          ) : (
            userJobs.slice(0, 5).map(job => (
              <JobRow key={job.id} job={job} onPress={() => navigation.navigate('JobDetails', { job })} />
            ))
          )}
          {userJobs.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('JobList')} style={{ marginTop: Spacing[3] }}>
              <Text style={s.sectionAction}>See all {userJobs.length} jobs →</Text>
            </TouchableOpacity>
          )}
        </SectionCard>

        {/* Active Chats */}
        <SectionCard title={`Messages (${activeChats.length})`}>
          {activeChats.length === 0 ? (
            <Text style={s.emptyText}>No active conversations yet.</Text>
          ) : (
            activeChats.slice(0, 5).map(chat => (
              <ChatRow
                key={chat.chatId}
                chat={chat}
                onPress={() => navigation.navigate('Chat', {
                  jobId: chat.jobId, jobTitle: chat.jobTitle,
                  otherUserId: chat.otherUserId, otherUserEmail: chat.otherUserEmail,
                })}
              />
            ))
          )}
        </SectionCard>

        {/* Testimonials */}
        <SectionCard title={`Reviews Given (${userTestimonials.length})`}>
          {userTestimonials.length === 0 ? (
            <Text style={s.emptyText}>You haven't left any reviews yet.</Text>
          ) : (
            userTestimonials.slice(0, 3).map((t, i) => (
              <View key={i} style={s.testimonialRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={s.testimonialJob}>{t.jobTitle}</Text>
                  <StarRating rating={t.rating} size={13} />
                </View>
                <Text style={s.testimonialComment} numberOfLines={2}>{t.comment}</Text>
              </View>
            ))
          )}
        </SectionCard>

        {/* Sign out */}
        <View style={s.signOutWrap}>
          <OutlineButton label="Sign Out" onPress={handleLogout} color={Colors.error} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: Spacing[6], paddingBottom: Spacing[8] },
  avatarWrap: { marginBottom: Spacing[3] },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white },
  userName: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: Colors.white, marginBottom: 2 },
  userEmail: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing[3] },
  verifiedRow: {},
  verifiedBadge: { backgroundColor: Colors.successLight, borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 5 },
  verifiedText: { fontSize: Typography.sm, color: Colors.success, fontWeight: Typography.semibold },
  unverifiedBadge: { backgroundColor: Colors.warningLight, borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 5, minWidth: 110, alignItems: 'center' },
  unverifiedText: { fontSize: Typography.sm, color: Colors.warning, fontWeight: Typography.semibold },
  statsRow: {
    flexDirection: 'row', marginHorizontal: Spacing[4],
    marginTop: -Spacing[5], marginBottom: Spacing[4],
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing[4], ...Shadows.md,
  },
  statPill: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 2 },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  sectionCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, marginHorizontal: Spacing[4], marginBottom: Spacing[4], padding: Spacing[4], ...Shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  sectionAction: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  chatAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[3] },
  listRowTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 2 },
  listRowSub: { fontSize: Typography.xs, color: Colors.textSecondary },
  listRowArrow: { fontSize: 22, color: Colors.gray400, marginLeft: Spacing[2] },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing[4] },
  testimonialRow: { paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  testimonialJob: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  testimonialComment: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  signOutWrap: { marginHorizontal: Spacing[4], marginTop: Spacing[2] },
});
