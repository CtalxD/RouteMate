import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Button, TextInput } from 'react-native-paper';
import type { DocumentFormData } from '../types/form';

type Props = {
  control: Control<DocumentFormData>;
  setValue: UseFormSetValue<DocumentFormData>;
  errors: FieldErrors<DocumentFormData>;
  location: string;
};

const LocationScanner = ({ control, setValue, errors, location }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const isPermissionGranted = Boolean(permission?.granted);

  if (!permission) {
    return <View />;
  }

  return (
    <>
      {isPermissionGranted && !location && (
        <Button onPress={() => setCameraVisible(true)}>Get Location</Button>
      )}

      {isPermissionGranted && location && (
        <Button onPress={() => setCameraVisible(true)}>Change Location</Button>
      )}

      {!isPermissionGranted && (
        <View style={styles.permissionView}>
          <Text>Camera permission is required</Text>
          <Button onPress={requestPermission}>Grant Permission</Button>
        </View>
      )}

      <Controller
        control={control}
        rules={{
          required: 'Location is required',
        }}
        render={({ field: { onChange, onBlur, value } }) =>
          location ? (
            <TextInput
              placeholder="Location"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              disabled
            />
          ) : (
            <></>
          )
        }
        name="location"
      />

      {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}

      {cameraVisible && (
        <View style={styles.overlay}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={({ data }) => {
              setValue('location', data);
              setCameraVisible(false);
            }}>
            <View style={styles.scannerOverlay}>
              <View style={styles.scanner} />
            </View>
            <TouchableOpacity onPress={() => setCameraVisible(false)} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </CameraView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  permissionView: {
    display: 'flex',
    gap: 6,
    marginTop: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanner: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
});

export default LocationScanner;
