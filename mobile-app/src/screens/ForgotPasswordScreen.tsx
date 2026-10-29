import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { authService } from '../services/auth.service';
import { AuthStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { colors, spacing } from '../theme';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Use the campus email attached to your account.');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      // Keep the same safe response as the server: do not reveal whether an
      // account exists at this address.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={styles.back} hitSlop={8}>
          <ArrowLeft size={18} color={colors.ink2} />
          <AppText variant="label" tone="ink2">Back to sign in</AppText>
        </Pressable>
        <View style={styles.icon}><Mail size={18} color={colors.ink} /></View>
        <AppText variant="display">Reset your password</AppText>
        <AppText variant="callout" tone="ink3" style={styles.lede}>Enter your campus email and we’ll send a secure reset link if the account exists.</AppText>
        {sent ? (
          <View style={styles.message}><AppText variant="body" tone="ink2">If that email is registered, a reset link is on its way. Check your inbox and spam folder.</AppText></View>
        ) : (
          <>
            <Field label="Campus email" value={email} onChangeText={setEmail} placeholder="name@smartcampus.edu" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Button title="Send reset link" onPress={submit} isLoading={loading} style={styles.submit} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.xxl, flexGrow: 1 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 48 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  lede: { marginTop: spacing.md, marginBottom: 40, maxWidth: 320 },
  submit: { marginTop: spacing.sm },
  message: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg },
});
