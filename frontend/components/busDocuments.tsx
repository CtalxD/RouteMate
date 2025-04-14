import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useCreateDocument } from "@/services/document.service";
import { asyncStore } from "@/helper/async.storage.helper";
import { ACCESS_TOKEN_KEY } from "@/constants";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

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
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    licenseNumber: "",
    productionYear: "",
    blueBookImages: [],
    vehicleImages: [],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const createDocument = useCreateDocument();

  const handleBackPress = () => {
    router.push("/lists");
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = await asyncStore.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          const payloadBase64 = token.split(".")[1];
          const payloadJson = decodeURIComponent(
            atob(payloadBase64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(payloadJson);
          setUserId(payload.id);
        }
      } catch (error) {
        console.error("Error parsing token:", error);
        Alert.alert("Error", "Failed to get user information. Please login again.");
      }
    };
    fetchUserId();
  }, []);

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.licenseNumber) {
      newErrors.licenseNumber = "License number is required";
    } else if (isNaN(Number(formData.licenseNumber))) {
      newErrors.licenseNumber = "License number must be a number";
    }

    if (!formData.productionYear) {
      newErrors.productionYear = "Production year is required";
    } else if (isNaN(Number(formData.productionYear))) {
      newErrors.productionYear = "Production year must be a number";
    } else if (formData.productionYear.length !== 4) {
      newErrors.productionYear = "Please enter a valid year (YYYY)";
    }

    if (formData.blueBookImages.length === 0) {
      newErrors.blueBookImages = "At least one blue book image is required";
    } else if (formData.blueBookImages.length > 3) {
      newErrors.blueBookImages = "Maximum 3 blue book images allowed";
    }

    if (formData.vehicleImages.length === 0) {
      newErrors.vehicleImages = "At least one vehicle image is required";
    } else if (formData.vehicleImages.length > 3) {
      newErrors.vehicleImages = "Maximum 3 vehicle images allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async (type: "blueBook" | "vehicle") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        addImageToForm(selectedAsset.uri, type);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  const takePhoto = async (type: "blueBook" | "vehicle") => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert("Permission required", "Camera access is needed to take photos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        addImageToForm(selectedAsset.uri, type);
      }
    } catch (error) {
      console.log("Camera error:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const addImageToForm = (newImage: string, type: "blueBook" | "vehicle") => {
    if (type === "blueBook") {
      if (formData.blueBookImages.length >= 3) {
        Alert.alert("Limit reached", "You can upload maximum 3 blue book images");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        blueBookImages: [...prev.blueBookImages, newImage],
      }));
    } else {
      if (formData.vehicleImages.length >= 3) {
        Alert.alert("Limit reached", "You can upload maximum 3 vehicle images");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        vehicleImages: [...prev.vehicleImages, newImage],
      }));
    }

    if (errors[`${type}Images` as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [`${type}Images`]: undefined,
      }));
    }
  };

  const removeImage = (index: number, type: "blueBook" | "vehicle") => {
    if (type === "blueBook") {
      const updatedImages = [...formData.blueBookImages];
      updatedImages.splice(index, 1);
      setFormData({
        ...formData,
        blueBookImages: updatedImages,
      });
    } else {
      const updatedImages = [...formData.vehicleImages];
      updatedImages.splice(index, 1);
      setFormData({
        ...formData,
        vehicleImages: updatedImages,
      });
    }
  };

  const getFileType = (uri: string): string => {
    const extension = uri.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      default:
        return "image/jpeg";
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsUploading(true);

    try {
      const data = new FormData();

      // Append text fields
      data.append("licenseNumber", formData.licenseNumber);
      data.append("productionYear", formData.productionYear);
      data.append("userId", userId);

      // Append blue book images
      for (const uri of formData.blueBookImages) {
        const filename = uri.split("/").pop() || `bluebook_${Date.now()}.jpg`;
        const fileType = getFileType(uri);
        
        // @ts-ignore - React Native specific FormData append
        data.append("blueBookImages", {
          uri,
          name: filename,
          type: fileType,
        });
      }

      // Append vehicle images
      for (const uri of formData.vehicleImages) {
        const filename = uri.split("/").pop() || `vehicle_${Date.now()}.jpg`;
        const fileType = getFileType(uri);
        
        // @ts-ignore - React Native specific FormData append
        data.append("vehicleImages", {
          uri,
          name: filename,
          type: fileType,
        });
      }

      createDocument.mutate(data, {
        onSuccess: () => {
          Alert.alert("Success", "Documents submitted successfully!", [
            {
              text: "OK",
              onPress: () => {
                router.push("/lists");
              },
            },
          ]);
        },
        onError: (error: any) => {
          Alert.alert("Error", error?.message || "Failed to submit documents.");
        },
        onSettled: () => {
          setIsUploading(false);
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload files. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#082A3F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bus Documents</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Please provide all required documents to complete your bus registration
          </Text>

          {/* License Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Number</Text>
            <TextInput
              style={[styles.input, errors.licenseNumber && styles.errorInput]}
              placeholder="Enter license number"
              placeholderTextColor="#828282"
              keyboardType="numeric"
              value={formData.licenseNumber}
              onChangeText={(text) => handleInputChange("licenseNumber", text)}
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
              onChangeText={(text) => handleInputChange("productionYear", text)}
            />
            {errors.productionYear && <Text style={styles.errorText}>{errors.productionYear}</Text>}
          </View>

          {/* Blue Book Images */}
          <View style={styles.inputContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Blue Book Images</Text>
              <Text style={styles.imageCount}>{formData.blueBookImages.length}/3 photos</Text>
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
                        onPress={() => removeImage(index, "blueBook")}
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

              {formData.blueBookImages.length < 3 && (
                <View style={styles.uploadOptionsContainer}>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.galleryButton]}
                    onPress={() => pickImage("blueBook")}
                  >
                    <Ionicons name="image" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.cameraButton]}
                    onPress={() => takePhoto("blueBook")}
                  >
                    <Ionicons name="camera" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {formData.blueBookImages.length > 0 && (
                <View style={styles.uploadTips}>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> Upload front side of the blue book
                  </Text>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> Make sure all details are visible
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
              <Text style={styles.imageCount}>{formData.vehicleImages.length}/3 photos</Text>
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
                        onPress={() => removeImage(index, "vehicle")}
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

              {formData.vehicleImages.length < 3 && (
                <View style={styles.uploadOptionsContainer}>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.galleryButton]}
                    onPress={() => pickImage("vehicle")}
                  >
                    <Ionicons name="image" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadOptionButton, styles.cameraButton]}
                    onPress={() => takePhoto("vehicle")}
                  >
                    <Ionicons name="camera" size={18} color="white" />
                    <Text style={styles.uploadOptionText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {formData.vehicleImages.length > 0 && (
                <View style={styles.uploadTips}>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> Upload front, back and side views
                  </Text>
                  <Text style={styles.uploadTipText}>
                    <Ionicons name="information-circle" size={16} color="#4F4F4F" /> Make sure registration plate is
                    visible
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
            disabled={isUploading || createDocument.isPending}
          >
            <Text style={styles.submitButtonText}>
              {isUploading || createDocument.isPending ? "Submitting..." : "Submit Documents"}
            </Text>
            {!(isUploading || createDocument.isPending) && (
              <Ionicons name="arrow-forward" size={20} color="white" style={styles.submitIcon} />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    shadowColor: "#082A3F",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { height: 2, width: 0 },
    elevation: 3,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#082A3F",
    textAlign: "center",
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: "#828282",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#082A3F",
  },
  imageCount: {
    fontSize: 14,
    color: "#828282",
  },
  hint: {
    fontSize: 14,
    color: "#828282",
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  errorInput: {
    borderColor: "#EB5757",
  },
  errorText: {
    color: "#EB5757",
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#828282",
    marginTop: 8,
    textAlign: "center",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  imageWrapper: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    marginRight: 8,
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "white",
    borderRadius: 12,
  },
  uploadOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  galleryButton: {
    backgroundColor: "#082A3F",
  },
  cameraButton: {
    backgroundColor: "#082A3F",
    opacity: 0.9,
  },
  uploadOptionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  uploadTips: {
    marginTop: 12,
  },
  uploadTipText: {
    fontSize: 13,
    color: "#4F4F4F",
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: "#082A3F",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    flexDirection: "row",
    shadowColor: "#082A3F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  submitIcon: {
    marginLeft: 8,
  },
});

export default BusDocuments;