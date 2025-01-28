import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateProfile, useGetProfile } from '@/services/profile.service';

interface ProfileProps {
  onBack: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  const { data: profileData, isLoading } = useGetProfile();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    profilePic: null as string | null,
  });

  const updateProfileMutation = useUpdateProfile();

  // Update form data when profile is fetched
  React.useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName,
        email: profileData.email,
        profilePic: profileData.profilePic || null,
      });
    }
  }, [profileData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, profilePic: result.assets[0].uri });
    }
  };

  const handleSaveChanges = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: formData.fullName,
        profilePic: formData.profilePic,
      });
      onBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.profilePicture} onPress={pickImage}>
        {formData.profilePic ? (
          <Image source={{ uri: formData.profilePic }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.profileDetails}>
        <Text style={styles.profileTitle}>Edit Profile</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          editable={false}
        />
        <TouchableOpacity 
          onPress={handleSaveChanges}
          style={styles.saveButton}
          disabled={updateProfileMutation.isPending}
        >
          <Text style={styles.saveButtonText}>
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
});

export default Profile;