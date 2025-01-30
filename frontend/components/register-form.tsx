import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller, Control } from 'react-hook-form';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import type { RegisterFormData } from '../types/form'; // Ensure the type is imported
import { Link, useRouter } from 'expo-router';
import { signUp } from '@/services/auth.service';

const RegisterForm = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'User',
    },
  });

  const router = useRouter();
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['register-user'],
    mutationFn: signUp,
  });

  // State for password visibility toggle
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);

  const onSubmit = (data: RegisterFormData) => {
    mutateAsync(
      {
        email: data.email,
        password: data.password,
        role: 'User',
      },
      {
        onSuccess: () => {
          Alert.alert('Registration Successful!');
          router.push('/(auth)/sign-in');
        },
        onError: (err) => {
          console.log('Could not register', err.name, err.message);
          Alert.alert('Error while registering, please try later!');
        },
      }
    );
    reset(); // Reset the form state
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>RouteMate</Text>
      <Text style={styles.trackRide}>Track Your Ride,</Text>
      <Text style={styles.anywhere}>Anywhere,</Text>
      <Text style={styles.anytime}>Anytime.</Text>

      {/* Styled Register Form Text */}
      <Text style={styles.registerFormText}>Signup</Text>

      <Controller
        control={control as Control<RegisterFormData>}
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
        control={control as Control<RegisterFormData>}
        rules={{
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters long',
          },
          pattern: {
            value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            message: 'Password must contain letters, numbers, and special characters',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.passwordContainer}>
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Password"
              value={value}
              secureTextEntry={!passwordVisible}
              mode="outlined"
              style={styles.input}
            />
            <IconButton
              icon={passwordVisible ? "eye" : "eye-off"}
              size={24}
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.iconButton}
            />
          </View>
        )}
        name="password"
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <Controller
        control={control as Control<RegisterFormData>}
        rules={{
          required: 'Confirm Password is required',
          validate: (value) => value === watch('password') || 'Passwords do not match',
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.passwordContainer}>
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Confirm Password"
              value={value}
              secureTextEntry={!confirmPasswordVisible}
              mode="outlined"
              style={styles.input}
            />
            <IconButton
              icon={confirmPasswordVisible ? "eye" : "eye-off"}
              size={24}
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={styles.iconButton}
            />
          </View>
        )}
        name="confirmPassword"
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.registerButton}
        labelStyle={styles.buttonLabel}>
        Signup
      </Button>

      <Text style={styles.orText}>or</Text>

      <View style={styles.info}>
        <Text style={styles.infoText}>Already have an account?</Text>
        <Link style={styles.infoLink} href="/(auth)/sign-in">
          Sign in
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    gap: 6,
    padding: 20,
  },
  title: {
    fontFamily: '',
    fontSize: 43,
    fontWeight: 'bold',
    color: '#082A3F',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 80,
    paddingTop: 10,
    paddingBottom: 10,
  },
  trackRide: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DB2955',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 2,
    marginLeft: -22,
    marginRight: 15,
    paddingBottom: 1,
    paddingTop: 1,
  },
  anywhere: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DB2955',
    textAlign: 'center',
    marginBottom: 0,
    marginLeft: -96,
    marginRight: 15,
    marginTop: -5,
    paddingTop: 1,
    paddingBottom: 1,
  },
  anytime: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DB2955',
    textAlign: 'center',
    marginBottom: 2,
    marginLeft: -115,
    marginRight: 15,
    marginTop: -3,
    paddingTop: 1,
    paddingBottom: 20,
  },
  registerFormText: {
    fontFamily: '',
    fontSize: 24,
    color: '#082A3F',
    fontWeight: 'bold',
    marginBottom: 0,
    paddingTop: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'absolute',
    right: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  registerButton: {
    marginBottom: 16,
    backgroundColor: '#082A3F',
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '60%',
    paddingVertical: 0,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 5,
    color: '#808080',
  },
  infoText: {
    fontSize: 16,
    color: '#000',
    paddingTop: 2,
  },
  info: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLink: {
    fontSize: 16,
    color: '#082A3F',
    textDecorationLine: 'underline',
  },
});

export default RegisterForm;
