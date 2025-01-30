import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated, Alert, Modal, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const DriverInfo = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const animatedLineWidth = useState(new Animated.Value(0))[0];

  const handleSubmit = () => {
    console.log('Driver Info Submitted:', { firstName, lastName, dob, image });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        const imageUri = result.assets && result.assets[0]?.uri;
        if (imageUri) {
          setImage(imageUri);
        }
      }
    } else {
      Alert.alert('Permission Denied', 'You need to grant permission to access the gallery');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        const imageUri = result.assets && result.assets[0]?.uri;
        if (imageUri) {
          setImage(imageUri);
        }
      }
    } else {
      Alert.alert('Permission Denied', 'You need to grant permission to access the camera');
    }
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

  const handleBackButton = () => {
    if (Platform.OS === 'web') {
      window.history.back(); // For web, go back using browser history
    } else {
      navigation.goBack(); // For mobile, use React Navigation's goBack method
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
        <FontAwesome name="arrow-left" size={24} color="#082A3F" />
      </TouchableOpacity>

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

      <View style={styles.photoContainer} />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

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
                pickImage();
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Upload a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                takePhoto();
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

// Modify the `iconImage` style to increase the size
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: -200,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 15,
    zIndex: 1,
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
    width: 100,  // Increase width
    height: 100, // Increase height
    borderRadius: 50, // Maintain circular shape
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
    marginRight: 160,
    color: '#082A3F',
    textAlign: 'left',
  },
  secondText: {
    fontWeight: 'regular',
    fontSize: 13,
    marginTop: 5,
    marginRight: 168,
    color: '#082A3F',
    textAlign: 'left',
  },
  thirdText: {
    fontWeight: 'regular',
    fontSize: 13,
    marginTop: 5,
    marginRight: 95,
    color: '#082A3F',
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: '#082A3F',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 15,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 15,
    backgroundColor: '#082A3F',
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DriverInfo;
