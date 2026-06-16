import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const MessageBubble = ({ item, isOwn }) => {
  const ts = item.timestamp?.toDate?.() || (item.timestamp ? new Date(item.timestamp) : null);
  const timeStr = ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <View style={[s.bubbleWrap, isOwn ? s.ownWrap : s.otherWrap]}>
      {!isOwn && <Text style={s.senderName}>{item.senderEmail?.split('@')[0]}</Text>}
      <View style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble]}>
        <Text style={[s.bubbleText, isOwn && { color: Colors.white }]}>{item.text}</Text>
        <Text style={[s.bubbleTime, isOwn && { color: 'rgba(255,255,255,0.7)' }]}>{timeStr}</Text>
      </View>
    </View>
  );
};

export default function ChatScreen({ route, navigation }) {
  const { jobId, jobTitle, otherUserId, otherUserEmail } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isJobOwner, setIsJobOwner] = useState(false);
  const [seekerApproved, setSeekerApproved] = useState(false);
  const flatRef = useRef(null);
  const user = auth.currentUser;
  const chatId = [jobId, user.uid, otherUserId].sort().join('_');

  useEffect(() => {
    navigation.setOptions({ title: jobTitle, headerBackTitle: 'Back' });
  }, [jobTitle]);

  // Load job info to determine ownership
  useEffect(() => {
    const loadJob = async () => {
      try {
        const snap = await getDoc(doc(db, 'jobs', jobId));
        if (snap.exists()) {
          const data = snap.data();
          setIsJobOwner(data.postedBy === user.uid);
          setSeekerApproved(data.approvedSeekers?.includes(otherUserId) || false);
        }
      } catch (_) {}
    };
    loadJob();
  }, [jobId]);

  // Listen to messages
  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [chatId]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: trimmed,
        senderId: user.uid,
        senderEmail: user.email,
        timestamp: new Date(),
      });
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (_) {
      Alert.alert('Failed to send message', 'Please check your connection.');
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, chatId, user, sending]);

  const handleApproveSeeker = async () => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const snap = await getDoc(jobRef);
      if (!snap.exists()) { Alert.alert('Job not found'); return; }
      const approved = snap.data().approvedSeekers || [];
      if (approved.includes(otherUserId)) { Alert.alert('Already approved'); return; }
      await updateDoc(jobRef, { approvedSeekers: [...approved, otherUserId] });
      setSeekerApproved(true);
      Alert.alert('Approved! ✅', 'They can now accept the job.');
      // Send a system-like message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: '✅ You have been approved to take this job!',
        senderId: 'system',
        senderEmail: 'Quick-Job',
        timestamp: new Date(),
      });
    } catch (_) {
      Alert.alert('Error', 'Could not approve seeker.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={s.loadingText}>Loading conversation…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Chat header */}
      <LinearGradient colors={Colors.gradientPrimary} style={s.chatHeader}>
        <View style={s.chatAvatar}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </View>
        <View>
          <Text style={s.chatHeaderName}>{otherUserEmail}</Text>
          <Text style={s.chatHeaderJob} numberOfLines={1}>{jobTitle}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={s.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Text style={s.emptyChatIcon}>💬</Text>
              <Text style={s.emptyChatText}>Start the conversation!</Text>
              <Text style={s.emptyChatSub}>Messages are only visible to you and {otherUserEmail}.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble item={item} isOwn={item.senderId === user.uid} />
          )}
        />

        {/* Approve seeker button (job owner only, seeker not yet approved) */}
        {isJobOwner && !seekerApproved && (
          <TouchableOpacity onPress={handleApproveSeeker} style={s.approveBar} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradientSuccess} style={s.approveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.approveText}>✅ Approve this seeker to take the job</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Already approved notice */}
        {isJobOwner && seekerApproved && (
          <View style={s.approvedNotice}>
            <Text style={s.approvedNoticeText}>✅ Seeker approved — they can now accept the job</Text>
          </View>
        )}

        {/* Input row */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
            style={s.sendBtn}
          >
            <LinearGradient
              colors={text.trim() ? Colors.gradientPrimary : [Colors.gray300, Colors.gray300]}
              style={s.sendGrad}
            >
              {sending
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={s.sendIcon}>➤</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  loadingText: { color: Colors.textSecondary },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  chatHeaderName: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  chatHeaderJob: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)', maxWidth: 220 },
  messagesList: { padding: Spacing[4], paddingBottom: Spacing[2] },
  bubbleWrap: { marginBottom: Spacing[3], maxWidth: '80%' },
  ownWrap: { alignSelf: 'flex-end' },
  otherWrap: { alignSelf: 'flex-start' },
  senderName: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: Radius.lg, padding: Spacing[3], ...Shadows.sm },
  ownBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[12] },
  emptyChatIcon: { fontSize: 48, marginBottom: Spacing[3] },
  emptyChatText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  emptyChatSub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },
  approveBar: { marginHorizontal: Spacing[4], marginBottom: Spacing[2], borderRadius: Radius.md, overflow: 'hidden' },
  approveGrad: { padding: Spacing[3], alignItems: 'center' },
  approveText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.sm },
  approvedNotice: { backgroundColor: Colors.successLight, marginHorizontal: Spacing[4], marginBottom: Spacing[2], borderRadius: Radius.md, padding: Spacing[3] },
  approvedNoticeText: { color: Colors.success, fontSize: Typography.sm, fontWeight: Typography.semibold, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: Spacing[3], backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
    gap: Spacing[2],
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
    fontSize: Typography.base, color: Colors.textPrimary,
    backgroundColor: Colors.gray50,
  },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: Colors.white, fontSize: 18 },
});
