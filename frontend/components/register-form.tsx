import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text, IconButton, Snackbar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { useSignUpMutation } from '@/services/auth.service';
import { RegisterFormData } from '@/types/form';

const RegisterForm = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = useSignUpMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      age: undefined,
      password: '',
      confirmPassword: '',
      // role: 'user', //enum jun chai driver user
    },
  });

  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await mutateAsync(data);
      
      setSnackbarMessage('Registration Successful!');
      setSnackbarVisible(true);
      // reset();
      router.push('/(auth)/sign-in');
    } catch (err) {
      setSnackbarMessage('Error while registering, please try later!');
      setSnackbarVisible(true);
      console.log('Could not register', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        RouteMate
      </Text>
      <Text style={styles.trackRide}>Track Your Ride,</Text>
      <Text style={styles.anywhere}>Anywhere,</Text>
      <Text style={styles.anytime}>Anytime.</Text>

      <Text style={styles.registerFormText}>Signup</Text>

      {/* Email Field */}
      <Controller
        control={control}
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
            error={!!errors.email}
          />
        )}
        name="email"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      {/* First Name and Last Name Fields */}
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
            />
          )}
          name="firstName"
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
            />
          )}
          name="lastName"
        />
      </View>
      <View style={styles.errorContainer}>
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}
      </View>

      {/* Age Field */}
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
          />
        )}
        name="age"
      />
      {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}

      {/* Password Field */}
      <Controller
        control={control}
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
              error={!!errors.password}
            />
            <IconButton
              icon={passwordVisible ? 'eye' : 'eye-off'}
              size={24}
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.iconButton}
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            />
          </View>
        )}
        name="password"
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      {/* Confirm Password Field */}
      <Controller
        control={control}
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
              error={!!errors.confirmPassword}
            />
            <IconButton
              icon={confirmPasswordVisible ? 'eye' : 'eye-off'}
              size={24}
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={styles.iconButton}
              accessibilityLabel={
                confirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'
              }
            />
          </View>
        )}
        name="confirmPassword"
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.registerButton}
        labelStyle={styles.buttonLabel}
        disabled={isPending}>
        {isPending ? 'Signing up...' : 'Signup'}
      </Button>

      <Text style={styles.orText}>or</Text>

      {/* Sign In Link */}
      <View style={styles.info}>
        <Text style={styles.infoText}>Already have an account?</Text>
        <Link style={styles.infoLink} href="/(auth)/sign-in">
          Sign in
        </Link>
      </View>

      {/* Snackbar for Success/Error Messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}>
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
  nameContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 0.5, // Each input takes half the width
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
