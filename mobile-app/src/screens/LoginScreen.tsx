import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthStackParamList } from '../types';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { colors, fonts, radius, spacing } from '../theme';

const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student@smartcampus.edu' },
  { label: 'Faculty', email: 'faculty@smartcampus.edu' },
];

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Almost there', 'Enter your campus email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (err.message === 'Network Error' || !err.response
          ? 'We can’t reach the campus server right now. Check your connection and try again.'
          : 'Check your email and password and try again.');
      Alert.alert('Couldn’t sign in', message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={styles.mark}>
            <AppText style={styles.markText}>S</AppText>
          </View>
          <AppText variant="label" tone="ink2">
            Smart Campus
          </AppText>
        </View>

        <AppText variant="display" style={styles.headline}>
          Your campus,
        </AppText>
        <AppText variant="display" italic tone="ink3" style={styles.headlineItalic}>
          in one place.
        </AppText>
        <AppText variant="callout" tone="ink3" style={styles.lede}>
          Find a free room, order ahead at the cafeteria, and get help fast when it matters.
        </AppText>

        <Field
          label="Campus email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@smartcampus.edu"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <Button title="Sign in" onPress={handleLogin} isLoading={isLoading} style={styles.submit} />

        <View style={styles.demo}>
          <AppText variant="caption" tone="ink3">
            Try a demo account:
          </AppText>
          {DEMO_ACCOUNTS.map(account => (
            <Pressable
              key={account.email}
              onPress={() => {
                setEmail(account.email);
                setPassword('Password@123');
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.demoChip, pressed && { backgroundColor: colors.sunken }]}
            >
              <AppText variant="label">{account.label}</AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <AppText variant="callout" tone="ink3">
            New to campus?{' '}
          </AppText>
          <Pressable onPress={() => navigation.navigate('Signup')} accessibilityRole="link" hitSlop={8}>
            <AppText variant="callout" style={styles.link}>
              Create an account
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.xxl, flexGrow: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 56 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 24, color: colors.canvas },
  headline: { fontSize: 44, lineHeight: 46 },
  headlineItalic: { fontSize: 44, lineHeight: 50 },
  lede: { marginTop: spacing.md, marginBottom: 40, maxWidth: 320 },
  submit: { marginTop: spacing.sm },
  demo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, flexWrap: 'wrap' },
  demoChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 40 },
  link: { fontFamily: fonts.semibold, textDecorationLine: 'underline' },
});
