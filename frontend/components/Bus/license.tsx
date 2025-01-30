import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DriverLicense = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver License</Text>
      <Text style={styles.description}>Upload your driver license to verify your eligibility.</Text>

      {/* Add your input fields and functionality for the driver license here */}
      {/* Example: */}
      <TouchableOpacity style={styles.uploadButton}>
        <Text style={styles.uploadText}>Upload Driver License</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#082A3F',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#777',
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default DriverLicense;
