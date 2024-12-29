import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';

import type { ForgotPasswordFormData } from '../types/form';
import { COLORS } from '@/constants/colors';

const ForgotPassword = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    // Handle forgot password logic here
    console.log('Forgot password request:', data);
    reset();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to reset your password.</Text>

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

      <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.resetButton}>
        Reset Password
      </Button>

      <Link style={styles.backToLogin} href="/(auth)/sign-in">
        Back to Login
      </Link>
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
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  resetButton: {
    marginBottom: 16,
    backgroundColor: COLORS.light.primary,
  },
  backToLogin: {
    textAlign: 'center',
    color: COLORS.light.primary,
  },
});

export default ForgotPassword;
