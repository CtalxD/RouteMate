import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SelfieWithID = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selfie with ID</Text>
      <Text style={styles.description}>Upload a selfie with your ID to verify your identity.</Text>

      {/* Add your input fields and functionality for the selfie here */}
      {/* Example: */}
      <TouchableOpacity style={styles.uploadButton}>
        <Text style={styles.uploadText}>Upload Selfie</Text>
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

export default SelfieWithID;
