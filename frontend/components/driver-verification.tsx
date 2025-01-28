import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Easing } from 'react-native';
import BusDocuments from './busDocuments';  // Import the separate screen component
import MircoDocuments from './microDocuments';

const DriverVerification = () => {
  const [isDriverSectionOpen, setDriverSectionOpen] = useState(false);
  const [animationHeight] = useState(new Animated.Value(0));
  const [currentScreen, setCurrentScreen] = useState('DriverVerification'); // Track the current screen

  const handlePress = () => {
    setDriverSectionOpen(!isDriverSectionOpen);
    Animated.timing(animationHeight, {
      toValue: isDriverSectionOpen ? 0 : 160,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const navigateToBusDocuments = () => {
    setCurrentScreen('BusDocuments'); // Navigate to the BusDocuments screen
  };

  const renderScreen = () => {
    if (currentScreen === 'DriverVerification') {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Driver Verification</Text>
          <Text style={styles.subTitle}>Upload and verify your documents</Text>

          <TouchableOpacity style={styles.driverSection} onPress={handlePress}>
            <View style={styles.iconContainer}>
              <Image
                source={{ uri: 'https://img.icons8.com/ios/452/car.png' }} // Car Logo
                style={styles.driverLogo}
              />
              <Text style={styles.driverText}>Driver</Text>
            </View>
            <Text style={[styles.arrow, { color: isDriverSectionOpen ? '#082A3F' : '#000000' }]}> ▼</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.dropdown, { height: animationHeight }]}>
  <TouchableOpacity style={styles.subSection} onPress={navigateToBusDocuments}>
    <Image
      source={{ uri: 'https://img.icons8.com/ios/452/bus.png' }} // Bus Logo
      style={styles.subSectionLogo}
    />
    <Text style={styles.subSectionText}>Bus</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.subSection} onPress={navigateToBusDocuments}>
    <Image
      source={{ uri: 'https://img.icons8.com/ios/452/van.png' }} // Microbus (Van) Logo
      style={styles.subSectionLogo}
    />
    <Text style={styles.subSectionText}>Microbus</Text>
  </TouchableOpacity>
</Animated.View>


          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Switch to Passenger Mode</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentScreen === 'BusDocuments') {
      return <BusDocuments />;  // Render the BusDocuments component when navigating
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
    fontFamily: '',
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
    marginBottom: 10,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginTop: 20,
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
  },
  driverText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#082A3F',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dropdown: {
    overflow: 'hidden',
    width: '100%',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderRadius: 8,
  },
  subSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginTop: 10,
    justifyContent: 'flex-start',
    backgroundColor: '#e9e9e9',
  },
  subSectionText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 10,
    color: '#082A3F',
  },
  subSectionLogo: {
    width: 30,
    height: 30,
  },
  footerButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default DriverVerification;
