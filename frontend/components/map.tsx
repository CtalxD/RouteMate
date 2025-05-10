import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform, 
  TextInput,
  FlatList,
  ActivityIndicator
} from "react-native";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import { useGetProfile } from "@/services/profile.service";
import Profile from "./Profile";
import Booking from "./Booking";
import Settings from "./Settings";
import Overlay from "./overlay";
import type { WebViewMessageEvent } from "react-native-webview";

// Define types for location suggestions and selected locations
interface LocationSuggestion {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface SelectedLocation {
  name: string;
  lat: number;
  lon: number;
}

// Conditionally import WebView to handle platform differences
let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
} else {
  WebView = null;
}

// Kathmandu bounding box coordinates
const KATHMANDU_BOUNDS = "85.2,27.6,85.5,27.8";

const ContactMap = () => {
  const webViewRef = useRef<any>(null);
  const router = useRouter();
  const { data: profileData } = useGetProfile();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState("Home");
  const [previousPage, setPreviousPage] = useState("Home");
  const { onLogout } = useAuth();
  const [searchVisible, setSearchVisible] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<LocationSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedFromLocation, setSelectedFromLocation] = useState<SelectedLocation | null>(null);
  const [selectedToLocation, setSelectedToLocation] = useState<SelectedLocation | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  const fetchSuggestions = async (
    query: string, 
    setLoading: React.Dispatch<React.SetStateAction<boolean>>, 
    setSuggestions: React.Dispatch<React.SetStateAction<LocationSuggestion[]>>
  ) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&viewbox=${KATHMANDU_BOUNDS}` +
        `&bounded=1` +
        `&limit=5` +
        `&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedSuggestions = data.map((item: any) => ({
          id: item.place_id.toString(),
          name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
        
        setSuggestions(formattedSuggestions);
      } else {
        console.error("Failed to fetch suggestions:", response.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessageToMap = (message: any) => {
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
        return true;
      }
      return false;
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  const handleFromLocationChange = (text: string) => {
    setFromLocation(text);
    setActiveField('from');
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      fetchSuggestions(text, setIsLoadingFrom, setFromSuggestions);
    }, 500);
    
    setDebounceTimer(timer);
  };
  
  const handleToLocationChange = (text: string) => {
    setToLocation(text);
    setActiveField('to');
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      fetchSuggestions(text, setIsLoadingTo, setToSuggestions);
    }, 500);
    
    setDebounceTimer(timer);
  };
  
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    if (activeField === 'from') {
      setFromLocation(suggestion.name);
      setFromSuggestions([]);
      setSelectedFromLocation({
        name: suggestion.name,
        lat: suggestion.lat,
        lon: suggestion.lon
      });
      
      sendMessageToMap({
        type: 'ADD_FROM_MARKER',
        lat: suggestion.lat,
        lon: suggestion.lon,
        name: suggestion.name
      });
    } else if (activeField === 'to') {
      setToLocation(suggestion.name);
      setToSuggestions([]);
      setSelectedToLocation({
        name: suggestion.name,
        lat: suggestion.lat,
        lon: suggestion.lon
      });
      
      sendMessageToMap({
        type: 'ADD_TO_MARKER',
        lat: suggestion.lat,
        lon: suggestion.lon,
        name: suggestion.name
      });
    }
    
    setActiveField(null);
  };
  
  useEffect(() => {
    if (!searchVisible) {
      setFromSuggestions([]);
      setToSuggestions([]);
      setActiveField(null);
    }
  }, [searchVisible]);
  
  useEffect(() => {
    if (isMapReady) {
      if (selectedFromLocation) {
        sendMessageToMap({
          type: 'ADD_FROM_MARKER',
          lat: selectedFromLocation.lat,
          lon: selectedFromLocation.lon,
          name: selectedFromLocation.name
        });
      }
      
      if (selectedToLocation) {
        sendMessageToMap({
          type: 'ADD_TO_MARKER',
          lat: selectedToLocation.lat,
          lon: selectedToLocation.lon,
          name: selectedToLocation.name
        });
      }
      
      if (selectedFromLocation && selectedToLocation) {
        sendMessageToMap({
          type: 'SHOW_ROUTE',
          from: selectedFromLocation,
          to: selectedToLocation
        });
      }
    }
  }, [isMapReady]);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
  };

  const handleFindRoute = () => {
    if (selectedFromLocation && selectedToLocation) {
      sendMessageToMap({
        type: 'SHOW_ROUTE',
        from: selectedFromLocation,
        to: selectedToLocation
      });
      
      // Calculate distance and duration (simplified for demo)
      // In a real app, you would get these from the routing service
      const distance = Math.random() * 10 + 5; // Random distance between 5-15 km
      const duration = distance * 3; // Rough estimate: 3 mins per km
      
      setRouteDistance(distance);
      setRouteDuration(duration);
      
      Alert.alert("Route Found", `Showing route from ${fromLocation} to ${toLocation}`);
    } else {
      Alert.alert("Input Required", "Please select both starting and destination locations");
    }
  };

  const handleSearch = () => {
    if (selectedFromLocation && selectedToLocation) {
      setIsOverlayVisible(true);
    } else {
      Alert.alert("Input Required", "Please select both starting and destination locations");
    }
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

  const handleBack = () => {
    setCurrentPage(previousPage);
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

  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <style>
          body, html, #map {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
          }
          .notification {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(255,255,255,0.9);
            padding: 10px;
            border-radius: 4px;
            z-index: 999;
            font-size: 14px;
            max-width: 80%;
            margin: 0 auto;
            text-align: center;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            font-size: 12px;
            border-radius: 5px;
          }
          .leaflet-routing-container {
            display: none;
          }
          .from-marker {
            background-color: #DB2955;
            border-radius: 50%;
            border: 2px solid white;
          }
          .to-marker {
            background-color: #082A3F;
            border-radius: 50%;
            border: 2px solid white;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="notification" class="notification" style="display: none;"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([27.7172, 85.3240], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ''
          }).addTo(map);
          
          const fromIcon = L.divIcon({
            className: 'from-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          const toIcon = L.divIcon({
            className: 'to-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          let fromMarker = null;
          let toMarker = null;
          let routeControl = null;
          
          function addFromMarker(lat, lon, name) {
            if (fromMarker) {
              map.removeLayer(fromMarker);
            }
            
            fromMarker = L.marker([lat, lon], {icon: fromIcon})
              .addTo(map)
              .bindPopup("<b>From:</b> " + name);
            fromMarker.openPopup();
            map.setView([lat, lon], 15);
            showNotification("From location set");
            return fromMarker;
          }
          
          function addToMarker(lat, lon, name) {
            if (toMarker) {
              map.removeLayer(toMarker);
            }
            
            toMarker = L.marker([lat, lon], {icon: toIcon})
              .addTo(map)
              .bindPopup("<b>To:</b> " + name);
            toMarker.openPopup();
            map.setView([lat, lon], 15);
            showNotification("To location set");
            return toMarker;
          }
          
          function showRoute(fromLat, fromLon, toLat, toLon) {
            if (routeControl) {
              map.removeControl(routeControl);
            }
            
            routeControl = L.Routing.control({
              waypoints: [
                L.latLng(fromLat, fromLon),
                L.latLng(toLat, toLon)
              ],
              routeWhileDragging: false,
              showAlternatives: false,
              fitSelectedRoutes: true,
              show: false,
              lineOptions: {
                styles: [
                  {color: '#6FB1FC', opacity: 0.8, weight: 6},
                  {color: '#0D6EFD', opacity: 0.9, weight: 4}
                ]
              },
              createMarker: function() {
                return null;
              }
            }).addTo(map);
            
            if (fromMarker && toMarker) {
              const bounds = L.latLngBounds(
                [fromMarker.getLatLng(), toMarker.getLatLng()]
              );
              map.fitBounds(bounds, {padding: [50, 50]});
            }
            
            showNotification("Route calculated");
            return routeControl;
          }
          
          function showNotification(message, duration = 3000) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.style.display = 'block';
            
            setTimeout(() => {
              notification.style.display = 'none';
            }, duration);
          }
          
          function handleMessage(event) {
            try {
              let data;
              
              if (typeof event.data === 'string') {
                try {
                  data = JSON.parse(event.data);
                } catch (e) {
                  console.error('Error parsing message:', e);
                  return;
                }
              } else {
                data = event.data;
              }
              
              console.log('Received message:', data);
              
              switch(data.type) {
                case 'ADD_FROM_MARKER':
                  addFromMarker(data.lat, data.lon, data.name);
                  break;
                  
                case 'ADD_TO_MARKER':
                  addToMarker(data.lat, data.lon, data.name);
                  break;
                  
                case 'SHOW_ROUTE':
                  const from = data.from;
                  const to = data.to;
                  
                  if (!fromMarker) {
                    addFromMarker(from.lat, from.lon, from.name);
                  }
                  
                  if (!toMarker) {
                    addToMarker(to.lat, to.lon, to.name);
                  }
                  
                  showRoute(from.lat, from.lon, to.lat, to.lon);
                  break;
                  
                default:
                  console.log('Unknown message type:', data.type);
              }
            } catch (e) {
              console.error('Error handling message:', e);
            }
          }
          
          if (window.ReactNativeWebView) {
            window.addEventListener('message', function(event) {
              handleMessage(event);
            });
          } else {
            window.addEventListener('message', function(event) {
              handleMessage(event);
            });
          }
          
          window.onload = function() {
            console.log('Map loaded and ready');
            showNotification("Map ready", 2000);
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'MAP_READY'}));
            } else {
              window.parent.postMessage({type: 'MAP_READY'}, '*');
            }
          };
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch(data.type) {
        case 'MAP_READY':
          setIsMapReady(true);
          break;
          
        default:
          console.log('Other message from WebView:', data);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleIframeMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'MAP_READY') {
          setIsMapReady(true);
        }
      };
      
      window.addEventListener('message', handleIframeMessage);
      
      return () => {
        window.removeEventListener('message', handleIframeMessage);
      };
    }
  }, []);

  const renderHamburgerButton = () => (
    <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
      <View style={styles.outsideBar} />
      <View style={styles.outsideBar} />
      <View style={styles.outsideBar} />
    </TouchableOpacity>
  );

  const renderSearchToggleButton = () => (
    <TouchableOpacity onPress={toggleSearch} style={styles.searchToggleButton}>
      <Icon name="search" size={24} color="black" />
    </TouchableOpacity>
  );

  const renderSuggestionsList = (suggestions: LocationSuggestion[], isLoading: boolean) => (
    <View style={styles.suggestionsContainer}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#DB2955" />
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
            >
              <Icon name="location" size={16} color="#DB2955" style={styles.suggestionIcon} />
              <Text style={styles.suggestionText} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={suggestions.length > 0 ? styles.suggestionsList : { height: 0 }}
        />
      )}
    </View>
  );

  const renderSearchPanel = () => (
    <View style={styles.searchOverlay}>
      <View style={styles.searchHeader}>
        <Text style={styles.searchTitle}>Search Routes</Text>
        <TouchableOpacity onPress={toggleSearch}>
          <Icon name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Icon name="location" size={20} color="#DB2955" style={styles.inputIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="From"
          value={fromLocation}
          onChangeText={handleFromLocationChange}
          placeholderTextColor="#999"
          onFocus={() => setActiveField('from')}
        />
        {fromLocation.length > 0 && (
          <TouchableOpacity onPress={() => {
            setFromLocation('');
            setFromSuggestions([]);
            if (selectedFromLocation) {
              setSelectedFromLocation(null);
              sendMessageToMap({
                type: 'REMOVE_FROM_MARKER'
              });
            }
          }}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {activeField === 'from' && renderSuggestionsList(fromSuggestions, isLoadingFrom)}
      
      <View style={styles.dividerLine} />
      
      <View style={styles.inputContainer}>
        <Icon name="navigate" size={20} color="#082A3F" style={styles.inputIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="To"
          value={toLocation}
          onChangeText={handleToLocationChange}
          placeholderTextColor="#999"
          onFocus={() => setActiveField('to')}
        />
        {toLocation.length > 0 && (
          <TouchableOpacity onPress={() => {
            setToLocation('');
            setToSuggestions([]);
            if (selectedToLocation) {
              setSelectedToLocation(null);
              sendMessageToMap({
                type: 'REMOVE_TO_MARKER'
              });
            }
          }}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {activeField === 'to' && renderSuggestionsList(toSuggestions, isLoadingTo)}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={handleFindRoute} 
          style={[
            styles.showRouteButton,
            (!selectedFromLocation || !selectedToLocation) && styles.disabledButton
          ]}
          disabled={!selectedFromLocation || !selectedToLocation}
        >
          <Text style={styles.showRouteButtonText}>Find Route</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleSearch} 
          style={[
            styles.searchButton,
            (!selectedFromLocation || !selectedToLocation) && styles.disabledButton
          ]}
          disabled={!selectedFromLocation || !selectedToLocation}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
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

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.map}>
          <iframe
            src={`data:text/html;charset=utf-8,${encodeURIComponent(generateMapHTML())}`}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
            }}
            title="Map"
          />
        </View>
      );
    }
    
    return (
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    );
  };

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
      {renderMap()}
      {renderHamburgerButton()}
      {renderSearchToggleButton()}
      {searchVisible && renderSearchPanel()}
      {menuVisible && renderMenu()}
      
      {isOverlayVisible && (
        <Overlay
          searchQuery={{ from: fromLocation, to: toLocation }}
          distance={routeDistance}
          duration={routeDuration}
          onClose={() => setIsOverlayVisible(false)}
        />
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
    ...StyleSheet.absoluteFillObject,
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
  searchToggleButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 3,
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
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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
  suggestionsContainer: {
    marginBottom: 10,
  },
  suggestionsList: {
    maxHeight: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    color: '#333',
  },
  loadingContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default ContactMap;