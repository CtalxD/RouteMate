import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image, TextInput, FlatList, Alert } from "react-native";
import { useAuth } from "@/context/auth-context";
import Profile from "./Profile";
import { useGetProfile } from "@/services/profile.service";
import Booking from "./Booking";
import Settings from "./Settings";
import Icon from "react-native-vector-icons/Ionicons";
import Overlay from "./overlay";
import Ticket from "./tickets";
import { useRouter } from "expo-router";

// Define Kathmandu boundaries
const KATHMANDU_BOUNDS = {
  north: 27.7749,
  south: 27.6594,
  west: 85.2536,
  east: 85.3906
};

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

type RouteCoordinates = {
  lat: number;
  lng: number;
};

type RouteResponse = {
  routes: {
    geometry: {
      coordinates: [number, number][];
    };
    distance: number;
    duration: number;
  }[];
  waypoints: {
    location: [number, number];
    name: string;
  }[];
};

const ContactMap = () => {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinates[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(14); // Default zoom level

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
  const [selectedFromLocation, setSelectedFromLocation] = useState<Location | null>(null);
  const [selectedToLocation, setSelectedToLocation] = useState<Location | null>(null);
  const { onLogout } = useAuth();

  // Check if a location is within Kathmandu bounds
  const isInKathmandu = (lat: number, lng: number): boolean => {
    return (
      lat >= KATHMANDU_BOUNDS.south &&
      lat <= KATHMANDU_BOUNDS.north &&
      lng >= KATHMANDU_BOUNDS.west &&
      lng <= KATHMANDU_BOUNDS.east
    );
  };

  const fetchLocationSuggestions = async (query: string): Promise<Suggestion[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&bounded=1&viewbox=${KATHMANDU_BOUNDS.west},${KATHMANDU_BOUNDS.north},${KATHMANDU_BOUNDS.east},${KATHMANDU_BOUNDS.south}`
      );
      const data = await response.json();
      
      // Filter results to only include locations within Kathmandu bounds
      return data
        .map((item: any) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }))
        .filter((loc: Location) => isInKathmandu(loc.lat, loc.lng));
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      return [];
    }
  };

  const fetchRoute = async (start: Location, end: Location) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      const data: RouteResponse = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(coord => ({
          lng: coord[0],
          lat: coord[1]
        }));
        setRouteCoordinates(coordinates);
        setRouteDistance(data.routes[0].distance / 1000); // Convert to km
        setRouteDuration(data.routes[0].duration / 60); // Convert to minutes
        setShowRoute(true);
        setZoomLevel(13); // Zoom out slightly to show the whole route
        return coordinates;
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      Alert.alert("Error", "Could not fetch route. Please try again.");
    }
    return [];
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
      setSelectedFromLocation(suggestion);
      setFromSuggestions([]);
    } else {
      setSearchQuery({ ...searchQuery, to: suggestion.name });
      setSelectedToLocation(suggestion);
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
    setShowRoute(false);
    setRouteCoordinates([]);
    setZoomLevel(14); // Reset to default zoom level
  };

  const navigateToSettings = () => {
    setPreviousPage(currentPage);
    setCurrentPage("Settings");
    setMenuVisible(false);
  };

  const switchToDriverMode = () => {
    setMenuVisible(false);
    if (profileData?.role === "DRIVER") {
      router.push("/(tabs)/driver");
    } else {
      router.push("/(tabs)/busdocs");
      Alert.alert("Access Denied", "You are not assigned the driver role.");
    }
  };

  const handleBack = () => {
    setCurrentPage(previousPage);
    if (previousPage === "Home") {
      setShowRoute(false);
      setRouteCoordinates([]);
      setZoomLevel(14); // Reset to default zoom level
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchVisible(true);
  };

  const closeSearchOverlay = () => {
    setIsSearchVisible(false);
  };

  const handleShowRoute = async () => {
    if (!searchQuery.from || !searchQuery.to) {
      Alert.alert("Error", "Please enter both starting and destination points");
      return;
    }

    if (!selectedFromLocation || !selectedToLocation) {
      Alert.alert("Error", "Please select valid locations from the suggestions");
      return;
    }

    // Verify both locations are within Kathmandu
    if (!isInKathmandu(selectedFromLocation.lat, selectedFromLocation.lng) || 
        !isInKathmandu(selectedToLocation.lat, selectedToLocation.lng)) {
      Alert.alert("Error", "Both locations must be within Kathmandu valley");
      return;
    }

    await fetchRoute(selectedFromLocation, selectedToLocation);
    setIsSearchVisible(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.from || !searchQuery.to) {
      Alert.alert("Error", "Please enter both starting and destination points");
      return;
    }

    if (!selectedFromLocation || !selectedToLocation) {
      Alert.alert("Error", "Please select valid locations from the suggestions");
      return;
    }

    // Verify both locations are within Kathmandu
    if (!isInKathmandu(selectedFromLocation.lat, selectedFromLocation.lng) || 
        !isInKathmandu(selectedToLocation.lat, selectedToLocation.lng)) {
      Alert.alert("Error", "Both locations must be within Kathmandu valley");
      return;
    }

    await fetchRoute(selectedFromLocation, selectedToLocation);
    setIsOverlayVisible(true);
    setIsSearchVisible(false);
  };

  const handleBookNow = (bus: BusRecommendation) => {
    setSelectedBus(bus);
    setShowTicket(true);
  };

  const getOSMUrlWithRoute = () => {
    if (!showRoute || routeCoordinates.length === 0) {
      return getDefaultMapUrl();
    }

    const polyline = routeCoordinates
      .map(coord => `${coord.lat},${coord.lng}`)
      .join(',');

    const markers = [
      `color:blue|label:S|${selectedFromLocation?.lat},${selectedFromLocation?.lng}`,
      `color:red|label:E|${selectedToLocation?.lat},${selectedToLocation?.lng}`
    ].join('&markers=');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${getBoundingBox()}&layer=mapnik&markers=${markers}&path=color:red|weight:5|${polyline}&zoom=${zoomLevel}`;
  };

  const getDefaultMapUrl = () => {
    if (userLocation) {
      // Calculate a bounding box around the user's location
      const padding = 0.01; // Degrees of padding around the user's location
      const bbox = [
        userLocation.lng - padding,
        userLocation.lat - padding,
        userLocation.lng + padding,
        userLocation.lat + padding
      ].join(',');
      
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}&zoom=${zoomLevel}`;
    } else {
      // Fallback to Kathmandu bounds if no user location
      const bbox = [
        KATHMANDU_BOUNDS.west,
        KATHMANDU_BOUNDS.south,
        KATHMANDU_BOUNDS.east,
        KATHMANDU_BOUNDS.north
      ].join(',');
      
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${defaultLocation.lat},${defaultLocation.lng}&zoom=${zoomLevel}`;
    }
  };

  const getBoundingBox = () => {
    if (!showRoute || routeCoordinates.length === 0) {
      if (userLocation) {
        // Return a bounding box around the user's location
        const padding = 0.01;
        return [
          userLocation.lng - padding,
          userLocation.lat - padding,
          userLocation.lng + padding,
          userLocation.lat + padding
        ].join(',');
      }
      // Return Kathmandu bounds if no route and no user location
      return [
        KATHMANDU_BOUNDS.west,
        KATHMANDU_BOUNDS.south,
        KATHMANDU_BOUNDS.east,
        KATHMANDU_BOUNDS.north
      ].join(',');
    }

    const lats = routeCoordinates.map(c => c.lat);
    const lngs = routeCoordinates.map(c => c.lng);
    
    // Constrain to Kathmandu bounds
    const minLat = Math.max(Math.min(...lats), KATHMANDU_BOUNDS.south);
    const maxLat = Math.min(Math.max(...lats), KATHMANDU_BOUNDS.north);
    const minLng = Math.max(Math.min(...lngs), KATHMANDU_BOUNDS.west);
    const maxLng = Math.min(Math.max(...lngs), KATHMANDU_BOUNDS.east);
    
    const padding = 0.01;
    return [
      Math.max(minLng - padding, KATHMANDU_BOUNDS.west),
      Math.max(minLat - padding, KATHMANDU_BOUNDS.south),
      Math.min(maxLng + padding, KATHMANDU_BOUNDS.east),
      Math.min(maxLat + padding, KATHMANDU_BOUNDS.north)
    ].join(',');
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (navigator.geolocation) {
        // First get current position quickly
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (isInKathmandu(latitude, longitude)) {
              setUserLocation({ name: "You", lat: latitude, lng: longitude });
              setPermissionGranted(true);
              setZoomLevel(16); // Zoom in more when we have user location
            } else {
              setUserLocation(defaultLocation);
              setPermissionGranted(true);
              Alert.alert("Notice", "You are outside Kathmandu. Map is centered on Kathmandu.");
            }
          },
          (error) => {
            console.error("Error getting initial location:", error);
            setUserLocation(defaultLocation);
            setPermissionGranted(true);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );

        // Then watch for continuous updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (isInKathmandu(latitude, longitude)) {
              setUserLocation({ name: "You", lat: latitude, lng: longitude });
            }
            // Else don't update location if outside Kathmandu
          },
          (error) => {
            console.error("Error watching location:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        setUserLocation(defaultLocation);
        setPermissionGranted(true);
      }
    };

    requestLocationPermission();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
          src={showRoute ? getOSMUrlWithRoute() : getDefaultMapUrl()}
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleShowRoute} style={styles.showRouteButton}>
              <Text style={styles.showRouteButtonText}>Show Route</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isOverlayVisible && (
        <Overlay
          searchQuery={searchQuery}
          distance={routeDistance}
          duration={routeDuration}
          onClose={() => {
            setIsOverlayVisible(false);
            setSearchQuery({ from: "", to: "" });
            setFromSuggestions([]);
            setToSuggestions([]);
            setShowRoute(false);
            setRouteCoordinates([]);
            setZoomLevel(16); // Zoom back in when closing overlay
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
    top: 70,
    left: 20,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  showRouteButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  showRouteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#DB2955',
    borderRadius: 10,
    alignItems: 'center',
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