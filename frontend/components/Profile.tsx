import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native"
import { useUpdateProfile, useGetProfile } from "@/services/profile.service"
import { useRouter } from "expo-router"
import Icon from "react-native-vector-icons/Ionicons"

interface ProfileProps {
  onBack?: () => void
}

const Profile = ({ onBack }: ProfileProps) => {
  const router = useRouter()
  const { data: profileData, isLoading, isError } = useGetProfile()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  })
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const updateProfileMutation = useUpdateProfile()

  useEffect(() => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        role: profileData.role || "",
      })
    }
  }, [profileData])

  const handleSaveChanges = async () => {
    try {
      setFormError("")
      setSuccessMessage("")
      const trimmedFirstName = formData.firstName.trim()
      const trimmedLastName = formData.lastName.trim()

      if (!trimmedFirstName) {
        setFormError("First name is required")
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("firstName", trimmedFirstName)
      formDataToSend.append("lastName", trimmedLastName)

      await updateProfileMutation.mutateAsync(formDataToSend)
      setSuccessMessage("Profile updated successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Failed to update profile:", error)
      setFormError("Failed to update profile. Please try again.")
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
        <Icon name="arrow-back" size={24} color="#0D6EFD" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Profile</Text>
      <View style={styles.headerRight} />
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#DB2955" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>Error loading profile data.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitials}>
                {formData.firstName.charAt(0)}
                {formData.lastName.charAt(0)}
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, formError && formError.includes("First name") ? styles.inputError : null]}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) => {
                  setFormError("")
                  setFormData({ ...formData, firstName: text })
                }}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) => {
                  setFormError("")
                  setFormData({ ...formData, lastName: text })
                }}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.input, styles.disabledInput, styles.emailContainer]}>
                <Icon name="mail-outline" size={20} color="#999" style={styles.emailIcon} />
                <Text style={styles.emailText}>{profileData?.email}</Text>
              </View>
              <Text style={styles.emailHint}>Email cannot be changed</Text>
            </View>

            {formError ? (
              <View style={styles.errorNotice}>
                <Icon name="alert-circle" size={18} color="#DB2955" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successNotice}>
                <Icon name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSaveChanges}
            style={[styles.saveButton, updateProfileMutation.isPending && styles.disabledButton]}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </View>
            ) : (
              <>
                <Icon name="save-outline" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#E9F2FF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#082A3F",
  },
  headerRight: {
    width: 40,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#082A3F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#DB2955",
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#082A3F",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#082A3F",
    backgroundColor: "#FFFFFF",
  },
  disabledInput: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E9ECEF",
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailIcon: {
    marginRight: 8,
  },
  emailText: {
    fontSize: 16,
    color: "#6C757D",
  },
  emailHint: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: "#DB2955",
    borderWidth: 1,
  },
  errorNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8ED",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  successNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAFFEA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#DB2955",
    fontSize: 14,
    marginLeft: 8,
  },
  successText: {
    color: "#4CAF50",
    fontSize: 14,
    marginLeft: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  saveButton: {
    backgroundColor: "#DB2955",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#82B4FF",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6C757D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#343A40",
    marginTop: 16,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#0D6EFD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default Profile