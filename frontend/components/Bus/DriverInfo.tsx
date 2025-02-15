import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated, Alert, Modal, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';

const DriverInfo = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const animatedLineWidth = useState(new Animated.Value(0))[0];

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/driverInfo/submit', {
        firstName,
        lastName,
        dob,
        image,
      });
      console.log('Driver Info Submitted:', response.data);
    } catch (error) {
      console.error('Error submitting driver info:', error);
    }
  };

  const pickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.5,
    };

    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        console.log('User canceled image picker');
      } else if (response.errorCode) {
        console.log('Error: ', response.errorMessage);
      } else {
        setImage(response.assets[0].uri); 
      }
    });
  };

  const takePhoto = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.5,
    };

    launchCamera(options, (response: any) => {
      if (response.didCancel) {
        console.log('User canceled camera');
      } else if (response.errorCode) {
        console.log('Error: ', response.errorMessage);
      } else {
        setImage(response.assets[0].uri); // Fixed here
      }
    });
  };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([ 
        Animated.timing(animatedLineWidth, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedLineWidth, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
  }, [animatedLineWidth]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconSection}>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} activeOpacity={1}>
          {image ? (
            <Image source={{ uri: image }} style={styles.iconImage} />
          ) : (
            <FontAwesome name="user-circle" size={60} color="#082A3F" />
          )}
        </TouchableOpacity>
        <Text style={styles.requirementText}>Requirement</Text>
        <Text style={styles.firstText}>- Do not use any filter</Text>
        <Text style={styles.secondText}>- Face to the Camera</Text>
        <Text style={styles.thirdText}>- Do not wear sunglasses or Mask</Text>
        <Animated.View
          style={[
            styles.animatedLine,
            {
              width: animatedLineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={dob ? dob.toLocaleDateString('en-CA') : ''}
          onChange={(e) => setDob(new Date(e.target.value))}
          style={styles.input}
        />
      ) : (
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: dob ? '#000' : '#888' }}>
            {dob ? dob.toLocaleDateString() : 'Date of Birth'}
          </Text>
        </TouchableOpacity>
      )}

      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

      {/* Modal for image upload or camera */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose an Option</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                pickImage(); // Pick image from gallery
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Upload a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                takePhoto(); // Take a photo using camera
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Take a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: -200,
  },
  iconSection: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
  },
  animatedLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: '#082A3F',
  },
  iconImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  requirementText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
    marginRight: 193,
    color: '#082A3F',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  firstText: {
    fontWeight: 'regular',
    fontSize: 13,
    marginTop: 5,
    marginRight: 150,
    color: '#082A3F',
    textAlign: 'left',
  },
  secondText: {
    fontWeight: 'regular',
    fontSize: 13,
    marginTop: 5,
    marginRight: 158,
    color: '#082A3F',
    textAlign: 'left',
  },
  thirdText: {
    fontWeight: 'regular',
    fontSize: 13,
    marginTop: 5,
    marginRight: 80,
    color: '#082A3F',
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: '#082A3F',
    borderRadius: 8,
    padding: 15,  // Increased padding for larger text box
    marginBottom: 15,
    fontSize: 16,  // Increased font size for better readability
  },
  submitButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent black background
  },
  modalContainer: {
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082A3F',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default DriverInfo;
