import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image, TextInput, FlatList, Alert } from "react-native";
import { useAuth } from "@/context/auth-context";
import Profile from "./Profile";
import { useGetProfile } from "@/services/profile.service";
import Booking from "./Booking";
import Settings from "./Settings";
import Icon from "react-native-vector-icons/Ionicons";
import Overlay from "./overlay";
import Ticket from "./tickets";
import BusDocuments from "./busDocuments";
import { useRouter } from "expo-router";

type Location = {
  name: string;
  lat: number;
  lng: number;
};

type Suggestion = Location;

type BusRecommendation = {
  id: string;
  numberPlate: string;
  from: string;
  to: string;
  departureTime: string;
  estimatedTime: string;
  price: string;
};

const ContactMap = () => {
  const router = useRouter();
  const [zoomLevel] = useState(0.01);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const defaultLocation: Location = {
    name: "Kathmandu",
    lat: 27.7172,
    lng: 85.324,
  };

  const { data: profileData } = useGetProfile();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState("Home");
  const [previousPage, setPreviousPage] = useState("Home");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState({ from: "", to: "" });
  const [fromSuggestions, setFromSuggestions] = useState<Suggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Suggestion[]>([]);
  const [showTicket, setShowTicket] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusRecommendation | null>(null);
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
    if (field === "from") {
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
    setCurrentPage("Profile");
    setMenuVisible(false);
  };

  const navigateToBooking = () => {
    setPreviousPage(currentPage);
    setCurrentPage("Booking");
    setMenuVisible(false);
  };

  const navigateToHome = () => {
    setPreviousPage(currentPage);
    setCurrentPage("Home");
    setMenuVisible(false);
  };

  const navigateToSettings = () => {
    setPreviousPage(currentPage);
    setCurrentPage("Settings");
    setMenuVisible(false);
  };

  const switchToDriverMode = () => {
    setMenuVisible(false);
    router.push("/busdocs");
  };

  const handleBack = () => {
    setCurrentPage(previousPage);
  };

  const handleSearchIconClick = () => {
    setIsSearchVisible(true);
  };

  const closeSearchOverlay = () => {
    setIsSearchVisible(false);
  };

  const handleSearch = () => {
    console.log("From:", searchQuery.from);
    console.log("To:", searchQuery.to);
    setIsOverlayVisible(true);
    setIsSearchVisible(false);
  };

  const handleBookNow = (bus: BusRecommendation) => {
    setSelectedBus(bus);
    setShowTicket(true);
  };

  const handlePayNow = async (totalPrice: string, passengerNames: string[]) => {
    try {
      const response = await fetch("http://localhost:5000/payment/initiate-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(totalPrice),
          mobile: "9862732725",
          purchase_order_id: selectedBus?.id,
          purchase_order_name: `Bus Ticket for ${selectedBus?.from} to ${selectedBus?.to}`,
          passengerNames,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.data.payment_url;
      } else {
        Alert.alert("Payment initiation failed");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      Alert.alert("Payment initiation failed");
    }
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermissionGranted(true);
            const { latitude, longitude } = position.coords;
            setUserLocation({ name: "User", lat: latitude, lng: longitude });
          },
          (error) => {
            console.error("Error getting location permission:", error);
            if (error.code === 1) {
              alert(
                "Location permission is required to use this feature. Please enable it in your browser settings."
              );
            } else {
              alert(
                "An error occurred while fetching your location. Please try again."
              );
            }
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        alert(
          "Geolocation is not supported by your browser. Please use a modern browser."
        );
      }
    };

    requestLocationPermission();
  }, []);

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
  }&lang=en&doubleClickZoom=false`;

  const renderHamburgerButton = () => (
    <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
      <View style={styles.outsideBar} />
      <View style={styles.outsideBar} />
      <View style={styles.outsideBar} />
    </TouchableOpacity>
  );

  const renderMenu = () => (
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
        <TouchableOpacity onPress={toggleMenu}>
          <Icon name="close" size={24} color="white" />
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
  );

  if (showTicket && selectedBus) {
    return (
      <Ticket
        bus={selectedBus}
        onBack={() => setShowTicket(false)}
      />
    );
  }

  if (currentPage === "Profile") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <View style={styles.profileDetails}>
          <Profile onBack={handleBack} />
        </View>
        {menuVisible && renderMenu()}
      </View>
    );
  }

  if (currentPage === "Booking") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Booking />
        {menuVisible && renderMenu()}
      </View>
    );
  }

  if (currentPage === "Settings") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonSettings}>
          <Icon name="arrow-back" size={30} color="black" />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
        <Settings />
        {menuVisible && renderMenu()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHamburgerButton()}

      {!permissionGranted ? (
        <Text style={styles.permissionText}>
          Location permission is required to use the map. Please enable it in
          your browser settings.
        </Text>
      ) : (
        <iframe
          src={openStreetMapUrl}
          style={{
            ...styles.map,
            pointerEvents: isSearchVisible || isOverlayVisible ? "none" : "auto",
          }}
          title="OpenStreetMap"
          allow="geolocation"
        />
      )}

      {permissionGranted && (
        <TouchableOpacity
          onPress={handleSearchIconClick}
          style={styles.searchIconContainer}
        >
          <Icon name="search" size={30} color="blue" />
        </TouchableOpacity>
      )}

      {isSearchVisible && (
        <View style={styles.searchOverlay}>
          <TouchableOpacity onPress={closeSearchOverlay} style={styles.closeButton}>
            <Icon name="close" size={24} color="black" style={styles.closeIcon} />
          </TouchableOpacity>

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

          {fromSuggestions.length > 0 && (
            <FlatList
              data={fromSuggestions}
              keyExtractor={(item) => item.name}
              renderItem={({ item }: { item: Suggestion }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress("from", item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          )}

          <View style={styles.dividerLine} />

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

          {toSuggestions.length > 0 && (
            <FlatList
              data={toSuggestions}
              keyExtractor={(item) => item.name}
              renderItem={({ item }: { item: Suggestion }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress("to", item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          )}

          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOverlayVisible && (
        <Overlay
          searchQuery={searchQuery}
          onClose={() => {
            setIsOverlayVisible(false);
            setSearchQuery({ from: "", to: "" });
            setFromSuggestions([]);
            setToSuggestions([]);
          }}
        />
      )}

      {menuVisible && renderMenu()}
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
    zIndex: 10,
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
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
  },
  backButtonSettings: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 20,
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
    marginTop: 60,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 5,
    zIndex: 6,
  },
  closeIcon: {
    color: 'black',
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