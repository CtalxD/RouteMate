import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const BusDocuments = () => {
  const handleSectionClick = (section: string) => {
    // Handle navigation or actions based on the clicked section
    switch (section) {
      case 'Basic Info':
        console.log('Navigating to Basic Info section');
        break;
      case 'Driver License':
        console.log('Navigating to Driver License section');
        break;
      case 'Selfie with ID':
        console.log('Navigating to Selfie with ID section');
        break;
      case 'Vehicle Info':
        console.log('Navigating to Vehicle Info section');
        break;
      default:
        console.log('Unknown section');
    }
  };

  // Animated component for a smooth press effect
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

  return (
    <View style={styles.container}>
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
          <Text style={styles.arrow}>›</Text> {/* Simple arrow symbol */}
        </TouchableOpacity>

        {/* Section 2: Driver License */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Driver License')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Driver License</Text>
          <Text style={styles.arrow}>›</Text> {/* Simple arrow symbol */}
        </TouchableOpacity>

        {/* Section 3: Selfie with ID */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Selfie with ID')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Selfie with ID</Text>
          <Text style={styles.arrow}>›</Text> {/* Simple arrow symbol */}
        </TouchableOpacity>

        {/* Section 4: Vehicle Info */}
        <TouchableOpacity
          style={styles.sectionBox}
          onPress={() => handleSectionClick('Vehicle Info')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.sectionText}>Vehicle Info</Text>
          <Text style={styles.arrow}>›</Text> {/* Simple arrow symbol */}
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
    color: '#082A3F',
    textAlign: 'center',
    paddingRight: 80,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DB2955',
    textAlign: 'center',
    paddingRight: 99,
    marginBottom: 20,
  },
  sectionsContainer: {
    width: '100%',
  },
  sectionBox: {
    flexDirection: 'row', // Align text and arrow horizontally
    backgroundColor: '#f4f4f4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15, // Add margin between sections
    alignItems: 'center', // Vertically center the content
    borderWidth: 1,
    borderColor: '#082A3F',
  },
  sectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082A3F',
    flex: 1, // Allow the text to take up the available space
  },
  arrow: {
    fontSize: 24,  // Increase the font size for the arrow
    color: '#082A3F',
    marginLeft: 10, // Add space between text and arrow
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
