import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DriverInfo from './Bus/DriverInfo'; // Import DriverInfo component
import DriverLicense from './Bus/license'; // Import DriverLicense component
import SelfieWithID from './Bus/ID'; // Import SelfieWithID component
import VehicleInfo from './Bus/VehicleInfo'; // Import VehicleInfo component
import DriverVerification from './driver-verification'; // Import DriverVerification component

const BusDocuments = () => {
  const [currentPage, setCurrentPage] = useState('busDocuments'); // Track current page
  const [pageHistory, setPageHistory] = useState(['busDocuments']); // Keep track of page history

  // Function to change pages based on section clicked
  const handleSectionClick = (
    section: 'Basic Info' | 'Driver License' | 'Selfie with ID' | 'Vehicle Info'
  ) => {
    if (section === 'Basic Info') {
      setCurrentPage('driverInfo');
      setPageHistory([...pageHistory, 'driverInfo']);
    } else if (section === 'Driver License') {
      setCurrentPage('driverLicense');
      setPageHistory([...pageHistory, 'driverLicense']);
    } else if (section === 'Selfie with ID') {
      setCurrentPage('selfieWithID');
      setPageHistory([...pageHistory, 'selfieWithID']);
    } else if (section === 'Vehicle Info') {
      setCurrentPage('vehicleInfo');
      setPageHistory([...pageHistory, 'vehicleInfo']);
    }
  };

  // Function to handle back button click
  const handleBackPress = () => {
    const newHistory = [...pageHistory];
    newHistory.pop(); // Remove the current page

    if (newHistory.length === 0) {
      // If there are no more pages in history, navigate to the 'driver-verification' page
      setCurrentPage('driver-verification');
    } else {
      setPageHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]); // Set the previous page as current
    }
  };

  // Animated component for smooth press effect
  const [scaleValue] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95, // Scale down effect
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1, // Scale back to normal
      useNativeDriver: true,
    }).start();
  };

  const handleDonePress = () => {
    // Handle Done button click
    console.log('Done button pressed');
  };

  // Conditional rendering based on the current page
  if (currentPage === 'driver-verification') {
    return <DriverVerification />; // Show DriverVerification page when currentPage is 'driver-verification'
  }

  if (currentPage === 'driverInfo') {
    return (
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress} // Custom back navigation
        >
          <Ionicons name="arrow-back" size={30} color="#082A3F" /> {/* Back arrow icon */}
        </TouchableOpacity>

        <DriverInfo />
      </View>
    );
  }

  if (currentPage === 'driverLicense') {
    return (
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress} // Custom back navigation
        >
          <Ionicons name="arrow-back" size={30} color="#082A3F" /> {/* Back arrow icon */}
        </TouchableOpacity>

        <DriverLicense />
      </View>
    );
  }

  if (currentPage === 'selfieWithID') {
    return (
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress} // Custom back navigation
        >
          <Ionicons name="arrow-back" size={30} color="#082A3F" /> {/* Back arrow icon */}
        </TouchableOpacity>

        <SelfieWithID />
      </View>
    );
  }

  if (currentPage === 'vehicleInfo') {
    return (
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress} // Custom back navigation
        >
          <Ionicons name="arrow-back" size={30} color="#082A3F" /> {/* Back arrow icon */}
        </TouchableOpacity>

        <VehicleInfo />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress} // Custom back navigation
      >
        <Ionicons name="arrow-back" size={30} color="#082A3F" /> {/* Back arrow icon */}
      </TouchableOpacity>

      <Text style={styles.title}>Bus Documents</Text>
      <Text style={styles.subTitle}>Upload your documents here.</Text>

      <View style={styles.sectionsContainer}>
        {/* Section 1: Basic Info */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Basic Info')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Basic Info</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Section 2: Driver License */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Driver License')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Driver License</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Section 3: Selfie with ID */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Selfie with ID')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Selfie with ID</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Section 4: Vehicle Info */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Vehicle Info')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Vehicle Info</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDonePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#082A3F',
    textAlign: 'center',
    paddingRight: 130,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DB2955',
    textAlign: 'center',
    paddingRight: 118,
    marginBottom: 20,
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
  doneButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default BusDocuments; 