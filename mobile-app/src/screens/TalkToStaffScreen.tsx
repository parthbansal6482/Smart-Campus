import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Segmented } from '../components/Chips';
import { Field } from '../components/Field';
import { Screen, SectionLabel, StickyFooter } from '../components/Screen';
import { colors, spacing } from '../theme';

type RequestType = 'CALLBACK' | 'CHAT' | 'APPOINTMENT';

const DESCRIPTIONS: Record<RequestType, string> = {
  CALLBACK: 'A nurse will call you on the number in your profile.',
  CHAT: 'Send a message to the on-duty nurse.',
  APPOINTMENT: 'Ask for a time to visit the medical centre.',
};

export const TalkToStaffScreen: React.FC = () => {
  const navigation = useNavigation();
  const [type, setType] = useState<RequestType>('CALLBACK');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!note.trim()) {
      Alert.alert('Tell us a little more', 'A sentence about how you’re feeling helps the nurse prepare.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Request sent', 'The on-duty medical team has your request.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    }, 600);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomSpace={32}>
        <View style={styles.status}>
          <View style={styles.dot} />
          <AppText variant="label" tone="ok">
            Nurses on duty now
          </AppText>
        </View>
        <AppText variant="title">For anything that isn’t an emergency.</AppText>
        <AppText variant="callout" tone="ink3" style={styles.lede}>
          Fever, a sprain, medication questions — talk to someone at the campus medical centre.
        </AppText>

        <SectionLabel>How should we reach you?</SectionLabel>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'CALLBACK', label: 'Call back' },
            { value: 'CHAT', label: 'Chat' },
            { value: 'APPOINTMENT', label: 'Visit' },
          ]}
        />
        <AppText variant="caption" tone="ink3" style={styles.helper}>
          {DESCRIPTIONS[type]}
        </AppText>

        <SectionLabel>What’s going on?</SectionLabel>
        <Field
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Headache and mild fever since this morning"
          multiline
        />
      </Screen>

      <StickyFooter>
        <Button title="Send request" onPress={handleSubmit} isLoading={submitting} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ok },
  lede: { marginTop: spacing.sm },
  helper: { marginTop: spacing.sm },
});
