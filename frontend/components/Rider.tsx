import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Rider = () => {
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      name?: string;
      phone?: string;
      email?: string;
    } = {};

    if (!riderName.trim()) {
      newErrors.name = 'Rider name is required';
    }

    if (!riderPhone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(riderPhone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (riderEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(riderEmail.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Submit rider information
      Alert.alert(
        'Success',
        'Rider information submitted successfully!',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#082A3F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Rider</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Please provide information about the rider who will be operating this vehicle
          </Text>

          {/* Rider Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rider Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.errorInput]}
              placeholder="Enter rider's full name"
              placeholderTextColor="#828282"
              value={riderName}
              onChangeText={setRiderName}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Rider Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.errorInput]}
              placeholder="Enter rider's phone number"
              placeholderTextColor="#828282"
              keyboardType="phone-pad"
              value={riderPhone}
              onChangeText={setRiderPhone}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Rider Email (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={[styles.input, errors.email && styles.errorInput]}
              placeholder="Enter rider's email address"
              placeholderTextColor="#828282"
              keyboardType="email-address"
              autoCapitalize="none"
              value={riderEmail}
              onChangeText={setRiderEmail}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <Text style={styles.submitButtonText}>Save Rider Information</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.submitIcon} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#082A3F',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { height: 2, width: 0 },
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#082A3F',
  },
  headerRightPlaceholder: {
    width: 24,
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#828282',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#082A3F',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  errorInput: {
    borderColor: '#EB5757',
  },
  errorText: {
    color: '#EB5757',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#082A3F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
    shadowColor: '#082A3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 8,
  },
});

export default Rider;