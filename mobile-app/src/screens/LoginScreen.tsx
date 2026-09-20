import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('student@smartcampus.edu');
  const [password, setPassword] = useState('Password@123');

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (err.message === 'Network Error' || !err.response
          ? 'Cannot connect to backend server. Make sure your server is running and accessible.'
          : 'Please check your campus credentials.');
      Alert.alert('Login Failed', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <ShieldCheck size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Smart Campus</Text>
        <Text style={styles.subtitle}>Student & Faculty Portal</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Campus Email</Text>
        <TextInput
          style={styles.input}
          placeholder="student@smartcampus.edu"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          isLoading={isLoading}
          style={{ marginTop: spacing.lg }}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={styles.signupLink}
        >
          <Text style={styles.signupText}>
            New to campus? <Text style={styles.signupHighlight}>Create account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  signupLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  signupText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  signupHighlight: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
