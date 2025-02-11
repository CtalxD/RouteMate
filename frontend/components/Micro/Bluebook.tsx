import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, TextInput } from 'react-native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions, ImagePickerResponse } from 'react-native-image-picker';

const Bluebook = () => {
  const [isModalVisible1, setIsModalVisible1] = useState(false);  // Modal for first section
  const [isModalVisible2, setIsModalVisible2] = useState(false);  // Modal for second section
  const [image1, setImage1] = useState<string | null>(null);  // For first section
  const [image2, setImage2] = useState<string | null>(null);  // For second section
  const [productionYear, setProductionYear] = useState<string>('');  // For vehicle production year

  const pickImage = (section: number) => {
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
          if (section === 1) {
            setImage1(response.assets[0].uri);  // Set for first section
          } else {
            setImage2(response.assets[0].uri);  // Set for second section
          }
        }
      }
    });
  };

  const takePhoto = (section: number) => {
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
          if (section === 1) {
            setImage1(response.assets[0].uri);  // Set for first section
          } else {
            setImage2(response.assets[0].uri);  // Set for second section
          }
        }
      }
    });
  };

  const handleSubmit = () => {
    if (image1) {
      console.log('Submit first section image:', image1);
    } else {
      console.log('No image selected for the first section');
    }
    if (image2) {
      console.log('Submit second section image:', image2);
    } else {
      console.log('No image selected for the second section');
    }
    console.log('Vehicle Production Year:', productionYear);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blue Book</Text>

      <View style={styles.boxContainer}>
        <Text style={styles.boxText}>Bluebook page with vehicle registration number </Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setIsModalVisible1(true)}  // Open first modal
        >
          <Text style={styles.uploadText}>Upload a Photo</Text>
        </TouchableOpacity>

        {/* Image preview for first upload */}
        {image1 && (
          <Image source={{ uri: image1 }} style={styles.imagePreview} />
        )}

        <Text style={styles.moreDescription}>
          Upload second and third page of the Bluebook
        </Text>
        <Text style={styles.moreDescription1}>
          Make sure details are clearly visible
        </Text>
      </View>

      {/* New Box Container for second section */}
      <View style={styles.boxContainer}>
        <Text style={styles.boxText}>Bluebook page with detailed description of vehicle</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setIsModalVisible2(true)}  // Open second modal
        >
          <Text style={styles.uploadText}>Upload Another Photo</Text>
        </TouchableOpacity>

        {/* Image preview for second upload */}
        {image2 && (
          <Image source={{ uri: image2 }} style={styles.imagePreview} />
        )}

        <Text style={styles.moreDescription}>
          Upload ninth or tenth page of Bluebook
        </Text>
        <Text style={styles.moreDescription1}>
          Or the page where vehicle description are given
        </Text>
      </View>

      {/* TextInput for vehicle production year */}
      <TextInput
        style={styles.input}
        placeholder="Enter Vehicle Production Year"
        keyboardType="numeric"
        value={productionYear}
        onChangeText={setProductionYear}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {/* Modal for first upload */}
      <Modal
        visible={isModalVisible1}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible1(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose an Option</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                pickImage(1);  // First section
                setIsModalVisible1(false);
              }}
            >
              <Text style={styles.modalButtonText}>Upload a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                takePhoto(1);  // First section
                setIsModalVisible1(false);
              }}
            >
              <Text style={styles.modalButtonText}>Take a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}

              onPress={() => setIsModalVisible1(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for second upload */}
      <Modal
        visible={isModalVisible2}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible2(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose an Option</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                pickImage(2);  // Second section
                setIsModalVisible2(false);
              }}
            >
              <Text style={styles.modalButtonText}>Upload a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                takePhoto(2);  // Second section
                setIsModalVisible2(false);
              }}
            >
              <Text style={styles.modalButtonText}>Take a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#ccc' }]}

              onPress={() => setIsModalVisible2(false)}
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
    paddingTop: 100,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#082A3F',
    textAlign: 'center',
    marginBottom: 20,
    marginRight: 110,
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
    marginTop: 10,
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
    marginTop: 10,
    marginBottom: 20,
  },
  moreDescription: {
    fontSize: 14,
    color: '#082A3F',
    marginTop: 10,
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
    marginTop: 0,  // Adjusted margin
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
  input: {
    height: 55,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
    fontSize: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
});

export default Bluebook;
