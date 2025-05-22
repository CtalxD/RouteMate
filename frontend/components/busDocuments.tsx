//frontend/components/busDocuments.tsx 

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, SafeAreaView, Alert } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useCreateDocument } from "@/services/document.service"
import { asyncStore } from "@/helper/async.storage.helper"
import { ACCESS_TOKEN_KEY } from "@/constants"
import { useRouter } from "expo-router"

type FormData = {
  licenseNumber: string
  productionYear: string
  userId: string
  busNumber: string
}

type Errors = {
  licenseNumber?: string
  productionYear?: string
  busNumber?: string
}

const BusDocuments = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    licenseNumber: "",
    productionYear: "",
    userId: "",
    busNumber: "",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [isUploading, setIsUploading] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [role, setRole] = useState<string>("")
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const createDocument = useCreateDocument()

  const handleBackPress = () => {
    router.push("/(tabs)/lists")
  }

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = await asyncStore.getItem(ACCESS_TOKEN_KEY)
        if (token) {
          const payloadBase64 = token.split(".")[1]
          const payloadJson = decodeURIComponent(
            atob(payloadBase64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          )
          const payload = JSON.parse(payloadJson)
          setUserId(payload.id)
          setRole(payload.role)
        }
      } catch (error) {
        console.error("Error parsing token:", error)
        Alert.alert("Error", "Failed to get user information. Please login again.")
      }
    }
    fetchUserId()
  }, [])

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Errors = {}

    if (!formData.licenseNumber) {
      newErrors.licenseNumber = "License number is required"
    } else if (isNaN(Number(formData.licenseNumber))) {
      newErrors.licenseNumber = "License number must be a number"
    }

    if (!formData.productionYear) {
      newErrors.productionYear = "Production year is required"
    } else if (isNaN(Number(formData.productionYear))) {
      newErrors.productionYear = "Production year must be a number"
    } else if (formData.productionYear.length !== 4) {
      newErrors.productionYear = "Please enter a valid year (YYYY)"
    }

    if (!formData.busNumber) {
      newErrors.busNumber = "Bus number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!userId) {
      Alert.alert("Error", "User not authenticated")
      return
    }

    setIsUploading(true)

    try {
      const data = new FormData()
      data.append("licenseNumber", formData.licenseNumber)
      data.append("productionYear", formData.productionYear)
      data.append("busNumber", formData.busNumber)
      data.append("userId", userId)

      createDocument.mutate(data, {
        onSuccess: () => {
          setShowSuccessMessage(true)
          // Reset form data
          setFormData({
            licenseNumber: "",
            productionYear: "",
            userId: "",
            busNumber: "",
          })
          
          // Automatically navigate after 3 seconds
          setTimeout(() => {
            setShowSuccessMessage(false)
            router.push("/(tabs)/lists")
          }, 3000)
        },
        onError: (error: any) => {
          Alert.alert("Error", error?.message || "Failed to submit documents.")
        },
        onSettled: () => {
          setIsUploading(false)
        },
      })
    } catch (error) {
      console.error("Upload error:", error)
      Alert.alert("Error", "Failed to upload files. Please try again.")
      setIsUploading(false)
    }
  }

  if (showSuccessMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Document Submitted Successfully</Text>
          <Text style={styles.successMessage}>
            Your bus documents have been submitted successfully. You will be redirected shortly.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

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

          {/* Bus Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bus Number</Text>
            <TextInput
              style={[styles.input, errors.busNumber && styles.errorInput]}
              placeholder="Enter bus number"
              placeholderTextColor="#828282"
              value={formData.busNumber}
              onChangeText={(text) => handleInputChange("busNumber", text)}
            />
            {errors.busNumber && <Text style={styles.errorText}>{errors.busNumber}</Text>}
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
  )
}

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
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#082A3F",
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
  // Success message styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F9FC",
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#082A3F",
    textAlign: "center",
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: "#4F4F4F",
    textAlign: "center",
    lineHeight: 24,
  },
})

export default BusDocuments