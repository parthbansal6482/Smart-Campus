import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Check, MapPin, Phone, X } from 'lucide-react-native';
import { CAMPUS } from '../data/mock';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Chips } from '../components/Chips';
import { colors, fonts, radius, spacing } from '../theme';
import { formatTime } from '../lib/format';

type Phase = 'ready' | 'countdown' | 'sent';
type Tag = 'NONE' | 'INJURY' | 'FAINTED' | 'ALLERGIC_REACTION' | 'BREATHING' | 'OTHER';

const COUNTDOWN_SECONDS = 3;

// Placeholder until the screen reads the device location and resolves the nearest building.
const LOCATION = { building: 'RTH Academic Block', detail: 'Ground floor, near RTH-105' };

const TAGS: { value: Tag; label: string }[] = [
  { value: 'INJURY', label: 'Injury' },
  { value: 'FAINTED', label: 'Fainted' },
  { value: 'BREATHING', label: 'Trouble breathing' },
  { value: 'ALLERGIC_REACTION', label: 'Allergic reaction' },
  { value: 'OTHER', label: 'Something else' },
];

export const EmergencyScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('ready');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [tag, setTag] = useState<Tag>('NONE');
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const startCountdown = () => {
    setPhase('countdown');
    setSecondsLeft(COUNTDOWN_SECONDS);
    timer.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          setPhase('sent');
          setSentAt(new Date());
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (timer.current) clearInterval(timer.current);
    setPhase('ready');
  };

  const callSecurity = () => Linking.openURL(`tel:${CAMPUS.securityPhone.replace(/\s/g, '')}`);

  const cancelAlert = () =>
    Alert.alert('Cancel the alert?', 'Only cancel if you no longer need help.', [
      { text: 'Keep alert', style: 'cancel' },
      { text: 'I’m safe, cancel', style: 'destructive', onPress: () => navigation.goBack() },
    ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topBar}>
        <AppText variant="label" tone="critical">
          Emergency
        </AppText>
        {phase !== 'sent' && (
          <Pressable
            onPress={() => (phase === 'countdown' ? cancelCountdown() : navigation.goBack())}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            style={styles.close}
          >
            <X size={20} color={colors.ink2} />
          </Pressable>
        )}
      </View>

      {phase !== 'sent' ? (
        <>
          <View>
            <AppText variant="display">
              {phase === 'countdown' ? 'Sending alert…' : 'Get medical help'}
            </AppText>
            <AppText variant="callout" tone="ink3" style={styles.lede}>
              {phase === 'countdown'
                ? 'Your alert goes out when the countdown ends.'
                : 'We’ll send your location to the campus ambulance and medical team.'}
            </AppText>
          </View>

          <View style={styles.location}>
            <MapPin size={18} color={colors.critical} />
            <View style={styles.flex}>
              <AppText variant="bodyMedium">{LOCATION.building}</AppText>
              <AppText variant="caption" tone="ink3">
                {LOCATION.detail}
              </AppText>
            </View>
          </View>

          <View style={styles.center}>
            {phase === 'ready' ? (
              <Pressable
                onPress={startCountdown}
                accessibilityRole="button"
                accessibilityLabel="Send emergency alert"
                style={({ pressed }) => [styles.sos, pressed && { backgroundColor: colors.criticalPressed }]}
              >
                <AppText style={styles.sosText}>SOS</AppText>
                <AppText variant="caption" style={styles.sosCaption}>
                  Tap to send
                </AppText>
              </Pressable>
            ) : (
              <View style={[styles.sos, styles.sosCounting]}>
                <AppText style={[styles.sosText, { color: colors.critical }]}>{secondsLeft}</AppText>
              </View>
            )}
          </View>

          {phase === 'countdown' ? (
            <Button title="Cancel" variant="secondary" onPress={cancelCountdown} />
          ) : (
            <View>
              <AppText variant="label" tone="ink3" style={styles.tagLabel}>
                What’s happening? (optional)
              </AppText>
              <Chips value={tag} onChange={setTag} options={TAGS} />
            </View>
          )}
        </>
      ) : (
        <>
          <View>
            <View style={styles.sentIcon}>
              <Check size={24} color={colors.ok} />
            </View>
            <AppText variant="display">Help is being sent</AppText>
            <AppText variant="callout" tone="ink3" style={styles.lede}>
              Stay where you are if it’s safe. Keep your phone nearby — a responder may call you.
            </AppText>
          </View>

          <View style={styles.timeline}>
            <TimelineStep done title="Alert sent" detail={`${LOCATION.building} · ${sentAt ? formatTime(sentAt) : ''}`} />
            <TimelineStep current title="Waiting for a responder" detail="The medical team has been notified" />
            <TimelineStep title="Ambulance on the way" />
            <TimelineStep title="Arrived" last />
          </View>

          <View style={styles.actions}>
            <Button
              title={`Call campus security`}
              variant="secondary"
              icon={<Phone size={16} color={colors.ink} />}
              onPress={callSecurity}
            />
            <Button title="I’m safe — cancel alert" variant="ghost" onPress={cancelAlert} />
          </View>
        </>
      )}
    </View>
  );
};

const TimelineStep: React.FC<{ title: string; detail?: string; done?: boolean; current?: boolean; last?: boolean }> = ({
  title,
  detail,
  done,
  current,
  last,
}) => (
  <View style={styles.step}>
    <View style={styles.stepRail}>
      <View style={[styles.stepDot, done && styles.stepDotDone, current && styles.stepDotCurrent]}>
        {done && <Check size={11} color={colors.onInk} strokeWidth={3} />}
      </View>
      {!last && <View style={[styles.stepLine, done && { backgroundColor: colors.ink }]} />}
    </View>
    <View style={styles.stepBody}>
      <AppText variant={current || done ? 'bodyMedium' : 'body'} tone={current || done ? 'ink' : 'ink4'}>
        {title}
      </AppText>
      {detail && (
        <AppText variant="caption" tone="ink3">
          {detail}
        </AppText>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.xxl, justifyContent: 'space-between' },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lede: { marginTop: spacing.sm },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  center: { alignItems: 'center' },
  sos: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
    borderColor: colors.criticalSoft,
  },
  sosCounting: { backgroundColor: colors.surface, borderColor: colors.criticalLine },
  sosText: { fontFamily: fonts.serif, fontSize: 64, lineHeight: 70, color: colors.onInk },
  sosCaption: { color: 'rgba(255,255,255,0.8)', marginTop: -4 },
  tagLabel: { marginBottom: spacing.sm },
  sentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.okSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  timeline: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  step: { flexDirection: 'row', gap: spacing.md },
  stepRail: { alignItems: 'center', width: 18 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  stepDotCurrent: { borderColor: colors.ink, borderWidth: 5 },
  stepLine: { width: 1.5, flex: 1, backgroundColor: colors.line, marginVertical: 2, minHeight: 18 },
  stepBody: { flex: 1, paddingBottom: spacing.lg },
  actions: { gap: spacing.sm },
});
