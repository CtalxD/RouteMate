import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Button, Text } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import type { RegisterFormData } from '../types/form';
import { Link, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { signUp } from '@/services/auth.service';

const RegisterForm = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      role: 'User',  
    }
  });

  const router = useRouter();
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['register-user'],
    mutationFn: signUp,
  });

  const onSubmit = (data: RegisterFormData) => {
    mutateAsync(
      {
        email: data.email,
        password: data.password,
        role: data.role,
      },
      {
        onSuccess: () => {
          Alert.alert('Registration Successful!');
          router.push('/(auth)/sign-in');
        },
        onError: (err) => {
          console.log('Could not register', err.name, err.message);
          Alert.alert('Error while registering please try later!');
        },
      }
    );
    reset();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>RouteMate</Text>
      <Text style={styles.trackRide}>Track Your Ride,</Text>
      <Text style={styles.anywhere}>Anywhere,</Text>
      <Text style={styles.anytime}>Anytime.</Text>

      {/* Styled Register Form Text */}
      <Text style={styles.registerFormText}>Register Form</Text>

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

      <Button disabled={isPending} onPress={handleSubmit(onSubmit)} style={styles.registerButton} labelStyle={styles.buttonLabel}>
        Register
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
    paddingTop : 2,
  },

  info: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 5,
    justifyContent: 'center', // Center horizontally
    alignItems: 'center',    // Center vertically
  },
  

  infoLink: {
    fontSize: 16,
    color: '#082A3F', 
    textDecorationLine: 'underline',
  },

});

export default RegisterForm;
