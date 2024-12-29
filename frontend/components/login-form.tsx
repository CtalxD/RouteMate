import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';

import type { LoginFormData } from '../types/form';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

const LoginForm = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { onLogin } = useAuth();

  const onSubmit = (data: LoginFormData) => {
    onLogin({
      email: data.email,
      password: data.password,
    });

    reset();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>RouteMate</Text>
      <Text style={styles.subtitle}>Track Your Ride, Anywhere, Anytime.</Text>

      <Text variant="titleMedium" style={styles.loginTitle}>Login</Text>

      <Controller
        control={control}
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email address',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Email"
            value={value}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
          />
        )}
        name="email"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <Controller
        control={control}
        rules={{
          required: 'Password is required',
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Password"
            value={value}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
        )}
        name="password"
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <Link style={styles.forgotPassword} href="/(auth)/sign-up">
Register a new user      </Link>
      <Link style={styles.forgotPassword} href="/(auth)/forgot-password">
        Forgot Password
      </Link>

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.loginButton}>
        Login
      </Button>

      <Text style={styles.orText}>or</Text>

      <Button
        mode="contained"
        icon="google"
        buttonColor={COLORS.light.primary}
        textColor={COLORS.light.background}
        style={styles.googleButton}
      >
        SignUp with Google
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: COLORS.dark.text,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.light.primary,
  },
  loginTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  forgotPassword: {
    textAlign: 'right',
    marginBottom: 16,
    color: COLORS.light.primary,
  },
  loginButton: {
    marginBottom: 16,
    backgroundColor: COLORS.light?.error,
  },
  orText: {
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.dark.text,
  },
  googleButton: {
    borderRadius: 8,
  },
});

export default LoginForm;
