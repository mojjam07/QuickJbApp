import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { decryptContact } from '../utils/encryption';
import { sendJobNotification, NotificationTypes } from '../utils/notifications';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import { StatusBadge, StarRating, GradientButton, OutlineButton } from '../components/UIComponents';

const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  </View>
);

export default function JobDetailsScreen({ route, navigation }) {
  const { job } = route.params;
  const [currentJob, setCurrentJob] = useState(job);
  const [decryptedContact, setDecryptedContact] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const user = auth.currentUser;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (job?.contact) setDecryptedContact(decryptContact(job.contact));
    if (job?.applicants) setHasApplied(job.applicants.includes(user?.uid));
  }, [job]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'jobs', job.id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setCurrentJob(data);
        if (data.contact) setDecryptedContact(decryptContact(data.contact));
        setHasApplied(data.applicants?.includes(user?.uid) || false);
      }
    });
    return () => unsub();
  }, [job.id]);

  const isOwner = user?.uid === currentJob.postedBy;
  const isAssigned = user?.uid === currentJob.assignedUser;
  const isApproved = currentJob.approvedSeekers?.includes(user?.uid);

  const run = async (fn) => {
    setActionLoading(true);
    try { await fn(); } catch (e) { Alert.alert('Error', e.message); } finally { setActionLoading(false); }
  };

  const handleApply = () => run(async () => {
    if (currentJob.status !== 'available') { Alert.alert('Not Available', 'This job is no longer available.'); return; }
    if (isOwner) { Alert.alert('Cannot Apply', 'You cannot apply to your own job.'); return; }
    const ref = doc(db, 'jobs', currentJob.id);
    await updateDoc(ref, { applicants: arrayUnion(user.uid) });
    sendJobNotification(currentJob.postedBy, NotificationTypes.NEW_APPLICATION, { jobId: currentJob.id, jobTitle: currentJob.title });
    Alert.alert('Applied! ✅', 'Your application has been submitted. The poster will review it.');
  });

  const handleWithdraw = () => {
    Alert.alert('Withdraw Application', 'Are you sure you want to withdraw?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: () => run(async () => {
        await updateDoc(doc(db, 'jobs', currentJob.id), { applicants: arrayRemove(user.uid) });
      })},
    ]);
  };

  const handleApproveApplicant = (applicantId) => run(async () => {
    if (currentJob.approvedSeekers?.includes(applicantId)) { Alert.alert('Already approved'); return; }
    await updateDoc(doc(db, 'jobs', currentJob.id), { approvedSeekers: arrayUnion(applicantId) });
    sendJobNotification(applicantId, NotificationTypes.APPLICATION_APPROVED, { jobId: currentJob.id, jobTitle: currentJob.title });
    Alert.alert('Approved! ✅', 'The applicant can now accept this job.');
  });

  const handleTakeJob = () => run(async () => {
    await updateDoc(doc(db, 'jobs', currentJob.id), { status: 'taken', assignedUser: user.uid });
    sendJobNotification(currentJob.postedBy, NotificationTypes.JOB_TAKEN, { jobId: currentJob.id, jobTitle: currentJob.title });
    Alert.alert('Job Accepted! 🎉', 'You have accepted this job. Good luck!');
  });

  const handleMarkCompleted = () => {
    Alert.alert('Mark as Completed?', 'Confirm you have finished this job.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => run(async () => {
        await updateDoc(doc(db, 'jobs', currentJob.id), { status: 'completed' });
        sendJobNotification(currentJob.postedBy, NotificationTypes.JOB_COMPLETED, { jobId: currentJob.id, jobTitle: currentJob.title });
        Alert.alert('Done! 🎉', 'Job marked as completed.', [
          { text: 'Leave a Review', onPress: () => navigation.navigate('Testimonial', { jobId: currentJob.id }) },
          { text: 'Close', style: 'cancel' },
        ]);
      })},
    ]);
  };

  const handleChat = () => {
    const otherUserId = isOwner ? (currentJob.assignedUser || currentJob.applicants?.[0] || '') : currentJob.postedBy;
    const otherUserEmail = isOwner ? 'Job Seeker' : 'Job Poster';
    if (!otherUserId) { Alert.alert('No one to chat with yet.'); return; }
    navigation.navigate('Chat', { jobId: currentJob.id, jobTitle: currentJob.title, otherUserId, otherUserEmail });
  };

  const showApplicantApproval = () => {
    if (!currentJob.applicants?.length) return;
    const opts = currentJob.applicants.map((id, idx) => ({
      text: `Applicant ${idx + 1} (${id.slice(0, 6)}…)${currentJob.approvedSeekers?.includes(id) ? ' ✅' : ''}`,
      onPress: () => handleApproveApplicant(id),
    }));
    Alert.alert('Select Applicant to Approve', 'Tap an applicant to approve them.', [...opts, { text: 'Cancel', style: 'cancel' }]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={{ paddingBottom: Spacing[12] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={Colors.gradientPrimary} style={s.hero}>
          <Text style={s.heroTitle}>{currentJob.title}</Text>
          <View style={s.heroMeta}>
            <StatusBadge status={currentJob.status} />
            <Text style={s.heroType}>🏷️ {currentJob.jobType}</Text>
          </View>
          <View style={s.payRow}>
            <Text style={s.payText}>${currentJob.pay}</Text>
            {currentJob.payFrequency && <Text style={s.payFreq}>/{currentJob.payFrequency}</Text>}
          </View>
        </LinearGradient>

        {/* Details card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Job Description</Text>
          <Text style={s.description}>{currentJob.description}</Text>

          <View style={s.divider} />

          <Text style={s.sectionTitle}>Details</Text>
          <InfoRow icon="📍" label="Location" value={currentJob.address || `${currentJob.location?.lat?.toFixed(4)}, ${currentJob.location?.lng?.toFixed(4)}`} />
          <InfoRow icon="💰" label="Pay" value={`$${currentJob.pay}${currentJob.payFrequency ? ` per ${currentJob.payFrequency}` : ''}`} />
          <InfoRow icon="🏷️" label="Job Type" value={currentJob.jobType} />
          {decryptedContact && currentJob.status === 'available' && !isOwner && (
            <InfoRow icon="📞" label="Contact" value={decryptedContact} />
          )}
          {currentJob.applicants?.length > 0 && isOwner && (
            <InfoRow icon="✋" label="Applicants" value={`${currentJob.applicants.length} applicant${currentJob.applicants.length !== 1 ? 's' : ''}`} />
          )}
        </View>

        {/* Action section */}
        <View style={s.actionsCard}>
          {/* Applicant seeking available job */}
          {!isOwner && currentJob.status === 'available' && !isApproved && (
            <View style={s.actionGroup}>
              <OutlineButton label="💬 Chat with Poster" onPress={handleChat} style={{ marginBottom: Spacing[3] }} />
              {hasApplied
                ? <GradientButton label="Withdraw Application" onPress={handleWithdraw} gradient={[Colors.error, '#FF6B6B']} />
                : <GradientButton label="Apply for this Job ✋" onPress={handleApply} loading={actionLoading} />}
            </View>
          )}

          {/* Applicant approved – can take job */}
          {!isOwner && currentJob.status === 'available' && isApproved && (
            <View style={s.actionGroup}>
              <View style={s.approvedBanner}>
                <Text style={s.approvedText}>🎉 You've been approved! You can now accept this job.</Text>
              </View>
              <GradientButton label="Accept This Job 🤝" onPress={handleTakeJob} loading={actionLoading} gradient={Colors.gradientSuccess} />
            </View>
          )}

          {/* Job owner managing applicants */}
          {isOwner && currentJob.status === 'available' && (
            <View style={s.actionGroup}>
              {currentJob.applicants?.length > 0 && (
                <GradientButton label={`Review ${currentJob.applicants.length} Applicant(s) 👥`} onPress={showApplicantApproval} loading={actionLoading} />
              )}
              <OutlineButton label="💬 Chat with Applicant" onPress={handleChat} style={{ marginTop: Spacing[3] }} />
            </View>
          )}

          {/* Assigned worker – mark complete */}
          {isAssigned && currentJob.status === 'taken' && (
            <View style={s.actionGroup}>
              <OutlineButton label="💬 Chat with Poster" onPress={handleChat} style={{ marginBottom: Spacing[3] }} />
              <GradientButton label="Mark as Completed ✅" onPress={handleMarkCompleted} loading={actionLoading} gradient={Colors.gradientSuccess} />
            </View>
          )}

          {/* Owner of taken job */}
          {isOwner && currentJob.status === 'taken' && (
            <GradientButton label="💬 Chat with Worker" onPress={handleChat} />
          )}

          {/* Completed state */}
          {currentJob.status === 'completed' && (
            <View style={s.completedBanner}>
              <Text style={s.completedIcon}>🏆</Text>
              <Text style={s.completedText}>This job has been completed</Text>
              {!isOwner && (
                <TouchableOpacity onPress={() => navigation.navigate('Testimonial', { jobId: currentJob.id })} style={{ marginTop: Spacing[3] }}>
                  <Text style={s.reviewLink}>Leave a review →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Testimonials */}
        {currentJob.testimonials?.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Reviews ({currentJob.testimonials.length})</Text>
            {currentJob.testimonials.map((t, i) => (
              <View key={i} style={[s.reviewCard, i < currentJob.testimonials.length - 1 && s.reviewDivider]}>
                <StarRating rating={t.rating} size={14} />
                <Text style={s.reviewComment}>{t.comment}</Text>
                {t.createdAt?.seconds && (
                  <Text style={s.reviewDate}>{new Date(t.createdAt.seconds * 1000).toLocaleDateString()}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {actionLoading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  hero: { padding: Spacing[6], paddingTop: Spacing[8], paddingBottom: Spacing[8] },
  heroTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.white, marginBottom: Spacing[3] },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[4] },
  heroType: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.9)', fontWeight: Typography.medium },
  payRow: { flexDirection: 'row', alignItems: 'baseline' },
  payText: { fontSize: Typography['3xl'], fontWeight: Typography.extrabold, color: Colors.white },
  payFreq: { fontSize: Typography.md, color: 'rgba(255,255,255,0.8)', marginLeft: 4 },
  card: { backgroundColor: Colors.white, margin: Spacing[4], borderRadius: Radius.lg, padding: Spacing[5], ...Shadows.sm },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  description: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 24 },
  divider: { height: 1, backgroundColor: Colors.gray100, marginVertical: Spacing[4] },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing[3] },
  infoIcon: { fontSize: 18, marginRight: Spacing[3], marginTop: 1 },
  infoLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: Typography.base, color: Colors.textPrimary, marginTop: 2, fontWeight: Typography.medium },
  actionsCard: { backgroundColor: Colors.white, margin: Spacing[4], borderRadius: Radius.lg, padding: Spacing[5], ...Shadows.sm },
  actionGroup: {},
  approvedBanner: { backgroundColor: Colors.successLight, borderRadius: Radius.md, padding: Spacing[3], marginBottom: Spacing[4] },
  approvedText: { fontSize: Typography.sm, color: Colors.success, fontWeight: Typography.semibold, textAlign: 'center' },
  completedBanner: { alignItems: 'center', padding: Spacing[4] },
  completedIcon: { fontSize: 48, marginBottom: Spacing[2] },
  completedText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
  reviewLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
  reviewCard: { paddingVertical: Spacing[3] },
  reviewDivider: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  reviewComment: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  reviewDate: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
});
