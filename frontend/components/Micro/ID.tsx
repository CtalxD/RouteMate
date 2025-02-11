import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions, ImagePickerResponse } from 'react-native-image-picker';

const SelfieWithID = ({ navigation }: any) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.5,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User canceled image picker');
      } else if (response.errorCode) {
        console.log('Error: ', response.errorMessage);
      } else {
        // Ensure that the URI is defined; if not, set image to null.
        if (response.assets && response.assets[0] && response.assets[0].uri) {
          setImage(response.assets[0].uri);
        } else {
          setImage(null);
        }
      }
    });
  };

  const takePhoto = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.5,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User canceled camera');
      } else if (response.errorCode) {
        console.log('Error: ', response.errorMessage);
      } else {
        // Ensure that the URI is defined; if not, set image to null.
        if (response.assets && response.assets[0] && response.assets[0].uri) {
          setImage(response.assets[0].uri);
        } else {
          setImage(null);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (image) {
      console.log('Submit selfie with ID:', image);
      // Perform submit action, such as uploading the image
    } else {
      console.log('No image selected');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selfie with ID</Text>

      <View style={styles.boxContainer}>
        <Text style={styles.description}>Upload a selfie with your ID to verify your identity.</Text>

        {/* Upload Selfie Button */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setIsModalVisible(true)} // Show modal on button press
        >
          <Text style={styles.uploadText}>Upload Selfie</Text>
        </TouchableOpacity>

        {/* Show selected image */}
        {image && (
          <Image
            source={{ uri: image }}
            style={{ width: 200, height: 200, marginTop: 20, borderRadius: 10 }}
          />
        )}

        {/* Additional description below the upload button */}
        <Text style={styles.additionalDescription}>
          Take a selfie with your driver license next to your face. Make sure your face and information on your document are clearly visible.
        </Text>
      </View>

      {/* Submit Button outside the boxContainer */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

      {/* Modal to choose between taking a photo or uploading an image */}
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
              style={[styles.modalButton, { backgroundColor: '#ccc' }] }
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
    justifyContent: 'flex-start', // Aligns content to the top
    alignItems: 'center', // Keeps the content centered horizontally
    backgroundColor: '#fff',
    marginTop: 140, // Adds a margin to move the content a bit down
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#082A3F',
    marginBottom: 0,
    paddingRight:120,
    paddingBottom: 30,
  },
  boxContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#d3d3d3',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Adds a slight shadow effect
  },
  description: {
    fontSize: 16,
    color: '#082A3F',
    marginBottom: 30,
    textAlign: 'center',
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
  additionalDescription: {
    fontSize: 14,
    color: '#082A3F',
    marginTop: 20,
    textAlign: 'center', // Ensures the text is centered horizontally
    width: '100%', // Optional: helps with wrapping the text in case it overflows
  },
  submitButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Modal styles
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

export default SelfieWithID;
