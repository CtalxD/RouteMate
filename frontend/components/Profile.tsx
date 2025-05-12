"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native"
import { useUpdateProfile, useGetProfile } from "@/services/profile.service"

interface ProfileProps {
  onBack: () => void
}

const Profile = ({ onBack }: ProfileProps) => {
  const { data: profileData, isLoading, isError } = useGetProfile()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  })
  const [formError, setFormError] = useState("")

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
      onBack()
    } catch (error) {
      console.error("Failed to update profile:", error)
      setFormError("Failed to update profile. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Error loading profile. Please try again later.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileDetails}>
        <Text style={styles.profileTitle}>Edit Profile</Text>
        <TextInput
          style={[styles.input, formError ? styles.inputError : null]}
          placeholder="First name"
          value={formData.firstName}
          onChangeText={(text) => {
            setFormError("")
            setFormData({ ...formData, firstName: text })
          }}
        />
        <TextInput
          style={[styles.input, formError ? styles.inputError : null]}
          placeholder="Last name"
          value={formData.lastName}
          onChangeText={(text) => {
            setFormError("")
            setFormData({ ...formData, lastName: text })
          }}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <TextInput
          style={[styles.input, styles.disabledInput]}
          placeholder="Email"
          value={profileData?.email}
          editable={false}
        />
        <TouchableOpacity
          onPress={handleSaveChanges}
          style={[styles.saveButton, updateProfileMutation.isPending && styles.disabledButton]}
          disabled={updateProfileMutation.isPending}
        >
          <Text style={styles.saveButtonText}>{updateProfileMutation.isPending ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 55,
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
    fontSize: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    backgroundColor: "#FFF",
  },
  disabledInput: {
    backgroundColor: "#E8E8E8",
  },
  saveButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A3C7FF",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
    marginTop: -15,
    marginBottom: 15,
    marginLeft: 5,
  },
})

export default Profile