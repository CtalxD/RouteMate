import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useAuth } from '@/context/auth-context'; // Adjust the import path as necessary

const Lists = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { onLogout } = useAuth();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    onLogout();
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
  },
  bar: {
    height: 4,
    width: 30,
    backgroundColor: 'black',
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
    backgroundColor: 'white',
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
    color: 'black',
  },
  menuItem: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: 'black',
  },
});

export default Lists;
