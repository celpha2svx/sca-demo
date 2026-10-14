// SCA (Sammy Cares Academy) — stakeholder demo. Mock data only, no backend.
// Follows DR00 (onboarding), DR02 (tabs & states), DR03 (tutor), DR04 (plans & payment).

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Animated, Easing,
  TextInput, Modal, Switch, ActivityIndicator, Alert as RNAlert, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Alert.alert does nothing on web, so use the browser's dialogs there.
const Alert = {
  alert: (title, msg, buttons) => {
    if (Platform.OS !== 'web') return RNAlert.alert(title, msg, buttons);
    const text = msg ? `${title}\n\n${msg}` : title;
    if (buttons && buttons.length > 1) {
      const ok = window.confirm(text);
      const act = buttons.find((b) => b.style !== 'cancel');
      if (ok && act && act.onPress) act.onPress();
    } else {
      window.alert(text);
    }
    return undefined;
  },
};

/* ───────────────────────── THEME ───────────────────────── */
const C = {
  primary: '#7C3AED', primaryDark: '#5B21B6', deep: '#2E1065', soft: '#F5F3FF', soft2: '#EDE9FE',
  line: '#E9E5F5', text: '#1E1B2E', muted: '#6B6785', white: '#FFFFFF',
  red: '#DC2626', redSoft: '#FEE2E2', green: '#16A34A', greenSoft: '#DCFCE7',
  amber: '#B45309', amberSoft: '#FEF3C7',
};

/* ───────────────────────── MOCK DATA ───────────────────────── */
const USER = {
  name: 'Tola', fullName: 'Tola Adeyemi', nickname: 'Tee',
  email: 'tola@example.com', dob: '14 / 03 / 2007', id: 'SCA-20481',
};
const SUBJECT_POOL = [
  'Use of English', 'Physics', 'Chemistry', 'Biology', 'Mathematics',
  'Economics', 'Government', 'Literature', 'Commerce', 'Accounting',
];
const MONTH_TITLES = [
  'Month 1 · Foundations', 'Month 2 · Core Concepts', 'Month 3 · Deep Dive',
  'Month 4 · Practice & Past Questions', 'Month 5 · Final Revision',
];
const TOPICS = {
  Physics: [
    ['Measurements & Units', 'Scalars & Vectors', 'Motion in a Straight Line'],
    ['Newton’s Laws', 'Work, Energy & Power', 'Simple Machines'],
    ['Heat & Temperature', 'Waves', 'Light'],
    ['Electricity', 'Magnetism', 'Electronics'],
    ['Atomic Physics', 'Revision: Mechanics', 'Revision: Electricity'],
  ],
  Chemistry: [
    ['Atomic Structure', 'The Periodic Table', 'Chemical Bonding'],
    ['Acids, Bases & Salts', 'Stoichiometry', 'Gas Laws'],
    ['Energy Changes', 'Rates of Reaction', 'Equilibrium'],
    ['Electrochemistry', 'Organic Chemistry I', 'Organic Chemistry II'],
    ['Metals & Non-metals', 'Revision: Physical', 'Revision: Organic'],
  ],
  Biology: [
    ['Cell Structure', 'Cell Division', 'Living Organisms'],
    ['Nutrition', 'Respiration', 'Transport Systems'],
    ['Excretion', 'Reproduction', 'Coordination'],
    ['Genetics', 'Evolution', 'Ecology'],
    ['Conservation', 'Revision: Cells', 'Revision: Systems'],
  ],
  'Use of English': [
    ['Lexis & Structure', 'Comprehension', 'Summary Writing'],
    ['Oral English: Vowels', 'Oral English: Stress', 'Sentence Types'],
    ['Idioms & Phrasal Verbs', 'Figures of Speech', 'Antonyms & Synonyms'],
    ['Essay Writing', 'Letter Writing', 'Past Question Drills'],
    ['Prescribed Novel', 'Revision: Lexis', 'Revision: Oral English'],
  ],
};
const getMonths = (course) => {
  const base = TOPICS[course] || [1, 2, 3, 4, 5].map((m) => [1, 2, 3].map((t) => `${course} · Topic ${m}.${t}`));
  return base.map((arr) => arr.map((t) => ({ title: t, novel: t === 'Prescribed Novel' })));
};
const QBANK = [
  { q: 'What is the SI unit of force?', o: ['Joule', 'Newton', 'Watt', 'Pascal'], a: 1, e: 'Force is measured in Newtons (N).' },
  { q: 'The acceleration due to gravity is approximately…', o: ['9.8 m/s²', '10.8 m/s²', '8.9 m/s²', '11.2 m/s²'], a: 0, e: 'Standard gravity is about 9.8 m/s².' },
  { q: 'Which of these is a vector quantity?', o: ['Speed', 'Mass', 'Velocity', 'Time'], a: 2, e: 'Velocity has both magnitude and direction.' },
];
const QUOTES = [
  'Small steps every day become big results.',
  'You don’t have to be perfect. You just have to show up.',
  'Today’s practice is tomorrow’s confidence.',
  'Calm mind, clear answers.',
  'Consistency beats cramming. Every single time.',
];
const OVERVIEW = '• Key definitions and units\n• Worked examples step by step\n• Common JAMB traps to avoid';
const MONTHS_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const fmtDate = (d) => `${d.getDate()} ${MONTHS_S[d.getMonth()]} ${d.getFullYear()}`;
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

/* ───────────────────────── ACCESS RULES (DR02 / DR04) ───────────────────────── */
const RANK = { free: 0, regular: 1, premium: 2 };
const FEATURES = {
  video: { min: 'premium', label: 'Lecture videos' },
  notes: { min: 'premium', label: 'Lecture notes' },
  past: { min: 'regular', label: 'Past questions + explanations' },
  likely: { min: 'regular', label: 'Likely questions' },
  forum: { min: 'free', label: 'Question Forum' },
  novel: { min: 'premium', label: 'The Novel' },
  live: { min: 'premium', label: 'Live Brainstorming' },
  mocks: { min: 'premium', label: 'Mocks & CBT simulation' },
  progress: { min: 'premium', label: 'Progress tracking' },
  mentor: { min: 'premium', label: 'Speak with Mentor' },
};
const can = (plan, f) => RANK[plan] >= RANK[FEATURES[f].min];
const tagFor = (f) => ({ free: 'All', regular: 'Regular+', premium: 'Premium' }[FEATURES[f].min]);

/* ───────────────────────── SMALL HELPERS ───────────────────────── */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function useNav() {
  const [stack, setStack] = useState([]);
  return {
    stack,
    push: (name, params) => setStack((s) => [...s, { name, params }]),
    pop: () => setStack((s) => s.slice(0, -1)),
    replace: (name, params) => setStack((s) => [...s.slice(0, -1), { name, params }]),
    reset: () => setStack([]),
  };
}

function FadeIn({ children, delay = 0, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

function Btn({ title, onPress, variant = 'primary', icon, style, disabled }) {
  const inner = (
    <>
      {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' ? C.white : C.primary} style={{ marginRight: 8 }} /> : null}
      <Text style={[s.btnText, variant !== 'primary' && { color: C.primary }]}>{title}</Text>
    </>
  );
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[{ opacity: disabled ? 0.45 : 1 }, style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={[C.primary, C.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>{inner}</LinearGradient>
      ) : (
        <View style={[s.btn, variant === 'ghost' ? s.btnGhost : s.btnSoft]}>{inner}</View>
      )}
    </TouchableOpacity>
  );
}

const Chip = ({ label, on, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.chip, on && s.chipOn]}>
    <Text style={[s.chipText, on && { color: C.white }]}>{label}</Text>
  </TouchableOpacity>
);

const Tag = ({ text, tone = 'purple' }) => {
  const m = { purple: [C.soft2, C.primaryDark], green: [C.greenSoft, C.green], amber: [C.amberSoft, C.amber], red: [C.redSoft, C.red] }[tone];
  return <View style={[s.tag, { backgroundColor: m[0] }]}><Text style={[s.tagText, { color: m[1] }]}>{text}</Text></View>;
};

const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

function Page({ title, children, scroll = true, right }) {
  const { nav } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <View style={s.header}>
        <TouchableOpacity onPress={nav.pop} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={C.deep} /></TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 36, alignItems: 'flex-end' }}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : children}
    </View>
  );
}

function TabScreen({ title, children, right }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <View style={s.tabHeader}>
        <Text style={s.tabTitle}>{title}</Text>
        {right}
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </View>
  );
}

