import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Image, 
  Alert, 
  Platform, 
  PermissionsAndroid,
  Dimensions,
  SafeAreaView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary, ImagePickerResponse, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import DriverVerification from './driver-verification';

const { width } = Dimensions.get('window');

type FormData = {
  licenseNumber: string;
  productionYear: string;
  blueBookImages: string[];
  vehicleImages: string[];
};

type Errors = {
  licenseNumber?: string;
  productionYear?: string;
  blueBookImages?: string;
  vehicleImages?: string;
};

const BusDocuments = () => {
  const [currentPage, setCurrentPage] = useState<'busDocuments' | 'driver-verification'>('busDocuments');
  const [pageHistory, setPageHistory] = useState<('busDocuments' | 'driver-verification')[]>(['busDocuments']);
  const [formData, setFormData] = useState<FormData>({
    licenseNumber: '',
    productionYear: '',
    blueBookImages: [],
    vehicleImages: []
  });
  const [errors, setErrors] = useState<Errors>({});

  const handleBackPress = () => {
    const newHistory = [...pageHistory];
    newHistory.pop();

    if (newHistory.length === 0) {
      setCurrentPage('driver-verification');
    } else {
      setPageHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]);
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      const newErrors = {...errors};
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    
    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
    } else if (isNaN(Number(formData.licenseNumber))) {
      newErrors.licenseNumber = 'License number must be a number';
    }
    
    if (!formData.productionYear) {
      newErrors.productionYear = 'Production year is required';
    } else if (isNaN(Number(formData.productionYear))) {
      newErrors.productionYear = 'Production year must be a number';
    } else if (formData.productionYear.length !== 4) {
      newErrors.productionYear = 'Please enter a valid year (YYYY)';
    }
    
    if (formData.blueBookImages.length === 0) {
      newErrors.blueBookImages = 'At least one blue book image is required';
    }
    
    if (formData.vehicleImages.length === 0) {
      newErrors.vehicleImages = 'At least one vehicle image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      Alert.alert('Success', 'Documents submitted successfully!');
      console.log('Form data:', formData);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to your storage",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const pickImage = async (type: 'blueBook' | 'vehicle') => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to select photos');
      return;
    }

    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
      selectionLimit: 1,
    };

    try {
      const response = await launchImageLibrary(options);
      handleImageResponse(response, type);
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const takePhoto = async (type: 'blueBook' | 'vehicle') => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      cameraType: 'back',
      saveToPhotos: true,
    };

    try {
      const response = await launchCamera(options);
      handleImageResponse(response, type);
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleImageResponse = (response: ImagePickerResponse, type: 'blueBook' | 'vehicle') => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', response.errorMessage || 'Failed to select image');
    } else if (response.assets && response.assets[0]?.uri) {
      const newImage = response.assets[0].uri;
      addImageToForm(newImage, type);
    }
  };

  const addImageToForm = (newImage: string, type: 'blueBook' | 'vehicle') => {
    if (type === 'blueBook') {
      setFormData(prev => ({
        ...prev,
        blueBookImages: [...prev.blueBookImages, newImage]
      }));
      if (errors.blueBookImages) {
        setErrors(prev => ({
          ...prev,
          blueBookImages: undefined
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        vehicleImages: [...prev.vehicleImages, newImage]
      }));
      if (errors.vehicleImages) {
        setErrors(prev => ({
          ...prev,
          vehicleImages: undefined
        }));
      }
    }
  };

  const removeImage = (index: number, type: 'blueBook' | 'vehicle') => {
    if (type === 'blueBook') {
      const updatedImages = [...formData.blueBookImages];
      updatedImages.splice(index, 1);
      setFormData({
        ...formData,
        blueBookImages: updatedImages
      });
    } else {
      const updatedImages = [...formData.vehicleImages];
      updatedImages.splice(index, 1);
      setFormData({
        ...formData,
        vehicleImages: updatedImages
      });
    }
  };

  if (currentPage === 'driver-verification') {
    return <DriverVerification />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#082A3F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bus Documents</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>Please provide all required documents to complete your bus registration</Text>

          {/* License Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Number</Text>
            <TextInput
              style={[styles.input, errors.licenseNumber && styles.errorInput]}
              placeholder="Enter license number"
              placeholderTextColor="#828282"
              keyboardType="numeric"
              value={formData.licenseNumber}
              onChangeText={(text) => handleInputChange('licenseNumber', text)}
            />
            {errors.licenseNumber && <Text style={styles.errorText}>{errors.licenseNumber}</Text>}
          </View>

          {/* Production Year */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Production Year</Text>
            <TextInput
              style={[styles.input, errors.productionYear && styles.errorInput]}
              placeholder="Enter production year (YYYY)"
              placeholderTextColor="#828282"
              keyboardType="numeric"
              maxLength={4}
              value={formData.productionYear}
              onChangeText={(text) => handleInputChange('productionYear', text)}
            />
            {errors.productionYear && <Text style={styles.errorText}>{errors.productionYear}</Text>}
          </View>

          {/* Blue Book Images */}
          <View style={styles.inputContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Blue Book Images</Text>
              <Text style={styles.imageCount}>
                {formData.blueBookImages.length}/5 photos
              </Text>
            </View>
            <Text style={styles.hint}>Upload clear images of your vehicle's blue book</Text>
            
            <View style={styles.uploadBox}>
              {formData.blueBookImages.length > 0 ? (
                <View style={styles.imagesContainer}>
                  {formData.blueBookImages.map((uri, index) => (
                    <View key={`bluebook-${index}`} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index, 'blueBook')}
                      >
                        <Ionicons name="close-circle" size={20} color="#EB5757" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-attach" size={40} color="#BDBDBD" />
                  <Text style={styles.emptyStateText}>Upload Photo of your blue book</Text>
                </View>
              )}
              
              {formData.blueBookImages.length < 5 && (
                <View style={styles.uploadOptionsContainer}>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.galleryButton]}
                    onPress={() => pickImage('blueBook')}
                  >
                    <Ionicons name="image" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.cameraButton]}
                    onPress={() => takePhoto('blueBook')}
                  >
                    <Ionicons name="camera" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {formData.blueBookImages.length > 0 && (
                <View style={styles.uploadTips}>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> 
                    {' '}Upload front side of the blue book
                  </Text>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> 
                    {' '}Make sure all details are visible
                  </Text>
                </View>
              )}
            </View>
            {errors.blueBookImages && <Text style={styles.errorText}>{errors.blueBookImages}</Text>}
          </View>

          {/* Vehicle Images */}
          <View style={styles.inputContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Vehicle Images</Text>
              <Text style={styles.imageCount}>
                {formData.vehicleImages.length}/5 photos
              </Text>
            </View>
            <Text style={styles.hint}>Upload clear images of your vehicle from multiple angles</Text>
            
            <View style={styles.uploadBox}>
              {formData.vehicleImages.length > 0 ? (
                <View style={styles.imagesContainer}>
                  {formData.vehicleImages.map((uri, index) => (
                    <View key={`vehicle-${index}`} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index, 'vehicle')}
                      >
                        <Ionicons name="close-circle" size={20} color="#EB5757" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="car-sport" size={40} color="#BDBDBD" />
                  <Text style={styles.emptyStateText}>Upload Photo of your vehicle</Text>
                </View>
              )}
              
              {formData.vehicleImages.length < 5 && (
                <View style={styles.uploadOptionsContainer}>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.galleryButton]}
                    onPress={() => pickImage('vehicle')}
                  >
                    <Ionicons name="image" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.cameraButton]}
                    onPress={() => takePhoto('vehicle')}
                  >
                    <Ionicons name="camera" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {formData.vehicleImages.length > 0 && (
                <View style={styles.uploadTips}>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> 
                    {' '}Upload front, back and side views
                  </Text>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> 
                    {' '}Make sure registration plate is visible
                  </Text>
                </View>
              )}
            </View>
            {errors.vehicleImages && <Text style={styles.errorText}>{errors.vehicleImages}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <Text style={styles.submitButtonText}>Submit Documents</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.submitIcon} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#082A3F',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { height: 2, width: 0 },
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#082A3F',
  },
  headerRightPlaceholder: {
    width: 24,
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#828282',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#082A3F',
  },
  imageCount: {
    fontSize: 14,
    color: '#828282',
  },
  hint: {
    fontSize: 14,
    color: '#828282',
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  errorInput: {
    borderColor: '#EB5757',
  },
  errorText: {
    color: '#EB5757',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#828282',
    marginTop: 8,
    textAlign: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  imageWrapper: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  galleryButton: {
    backgroundColor: '#082A3F',
  },
  cameraButton: {
    backgroundColor: '#082A3F',
    opacity: 0.9,
  },
  uploadOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  uploadTips: {
    marginTop: 12,
  },
  uploadTipText: {
    fontSize: 13,
    color: '#4F4F4F',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#082A3F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
    shadowColor: '#082A3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 8,
  },
});

export default BusDocuments;