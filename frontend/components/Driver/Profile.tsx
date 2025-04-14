import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateProfile, useGetProfile } from '@/services/profile.service';

interface ProfileProps {
  onBack: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  const { data: profileData, isLoading, isError } = useGetProfile();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName:"",
    profilePicUri: '',
    profilePicType: '',
    email: '',
  });
  const [formError, setFormError] = useState('');

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || '',
        profilePicUri: profileData.profilePic || '',
        profilePicType: '',
        email: profileData.email || '',
        lastName:profileData.lastName || ""
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

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFormData({
        ...formData,
        profilePicUri: asset.uri,
        profilePicType: asset.type || 'image/jpeg',
      });
    }
  };

  const handleSaveChanges = async () => {
    try {
      setFormError('');
      const trimmedfirstName = formData.firstName.trim();

      if (!trimmedfirstName) {
        setFormError('All fields are required');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('firstName', trimmedfirstName);

      if (formData.profilePicUri && !formData.profilePicUri.startsWith('http')) {
        // Only append if it's a new image (not a URL)
        const filename = formData.profilePicUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        const imageFile = {
          uri: formData.profilePicUri,
          type: type,
          name: filename || 'profile.jpg',
        };

        formDataToSend.append('profilePic', imageFile as any);
      }

      await updateProfileMutation.mutateAsync(formDataToSend);
      onBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFormError('Failed to update profile. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Error loading profile. Please try again later.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.profilePicture} onPress={pickImage}>
        {formData.profilePicUri ? (
          <Image source={{ uri: formData.profilePicUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.profileDetails}>
        <Text style={styles.profileTitle}>Edit Profile</Text>
        <TextInput
          style={[styles.input, formError ? styles.inputError : null]}
          placeholder="first name"
          value={formData.firstName}
          onChangeText={(text) => {
            setFormError('');
            setFormData({ ...formData, firstName: text });
          }}
        />
        <TextInput
          style={[styles.input, formError ? styles.inputError : null]}
          placeholder="last name"
          value={formData.lastName}
          onChangeText={(text) => {
            setFormError('');
            setFormData({ ...formData, lastName: text });
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
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#007BFF',
    overflow: 'hidden',
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
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
    backgroundColor: '#FFF',
  },
  disabledInput: {
    backgroundColor: '#E8E8E8',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A3C7FF',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: -15,
    marginBottom: 15,
    marginLeft: 5,
  },
});

export default Profile;