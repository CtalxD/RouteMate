import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Registration from './Registration'; // Import Registration component
import VehiclePicture from './VehiclePicture'; // Import VehiclePicture component
import Bluebook from './Bluebook'; // Import Bluebook component

const VehicleInfo = () => {
  const [screen, setScreen] = useState<'main' | 'registration' | 'vehiclePicture' | 'Bluebook'>('main');

  // Function to handle navigation
  const handleNavigation = (destination: 'registration' | 'vehiclePicture' | 'Bluebook') => {
    setScreen(destination);
  };

  return (
    <View style={styles.container}>
      {screen === 'registration' ? (
        <Registration /> // Show Registration screen
      ) : screen === 'vehiclePicture' ? (
        <VehiclePicture /> // Show VehiclePicture screen
      ) : screen === 'Bluebook' ? (
        <Bluebook /> // Show Bluebook screen
      ) : (
        <>
          <Text style={styles.title}>Vehicle Information</Text>
          <Text style={styles.description}>Provide the details of your vehicle.</Text>

          <View style={styles.sectionsContainer}>
            {/* Section 1: Registration Plate */}
            <TouchableOpacity
              style={styles.sectionBox}
              onPress={() => handleNavigation('registration')}
            >
              <Text style={styles.sectionText}>Registration Plate</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            {/* Section 2: Vehicle Picture */}
            <TouchableOpacity
              style={styles.sectionBox}
              onPress={() => handleNavigation('vehiclePicture')}
            >
              <Text style={styles.sectionText}>Vehicle Picture</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            {/* Section 3: Blue Book */}
            <TouchableOpacity
              style={styles.sectionBox}
              onPress={() => handleNavigation('Bluebook')}
            >
              <Text style={styles.sectionText}>Blue Book</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadText}>Submit</Text>
          </TouchableOpacity>
        </>
      )}
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
    marginBottom: 10,
    marginRight: 40,
  },
  description: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DB2955',
    textAlign: 'center',
    marginBottom: 20,
    marginRight: 50,
  },
  sectionsContainer: {
    width: '100%',
  },
  sectionBox: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#082A3F',
  },
  sectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082A3F',
    flex: 1,
  },
  arrow: {
    fontSize: 24,
    color: '#082A3F',
    marginLeft: 10,
  },
  uploadButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default VehicleInfo;
