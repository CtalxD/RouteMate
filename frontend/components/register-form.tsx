import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text, IconButton, Snackbar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { useSignUpMutation } from '@/services/auth.service';
import { RegisterFormData } from '@/types/form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Create a zod schema for form validation
const registerSchema = z
  .object({
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    age: z
      .preprocess((val) => (val === "" ? undefined : Number(val)), 
        z.number()
          .min(18, "You must be at least 18 years old")
          .max(70, "Age must be less than 70 years old")
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const RegisterForm = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = useSignUpMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      age: undefined,
      password: '',
      confirmPassword: '',
    },
  });

  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarColor, setSnackbarColor] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Clear any previous email error
      setEmailError('');
      
      await mutateAsync(data);
      
      setShowSuccessMessage(true);
      setSnackbarMessage('Registration Successful! Proceeding to login...');
      setSnackbarColor('#4BB543'); // Green color for success
      setSnackbarVisible(true);
      
      // Navigate to sign-in after successful registration
      setTimeout(() => {
        router.push('/(auth)/sign-in');
      }, 2000);
    } catch (err: any) {
      console.log('Could not register', err);
      
      // Check if the error is about email already existing
      if (
        err?.response?.data?.message === "Email already exists" || 
        err?.message?.includes("Email already exists")
      ) {
        setEmailError('Email already exists. Please use a different email address.');
        setSnackbarMessage('Email already exists');
        setSnackbarColor('#FF0000'); // Red color for error
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage('Error while registering, please try later!');
        setSnackbarColor('#FF0000'); // Red color for error
        setSnackbarVisible(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Message Banner */}
      {showSuccessMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Registration Successful! Proceeding to login...</Text>
        </View>
      )}

      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          RouteMate
        </Text>
        <View style={styles.taglineContainer}>
          <Text style={styles.trackRide}>Track Your Ride,</Text>
          <Text style={styles.anywhere}>Anywhere,</Text>
          <Text style={styles.anytime}>Anytime.</Text>
        </View>
      </View>

      <Text style={styles.registerFormText}>Signup</Text>

      {/* Email Field with Icon */}
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              onBlur={onBlur}
              onChangeText={(text) => {
                onChange(text);
                // Clear email error when user types
                if (emailError) setEmailError('');
              }}
              placeholder="Email"
              value={value}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
              style={styles.input}
              error={!!errors.email || !!emailError}
              left={<TextInput.Icon icon="email" />}
            />
          </View>
        )}
        name="email"
        rules={{ required: true }}
      />
      {errors.email ? (
        <Text style={styles.errorText}>{errors.email.message}</Text>
      ) : emailError ? (
        <Text style={styles.errorText}>{emailError}</Text>
      ) : null}

      {/* First Name and Last Name Fields with Icons */}
      <View style={styles.nameContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="First Name"
              value={value}
              mode="outlined"
              style={[styles.input, styles.nameInput]}
              error={!!errors.firstName}
              left={<TextInput.Icon icon="account" />}
            />
          )}
          name="firstName"
          rules={{ required: true }}
        />
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Last Name"
              value={value}
              mode="outlined"
              style={[styles.input, styles.nameInput]}
              error={!!errors.lastName}
              left={<TextInput.Icon icon="account" />}
            />
          )}
          name="lastName"
          rules={{ required: true }}
        />
      </View>
      <View style={styles.errorContainer}>
        <View style={{ flex: 0.5 }}>
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName.message}</Text>
          )}
        </View>
        <View style={{ flex: 0.5 }}>
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName.message}</Text>
          )}
        </View>
      </View>

      {/* Age Field with Icon */}
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={(val) => onChange(val)}
            placeholder="Age"
            value={value !== undefined ? String(value) : ''}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            error={!!errors.age}
            left={<TextInput.Icon icon="calendar" />}
          />
        )}
        name="age"
        rules={{ required: true }}
      />
      {errors.age && (
        <Text style={styles.errorText}>{errors.age.message}</Text>
      )}

      {/* Password Field with Icon */}
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Password"
            value={value}
            secureTextEntry={!passwordVisible}
            mode="outlined"
            style={styles.input}
            error={!!errors.password}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={passwordVisible ? 'eye' : 'eye-off'}
                onPress={() => setPasswordVisible(!passwordVisible)}
                forceTextInputFocus={false}
              />
            }
          />
        )}
        name="password"
        rules={{ required: true }}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password.message}</Text>
      )}

      {/* Confirm Password Field with Icon */}
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Confirm Password"
            value={value}
            secureTextEntry={!confirmPasswordVisible}
            mode="outlined"
            style={styles.input}
            error={!!errors.confirmPassword}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={confirmPasswordVisible ? 'eye' : 'eye-off'}
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                forceTextInputFocus={false}
              />
            }
          />
        )}
        name="confirmPassword"
        rules={{ required: true }}
      />
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
      )}

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.registerButton}
        labelStyle={styles.buttonLabel}
        disabled={isPending}
      >
        {isPending ? 'Signing up...' : 'Signup'}
      </Button>

      <Text style={styles.orText}>or</Text>

      {/* Sign In Link */}
      <View style={styles.info}>
        <Text style={styles.infoText}>Already have an account?</Text>
        <Pressable onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={styles.infoLink}>Sign in</Text>
        </Pressable>
      </View>

      {/* Snackbar for Success/Error Messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: snackbarColor }}
      >
        {snackbarMessage}
      </Snackbar>
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
  successBanner: {
    backgroundColor: '#4BB543',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  taglineContainer: {
    marginLeft: 22,
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
    marginLeft: 40,
    marginBottom: 2,
    paddingBottom: 1,
    paddingTop: 2,
  },
  anywhere: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DB2955',
    marginLeft: 40,
    marginBottom: 0,
    marginTop: -5,
    paddingTop: 4,
    paddingBottom: 1,
  },
  anytime: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DB2955',
    marginLeft: 40,
    marginBottom: 2,
    marginTop: -3,
    paddingTop: 4,
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
  inputContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    marginVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    gap: 10,
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