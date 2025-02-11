import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions, ImagePickerResponse } from 'react-native-image-picker';

const VehiclePicture = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);  // Explicitly define type

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
      console.log('Submit vehicle image:', image);
    } else {
      console.log('No image selected');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Picture</Text>

      <View style={styles.boxContainer}>
        <Text style={styles.boxText}>Upload Photo of your vehicle</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.uploadText}>Upload a Photo</Text>
        </TouchableOpacity>

        {/* Image preview */}
        {image && (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        )}

        <Text style={styles.moreDescription}>
          Upload front side of the vehicle
        </Text>
        <Text style={styles.moreDescription1}>
          Make sure your registration plate is visible
        </Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    paddingTop: 150,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#082A3F',
    textAlign: 'center',
    marginBottom: 20,
    marginRight: 40,
  },
  boxContainer: {
    backgroundColor: '#d3d3d3',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  boxText: {
    fontSize: 14,
    color: '#082A3F',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  moreDescription: {
    fontSize: 14,
    color: '#082A3F',
    marginTop: 20,
    textAlign: 'center',
  },
  moreDescription1: {
    fontSize: 14,
    color: '#082A3F',
    marginTop: 5,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#082A3F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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

export default VehiclePicture;
