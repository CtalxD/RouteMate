"use client"

import React, { useState, useRef } from "react"
import { TouchableOpacity, StyleSheet, View, Text, Modal, Pressable, Animated, Easing, Vibration, Linking } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import * as Haptics from "expo-haptics"

type EmergencyService = "police" | "ambulance" | "fire"

interface EmergencyButtonProps {
  onPress?: (serviceType: EmergencyService) => void
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onPress }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const modalAnim = useRef(new Animated.Value(0)).current

  const emergencyNumbers = {
    police: "100",
    ambulance: "102",
    fire: "101"
  }

  const pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start()
  }

  const fadeInModal = () => {
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }

  const fadeOutModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }

  const handleEmergencyPress = () => {
    pulse()
    Vibration.vibrate(50)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    setModalVisible(true)
    fadeInModal()
  }

  const handleServiceSelection = async (serviceType: EmergencyService) => {
    setSelectedService(serviceType)
    fadeOutModal()
    setTimeout(() => {
      setModalVisible(false)
      Vibration.vibrate(100)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setConfirmModalVisible(true)
      fadeInModal()
    }, 200)
  }

  const handleConfirm = async () => {
    fadeOutModal()
    setTimeout(() => {
      setConfirmModalVisible(false)
      if (selectedService) {
        // Call the emergency number
        const phoneNumber = emergencyNumbers[selectedService]
        Linking.openURL(`tel:${phoneNumber}`)
        
        // Call the onPress callback if provided
        if (onPress) {
          onPress(selectedService)
        }
      }
    }, 200)
  }

  const getServiceDetails = (service: EmergencyService | null) => {
    switch (service) {
      case "police":
        return {
          icon: "shield",
          color: "#1E40AF",
          message: "Police have been notified of your emergency. Help is on the way.",
          actionText: "Call Police (100)",
          number: "100"
        }
      case "ambulance":
        return {
          icon: "medkit",
          color: "#DC2626",
          message: "Medical services have been dispatched to your location. Stay calm.",
          actionText: "Call Ambulance (102)",
          number: "102"
        }
      case "fire":
        return {
          icon: "flame",
          color: "#EA580C",
          message: "Fire brigade has been notified. Evacuate if necessary.",
          actionText: "Call Fire Brigade (101)",
          number: "101"
        }
      default:
        return {
          icon: "warning",
          color: "#EF4444",
          message: "",
          actionText: "",
          number: ""
        }
    }
  }

  const serviceDetails = getServiceDetails(selectedService)

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyPress}
          activeOpacity={0.85}
        >
          <Icon name="alert-circle" size={28} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Emergency Services Selection Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          fadeOutModal()
          setTimeout(() => setModalVisible(false), 200)
        }}
      >
        <Animated.View style={[styles.modalBackground, { opacity: modalAnim }]}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Emergency Services</Text>
              <Text style={styles.modalSubHeader}>Select the service you need</Text>
            </View>

            <View style={styles.servicesContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.serviceButton,
                  { backgroundColor: pressed ? "#DBEAFE" : "#EFF6FF" },
                  { borderColor: "#1E40AF" },
                ]}
                onPress={() => handleServiceSelection("police")}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: "#1E40AF20" }]}>
                  <Icon name="shield" size={32} color="#1E40AF" />
                </View>
                <Text style={[styles.serviceButtonText, { color: "#1E40AF" }]}>
                  Police (100)
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.serviceButton,
                  { backgroundColor: pressed ? "#FEE2E2" : "#FEF2F2" },
                  { borderColor: "#DC2626" },
                ]}
                onPress={() => handleServiceSelection("ambulance")}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: "#DC262620" }]}>
                  <Icon name="medkit" size={32} color="#DC2626" />
                </View>
                <Text style={[styles.serviceButtonText, { color: "#DC2626" }]}>
                  Ambulance (102)
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.serviceButton,
                  { backgroundColor: pressed ? "#FFEDD5" : "#FFF7ED" },
                  { borderColor: "#EA580C" },
                ]}
                onPress={() => handleServiceSelection("fire")}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: "#EA580C20" }]}>
                  <Icon name="flame" size={32} color="#EA580C" />
                </View>
                <Text style={[styles.serviceButtonText, { color: "#EA580C" }]}>
                  Fire Brigade (101)
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: pressed ? "#E5E7EB" : "#F3F4F6" },
              ]}
              onPress={() => {
                fadeOutModal()
                setTimeout(() => {
                  setModalVisible(false)
                  Haptics.selectionAsync()
                }, 200)
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => {
          fadeOutModal()
          setTimeout(() => setConfirmModalVisible(false), 200)
        }}
      >
        <Animated.View style={[styles.modalBackground, { opacity: modalAnim }]}>
          <View style={styles.confirmModalContainer}>
            <View
              style={[
                styles.confirmIconContainer,
                { backgroundColor: `${serviceDetails.color}15` },
              ]}
            >
              <Icon
                name={serviceDetails.icon}
                size={56}
                color={serviceDetails.color}
              />
            </View>
            <Text style={styles.confirmModalTitle}>Emergency Alert Sent!</Text>
            <Text style={styles.confirmModalText}>{serviceDetails.message}</Text>
            <View style={styles.confirmButtonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  {
                    backgroundColor: pressed
                      ? `${serviceDetails.color}B3`
                      : serviceDetails.color,
                  },
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Call {serviceDetails.number}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: pressed ? "#E5E7EB" : "#F3F4F6",
                  },
                ]}
                onPress={() => {
                  fadeOutModal()
                  setTimeout(() => setConfirmModalVisible(false), 200)
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: "#EF4444",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  modalHeaderText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  modalSubHeader: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    fontWeight: "500",
  },
  servicesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  serviceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceButtonText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    letterSpacing: -0.2,
  },
  cancelButton: {
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  confirmModalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  confirmModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  confirmModalText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: "400",
  },
  confirmButtonContainer: {
    width: "100%",
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
})

export default EmergencyButton