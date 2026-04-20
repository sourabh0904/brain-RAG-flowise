import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const FLOWISE_URL =
  'https://flowise-production-7d16.up.railway.app/api/v1/prediction/5315144e-0512-4a19-aeaa-8a94280704a8';

async function queryFlowise(question) {
  const response = await fetch(FLOWISE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Typing bubble ─────────────────────────────── */
function TypingIndicator() {
  return (
    <View style={styles.rowLeft}>
      <View style={styles.receivedBubble}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { opacity: 0.4 }]} />
          <View style={[styles.dot, { opacity: 0.7 }]} />
          <View style={[styles.dot, { opacity: 1 }]} />
        </View>
      </View>
      <View style={styles.tailLeft} />
    </View>
  );
}

/* ── Single message ────────────────────────────── */
function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.rowRight}>
        <View style={styles.sentBubble}>
          <Text style={styles.sentText}>{message.text}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.sentMeta}>{formatTime(message.time)}</Text>
            {/* Telegram-style double check */}
            <Text style={styles.sentMeta}> ✓✓</Text>
          </View>
        </View>
        <View style={styles.tailRight} />
      </View>
    );
  }

  return (
    <View style={styles.rowLeft}>
      <View style={styles.receivedBubble}>
        <Text style={styles.botName}>Brain</Text>
        <Text style={styles.receivedText}>{message.text}</Text>
        <Text style={styles.receivedMeta}>{formatTime(message.time)}</Text>
      </View>
      <View style={styles.tailLeft} />
    </View>
  );
}

