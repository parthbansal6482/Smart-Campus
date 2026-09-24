import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { colors, fonts, spacing } from '../theme';

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Almost there', 'Your name, email and a password are required.');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
    } catch (err: any) {
      Alert.alert('Couldn’t create your account', err.response?.data?.message || 'Please try again in a moment.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          hitSlop={12}
          style={styles.back}
        >
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>

        <AppText variant="display">Create account</AppText>
        <AppText variant="callout" tone="ink3" style={styles.lede}>
          For students and faculty. Staff accounts are set up by the campus administrator.
        </AppText>

        <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" textContentType="name" />
        <Field
          label="Campus email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@smartcampus.edu"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          hint="Optional. Responders use it to reach you during an emergency."
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          textContentType="newPassword"
        />

        <Button title="Create account" onPress={handleSignup} isLoading={isLoading} style={styles.submit} />

        <View style={styles.footer}>
          <AppText variant="callout" tone="ink3">
            Already have an account?{' '}
          </AppText>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="link" hitSlop={8}>
            <AppText variant="callout" style={styles.link}>
              Sign in
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.xxl },
  back: { width: 40, height: 40, justifyContent: 'center', marginLeft: -8, marginBottom: spacing.xl },
  lede: { marginTop: spacing.sm, marginBottom: spacing.xxxl },
  submit: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  link: { fontFamily: fonts.semibold, textDecorationLine: 'underline' },
});
