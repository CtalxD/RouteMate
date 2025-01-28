import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import axios from 'axios';

type ForgotPasswordFormData = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

const ForgotPassword = () => {
  const [step, setStep] = useState('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitEmail = async (data: ForgotPasswordFormData) => {
    try {
      const response = await axios.post('http://localhost:5000/forgot-pass', { email: data.email });
      console.log(response.data.message);
      setGeneratedCode(response.data.verificationCode);
      setStep('verify');
    } catch (error) {
      console.error('Error sending verification code:', error);
    }
  };

  const onVerifyCode = () => {
    if (verificationCode === generatedCode) {
      setStep('reset');
    } else {
      console.error('Invalid verification code');
    }
  };

  const onChangePassword = async (data: ForgotPasswordFormData) => {
    if (data.newPassword === data.confirmPassword) {
      try {
        const response = await axios.post('http://localhost:5000/reset-pass', {
          email: watch('email'),
          newPassword: data.newPassword,
        });
        console.log(response.data.message);
        reset();
        setStep('email');
      } catch (error) {
        console.error('Error resetting password:', error);
      }
    } else {
      console.error('Passwords do not match');
    }
  };

  return (
    <View style={styles.container}>
      {step === 'email' && (
        <>
          <Text variant="headlineMedium" style={styles.loginTitle}>
            Forgot Password
          </Text>
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

          <Button mode="contained" onPress={handleSubmit(onSubmitEmail)} style={styles.resetButton}>
            <Text style={styles.buttonText}>Send Verification Code</Text>
          </Button>
        </>
      )}

      {step === 'verify' && (
        <>
          <Text variant="headlineMedium" style={styles.loginTitle}>
            Verify Code
          </Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to the console.</Text>

          <TextInput
            placeholder="Enter Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <Button mode="contained" onPress={onVerifyCode} style={styles.resetButton}>
            <Text style={styles.buttonText}>Verify Code</Text>
          </Button>
        </>
      )}

      {step === 'reset' && (
        <>
          <Text variant="headlineMedium" style={styles.loginTitle}>
            Reset Password
          </Text>
          <Text style={styles.newPasswordSubtitle}>Enter your new password below.</Text>

          <Controller
            control={control}
            rules={{ required: 'New password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="New Password"
                value={value}
                secureTextEntry
                mode="outlined"
                style={styles.input}
              />
            )}
            name="newPassword"
          />
          {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message}</Text>}

          <Controller
            control={control}
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === watch('newPassword') || 'Passwords do not match',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Confirm Password"
                value={value}
                secureTextEntry
                mode="outlined"
                style={styles.input}
              />
            )}
            name="confirmPassword"
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

          <Button mode="contained" onPress={handleSubmit(onChangePassword)} style={styles.resetButton}>
            <Text style={styles.buttonText}>Change Password</Text>
          </Button>
        </>
      )}

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
  loginTitle: {
    fontSize: 24,
    color: '#082A3F',
    fontWeight: 'bold',
    marginBottom: 10,
    paddingTop: 30,
  },
  subtitle: {
    textAlign: 'center',
    paddingRight: 35,
    marginBottom: 10,
    color: '#DB2955',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newPasswordSubtitle: {
    textAlign: 'center',
    marginBottom: 10,
    marginRight: 98,
    color: '#DB2955',
    fontSize: 16,
    fontWeight: 'bold',
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
  errorText: {
    color: 'red',
    fontSize: 14,
    paddingLeft: 8,
    marginBottom: 10,
  },
  resetButton: {
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
  buttonText: {
    fontSize: 16,   
    fontWeight: 'regular',  
    color: '#fff',
  },
  backToLogin: {
    textAlign: 'center',
    color: '#DB2955',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 1,
  },
});

export default ForgotPassword;