/* ── Main screen ───────────────────────────────── */
function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'bot',
      text: "Hi! I'm Brain, your RAG-powered assistant. Ask me anything!",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((p) => [...p, { id: `${Date.now()}`, role: 'user', text: question, time: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const result = await queryFlowise(question);
      const text = result?.text || result?.answer || result?.response || JSON.stringify(result);
      setMessages((p) => [...p, { id: `${Date.now() + 1}`, role: 'bot', text, time: new Date() }]);
    } catch (err) {
      setMessages((p) => [
        ...p,
        { id: `${Date.now() + 1}`, role: 'bot', text: `Error: ${err.message}`, time: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const hasText = input.trim().length > 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={TG.header} />

      {/* ── Header ────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT + 6 }]}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.6}>
          <View style={styles.backChevron} />
        </TouchableOpacity>

        {/* Avatar with online ring */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>B</Text>
          </View>
          <View style={styles.onlineBadge} />
        </View>

        {/* Name + status */}
        <View style={styles.headerMeta}>
          <Text style={styles.headerName}>Brain</Text>
          <Text style={styles.headerStatus}>online</Text>
        </View>

        {/* Search icon */}
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.6}>
          {/* magnifier drawn with Views */}
          <View style={styles.searchCircle} />
          <View style={styles.searchHandle} />
        </TouchableOpacity>

        {/* Three-dot menu */}
        <TouchableOpacity style={[styles.iconBtn, { gap: 3.5 }]} activeOpacity={0.6}>
          <View style={styles.menuDot} />
          <View style={styles.menuDot} />
          <View style={styles.menuDot} />
        </TouchableOpacity>
      </View>

      {/* ── Chat + input ──────────────────────────── */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          style={styles.chatBg}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
          keyboardShouldPersistTaps="handled"
        />

        {/* ── Input bar ─────────────────────────── */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
          <View style={styles.inputPill}>
            {/* Emoji */}
            <TouchableOpacity style={styles.pillIcon} activeOpacity={0.6}>
              <View style={styles.emojiCircle}>
                <View style={styles.emojiSmile} />
              </View>
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Message"
              placeholderTextColor="#A0ADB8"
              multiline
              maxLength={1000}
              returnKeyType="default"
            />

            {/* Attach — only when no text */}
            {!hasText && (
              <TouchableOpacity style={styles.pillIcon} activeOpacity={0.6}>
                <View style={styles.attachLine} />
                <View style={[styles.attachLine, styles.attachLine2]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Send / Mic button */}
          <TouchableOpacity
            style={[styles.sendBtn, hasText ? styles.sendActive : styles.sendIdle]}
            onPress={hasText ? sendMessage : undefined}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : hasText ? (
              /* Paper-plane icon */
              <View style={styles.planeWrap}>
                <View style={styles.planeBody} />
                <View style={styles.planeTail} />
              </View>
            ) : (
              /* Mic bars */
              <View style={styles.micWrap}>
                <View style={styles.micBody} />
                <View style={styles.micStand} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ChatScreen />
    </SafeAreaProvider>
  );
}

/* ── Design tokens ───────────────────────────────────────────── */
const TG = {
  header:      '#2AABEE',
  headerDeep:  '#1D8DC4',
  sent:        '#2AABEE',
  sentText:    '#FFFFFF',
  received:    '#FFFFFF',
  chatBg:      '#F1F1F3',
  inputBg:     '#FFFFFF',
  barBg:       '#F4F4F5',
  accent:      '#2AABEE',
  online:      '#5AC85A',
  textDark:    '#000000',
  textMid:     '#6C7883',
  metaSent:    'rgba(255,255,255,0.75)',
};

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: TG.header },
  flex:    { flex: 1 },

  /* ── Header ─────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TG.header,
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 6,
  },
  backBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  backChevron: {
    width: 10, height: 10,
    borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },

  avatarWrap:   { position: 'relative' },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: TG.headerDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
  onlineBadge: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: TG.online,
    borderWidth: 2, borderColor: TG.header,
  },

  headerMeta: { flex: 1, marginLeft: 6 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },

  iconBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  searchCircle: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#fff',
  },
  searchHandle: {
    position: 'absolute', bottom: 5, right: 5,
    width: 6, height: 2, backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  menuDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

  /* ── Chat background ─────────────────────────────────── */
  chatBg:      { backgroundColor: TG.chatBg },
  messageList: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4, flexGrow: 1 },

  /* ── Sent bubble ─────────────────────────────────────── */
  rowRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 3,
    marginRight: 4,
    maxWidth: '80%',
  },
  sentBubble: {
    backgroundColor: TG.sent,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    elevation: 1,
    shadowColor: '#2AABEE',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  tailRight: {
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: TG.sent,
    borderLeftWidth: 7, borderLeftColor: 'transparent',
    marginBottom: 5,
  },
  sentText: { color: TG.sentText, fontSize: 15, lineHeight: 21 },
  metaRow:  { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 3 },
  sentMeta: { color: TG.metaSent, fontSize: 11 },

  /* ── Received bubble ─────────────────────────────────── */
  rowLeft: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 3,
    marginLeft: 4,
    maxWidth: '80%',
  },
  receivedBubble: {
    backgroundColor: TG.received,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tailLeft: {
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: TG.received,
    borderRightWidth: 7, borderRightColor: 'transparent',
    marginBottom: 5,
    position: 'absolute',
    left: -7, bottom: 5,
  },
  botName:      { color: TG.accent, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  receivedText: { color: TG.textDark, fontSize: 15, lineHeight: 21 },
  receivedMeta: { color: TG.textMid, fontSize: 11, textAlign: 'right', marginTop: 3 },

  /* ── Typing dots ─────────────────────────────────────── */
  dotsRow: { flexDirection: 'row', gap: 5, paddingVertical: 6, paddingHorizontal: 2 },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: TG.textMid },

  /* ── Input bar ───────────────────────────────────────── */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: TG.barBg,
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9D9D9',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: TG.inputBg,
    borderRadius: 24,
    paddingRight: 6,
    minHeight: 44,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  pillIcon: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center' },

  /* emoji icon */
  emojiCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#B0B8C1',
    alignItems: 'center', justifyContent: 'center',
  },
  emojiSmile: {
    width: 10, height: 5,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
    borderWidth: 1.5, borderTopWidth: 0,
    borderColor: '#B0B8C1',
    marginTop: 3,
  },

  /* attach icon */
  attachLine:  { width: 16, height: 2, backgroundColor: '#B0B8C1', borderRadius: 1 },
  attachLine2: { transform: [{ rotate: '90deg' }], position: 'absolute' },

  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: TG.textDark,
  },

  /* send / mic button */
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  sendActive: { backgroundColor: TG.accent },
  sendIdle:   { backgroundColor: TG.accent },

  /* paper-plane */
  planeWrap:  { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  planeBody: {
    width: 0, height: 0,
    borderTopWidth: 9, borderTopColor: 'transparent',
    borderBottomWidth: 9, borderBottomColor: 'transparent',
    borderLeftWidth: 18, borderLeftColor: '#fff',
    marginLeft: 2,
  },
  planeTail: {
    position: 'absolute', bottom: 1, left: 1,
    width: 0, height: 0,
    borderTopWidth: 5, borderTopColor: '#fff',
    borderRightWidth: 8, borderRightColor: 'transparent',
    transform: [{ rotate: '20deg' }],
  },

  /* mic */
  micWrap:  { alignItems: 'center', justifyContent: 'center', height: 22 },
  micBody: {
    width: 8, height: 14, borderRadius: 4,
    borderWidth: 2, borderColor: '#fff',
  },
  micStand: {
    width: 14, height: 7,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2,
    borderColor: '#fff',
    marginTop: 1,
  },
});
