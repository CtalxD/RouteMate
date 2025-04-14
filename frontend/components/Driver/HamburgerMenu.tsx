// components/Driver/HamburgerMenu.tsx

import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useGetProfile } from "@/services/profile.service";

type HamburgerMenuProps = {
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateSettings: () => void;
  onLogout: () => void;
  onSwitchMode: () => void;
  onClose: () => void;
};

const HamburgerMenu = ({
  onNavigateHome,
  onNavigateProfile,
  onNavigateSettings,
  onLogout,
  onSwitchMode,
  onClose,
}: HamburgerMenuProps) => {
  const { data: profileData } = useGetProfile();

  return (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <View style={styles.profileContainer}>
          {profileData?.profilePic ? (
            <Image
              source={{ uri: profileData.profilePic }}
              style={styles.profileIcon}
            />
          ) : (
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitials}>
                {profileData?.firstName?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <Text style={styles.profileText}>
            {profileData?.firstName || "User"}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onNavigateHome} style={styles.menuItem}>
        <Text style={styles.menuText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNavigateProfile} style={styles.menuItem}>
        <Text style={styles.menuText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNavigateSettings} style={styles.menuItem}>
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onLogout} style={styles.menuItem}>
        <Text style={styles.menuText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSwitchMode} style={styles.passengerButton}>
        <Text style={styles.passengerButtonText}>Switch to Passenger Mode</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: "100%",
    backgroundColor: "#082A3F",
    padding: 20,
    zIndex: 10,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  profileText: {
    fontSize: 18,
    color: "white",
  },
  menuItem: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#082A3F",
  },
  menuText: {
    fontSize: 16,
    color: "white",
  },
  passengerButton: {
    padding: 10,
    backgroundColor: "#DB2955",
    borderRadius: 5,
    alignSelf: "center",
    marginTop: "auto",
  },
  passengerButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default HamburgerMenu;
