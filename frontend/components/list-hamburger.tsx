import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '@/context/auth-context';
import Profile from './Profile';
import { useGetProfile } from '@/services/profile.service';
import DriverVerification from './driver-verification'; // Import the driver verification component
import Booking from './Booking'; // Import the Booking component
import Settings from './Settings'; // Import the Settings component
import Icon from 'react-native-vector-icons/Ionicons';  // Import Ionicons for back arrow icon

const ListHamburger = () => {
  const { data: profileData } = useGetProfile();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState('Home');
  const [previousPage, setPreviousPage] = useState('Home'); // Track previous page
  const [isDriverMode, setIsDriverMode] = useState(false); // State for checking if in driver mode

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

  const navigateToBooking = () => {
    setPreviousPage(currentPage); // Save current page before navigating to booking
    setCurrentPage('Booking');
    setMenuVisible(false);
  };

  const navigateToHome = () => {
    setPreviousPage(currentPage); // Save current page before navigating to home
    setCurrentPage('Home');
    setMenuVisible(false);
  };

  const navigateToSettings = () => {
    setPreviousPage(currentPage); // Save current page before navigating to settings
    setCurrentPage('Settings');
    setMenuVisible(false);
  };

  const handleBack = () => {
    setCurrentPage(previousPage);
  };

  const switchToDriverMode = () => {
    setIsDriverMode(true); // Set driver mode state to true
    setMenuVisible(false);
  };

  if (isDriverMode) {
    return <DriverVerification />; // Render the DriverVerification page
  }

  if (currentPage === 'Profile') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" /> {/* Back arrow icon */}
        </TouchableOpacity>
        <View style={styles.profileDetails}>
          <Profile onBack={handleBack} />
        </View>
      </View>
    );
  }

  if (currentPage === 'Booking') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" /> {/* Back arrow icon */}
        </TouchableOpacity>
        <Booking />
      </View>
    );
  }

  if (currentPage === 'Settings') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonSettings}>
          <Icon name="arrow-back" size={30} color="black" /> {/* Back arrow icon */}
          <Text style={styles.settingsText}>Settings</Text> {/* Settings text next to the icon */}
        </TouchableOpacity>
        <Settings />
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
              {profileData?.profilePic ? (
                <Image 
                  source={{ uri: profileData.profilePic }} 
                  style={styles.profileIcon} 
                />
              ) : (
                <View style={styles.profileIcon}>
                  <Text style={styles.profileInitials}>
                    {profileData?.firstName?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <Text style={styles.profileText}>
                {profileData?.firstName || 'User'}
              </Text>
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
          <TouchableOpacity onPress={navigateToBooking} style={styles.menuItem}>
            <Text style={styles.menuText}>Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToSettings} style={styles.menuItem}>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>

          {/* Switch to Driver Mode Button at the bottom */}
          <TouchableOpacity onPress={switchToDriverMode} style={styles.driverButton}>
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
    overflow: 'hidden', // Add this to clip the image
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
    backgroundColor: '',
    borderRadius: 4,
    marginBottom: 10,
  },
  backButtonSettings: {
    padding: 10,
    backgroundColor: '',
    borderRadius: 4,
    marginBottom: 10,
    marginLeft: 10,
    flexDirection: 'row', // Align items horizontally (row)
    alignItems: 'center', // Align text and icon vertically
    marginTop: 10,
  },
  settingsText: {
    fontSize: 26,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,  // Adds space between the back arrow and the text
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
