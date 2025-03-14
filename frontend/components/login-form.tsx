import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import type { LoginFormData } from '../types/form';
import { useAuth } from '@/context/auth-context';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
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
      <Text style={styles.trackRide}>Track Your Ride,</Text>
      <Text style={styles.anywhere}>Anywhere,</Text>
      <Text style={styles.anytime}>Anytime.</Text>

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
          <View style={styles.passwordContainer}>
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Password"
              value={value}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={[styles.input, styles.passwordInput]}
            />
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={24}
              color="gray"
              style={styles.passwordIcon}
              onPress={() => setShowPassword((prev) => !prev)}
            />
          </View>
        )}
        name="password"
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <Link style={styles.forgotPassword} href="/(auth)/forgot-password">
        Forgot Password
      </Link>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.loginButton}
        labelStyle={styles.loginButtonText}
      >
        Login
      </Button>

      <Text style={styles.orText}>or</Text>
      <Link style={styles.registerLink} href="/(auth)/sign-up">
        Signup
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
    fontFamily: '',
    fontSize: 43,
    fontWeight: 'bold',
    color: '#082A3F',
    textAlign: 'center',
    marginBottom: 4,
    paddingTop: 10,
    paddingBottom: 10,
  },

  trackRide: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DB2955',
    textAlign: 'center',
    marginBottom: 2,
    marginLeft: -22,
    marginRight: 15,
    marginTop: 1,
    paddingBottom: 1,
    paddingTop: 1,
  },

  anywhere: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DB2955',
    textAlign: 'center',
    marginBottom: 2,
    marginLeft: -96,
    marginRight: 15,
    marginTop: 1,
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
    marginTop: 2,
    paddingTop: 1,
    paddingBottom: 20,
  },

  loginTitle: {
    fontFamily: '',
    fontSize: 24,
    color: '#082A3F',
    fontWeight: 'bold',
    marginBottom: 10,
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
    position: 'relative',
  },

  passwordInput: {
    paddingRight: 40, // To give space for the icon
  },

  passwordIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
  },

  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    color: '#082A3F',
    marginTop: 5,
    marginBottom: 12,
    textDecorationLine: 'underline',
  },

  loginButton: {
    marginBottom: 16,
    backgroundColor: '#082A3F',
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '60%',
    paddingVertical: 0,
    alignItems: 'center',
    marginTop: 10,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  orText: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
    color: '#808080',
  },

  registerLink: {
    marginBottom: 16,
    backgroundColor: '#DB2955',
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '60%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginForm;
