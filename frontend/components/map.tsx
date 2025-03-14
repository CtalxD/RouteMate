import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image, TextInput, FlatList } from "react-native";
import { io } from "socket.io-client";
import { useAuth } from '@/context/auth-context';
import Profile from './Profile';
import { useGetProfile } from '@/services/profile.service';
import DriverVerification from './driver-verification';
import Booking from './Booking';
import Settings from './Settings';
import Icon from 'react-native-vector-icons/Ionicons';
import Overlay from './overlay'; 

type Location = {
  name: string;
  lat: number;
  lng: number;
};

type Suggestion = Location;

const ContactMap = () => {
  const [zoomLevel] = useState(0.01);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [otherLocations, setOtherLocations] = useState<Location[]>([]);
  const socket = io("http://localhost:5000"); // Replace with your server URL

  const defaultLocation: Location = {
    name: "Kathmandu",
    lat: 27.7172,
    lng: 85.324,
  };

  const { data: profileData } = useGetProfile();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState('Home');
  const [previousPage, setPreviousPage] = useState('Home');
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false); // State for search overlay visibility
  const [isOverlayVisible, setIsOverlayVisible] = useState(false); // State for bus recommendations overlay
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '' }); // State for search query
  const [fromSuggestions, setFromSuggestions] = useState<Suggestion[]>([]); // State for "From" suggestions
  const [toSuggestions, setToSuggestions] = useState<Suggestion[]>([]); // State for "To" suggestions
  const { onLogout } = useAuth();

  const fetchLocationSuggestions = async (query: string): Promise<Suggestion[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      return [];
    }
  };

  const handleFromInputChange = async (text: string) => {
    setSearchQuery({ ...searchQuery, from: text });
    if (text.length > 2) {
      const suggestions = await fetchLocationSuggestions(text);
      setFromSuggestions(suggestions);
    } else {
      setFromSuggestions([]);
    }
  };

  const handleToInputChange = async (text: string) => {
    setSearchQuery({ ...searchQuery, to: text });
    if (text.length > 2) {
      const suggestions = await fetchLocationSuggestions(text);
      setToSuggestions(suggestions);
    } else {
      setToSuggestions([]);
    }
  };

  const handleSuggestionPress = (field: string, suggestion: Suggestion) => {
    if (field === 'from') {
      setSearchQuery({ ...searchQuery, from: suggestion.name });
      setFromSuggestions([]);
    } else {
      setSearchQuery({ ...searchQuery, to: suggestion.name });
      setToSuggestions([]);
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    onLogout();
  };

  const navigateToProfile = () => {
    setPreviousPage(currentPage);
    setCurrentPage('Profile');
    setMenuVisible(false);
  };

  const navigateToBooking = () => {
    setPreviousPage(currentPage);
    setCurrentPage('Booking');
    setMenuVisible(false);
  };

  const navigateToHome = () => {
    setPreviousPage(currentPage);
    setCurrentPage('Home');
    setMenuVisible(false);
  };

  const navigateToSettings = () => {
    setPreviousPage(currentPage);
    setCurrentPage('Settings');
    setMenuVisible(false);
  };

  const handleBack = () => {
    setCurrentPage(previousPage);
  };

  const switchToDriverMode = () => {
    setIsDriverMode(true);
    setMenuVisible(false);
  };

  const handleSearchIconClick = () => {
    setIsSearchVisible(true); // Show the search overlay
  };

  const closeSearchOverlay = () => {
    setIsSearchVisible(false); // Hide the search overlay
  };

  const handleSearch = () => {
    console.log("From:", searchQuery.from);
    console.log("To:", searchQuery.to);
    setIsOverlayVisible(true); // Show the bus recommendations overlay
    setIsSearchVisible(false); // Hide the search overlay
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermissionGranted(true);
          },
          (error) => {
            console.error("Error getting location permission:", error);
            alert("Location permission is required to use this feature.");
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { name: "User", lat: latitude, lng: longitude };
        setUserLocation(location);

        socket.emit("updateLocation", location);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    socket.on("newLocation", (location: Location) => {
      console.log("New location received:", location);
      setOtherLocations((prevLocations) => {
        const existingLocationIndex = prevLocations.findIndex((loc) => loc.name === location.name);
        if (existingLocationIndex !== -1) {
          const updatedLocations = [...prevLocations];
          updatedLocations[existingLocationIndex] = location;
          return updatedLocations;
        } else {
          return [...prevLocations, location];
        }
      });
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [permissionGranted]);

  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    (userLocation?.lng || defaultLocation.lng) - zoomLevel
  },${
    (userLocation?.lat || defaultLocation.lat) - zoomLevel
  },${
    (userLocation?.lng || defaultLocation.lng) + zoomLevel
  },${
    (userLocation?.lat || defaultLocation.lat) + zoomLevel
  }&layer=mapnik&marker=${userLocation?.lat || defaultLocation.lat},${
    userLocation?.lng || defaultLocation.lng
  }&lang=en&doubleClickZoom=false`; // Disable double-click zoom

  if (isDriverMode) {
    return <DriverVerification />;
  }

  if (currentPage === 'Profile') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" />
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
          <Icon name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Booking />
      </View>
    );
  }

  if (currentPage === 'Settings') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonSettings}>
          <Icon name="arrow-back" size={30} color="black" />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
        <Settings />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hamburger Menu Button */}
      <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
        <View style={styles.outsideBar} />
        <View style={styles.outsideBar} />
        <View style={styles.outsideBar} />
      </TouchableOpacity>

      {/* Map */}
      {!permissionGranted ? (
        <Text style={styles.permissionText}>Please grant location permission to use the map.</Text>
      ) : (
        <iframe
          src={openStreetMapUrl}
          style={{ ...styles.map, pointerEvents: menuVisible || isSearchVisible ? 'none' : 'auto' }}
          title="OpenStreetMap"
          allow="geolocation"
        />
      )}

      {/* Search Icon */}
      {permissionGranted && (
        <TouchableOpacity onPress={handleSearchIconClick} style={styles.searchIconContainer}>
          <Icon name="search" size={30} color="blue" />
        </TouchableOpacity>
      )}

      {/* Search Overlay */}
      {isSearchVisible && (
        <View style={styles.searchOverlay}>
          {/* Close Button */}
          <TouchableOpacity onPress={closeSearchOverlay} style={styles.closeButton}>
            <Icon name="close" size={24} color="black" />
          </TouchableOpacity>

          {/* From Input */}
          <View style={styles.inputContainer}>
            <Icon name="location" size={20} color="blue" style={styles.inputIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="From..."
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={searchQuery.from}
              onChangeText={handleFromInputChange}
            />
          </View>

          {/* From Suggestions */}
          {fromSuggestions.length > 0 && (
            <FlatList
              data={fromSuggestions}
              keyExtractor={(item) => item.name}
              renderItem={({ item }: { item: Suggestion }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress('from', item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          )}

          {/* Divider Line */}
          <View style={styles.dividerLine} />

          {/* To Input */}
          <View style={styles.inputContainer}>
            <Icon name="location" size={20} color="red" style={styles.inputIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="To..."
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={searchQuery.to}
              onChangeText={handleToInputChange}
            />
          </View>

          {/* To Suggestions */}
          {toSuggestions.length > 0 && (
            <FlatList
              data={toSuggestions}
              keyExtractor={(item) => item.name}
              renderItem={({ item }: { item: Suggestion }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress('to', item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          )}

          {/* Search Button */}
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bus Recommendations Overlay */}
      {isOverlayVisible && (
        <Overlay
          searchQuery={searchQuery}
          onClose={() => setIsOverlayVisible(false)}
        />
      )}

      {/* Menu Overlay */}
      {menuVisible && (
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
                    {profileData?.firstName?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <Text style={styles.profileText}>
                {profileData?.firstName || 'User'}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
            </TouchableOpacity>
          </View>

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
          <TouchableOpacity onPress={switchToDriverMode} style={styles.driverButton}>
            <Text style={styles.driverButtonText}>Switch to Driver Mode</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  hamburgerButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
  },
  outsideBar: {
    height: 4,
    width: 30,
    backgroundColor: 'black',
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
    zIndex: 2,
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
    overflow: 'hidden',
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
    borderRadius: 4,
    marginBottom: 10,
  },
  backButtonSettings: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  settingsText: {
    fontSize: 26,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,
  },
  profileDetails: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  driverButton: {
    padding: 10,
    backgroundColor: '#DB2955',
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 'auto',
  },
  driverButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchIconContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 4,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
  },
  searchOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: '#082A3F',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    borderBottomWidth: 0,
    paddingVertical: 12,
    color: 'black',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  searchButton: {
    padding: 15,
    backgroundColor: '#DB2955',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  suggestionsList: {
    maxHeight: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  suggestionText: {
    fontSize: 14,
    color: 'black',
  },
});

export default ContactMap;