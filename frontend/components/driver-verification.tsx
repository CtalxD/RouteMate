import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Modal, TouchableOpacity } from 'react-native';

const DriverVerification = () => {
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicle1, setVehicle1] = useState('');
  const [vehicle2, setVehicle2] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isFirstVehicle, setIsFirstVehicle] = useState(true);

  const vehicleOptions = [
    'Vehicle 1',
    'Vehicle 2',
    'Vehicle 3',
    'Vehicle 4',
  ];

  const handleSubmit = () => {
    if (!name || !licenseNumber || !vehicle1 || !vehicle2) {
      alert('Please fill all the fields.');
      return;
    }
    alert('Documents and vehicles selected.');
  };

  const handleVehicleSelect = (vehicle: string) => {
    if (isFirstVehicle) {
      setVehicle1(vehicle);
      setIsFirstVehicle(false);
    } else {
      setVehicle2(vehicle);
      setIsModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Verification</Text>
      
      <Text style={styles.label}>Full Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
      />
      
      <Text style={styles.label}>License Number:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your license number"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
      />

      <Text style={styles.label}>Select Vehicle 1:</Text>
      <TouchableOpacity onPress={() => { setIsModalVisible(true); setIsFirstVehicle(true); }}>
        <TextInput
          style={styles.input}
          placeholder="Select Vehicle 1"
          editable={false}
          value={vehicle1}
        />
      </TouchableOpacity>

      <Text style={styles.label}>Select Vehicle 2:</Text>
      <TouchableOpacity onPress={() => { setIsModalVisible(true); setIsFirstVehicle(false); }}>
        <TextInput
          style={styles.input}
          placeholder="Select Vehicle 2"
          editable={false}
          value={vehicle2}
        />
      </TouchableOpacity>

      <Button title="Submit" onPress={handleSubmit} />

      {/* Modal for vehicle selection */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Vehicle</Text>
            {vehicleOptions.map((vehicle, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalButton}
                onPress={() => handleVehicleSelect(vehicle)}
              >
                <Text>{vehicle}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Close" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 8,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#ddd',
    marginBottom: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default DriverVerification;