function TabBar({ tab, setTab, tabs }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((t) => {
        const on = t.key === tab;
        return (
          <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => setTab(t.key)} activeOpacity={0.7}>
            <View style={[s.tabIconWrap, on && { backgroundColor: C.soft2 }]}>
              <Ionicons name={on ? t.icon : `${t.icon}-outline`} size={20} color={on ? C.primary : C.muted} />
            </View>
            <Text style={[s.tabText, on && { color: C.primary, fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Row({ icon, title, sub, right, onPress, locked, danger }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={s.row}>
      <View style={[s.rowIcon, danger && { backgroundColor: C.redSoft }]}>
        <Ionicons name={icon} size={20} color={danger ? C.red : C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, danger && { color: C.red }]}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {right}
      {locked ? <Ionicons name="lock-closed" size={16} color={C.muted} style={{ marginLeft: 8 }} /> : <Ionicons name="chevron-forward" size={18} color={C.muted} style={{ marginLeft: 6 }} />}
    </TouchableOpacity>
  );
}

function Banner({ tone, text, action, onAction }) {
  const t = tone === 'red' ? { bg: C.redSoft, fg: C.red } : { bg: C.soft2, fg: C.primaryDark };
  return (
    <View style={[s.banner, { backgroundColor: t.bg }]}>
      <Text style={[s.bannerText, { color: t.fg }]}>{text}</Text>
      {action ? <TouchableOpacity onPress={onAction}><Text style={[s.bannerAction, { color: t.fg }]}>{action} ›</Text></TouchableOpacity> : null}
    </View>
  );
}

function LockedPanel({ title, text }) {
  const { nav } = useApp();
  return (
    <FadeIn>
      <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
        <View style={s.bigLock}><Ionicons name="lock-closed" size={30} color={C.primary} /></View>
        <Text style={[s.h2, { textAlign: 'center' }]}>{title}</Text>
        <Text style={[s.muted, { textAlign: 'center', marginVertical: 10 }]}>{text}</Text>
        <Btn title="See Plans" onPress={() => nav.push('Plans')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </Card>
    </FadeIn>
  );
}

/* ───────────────────────── DEMO BAR (stakeholder toggles) ───────────────────────── */
function Seg({ options, value, onChange, disabled }) {
  return (
    <View style={[s.seg, disabled && { opacity: 0.4 }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity key={o.value} disabled={disabled} onPress={() => onChange(o.value)} style={[s.segItem, on && s.segItemOn]} activeOpacity={0.8}>
            <Text style={[s.segText, on && s.segTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DemoBar({ mode, setMode, plan, setPlan, expiring, setExpiring, onRestart }) {
  return (
    <View style={s.demo}>
      <View style={s.demoTop}>
        <Text style={s.demoLabel}>STAKEHOLDER PREVIEW</Text>
        <TouchableOpacity onPress={onRestart} hitSlop={10}><Ionicons name="refresh" size={16} color="#C4B5FD" /></TouchableOpacity>
      </View>
      <Seg
        value={mode} onChange={setMode}
        options={[{ value: 'student', label: 'Student' }, { value: 'tutor', label: 'Tutor' }]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Seg
            value={plan} onChange={setPlan} disabled={mode === 'tutor'}
            options={[{ value: 'free', label: 'Free' }, { value: 'regular', label: 'Regular' }, { value: 'premium', label: 'Premium' }]}
          />
        </View>
        <TouchableOpacity
          disabled={plan === 'free' || mode === 'tutor'} onPress={() => setExpiring(!expiring)}
          style={[s.expChip, expiring && { backgroundColor: C.red }, (plan === 'free' || mode === 'tutor') && { opacity: 0.35 }]}
        >
          <Text style={s.expChipText}>Expiring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────────────────────── DR00: WELCOME, AUTH, ONBOARDING ───────────────────────── */
function Logo({ size = 72 }) {
  return (
    <LinearGradient colors={['#A78BFA', C.primary]} style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.white, fontWeight: '800', fontSize: size * 0.38, letterSpacing: 1 }}>SCA</Text>
    </LinearGradient>
  );
}

function Welcome({ onJoin, onSkip }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(tag, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <LinearGradient colors={['#FFFFFF', C.soft, C.soft2]} style={{ flex: 1, padding: 28, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={{ opacity: fade, transform: [{ scale }] }}><Logo size={104} /></Animated.View>
        <Animated.Text style={[s.brand, { opacity: fade }]}>Sammy Cares Academy</Animated.Text>
        <Animated.Text style={[s.tagline, { opacity: tag }]}>…caring for every step of your educational journey.</Animated.Text>
      </View>
      <Animated.View style={{ opacity: tag, marginTop: 56 }}>
        <Btn title="Join Us" onPress={onJoin} />
        <TouchableOpacity onPress={onSkip} style={{ alignSelf: 'center', padding: 14 }}>
          <Text style={{ color: C.muted, fontSize: 13 }}>Skip intro (demo)</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

function Field({ label, ...p }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#A8A3BD" style={s.input} autoCapitalize="none" {...p} />
    </View>
  );
}

function Auth({ profile, setProfile, onDone }) {
  const [step, setStep] = useState('choose'); // choose | email | details | dob | login
  const [pw, setPw] = useState('');
  const set = (k) => (v) => setProfile((p) => ({ ...p, [k]: v }));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.white }} contentContainerStyle={{ padding: 24, paddingTop: 36 }} keyboardShouldPersistTaps="handled">
      <FadeIn key={step}>
        {step === 'choose' && (
          <>
            <Logo size={56} />
            <Text style={[s.h1, { marginTop: 22 }]}>Let’s get you started</Text>
            <Text style={[s.muted, { marginBottom: 28 }]}>Two quick ways to join.</Text>
            <Btn variant="soft" icon="logo-google" title="Continue with Google" onPress={() => { setProfile((p) => ({ ...p, name: 'Tola', fullName: 'Tola Adeyemi', email: 'tola@gmail.com' })); setStep('dob'); }} />
            <View style={{ height: 12 }} />
            <Btn title="Continue with Email" icon="mail" onPress={() => setStep('email')} />
            <TouchableOpacity onPress={() => setStep('login')} style={{ alignSelf: 'center', padding: 20 }}>
              <Text style={s.muted}>Already have an account? <Text style={{ color: C.primary, fontWeight: '700' }}>Log in</Text></Text>
            </TouchableOpacity>
          </>
        )}
        {step === 'email' && (
          <>
            <Text style={s.h1}>What’s your email?</Text>
            <Text style={[s.muted, { marginBottom: 24 }]}>We’ll use it to sign you in.</Text>
            <Field label="Email" value={profile.email} onChangeText={set('email')} keyboardType="email-address" placeholder="you@example.com" />
            <Btn title="Continue" onPress={() => setStep('details')} />
          </>
        )}
        {step === 'details' && (
          <>
            <Text style={s.h1}>Tell us about you</Text>
            <Text style={[s.muted, { marginBottom: 24 }]}>Just three things.</Text>
            <Field label="Name" value={profile.fullName} onChangeText={(v) => setProfile((p) => ({ ...p, fullName: v, name: v.split(' ')[0] || 'Student' }))} autoCapitalize="words" />
            <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry placeholder="••••••••" />
            <Field label="Date of birth" value={profile.dob} onChangeText={set('dob')} placeholder="DD / MM / YYYY" />
            <Btn title="Create account" onPress={onDone} />
          </>
        )}
        {step === 'dob' && (
          <>
            <Text style={s.h1}>Hi {profile.name} 👋</Text>
            <Text style={[s.muted, { marginBottom: 24 }]}>Google gave us your name and email. One last thing.</Text>
            <Field label="Date of birth" value={profile.dob} onChangeText={set('dob')} placeholder="DD / MM / YYYY" />
            <Btn title="Continue" onPress={onDone} />
          </>
        )}
        {step === 'login' && (
          <>
            <Text style={s.h1}>Welcome back</Text>
            <Text style={[s.muted, { marginBottom: 24 }]}>Email and password. That’s all.</Text>
            <Field label="Email" value={profile.email} onChangeText={set('email')} keyboardType="email-address" />
            <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry placeholder="••••••••" />
            <Btn title="Log in" onPress={onDone} />
            <Text style={[s.muted, { textAlign: 'center', marginTop: 14, fontSize: 12 }]}>Password recovery is coming in V2.</Text>
          </>
        )}
      </FadeIn>
    </ScrollView>
  );
}

function Choice({ title, sub, on, onPress, badge, icon }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[s.choice, on && s.choiceOn]}>
      <View style={[s.rowIcon, on && { backgroundColor: C.primary }]}>
        <Ionicons name={icon} size={20} color={on ? C.white : C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {badge ? <Tag text={badge} tone="amber" /> : on ? <Ionicons name="checkmark-circle" size={22} color={C.primary} /> : null}
    </TouchableOpacity>
  );
}

function Onboarding({ onDone }) {
  const [i, setI] = useState(0);
  const [role, setRole] = useState('student');
  const [level, setLevel] = useState('JAMB');
  const [course, setCourse] = useState('');
  const [score, setScore] = useState('');
  const [subs, setSubs] = useState(['Use of English', 'Physics', 'Chemistry', 'Biology']);
  const [wait, setWait] = useState('');
  const [joined, setJoined] = useState(false);
  const prog = useRef(new Animated.Value(0)).current;
  const steps = ['role', 'level', ...(level === 'Post-UTME' ? ['course', 'score'] : []), 'subjects'];
  const step = steps[i];
  useEffect(() => {
    Animated.timing(prog, { toValue: (i + 1) / steps.length, duration: 350, useNativeDriver: false }).start();
  }, [i, steps.length]);
  const blocked = (step === 'role' && role === 'tutor') || (step === 'level' && level === '100L') || (step === 'subjects' && subs.length !== 4);
  const toggleSub = (x) => setSubs((p) => (p.includes(x) ? p.filter((y) => y !== x) : p.length < 4 ? [...p, x] : p));
  const next = () => (i < steps.length - 1 ? setI(i + 1) : onDone(subs));

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity disabled={i === 0} onPress={() => setI(i - 1)} style={{ opacity: i === 0 ? 0 : 1, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={22} color={C.deep} />
        </TouchableOpacity>
        <View style={s.progTrack}>
          <Animated.View style={[s.progFill, { width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <FadeIn key={step}>
          {step === 'role' && (
            <>
              <Text style={s.h1}>How will you use SCA?</Text>
              <Text style={[s.muted, { marginBottom: 20 }]}>Pick one. You only do this once.</Text>
              <Choice icon="school" title="Student" sub="Learn, practice and pass" on={role === 'student'} onPress={() => setRole('student')} />
              <Choice icon="easel" title="Tutor" badge="Coming Soon" on={role === 'tutor'} onPress={() => setRole('tutor')} />
              {role === 'tutor' && (
                <Card style={{ marginTop: 6 }}>
                  <Text style={s.rowTitle}>Tutor sign-up is almost ready</Text>
                  <Text style={[s.muted, { marginVertical: 8 }]}>Drop your email and we’ll tell you the moment it opens.</Text>
                  {joined ? <Tag text="You’re on the waitlist ✓" tone="green" /> : (
                    <>
                      <TextInput value={wait} onChangeText={setWait} placeholder="you@example.com" placeholderTextColor="#A8A3BD" style={s.input} autoCapitalize="none" keyboardType="email-address" />
                      <Btn variant="soft" title="Join waitlist" onPress={() => setJoined(true)} style={{ marginTop: 10 }} />
                    </>
                  )}
                </Card>
              )}
            </>
          )}
          {step === 'level' && (
            <>
              <Text style={s.h1}>What are you preparing for?</Text>
              <Text style={[s.muted, { marginBottom: 20 }]}>We’ll shape your 5-month plan around it.</Text>
              <Choice icon="ribbon" title="JAMB" sub="Pick 4 subjects" on={level === 'JAMB'} onPress={() => setLevel('JAMB')} />
              <Choice icon="business" title="Post-UTME" sub="Course, JAMB score, subjects" on={level === 'Post-UTME'} onPress={() => setLevel('Post-UTME')} />
              <Choice icon="library" title="100L" badge="Coming Soon" on={level === '100L'} onPress={() => setLevel('100L')} />
            </>
          )}
          {step === 'course' && (
            <>
              <Text style={s.h1}>Course of study?</Text>
              <Text style={[s.muted, { marginBottom: 20 }]}>What do you want to study in university?</Text>
              <Field label="Course" value={course} onChangeText={setCourse} placeholder="e.g. Medicine and Surgery" autoCapitalize="words" />
            </>
          )}
          {step === 'score' && (
            <>
              <Text style={s.h1}>Your JAMB score?</Text>
              <Text style={[s.muted, { marginBottom: 20 }]}>Approximate is fine.</Text>
              <Field label="Score" value={score} onChangeText={setScore} keyboardType="number-pad" placeholder="e.g. 280" />
            </>
          )}
          {step === 'subjects' && (
            <>
              <Text style={s.h1}>Pick your 4 subjects</Text>
              <Text style={[s.muted, { marginBottom: 20 }]}>{subs.length}/4 selected</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {SUBJECT_POOL.map((x) => <Chip key={x} label={x} on={subs.includes(x)} onPress={() => toggleSub(x)} />)}
              </View>
            </>
          )}
        </FadeIn>
      </ScrollView>
      <View style={{ padding: 24 }}>
        {step === 'level' && level === '100L' ? <Text style={[s.muted, { textAlign: 'center', marginBottom: 10 }]}>100L is coming soon. Pick JAMB or Post-UTME to continue.</Text> : null}
        <Btn title={i === steps.length - 1 ? 'Finish' : 'Continue'} disabled={blocked} onPress={next} />
      </View>
    </View>
  );
}

function Loading() {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(p, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <LinearGradient colors={[C.primary, C.deep]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }}><Logo size={88} /></Animated.View>
      <Text style={{ color: C.white, marginTop: 24, fontSize: 16, fontWeight: '600' }}>Setting up your study space…</Text>
      <ActivityIndicator color="#C4B5FD" style={{ marginTop: 16 }} />
    </LinearGradient>
  );
}

/* ───────────────────────── STUDENT TABS ───────────────────────── */
function HomeScreen() {
  const { plan, expiring, profile, nav, setTab, openLock } = useApp();
  const paid = plan !== 'free';
  const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];
  const cards = [
    { k: 'courses', icon: 'book', title: 'My Courses', sub: '5-month plans', onPress: () => setTab('study') },
    { k: 'brain', icon: 'chatbubbles', title: 'Brainstorming', sub: 'Forum & live', onPress: () => nav.push('Brainstorm') },
    { k: 'mocks', icon: 'timer', title: 'Mocks', sub: 'CBT practice', gate: 'mocks', onPress: () => nav.push('Mocks') },
    { k: 'notif', icon: 'notifications', title: 'Notifications', sub: '3 new', onPress: () => nav.push('Notifications') },
    { k: 'mentor', icon: 'people', title: 'Speak with Mentor', sub: 'Book a session', gate: 'mentor', wide: true, onPress: () => nav.push('Mentor') },
  ];
  const go = (c) => (c.gate && !can(plan, c.gate) ? openLock(c.gate) : c.onPress());
  return (
    <TabScreen
      title={''}
      right={null}
    >
      <View style={s.homeTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><Logo size={34} /><Text style={s.homeBrand}>  SCA</Text></View>
        <TouchableOpacity onPress={() => nav.push('Profile')} style={s.hiPill}>
          <Text style={s.hiText}>Hi, {profile.name}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.primaryDark} />
        </TouchableOpacity>
      </View>

      {plan === 'free' && <FadeIn><Banner text="You’re on Free Mode. Upgrade to unlock everything." action="See Plans" onAction={() => nav.push('Plans')} /></FadeIn>}
      {paid && expiring && <FadeIn><Banner tone="red" text="Your subscription expires in 2 days. Renew now." action="Renew" onAction={() => nav.push('Plans')} /></FadeIn>}

      <FadeIn delay={80}>
        <LinearGradient colors={[C.primary, C.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.quote}>
          <Text style={s.quoteLabel}>QUOTE OF THE DAY</Text>
          <Text style={s.quoteText}>“{quote}”</Text>
        </LinearGradient>
      </FadeIn>

      <Text style={[s.section, { marginTop: 22 }]}>Quick access</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {cards.map((c, idx) => {
          const locked = c.gate && !can(plan, c.gate);
          return (
            <FadeIn key={c.k} delay={140 + idx * 60} style={{ width: c.wide ? '100%' : '48%', marginBottom: 12 }}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => go(c)} style={[s.qCard, locked && { backgroundColor: '#FAF9FD' }]}>
                <View style={[s.qIcon, locked && { backgroundColor: C.line }]}>
                  <Ionicons name={c.icon} size={22} color={locked ? C.muted : C.primary} />
                </View>
                {locked ? <Ionicons name="lock-closed" size={15} color={C.muted} style={s.qLock} /> : null}
                <Text style={[s.qTitle, locked && { color: C.muted }]}>{c.title}</Text>
                <Text style={s.rowSub}>{c.sub}</Text>
              </TouchableOpacity>
            </FadeIn>
          );
        })}
      </View>
    </TabScreen>
  );
}

function StudyScreen() {
  const { courses, nav, plan } = useApp();
  return (
    <TabScreen title="Study">
      {courses.length === 0 ? (
        <Card><Text style={s.rowTitle}>You never select courses. Select now.</Text></Card>
      ) : courses.map((c, i) => (
        <FadeIn key={c} delay={i * 70}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => nav.push('CoursePlan', { course: c })} style={s.courseCard}>
            <LinearGradient colors={['#A78BFA', C.primary]} style={s.courseIcon}><Ionicons name="school" size={22} color={C.white} /></LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{c}</Text>
              <Text style={s.rowSub}>5-month plan · 15 topics</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>
        </FadeIn>
      ))}
      {plan === 'free' && <Text style={[s.muted, { marginTop: 8, fontSize: 12 }]}>Free users can browse outlines and use the Question Forum.</Text>}
    </TabScreen>
  );
}

function CoursePlanScreen({ course }) {
  const { nav } = useApp();
  return (
    <Page title={course}>
      <Text style={[s.muted, { marginBottom: 14 }]}>All months are open. Study at your own pace.</Text>
      {MONTH_TITLES.map((m, i) => (
        <FadeIn key={m} delay={i * 60}>
          <Row icon="calendar" title={m} sub="3 topics" onPress={() => nav.push('Month', { course, month: i })} />
        </FadeIn>
      ))}
    </Page>
  );
}

function MonthScreen({ course, month }) {
  const { nav } = useApp();
  const topics = getMonths(course)[month];
  return (
    <Page title={MONTH_TITLES[month]}>
      {topics.map((t, i) => (
        <FadeIn key={t.title} delay={i * 60}>
          <Row icon={t.novel ? 'book' : 'document-text'} title={t.title} sub={t.novel ? 'Special topic · Premium' : 'Video · Notes · Questions'} onPress={() => nav.push('Topic', { course, topic: t })} />
        </FadeIn>
      ))}
    </Page>
  );
}

function TopicScreen({ course, topic }) {
  const { plan, nav, openLock } = useApp();
  const items = topic.novel
    ? [{ k: 'novel', icon: 'book', title: 'Novel Reader', onPress: () => nav.push('Notes', { topic: topic.title, novel: true }) },
       { k: 'forum', icon: 'chatbubble-ellipses', title: 'Question Forum', onPress: () => nav.push('Forum', { topic: topic.title }) }]
    : [
      { k: 'video', icon: 'play-circle', title: 'Lecture Video', onPress: () => nav.push('Video', { course, topic }) },
      { k: 'notes', icon: 'document-text', title: 'Lecture Notes (PDF)', onPress: () => nav.push('Notes', { topic: topic.title }) },
      { k: 'past', icon: 'help-circle', title: 'Past Questions + Explanations', onPress: () => nav.push('Questions', { kind: 'past', title: 'Past Questions' }) },
      { k: 'likely', icon: 'sparkles', title: 'Likely Questions', onPress: () => nav.push('Questions', { kind: 'likely', title: 'Likely Questions' }) },
      { k: 'forum', icon: 'chatbubble-ellipses', title: 'Question Forum', onPress: () => nav.push('Forum', { topic: topic.title }) },
    ];
  return (
    <Page title={topic.title}>
      <Text style={[s.muted, { marginBottom: 14 }]}>{course}</Text>
      {items.map((it, i) => {
        const ok = can(plan, it.k);
        return (
          <FadeIn key={it.k} delay={i * 60}>
            <Row
              icon={it.icon} title={it.title} locked={!ok}
              right={<Tag text={tagFor(it.k)} tone={ok ? 'green' : 'purple'} />}
              onPress={() => (ok ? it.onPress() : openLock(it.k))}
            />
          </FadeIn>
        );
      })}
    </Page>
  );
}

function VideoScreen({ course, topic }) {
  const { profile, nav } = useApp();
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [corner, setCorner] = useState(0);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setPos((p) => (p >= 100 ? 0 : p + 2)), 1000);
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => {
    const t = setInterval(() => setCorner((c) => (c + 1) % 4), 30000);
    return () => clearInterval(t);
  }, []);
  const corners = [{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 34, right: 10 }, { bottom: 34, left: 10 }];
  return (
    <Page title={topic.title}>
      <View style={s.player}>
        <LinearGradient colors={['#4C1D95', '#1E1B2E']} style={StyleSheet.absoluteFill} />
        <TouchableOpacity onPress={() => setPlaying(!playing)} style={s.playBtn}>
          <Ionicons name={playing ? 'pause' : 'play'} size={30} color={C.white} />
        </TouchableOpacity>
        <Text style={[s.wm, corners[corner]]}>{profile.email} · {profile.id}</Text>
        <View style={s.vidBar}><View style={[s.vidFill, { width: `${pos}%` }]} /></View>
      </View>
      <Text style={[s.section, { marginTop: 18 }]}>Overview</Text>
      <Card><Text style={{ color: C.text, lineHeight: 22 }}>{OVERVIEW}</Text></Card>
      <Btn icon="document-text" title="Open Lecture Notes" onPress={() => nav.push('Notes', { topic: topic.title })} style={{ marginTop: 14 }} />
      <Text style={[s.section, { marginTop: 22 }]}>Quick links</Text>
      <Row icon="help-circle" title="Past Questions" onPress={() => nav.push('Questions', { kind: 'past', title: 'Past Questions' })} />
      <Row icon="sparkles" title="Likely Questions" onPress={() => nav.push('Questions', { kind: 'likely', title: 'Likely Questions' })} />
    </Page>
  );
}

function NotesScreen({ topic, novel }) {
  const { profile } = useApp();
  return (
    <Page title={novel ? 'Prescribed Novel' : 'Lecture Notes'}>
      <Text style={[s.muted, { marginBottom: 12 }]}>{topic} · watermarked for {profile.email}</Text>
      {[1, 2, 3].map((pg) => (
        <View key={pg} style={s.pdfPage}>
          <Text style={s.pdfTitle}>{topic}</Text>
          {[90, 100, 84, 96, 70, 100, 88, 60].map((w, i) => <View key={i} style={[s.pdfLine, { width: `${w}%` }]} />)}
          {[0, 1, 2].map((k) => (
            <Text key={k} style={[s.pdfWm, { top: 60 + k * 120 }]}>{profile.email} · SCA</Text>
          ))}
          <Text style={s.pdfNum}>Page {pg}</Text>
        </View>
      ))}
    </Page>
  );
}

function QuestionsScreen({ kind, title }) {
  const { profile } = useApp();
  const mock = kind === 'mock';
  const [ans, setAns] = useState({});
  const [done, setDone] = useState(false);
  const reveal = (i) => (mock ? done : ans[i] !== undefined);
  const score = QBANK.filter((q, i) => ans[i] === q.a).length;
  return (
    <Page title={title}>
      {mock && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={s.rowTitle}>CBT mode</Text>
          <Tag text="⏱ 00:45:00" tone="amber" />
        </Card>
      )}
      {QBANK.map((q, qi) => (
        <FadeIn key={qi} delay={qi * 70}>
          <Card style={{ marginBottom: 14 }}>
            <Text style={s.qNum}>Question {qi + 1}</Text>
            <Text style={[s.rowTitle, { marginVertical: 8, fontSize: 16 }]}>{q.q}</Text>
            {q.o.map((o, oi) => {
              const chosen = ans[qi] === oi;
              const r = reveal(qi);
              let bg = C.white; let bd = C.line;
              if (r && oi === q.a) { bg = C.greenSoft; bd = C.green; }
              else if (r && chosen) { bg = C.redSoft; bd = C.red; }
              else if (chosen) { bg = C.soft2; bd = C.primary; }
              return (
                <TouchableOpacity
                  key={oi} activeOpacity={0.8}
                  disabled={mock ? done : ans[qi] !== undefined}
                  onPress={() => setAns((a) => ({ ...a, [qi]: oi }))}
                  style={[s.opt, { backgroundColor: bg, borderColor: bd }]}
                >
                  <Text style={s.optLetter}>{'ABCD'[oi]}</Text>
                  <Text style={{ color: C.text, flex: 1 }}>{o}</Text>
                </TouchableOpacity>
              );
            })}
            {!mock && ans[qi] !== undefined && (
              <View style={s.expl}><Text style={{ color: C.primaryDark, lineHeight: 20 }}>💡 {q.e}</Text></View>
            )}
          </Card>
        </FadeIn>
      ))}
      {mock && !done && <Btn title="Submit" onPress={() => setDone(true)} disabled={Object.keys(ans).length === 0} />}
      {mock && done && <Card style={{ alignItems: 'center' }}><Text style={s.h2}>You scored {score}/{QBANK.length}</Text><Text style={s.muted}>Nice work. Keep going.</Text></Card>}
      {mock && <Text style={[s.muted, { textAlign: 'center', marginTop: 14, fontSize: 11 }]}>{profile.fullName} · {profile.email}</Text>}
    </Page>
  );
}

const SEED_THREADS = [
  { id: 1, q: 'Why is velocity a vector but speed is not?', by: 'Chidi', replies: [{ by: 'Mr. Bayo (Tutor)', t: 'Velocity includes direction, speed only tells you how fast.', best: true }] },
  { id: 2, q: 'What’s the difference between mass and weight?', by: 'Amaka', replies: [{ by: 'Zainab', t: 'Mass is the amount of matter. Weight is the pull of gravity on it.', best: false }] },
];
function ForumScreen({ topic, tutor }) {
  const [threads, setThreads] = useState(SEED_THREADS);
  const [txt, setTxt] = useState('');
  const post = () => {
    if (!txt.trim()) return;
    setThreads((t) => [{ id: Date.now(), q: txt.trim(), by: 'You', replies: [] }, ...t]);
    setTxt('');
  };
  const markBest = (tid, ri) => setThreads((ts) => ts.map((t) => (t.id !== tid ? t : { ...t, replies: t.replies.map((r, i) => ({ ...r, best: i === ri })) })));
  return (
    <Page title="Question Forum">
      <Text style={[s.muted, { marginBottom: 12 }]}>{topic || 'All topics'}</Text>
      {!tutor && (
        <Card style={{ marginBottom: 16 }}>
          <TextInput value={txt} onChangeText={setTxt} placeholder="Ask a question…" placeholderTextColor="#A8A3BD" style={[s.input, { minHeight: 56 }]} multiline />
          <Btn title="Post question" onPress={post} style={{ marginTop: 10 }} />
        </Card>
      )}
      {threads.map((t) => (
        <Card key={t.id} style={{ marginBottom: 12 }}>
          <Text style={s.rowTitle}>{t.q}</Text>
          <Text style={s.rowSub}>by {t.by}</Text>
          {t.replies.length === 0 && <Text style={[s.muted, { marginTop: 8 }]}>No replies yet.</Text>}
          {t.replies.map((r, ri) => (
            <View key={ri} style={[s.reply, r.best && { borderColor: C.green, backgroundColor: C.greenSoft }]}>
              {r.best && <Tag text="Best Answer" tone="green" />}
              <Text style={{ color: C.text, marginTop: r.best ? 6 : 0 }}>{r.t}</Text>
              <Text style={s.rowSub}>{r.by}</Text>
              {tutor && !r.best && <TouchableOpacity onPress={() => markBest(t.id, ri)}><Text style={{ color: C.primary, fontWeight: '700', marginTop: 6 }}>Mark as Best Answer</Text></TouchableOpacity>}
            </View>
          ))}
        </Card>
      ))}
    </Page>
  );
}

function Bar({ pct }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: pct, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [pct]);
  return <View style={s.barTrack}><Animated.View style={[s.barFill, { width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} /></View>;
}

function LineChart({ data, labels }) {
  const [w, setW] = useState(0);
  const h = 150; const pad = 18;
  const pts = w ? data.map((v, i) => ({ x: pad + i * ((w - 2 * pad) / (data.length - 1)), y: h - pad - (v / 100) * (h - 2 * pad) })) : [];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: h + 22 }}>
      {w > 0 && (
        <Svg width={w} height={h}>
          {[0, 50, 100].map((g) => { const y = h - pad - (g / 100) * (h - 2 * pad); return <Line key={g} x1={pad} x2={w - pad} y1={y} y2={y} stroke={C.line} strokeWidth="1" />; })}
          <Polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.primary} strokeWidth="3" />
          {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r="4.5" fill={C.white} stroke={C.primary} strokeWidth="2.5" />)}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: pad - 8 }}>
        {labels.map((l) => <Text key={l} style={s.chartLbl}>{l}</Text>)}
      </View>
    </View>
  );
}

function ProgressScreen() {
  const { plan, courses } = useApp();
  const locked = !can(plan, 'progress');
  const pcts = [72, 58, 41, 66];
  return (
    <TabScreen title="Progress">
      {locked ? (
        <LockedPanel
          title="Progress tracking is a Premium feature."
          text={plan === 'regular' ? 'Upgrade to Premium to track your performance.' : 'Upgrade to track your performance.'}
        />
      ) : (
        <FadeIn>
          <Text style={s.section}>Progress per course</Text>
          <Card>
            {courses.map((c, i) => (
              <View key={c} style={{ marginBottom: i === courses.length - 1 ? 0 : 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={s.rowTitle}>{c}</Text><Text style={{ color: C.primaryDark, fontWeight: '700' }}>{pcts[i % 4]}%</Text>
                </View>
                <Bar pct={pcts[i % 4]} />
              </View>
            ))}
          </Card>
          <Text style={[s.section, { marginTop: 20 }]}>Mock scores over time</Text>
          <Card><LineChart data={[48, 55, 52, 63, 70, 74]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']} /></Card>
          <LinearGradient colors={[C.soft2, C.soft]} style={s.aiMsg}>
            <Ionicons name="sparkles" size={18} color={C.primary} />
            <Text style={{ color: C.primaryDark, flex: 1, marginLeft: 10, lineHeight: 20 }}>
              You’ve improved 26 points in six weeks. Chemistry needs a little more love. Two short drills this week will help.
            </Text>
          </LinearGradient>
        </FadeIn>
      )}
    </TabScreen>
  );
}

function MoreScreen() {
  const { nav, plan, onLogout } = useApp();
  return (
    <TabScreen title="More">
      <Row icon="person" title="Profile" onPress={() => nav.push('Profile')} />
      <Row icon="card" title="Subscription / Plans" sub={`${cap(plan)} plan`} onPress={() => nav.push('Subscription')} />
      <Row icon="information-circle" title="About the App" onPress={() => nav.push('About')} />
      <Row icon="settings" title="Settings" onPress={() => nav.push('Settings')} />
      <Row icon="help-buoy" title="Help & Support" onPress={() => nav.push('Help')} />
      <Row icon="log-out" title="Logout" danger onPress={() => Alert.alert('Log out?', 'You’ll return to the Welcome screen.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: onLogout }])} />
    </TabScreen>
  );
}

/* ───────────────────────── STUDENT SUB-SCREENS ───────────────────────── */
function ProfileScreen() {
  const { profile, setProfile } = useApp();
  const set = (k) => (v) => setProfile((p) => ({ ...p, [k]: v }));
  return (
    <Page title="Profile">
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <Logo size={80} />
        <Text style={[s.h2, { marginTop: 12 }]}>{profile.fullName}</Text>
        <Text style={s.muted}>Changes save immediately</Text>
      </View>
      <Field label="Name" value={profile.fullName} onChangeText={(v) => setProfile((p) => ({ ...p, fullName: v, name: v.split(' ')[0] || p.name }))} autoCapitalize="words" />
      <Field label="Nickname" value={profile.nickname} onChangeText={set('nickname')} />
      <Field label="Date of birth" value={profile.dob} onChangeText={set('dob')} />
      <Field label="Email" value={profile.email} onChangeText={set('email')} keyboardType="email-address" />
    </Page>
  );
}

function SubscriptionScreen() {
  const { plan, expiring, nav } = useApp();
  const exp = fmtDate(addDays(expiring ? 2 : 30));
  const msg = plan === 'free' ? 'You’re on Free Mode.' : `${cap(plan)} Plan — expires on ${exp}`;
  return (
    <Page title="Subscription">
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Tag text={cap(plan)} tone={plan === 'free' ? 'purple' : 'green'} />
        <Text style={[s.h2, { textAlign: 'center', marginTop: 12 }]}>{msg}</Text>
        {plan !== 'free' && expiring && <Text style={{ color: C.red, fontWeight: '700', marginTop: 6 }}>Expires in 2 days</Text>}
        <Btn
          title={plan === 'free' ? 'Upgrade' : plan === 'regular' ? 'Upgrade to Premium' : 'Renew'}
          onPress={() => nav.push('Plans')} style={{ alignSelf: 'stretch', marginTop: 18 }}
        />
      </Card>
      <Text style={[s.muted, { marginTop: 14, fontSize: 12 }]}>Your subscription is tied to your account, not your phone. Log in anywhere and it’s still active.</Text>
    </Page>
  );
}

const PLAN_FEATURES = {
  regular: ['Past questions + explanations', 'Likely questions', 'Question Forum', 'Full 5-month plan'],
  premium: ['Everything in Regular', 'Lecture videos & notes', 'All mocks + CBT simulator', 'Live brainstorming', 'Progress tracking', 'Speak with Mentor', 'Novel reader', 'Official WhatsApp group'],
};
function PlansScreen() {
  const { plan, setPlan, nav } = useApp();
  const [paying, setPaying] = useState(null);
  const pay = (p) => {
    setPaying(p);
    setTimeout(() => { setPlan(p); setPaying(null); nav.replace('Receipt', { plan: p }); }, 1400);
  };
  const cards = [
    { id: 'regular', name: 'Regular', price: '₦1,000', blocked: plan === 'premium' },
    { id: 'premium', name: 'Premium', price: '₦6,000', best: true },
  ];
  return (
    <View style={{ flex: 1 }}>
      <Page title="Plans">
        <Text style={s.h1}>Here’s how we help you pass</Text>
        <Text style={[s.muted, { marginBottom: 18 }]}>Pick what fits. 30 days, no stress.</Text>
        {cards.map((c, i) => {
          const current = plan === c.id;
          return (
            <FadeIn key={c.id} delay={i * 90}>
              <View style={[s.planCard, c.best && { borderColor: C.primary, borderWidth: 2 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.h2}>{c.name}</Text>
                  {current ? <Tag text="Current" tone="green" /> : c.best ? <Tag text="Best value" /> : null}
                </View>
                <Text style={s.price}>{c.price}<Text style={s.perMonth}> /month</Text></Text>
                {PLAN_FEATURES[c.id].map((f) => (
                  <View key={f} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color={C.primary} />
                    <Text style={{ color: C.text, marginLeft: 8, flex: 1 }}>{f}</Text>
                  </View>
                ))}
                <Btn
                  title={c.blocked ? 'Available after Premium expires' : current ? 'Renew with Paystack' : 'Pay with Paystack'}
                  icon={c.blocked ? undefined : 'shield-checkmark'} disabled={c.blocked}
                  onPress={() => pay(c.id)} style={{ marginTop: 18 }}
                />
              </View>
            </FadeIn>
          );
        })}
        <TouchableOpacity onPress={nav.pop} style={{ alignSelf: 'center', padding: 14 }}><Text style={s.muted}>Maybe later</Text></TouchableOpacity>
      </Page>
      {paying && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ marginTop: 14, color: C.deep, fontWeight: '700' }}>Connecting to Paystack…</Text>
          <Text style={s.muted}>Mock checkout. No real payment.</Text>
        </View>
      )}
    </View>
  );
}

function ReceiptScreen({ plan: bought }) {
  const { nav, setTab, profile } = useApp();
  const ref = useRef(`SCA-${Math.floor(100000 + Math.random() * 900000)}`).current;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start(); }, []);
  const rows = [['Plan', cap(bought)], ['Amount', bought === 'premium' ? '₦6,000' : '₦1,000'], ['Date', fmtDate(new Date())], ['Reference', ref], ['Valid until', fmtDate(addDays(30))], ['Account', profile.email]];
  return (
    <Page title="Receipt">
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Animated.View style={[s.tick, { transform: [{ scale: pop }] }]}><Ionicons name="checkmark" size={40} color={C.white} /></Animated.View>
        <Text style={[s.h2, { marginTop: 14 }]}>Payment successful</Text>
        <Text style={[s.muted, { textAlign: 'center' }]}>You’re now on {cap(bought)} until {fmtDate(addDays(30))}.</Text>
      </View>
      <Card>
        {rows.map(([k, v], i) => (
          <View key={k} style={[s.rcRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={s.muted}>{k}</Text><Text style={s.rowTitle}>{v}</Text>
          </View>
        ))}
      </Card>
      <Text style={[s.muted, { textAlign: 'center', marginVertical: 14, fontSize: 12 }]}>For your reference only. No PIN needed.</Text>
      <Btn title="Start learning" onPress={() => { nav.reset(); setTab('home'); }} />
    </Page>
  );
}

const NOTIFS = [
  { id: 1, icon: 'timer', t: 'Daily mock is ready', d: 'Take today’s 10-question mock.', go: 'mocks' },
  { id: 2, icon: 'chatbubbles', t: 'Live brainstorming at 6 PM', d: 'Physics: Motion & Forces with Mr. Bayo.', go: 'brain' },
  { id: 3, icon: 'gift', t: 'Happy birthday, Tola 🎉', d: 'The SCA family is proud of you.', go: null },
  { id: 4, icon: 'card', t: 'Subscription reminder', d: 'Check your plan and renew anytime.', go: 'plans' },
];
function NotificationsScreen() {
  const { nav, plan, openLock } = useApp();
  const [read, setRead] = useState({});
  const [cleared, setCleared] = useState(false);
  const list = cleared ? [] : NOTIFS;
  const tap = (n) => {
    setRead((r) => ({ ...r, [n.id]: true }));
    if (n.go === 'mocks') (can(plan, 'mocks') ? nav.push('Mocks') : openLock('mocks'));
    if (n.go === 'brain') nav.push('Brainstorm');
    if (n.go === 'plans') nav.push('Plans');
  };
  return (
    <Page title="Notifications" right={null}>
      {list.length === 0 ? <Text style={[s.muted, { textAlign: 'center', marginTop: 40 }]}>You’re all caught up.</Text> : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity onPress={() => setRead(Object.fromEntries(NOTIFS.map((n) => [n.id, true])))}><Text style={{ color: C.primary, fontWeight: '700' }}>Mark all as read</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setCleared(true)}><Text style={{ color: C.muted, fontWeight: '700' }}>Clear all</Text></TouchableOpacity>
          </View>
          {list.map((n) => (
            <Row key={n.id} icon={n.icon} title={n.t} sub={n.d} onPress={() => tap(n)} right={!read[n.id] ? <View style={s.dot} /> : null} />
          ))}
        </>
      )}
    </Page>
  );
}

function BrainstormScreen() {
  const { nav, plan, openLock } = useApp();
  const live = can(plan, 'live');
  return (
    <Page title="Brainstorming">
      <Text style={s.section}>Question Forum</Text>
      <Row icon="chatbubble-ellipses" title="Ask & answer by topic" sub="Open to everyone" onPress={() => nav.push('Forum', {})} />
      <Text style={[s.section, { marginTop: 20 }]}>Live Brainstorming</Text>
      {[['Physics · Motion & Forces', 'Today, 6:00 PM'], ['Chemistry · Acids & Bases', 'Thu, 5:00 PM']].map(([t, d]) => (
        <Row key={t} icon="videocam" title={t} sub={d} locked={!live} onPress={() => (live ? Alert.alert('Reminder set', `We’ll nudge you before ${t}.`) : openLock('live'))} />
      ))}
      <Btn variant="soft" icon={live ? 'chatbubbles' : 'lock-closed'} title="Join open chat" style={{ marginTop: 12 }} onPress={() => (live ? Alert.alert('Open chat', 'Joining the open chat room…') : openLock('live'))} />
    </Page>
  );
}

function MocksScreen() {
  const { nav, plan, openLock } = useApp();
  const ok = can(plan, 'mocks');
  const list = [['Daily Mock', '10 questions · 15 min', 'today'], ['End-of-Week Mock', '30 questions · 40 min', 'calendar'], ['End-of-Month Mock', '60 questions · 1 hr 20', 'calendar-number'], ['Full JAMB Simulation', '4 subjects · timed CBT', 'desktop']];
  return (
    <Page title="Mocks">
      {list.map(([t, d, ic]) => (
        <Row key={t} icon={ic} title={t} sub={d} locked={!ok} onPress={() => (ok ? nav.push('Questions', { kind: 'mock', title: t }) : openLock('mocks'))} />
      ))}
    </Page>
  );
}

function MentorScreen() {
  const { plan, openLock } = useApp();
  const ok = can(plan, 'mentor');
  const groups = [['Science mentors', 'Biology, Engineering', 'flask'], ['Art class mentors', 'Literature, Government', 'color-palette'], ['Commercial class mentors', 'Economics, Accounting', 'briefcase']];
  const act = (t) => (ok ? Alert.alert('Request sent', `Your request for ${t} has been sent.`) : openLock('mentor'));
  return (
    <Page title="Speak with Mentor">
      {groups.map(([t, d, ic]) => <Row key={t} icon={ic} title={t} sub={d} locked={!ok} onPress={() => act(t)} />)}
      <Btn title="Book a session with Dr. Sam" icon="calendar" style={{ marginTop: 14 }} onPress={() => act('a session with Dr. Sam')} />
    </Page>
  );
}

function AboutScreen() {
  return (
    <Page title="About the App">
      <Text style={s.h1}>Sammy Cares Academy</Text>
      <Text style={[s.muted, { marginVertical: 10, lineHeight: 22 }]}>…caring for every step of your educational journey.</Text>
      <Card style={{ marginBottom: 12 }}><Text style={s.rowTitle}>Cornerstone 1</Text><Text style={[s.muted, { marginTop: 6 }]}>Breaking complex stuff into basics, through a simple 5-month plan.</Text></Card>
      <Card style={{ marginBottom: 12 }}><Text style={s.rowTitle}>Cornerstone 2</Text><Text style={[s.muted, { marginTop: 6 }]}>Mental health stability, because a calm mind learns better.</Text></Card>
      <Card><Text style={s.rowTitle}>Plans & payment</Text><Text style={[s.muted, { marginTop: 6 }]}>Regular ₦1,000/month · Premium ₦6,000/month. Pay securely with Paystack. Your subscription is tied to your account.</Text></Card>
    </Page>
  );
}

function SettingsScreen() {
  const [n, setN] = useState({ mocks: true, brain: true, bday: true, exp: true });
  const items = [['mocks', 'Mock reminders'], ['brain', 'Brainstorming sessions'], ['bday', 'Birthday message'], ['exp', 'Subscription expiry']];
  return (
    <Page title="Settings">
      <Text style={s.section}>Notifications</Text>
      {items.map(([k, label]) => (
        <View key={k} style={s.row}>
          <Text style={[s.rowTitle, { flex: 1 }]}>{label}</Text>
          <Switch value={n[k]} onValueChange={(v) => setN((p) => ({ ...p, [k]: v }))} trackColor={{ true: C.primary, false: C.line }} thumbColor={C.white} />
        </View>
      ))}
      <Text style={[s.section, { marginTop: 20 }]}>Coming in V2</Text>
      <View style={[s.row, { opacity: 0.5 }]}><Text style={[s.rowTitle, { flex: 1 }]}>Dark mode</Text><Tag text="V2" tone="amber" /></View>
      <View style={[s.row, { opacity: 0.5 }]}><Text style={[s.rowTitle, { flex: 1 }]}>Language</Text><Tag text="V2" tone="amber" /></View>
    </Page>
  );
}

function HelpScreen() {
  return (
    <Page title="Help & Support">
      <Text style={s.section}>FAQ</Text>
      <Row icon="help-circle" title="Will my subscription move to a new phone?" sub="Yes. It’s tied to your account." onPress={() => {}} />
      <Row icon="help-circle" title="How many devices can I use?" sub="Up to 3 active devices." onPress={() => {}} />
      <Text style={[s.section, { marginTop: 20 }]}>Contact SCA</Text>
      <Row icon="mail" title="Email" onPress={() => {}} />
      <Row icon="call" title="Phone" onPress={() => {}} />
      <Row icon="logo-whatsapp" title="WhatsApp" onPress={() => {}} />
      <Row icon="flag" title="Report a problem" onPress={() => {}} />
    </Page>
  );
}

function StudentRoutes({ route }) {
  const p = route.params || {};
  switch (route.name) {
    case 'Profile': return <ProfileScreen />;
    case 'Subscription': return <SubscriptionScreen />;
    case 'Plans': return <PlansScreen />;
    case 'Receipt': return <ReceiptScreen {...p} />;
    case 'About': return <AboutScreen />;
    case 'Settings': return <SettingsScreen />;
    case 'Help': return <HelpScreen />;
    case 'Notifications': return <NotificationsScreen />;
    case 'Brainstorm': return <BrainstormScreen />;
    case 'Mocks': return <MocksScreen />;
    case 'Mentor': return <MentorScreen />;
    case 'CoursePlan': return <CoursePlanScreen {...p} />;
    case 'Month': return <MonthScreen {...p} />;
    case 'Topic': return <TopicScreen {...p} />;
    case 'Video': return <VideoScreen {...p} />;
    case 'Notes': return <NotesScreen {...p} />;
    case 'Questions': return <QuestionsScreen {...p} />;
    case 'Forum': return <ForumScreen {...p} />;
    default: return null;
  }
}

const STUDENT_TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'study', label: 'Study', icon: 'book' },
  { key: 'progress', label: 'Progress', icon: 'stats-chart' },
  { key: 'more', label: 'More', icon: 'ellipsis-horizontal-circle' },
];

function StudentApp({ profile, setProfile, plan, setPlan, expiring, courses, onLogout }) {
  const [tab, setTab] = useState('home');
  const [lock, setLock] = useState(null);
  const nav = useNav();
  const ctx = { plan, setPlan, expiring, profile, setProfile, courses, nav, setTab, onLogout, openLock: setLock };
  const top = nav.stack[nav.stack.length - 1];
  const screens = { home: <HomeScreen />, study: <StudyScreen />, progress: <ProgressScreen />, more: <MoreScreen /> };
  const tier = lock ? FEATURES[lock].min : 'premium';
  return (
    <Ctx.Provider value={ctx}>
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <View style={{ flex: 1 }}>
          {top ? (
            <FadeIn key={`${nav.stack.length}-${top.name}`} style={{ flex: 1 }}><StudentRoutes route={top} /></FadeIn>
          ) : (
            <FadeIn key={tab} style={{ flex: 1 }}>{screens[tab]}</FadeIn>
          )}
        </View>
        {!top && <TabBar tab={tab} setTab={setTab} tabs={STUDENT_TABS} />}
      </View>

      <Modal visible={!!lock} transparent animationType="slide" onRequestClose={() => setLock(null)}>
        <Pressable style={s.backdrop} onPress={() => setLock(null)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <View style={s.bigLock}><Ionicons name="lock-closed" size={28} color={C.primary} /></View>
            <Text style={[s.h2, { textAlign: 'center' }]}>This is a {cap(tier)} feature</Text>
            <Text style={[s.muted, { textAlign: 'center', marginVertical: 10 }]}>
              {lock ? `${FEATURES[lock].label} ${tier === 'premium' ? 'is part of Premium' : 'comes with Regular and Premium'}. Here’s how we help you pass.` : ''}
            </Text>
            <Btn title="See Plans" onPress={() => { setLock(null); nav.push('Plans'); }} style={{ alignSelf: 'stretch' }} />
            <TouchableOpacity onPress={() => setLock(null)} style={{ padding: 14 }}><Text style={s.muted}>Maybe later</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Ctx.Provider>
  );
}

/* ───────────────────────── DR03: TUTOR PANEL (mobile mock of the web panel) ───────────────────────── */
const TUTOR_TOPICS = [
  { t: 'Measurements & Units', st: 'Approved' },
  { t: 'Scalars & Vectors', st: 'Approved' },
  { t: 'Motion in a Straight Line', st: 'Pending' },
  { t: 'Newton’s Laws', st: 'Rejected', fb: 'Video audio is unclear. Please re-upload.' },
  { t: 'Work, Energy & Power', st: 'Pending' },
];
const stTone = { Approved: 'green', Pending: 'amber', Rejected: 'red' };
const SAMPLE_BULK = `Q: What is the SI unit of force?
A) Joule
B) Newton
C) Watt
D) Pascal
Ans: B
Expl: Force is measured in Newtons (N).

Q: What is the acceleration due to gravity?
A) 9.8 m/s²
B) 10.8 m/s²
C) 8.9 m/s²
D) 11.2 m/s²
Ans: A
Expl: Standard gravity is approximately 9.8 m/s².`;

function parseBulk(text) {
  const t = text.trim();
  if (!t) return { ok: 0, errors: ['Nothing to validate yet. Paste your questions above.'] };
  const blocks = t.split(/\n\s*\n/);
  let ok = 0; const errors = [];
  blocks.forEach((b, bi) => {
    const L = b.split('\n').map((x) => x.trim());
    const hasQ = L.some((x) => /^Q:/i.test(x));
    const opts = ['A', 'B', 'C', 'D'].every((l) => L.some((x) => x.startsWith(`${l})`)));
    const ans = L.find((x) => /^Ans:\s*[A-D]\s*$/i.test(x));
    if (hasQ && opts && ans) ok += 1;
    else {
      const line = t.slice(0, t.indexOf(b)).split('\n').length;
      errors.push(`Line ${line} (question ${bi + 1}): needs “Q:”, options A) to D), and “Ans: B” style answer.`);
    }
  });
  return { ok, errors };
}

function TutorDash() {
  const { nav, setTab, sessions } = useApp();
  const stats = [['Courses', '2', 'school'], ['Topics uploaded', '38', 'cloud-upload'], ['Questions in bank', '412', 'help-circle'], ['Upcoming sessions', String(sessions.length), 'videocam']];
  const actions = [['Upload Content', 'cloud-upload', () => nav.push('Upload')], ['Add Questions', 'create', () => nav.push('AddQuestions')], ['Schedule Brainstorming', 'calendar', () => nav.push('Schedule')], ['View Question Forum', 'chatbubbles', () => nav.push('Forum', { tutor: true, topic: 'Your courses' })]];
  return (
    <TabScreen title="Welcome, Mr. Bayo">
      <Banner text="2 uploads are pending admin review." action="Content" onAction={() => setTab('content')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {stats.map(([k, v, ic], i) => (
          <FadeIn key={k} delay={i * 60} style={{ width: '48%', marginBottom: 12 }}>
            <View style={s.stat}><Ionicons name={ic} size={18} color={C.primary} /><Text style={s.statNum}>{v}</Text><Text style={s.rowSub}>{k}</Text></View>
          </FadeIn>
        ))}
      </View>
      <Text style={[s.section, { marginTop: 8 }]}>Quick actions</Text>
      {actions.map(([t, ic, fn]) => <Row key={t} icon={ic} title={t} onPress={fn} />)}
    </TabScreen>
  );
}

function TutorContent() {
  const { nav } = useApp();
  const [course, setCourse] = useState('Physics');
  return (
    <TabScreen title="Content">
      <View style={{ flexDirection: 'row' }}>{['Physics', 'Chemistry'].map((c) => <Chip key={c} label={c} on={course === c} onPress={() => setCourse(c)} />)}</View>
      <Text style={[s.muted, { marginVertical: 10 }]}>{course} · Month 1–2 topics</Text>
      {TUTOR_TOPICS.map((t, i) => (
        <FadeIn key={t.t} delay={i * 50}>
          <Row icon="document-text" title={t.t} sub={t.fb || 'Video · Notes · Questions'} right={<Tag text={t.st} tone={stTone[t.st]} />} onPress={() => nav.push('Upload')} />
        </FadeIn>
      ))}
      <Text style={[s.muted, { fontSize: 12, marginTop: 8 }]}>Edits to approved content create a new pending version. The old one stays live until approved.</Text>
    </TabScreen>
  );
}

function TutorSessions() {
  const { sessions, setSessions, nav } = useApp();
  const toggle = (id) => setSessions((ss) => ss.map((x) => (x.id === id ? { ...x, live: !x.live } : x)));
  return (
    <TabScreen title="Sessions">
      <Btn title="Schedule a session" icon="add" onPress={() => nav.push('Schedule')} style={{ marginBottom: 16 }} />
      {sessions.map((x) => (
        <Card key={x.id} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.rowTitle}>{x.title}</Text>{x.live ? <Tag text="LIVE" tone="red" /> : <Tag text="Scheduled" />}
          </View>
          <Text style={s.rowSub}>{x.when} · {x.dur}</Text>
          <Text style={[s.rowSub, { marginTop: 4 }]}>Notifies Premium students of this course only</Text>
          <Btn variant="soft" title={x.live ? 'End session' : 'Start session'} onPress={() => toggle(x.id)} style={{ marginTop: 10 }} />
        </Card>
      ))}
    </TabScreen>
  );
}

function UploadScreen() {
  const { nav } = useApp();
  const [link, setLink] = useState('');
  const [ov, setOv] = useState('');
  const [pdf, setPdf] = useState(false);
  const valid = /youtu/.test(link);
  const submit = () => { Alert.alert('Submitted', 'Status: Pending Review. An admin will approve it before it goes live.'); nav.pop(); };
  return (
    <Page title="Upload Content">
      <Field label="Lecture video (YouTube unlisted link)" value={link} onChangeText={setLink} placeholder="https://youtu.be/…" />
      {link.length > 0 && <Tag text={valid ? 'Link looks good ✓' : 'Not a YouTube link'} tone={valid ? 'green' : 'red'} />}
      <View style={{ height: 14 }} />
      <Field label={`Overview (${ov.length}/500)`} value={ov} onChangeText={(v) => setOv(v.slice(0, 500))} multiline placeholder="Short key points. Plain text only." />
      <Text style={s.label}>Lecture notes</Text>
      <Btn variant="soft" icon="document-attach" title={pdf ? 'lecture-notes.pdf · 2.4 MB ✓' : 'Choose PDF (max 20 MB)'} onPress={() => setPdf(!pdf)} />
      <Btn title="Submit for review" onPress={submit} style={{ marginTop: 22 }} disabled={!valid} />
    </Page>
  );
}

function AddQuestionsScreen() {
  const [txt, setTxt] = useState(SAMPLE_BULK);
  const [res, setRes] = useState(null);
  return (
    <Page title="Add Questions">
      <Text style={[s.muted, { marginBottom: 10 }]}>Bulk paste. Separate questions with a blank line.</Text>
      <TextInput value={txt} onChangeText={(v) => { setTxt(v); setRes(null); }} multiline style={[s.input, { minHeight: 260, fontSize: 13, textAlignVertical: 'top' }]} autoCapitalize="none" />
      <Btn title="Validate format" onPress={() => setRes(parseBulk(txt))} style={{ marginTop: 14 }} />
      {res && (
        <FadeIn key={`${res.ok}-${res.errors.length}`}>
          <Card style={{ marginTop: 14 }}>
            {res.ok > 0 && <Tag text={`${res.ok} question${res.ok > 1 ? 's' : ''} parsed ✓`} tone="green" />}
            {res.errors.map((e) => <Text key={e} style={{ color: C.red, marginTop: 8 }}>{e}</Text>)}
          </Card>
        </FadeIn>
      )}
    </Page>
  );
}

function ScheduleScreen() {
  const { setSessions, nav } = useApp();
  const [course, setCourse] = useState('Physics');
  const [when, setWhen] = useState('Fri, 6:00 PM');
  const [dur, setDur] = useState('1 hour');
  const [topic, setTopic] = useState('Newton’s Laws');
  const save = () => {
    setSessions((ss) => [...ss, { id: Date.now(), title: `${course} · ${topic}`, when, dur, live: false }]);
    nav.pop();
  };
  return (
    <Page title="Schedule Brainstorming">
      <Text style={s.label}>Course</Text>
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>{['Physics', 'Chemistry'].map((c) => <Chip key={c} label={c} on={course === c} onPress={() => setCourse(c)} />)}</View>
      <Field label="Date & time" value={when} onChangeText={setWhen} autoCapitalize="words" />
      <Field label="Duration" value={dur} onChangeText={setDur} />
      <Field label="Topic(s)" value={topic} onChangeText={setTopic} autoCapitalize="words" />
      <Btn title="Save session" onPress={save} />
    </Page>
  );
}

function TutorRoutes({ route }) {
  const p = route.params || {};
  switch (route.name) {
    case 'Upload': return <UploadScreen />;
    case 'AddQuestions': return <AddQuestionsScreen />;
    case 'Schedule': return <ScheduleScreen />;
    case 'Forum': return <ForumScreen {...p} />;
    default: return null;
  }
}
const TUTOR_TABS = [
  { key: 'dash', label: 'Dashboard', icon: 'grid' },
  { key: 'content', label: 'Content', icon: 'folder' },
  { key: 'sessions', label: 'Sessions', icon: 'calendar' },
];
function TutorApp() {
  const [tab, setTab] = useState('dash');
  const [sessions, setSessions] = useState([
    { id: 1, title: 'Physics · Motion & Forces', when: 'Today, 6:00 PM', dur: '1 hour', live: false },
    { id: 2, title: 'Chemistry · Acids & Bases', when: 'Thu, 5:00 PM', dur: '45 min', live: false },
  ]);
  const nav = useNav();
  const top = nav.stack[nav.stack.length - 1];
  const screens = { dash: <TutorDash />, content: <TutorContent />, sessions: <TutorSessions /> };
  return (
    <Ctx.Provider value={{ nav, setTab, sessions, setSessions }}>
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <View style={{ flex: 1 }}>
          {top ? <FadeIn key={`${nav.stack.length}-${top.name}`} style={{ flex: 1 }}><TutorRoutes route={top} /></FadeIn>
            : <FadeIn key={tab} style={{ flex: 1 }}>{screens[tab]}</FadeIn>}
        </View>
        {!top && <TabBar tab={tab} setTab={setTab} tabs={TUTOR_TABS} />}
      </View>
    </Ctx.Provider>
  );
}

/* ───────────────────────── ROOT ───────────────────────── */
function Root() {
  const [mode, setMode] = useState('student');
  const [plan, setPlan] = useState('free');
  const [expiring, setExpiring] = useState(false);
  const [phase, setPhase] = useState('welcome'); // welcome | auth | onboard | loading | app
  const [courses, setCourses] = useState(['Use of English', 'Physics', 'Chemistry', 'Biology']);
  const [profile, setProfile] = useState(USER);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (phase !== 'loading') return undefined;
    const t = setTimeout(() => setPhase('app'), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  const restart = () => { setPhase('welcome'); setProfile(USER); setPlan('free'); setExpiring(false); setRunKey((k) => k + 1); };
  const changePlan = (p) => { setPlan(p); if (p === 'free') setExpiring(false); };

  let body = null;
  if (mode === 'tutor') body = <TutorApp />;
  else if (phase === 'welcome') body = <Welcome onJoin={() => setPhase('auth')} onSkip={() => setPhase('loading')} />;
  else if (phase === 'auth') body = <Auth profile={profile} setProfile={setProfile} onDone={() => setPhase('onboard')} />;
  else if (phase === 'onboard') body = <Onboarding onDone={(subs) => { setCourses(subs); setPhase('loading'); }} />;
  else if (phase === 'loading') body = <Loading />;
  else body = (
    <StudentApp
      key={runKey} profile={profile} setProfile={setProfile} plan={plan} setPlan={changePlan}
      expiring={expiring} courses={courses} onLogout={() => setPhase('welcome')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.deep }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.deep }}>
        <DemoBar mode={mode} setMode={setMode} plan={plan} setPlan={changePlan} expiring={expiring} setExpiring={setExpiring} onRestart={restart} />
      </SafeAreaView>
      <View style={{ flex: 1, backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' }}>
        <FadeIn key={`${mode}-${phase}`} style={{ flex: 1 }}>{body}</FadeIn>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */
const s = StyleSheet.create({
  // demo bar
  demo: { backgroundColor: C.deep, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  demoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  demoLabel: { color: '#C4B5FD', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  seg: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 3 },
  segItem: { flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  segItemOn: { backgroundColor: C.white },
  segText: { color: '#DDD6FE', fontWeight: '600', fontSize: 13 },
  segTextOn: { color: C.deep, fontWeight: '800' },
  expChip: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' },
  expChipText: { color: C.white, fontSize: 12, fontWeight: '700' },
  // type
  h1: { fontSize: 26, fontWeight: '800', color: C.deep, marginBottom: 6 },
  h2: { fontSize: 19, fontWeight: '800', color: C.deep },
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  section: { fontSize: 13, fontWeight: '800', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  brand: { fontSize: 24, fontWeight: '800', color: C.deep, marginTop: 22 },
  tagline: { fontSize: 15, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 10 },
  label: { fontSize: 13, fontWeight: '700', color: C.deep, marginBottom: 6 },
  // inputs & buttons
  input: { backgroundColor: C.soft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.line },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 16 },
  btnText: { color: C.white, fontWeight: '800', fontSize: 15 },
  btnSoft: { backgroundColor: C.soft2 },
  btnGhost: { borderWidth: 1.5, borderColor: C.primary },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.deep, fontWeight: '700', fontSize: 13 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  tagText: { fontSize: 11, fontWeight: '800' },
  // cards & rows
  card: { backgroundColor: C.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line, shadowColor: C.primary, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.soft2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  rowSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  choice: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: C.line, marginBottom: 12, backgroundColor: C.white },
  choiceOn: { borderColor: C.primary, backgroundColor: C.soft },
  // chrome
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.soft },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: C.deep, marginHorizontal: 6 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18 },
  tabTitle: { fontSize: 26, fontWeight: '800', color: C.deep },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 14 },
  tabText: { fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '600' },
  // onboarding
  progTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.soft2, overflow: 'hidden' },
  progFill: { height: 6, borderRadius: 3, backgroundColor: C.primary },
  // home
  homeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: -6 },
  homeBrand: { fontSize: 18, fontWeight: '800', color: C.deep },
  hiPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.soft2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  hiText: { color: C.primaryDark, fontWeight: '800', fontSize: 13, marginRight: 2 },
  banner: { borderRadius: 14, padding: 14, marginBottom: 14 },
  bannerText: { fontWeight: '700', fontSize: 13, lineHeight: 19 },
  bannerAction: { fontWeight: '800', fontSize: 13, marginTop: 6 },
  quote: { borderRadius: 20, padding: 20 },
  quoteLabel: { color: '#DDD6FE', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  quoteText: { color: C.white, fontSize: 18, fontWeight: '700', marginTop: 8, lineHeight: 26 },
  qCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line, shadowColor: C.primary, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  qIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.soft2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  qLock: { position: 'absolute', top: 14, right: 14 },
  qTitle: { fontSize: 15, fontWeight: '800', color: C.deep },
  courseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  courseIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  // video & notes
  player: { height: 200, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(124,58,237,0.9)', alignItems: 'center', justifyContent: 'center' },
  wm: { position: 'absolute', color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  vidBar: { position: 'absolute', left: 12, right: 12, bottom: 14, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  vidFill: { height: 4, borderRadius: 2, backgroundColor: '#C4B5FD' },
  pdfPage: { backgroundColor: C.white, borderRadius: 10, padding: 18, marginBottom: 14, height: 380, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  pdfTitle: { fontSize: 17, fontWeight: '800', color: C.deep, marginBottom: 16 },
  pdfLine: { height: 8, borderRadius: 4, backgroundColor: '#EDEAF5', marginBottom: 12 },
  pdfWm: { position: 'absolute', left: -20, color: C.primary, opacity: 0.13, fontSize: 20, fontWeight: '800', transform: [{ rotate: '-28deg' }] },
  pdfNum: { position: 'absolute', bottom: 10, alignSelf: 'center', color: C.muted, fontSize: 11 },
  // questions
  qNum: { fontSize: 12, fontWeight: '800', color: C.primary, letterSpacing: 0.6 },
  opt: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, marginTop: 8 },
  optLetter: { width: 26, fontWeight: '800', color: C.primary },
  expl: { backgroundColor: C.soft, borderRadius: 12, padding: 12, marginTop: 10 },
  reply: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, marginTop: 10, backgroundColor: C.soft },
  // charts
  barTrack: { height: 10, borderRadius: 5, backgroundColor: C.soft2, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: C.primary },
  chartLbl: { fontSize: 11, color: C.muted },
  aiMsg: { flexDirection: 'row', borderRadius: 16, padding: 16, marginTop: 16, alignItems: 'flex-start' },
  // plans & receipt
  planCard: { borderRadius: 22, padding: 20, borderWidth: 1, borderColor: C.line, marginBottom: 16, backgroundColor: C.white },
  price: { fontSize: 32, fontWeight: '800', color: C.primaryDark, marginTop: 6 },
  perMonth: { fontSize: 14, color: C.muted, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  tick: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  rcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary },
  // sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(30,27,46,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 34, alignItems: 'center' },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: 18 },
  bigLock: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.soft2, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  // tutor
  stat: { backgroundColor: C.soft, borderRadius: 18, padding: 16 },
  statNum: { fontSize: 28, fontWeight: '800', color: C.deep, marginTop: 8 },
});
