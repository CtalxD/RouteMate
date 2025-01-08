import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth-context';

const ListHamburger = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState('Home');
  const [previousPage, setPreviousPage] = useState('Home'); // Track previous page
  const [editableProfile, setEditableProfile] = useState({
    fullName: 'Ctal',
    dob: '2003-06-25',
    email: 'ctal@gmail.com',
  });
  const { onLogout } = useAuth();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    onLogout();
  };

  const navigateToProfile = () => {
    setPreviousPage(currentPage); // Save current page before navigating to profile
    setCurrentPage('Profile');
    setMenuVisible(false);
  };

  const navigateToHome = () => {
    setPreviousPage(currentPage); // Save current page before navigating to home
    setCurrentPage('Home');
    setMenuVisible(false);
  };

  const handleSaveChanges = () => {
    console.log('Profile Updated:', editableProfile);
    navigateToHome();
  };

  if (currentPage === 'Profile') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={navigateToHome} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.profileDetails}>
          <Text style={styles.profileTitle}>Edit Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={editableProfile.fullName}
            onChangeText={(text) => setEditableProfile({ ...editableProfile, fullName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Birth"
            value={editableProfile.dob}
            onChangeText={(text) => setEditableProfile({ ...editableProfile, dob: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={editableProfile.email}
            onChangeText={(text) => setEditableProfile({ ...editableProfile, email: text })}
          />
          <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hamburger Icon (outside menu) */}
      <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
        <View style={styles.outsideBar} />
        <View style={styles.outsideBar} />
        <View style={styles.outsideBar} />
      </TouchableOpacity>

      {/* Menu */}
      {menuVisible && (
        <View style={styles.menuContainer}>
          {/* Header with Profile Icon and Hamburger Button */}
          <View style={styles.menuHeader}>
            <View style={styles.profileContainer}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitials}>P</Text>
              </View>
              <Text style={styles.profileText}>Sital</Text>
            </View>
            <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
              <View style={styles.insideBar} />
              <View style={styles.insideBar} />
              <View style={styles.insideBar} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <TouchableOpacity onPress={navigateToHome} style={styles.menuItem}>
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToProfile} style={styles.menuItem}>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuItem}>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>

          {/* Switch to Driver Mode Button at the bottom */}
          <TouchableOpacity style={styles.driverButton}>
            <Text style={styles.driverButtonText}>Switch to Driver Mode</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bars at the Bottom */}
      {!menuVisible && (
        <View style={styles.searchBarsContainer}>
          <TextInput style={styles.searchBar} placeholder="From" />
          <TextInput style={styles.searchBar} placeholder="To" />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}
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
  outsideBar: {
    height: 4,
    width: 30,
    backgroundColor: 'black',
    marginVertical: 3,
    borderRadius: 2,
  },
  insideBar: {
    height: 4,
    width: 30,
    backgroundColor: 'white', 
    marginVertical: 3,
    borderRadius: 2,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#082A3F',
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
    color: 'white',
  },
  menuItem: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#082A3F',
  },
  menuText: {
    fontSize: 16,
    color: 'white',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#DB2955',
    borderRadius: 4,
    marginBottom: 10,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profileDetails: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#DB2955',
    borderRadius: 5,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchBarsContainer: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: -2,
    paddingRight: 20,
    backgroundColor: '#082A3F',
    paddingVertical: 30,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  searchBar: {
    width: '100%',
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  searchButton: {
    padding: 10,
    backgroundColor: '#DB2955',
    borderRadius: 5,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  driverButton: {
    padding: 10,
    backgroundColor: '#DB2955',
    borderRadius: 5,
    alignSelf: 'center', // Align the button to the center
    marginTop: 'auto',
  },
  
  driverButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ListHamburger;
