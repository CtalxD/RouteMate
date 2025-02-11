import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const license = () => {
  const [LicenseNumber, setLicenseNumber] = useState('');

  // Function to handle License Number input change
  const handleInputChange = (text: string) => {
    setLicenseNumber(text);
  };

  // Function to handle form submission
  const handleSubmit = () => {
    console.log('License Number:', LicenseNumber);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>License Number</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={LicenseNumber}
          onChangeText={handleInputChange}
          placeholder="Enter License Number"
          keyboardType="default"
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#082A3F',
    textAlign: 'center',
    marginBottom: 20,
    marginRight: 65,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DB2955',
    marginBottom: 8,
  },
  input: {
    height: 55,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
    fontSize: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  submitButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    marginTop:-10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default license;
