import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useAuth } from '@/context/auth-context'; // Adjust the import path as necessary

const Lists = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isDriverMode, setIsDriverMode] = useState(false);
  const { onLogout } = useAuth();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    onLogout();
  };

  const switchToDriverMode = () => {
    setIsDriverMode(true);
    setMenuVisible(false);
  };

  const switchToPassengerMode = () => {
    setIsDriverMode(false);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Hamburger Icon */}
      <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </TouchableOpacity>

      {/* Menu */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={toggleMenu}
          activeOpacity={1}
        />
        <View style={styles.menuContainer}>
          {/* Header with Profile Icon and 3 Dots Button */}
          <View style={styles.menuHeader}>
            <View style={styles.profileContainer}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitials}>P</Text>
              </View>
              <Text style={styles.profileText}>John Doe</Text>
            </View>
            {/* 3 Dots Button */}
            <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <TouchableOpacity onPress={toggleMenu} style={styles.menuItem}>
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuItem}>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuItem}>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
          {/* Switch Mode Button */}
          {isDriverMode ? (
            <TouchableOpacity onPress={switchToPassengerMode} style={styles.switchModeButton}>
              <Text style={styles.switchModeText}>Switch to Passenger Mode</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={switchToDriverMode} style={styles.switchModeButton}>
              <Text style={styles.switchModeText}>Switch to Driver Mode</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 16,
  },
  hamburgerButton: {
    padding: 10,
    backgroundColor: '#082A3F', // Hamburger button color
  },
  bar: {
    height: 4,
    width: 30,
    backgroundColor: 'white', // Bars color
    marginVertical: 3,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#082A3F', // Menu background color
    padding: 20,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  profileText: {
    fontSize: 18,
    color: 'white', // White text for profile
  },
  menuItem: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#082A3F', // Background for menu items
  },
  menuText: {
    fontSize: 16,
    color: 'white', // White text for menu items
  },
  switchModeButton: {
    marginTop: 'auto',
    marginVertical: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#DB2955', // Background color for Switch Mode button
    borderWidth: 2,
    borderColor: '#DB2955', // Border around the button
  },
  switchModeText: {
    fontSize: 16,
    color: 'white', // White text for Switch Mode button
    textAlign: 'center',
  },
});

export default Lists;
