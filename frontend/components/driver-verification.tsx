import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import BusDocuments from './busDocuments';
import ContactMap from './map';

const DriverVerification = () => {
  const [currentScreen, setCurrentScreen] = useState('DriverVerification');
  const [currentPage, setCurrentPage] = useState('DriverVerification');
  const [ , setPreviousPage] = useState<string | null>(null);

  const navigateToBusDocuments = () => {
    setCurrentScreen('BusDocuments');
  };

  const navigateToHome = () => {
    setPreviousPage(currentPage);
    setCurrentPage('Home');
    setCurrentScreen('map');
  };

  const renderScreen = () => {
    if (currentScreen === 'DriverVerification') {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Driver Verification</Text>
          <Text style={styles.subTitle}>Upload and verify your documents</Text>

          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.vehicleSection}
              onPress={navigateToBusDocuments}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://img.icons8.com/ios/452/bus.png' }}
                style={styles.vehicleLogo}
              />
              <Text style={styles.vehicleText}>Bus Documents</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={navigateToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.footerButtonText}>Switch to Passenger Mode</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentScreen === 'BusDocuments') {
      return <BusDocuments />;
    } else if (currentScreen === 'map') {
      return <ContactMap/>;  
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    paddingRight: 30,
    color: '#082A3F',
    textAlign: 'center',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DB2955',
    paddingRight: 50,
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionContainer: {
    marginTop: 20,
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  vehicleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#082A3F',
    marginLeft: 15,
  },
  vehicleLogo: {
    width: 40,
    height: 40,
  },
  footerButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default DriverVerification;