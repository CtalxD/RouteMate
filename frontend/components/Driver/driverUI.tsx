import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "expo-router"
import Profile from "./Profile"
import Settings from "./Settings"
import Icon from "react-native-vector-icons/Ionicons"
import HamburgerMenu from "./HamburgerMenu"
import { io, type Socket } from "socket.io-client"

type Location = {
  name: string
  lat: number
  lng: number
}

type UserLocation = {
  socketId: string
  latitude: number
  longitude: number
  accuracy: number
  isOnline: boolean
  lastUpdated: number
}

const API_URL = "http://localhost:5000"

const DriverUI = () => {
  const [zoomLevel] = useState(0.01)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const [] = useState<Record<string, UserLocation>>({})
  const mapRef = useRef<HTMLIFrameElement>(null)
  const locationWatchIdRef = useRef<number | null>(null)
  const { user } = useAuth()

  const defaultLocation: Location = {
    name: "Kathmandu",
    lat: 27.7172,
    lng: 85.324,
  }
  
  const [menuVisible, setMenuVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState("Home")
  const [previousPage, setPreviousPage] = useState("Home")
  const { onLogout } = useAuth()

  // Initialize Socket.io connection
  useEffect(() => {
    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(API_URL, {
        withCredentials: true,
        transports: ["websocket"],
      })
    }

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id)
      
      if (user?.id) {
        socket.emit("authenticate", {
          userId: user.id,
          userType: 'driver'
        })
      }

      if (isOnline) {
        handleToggleOnline(true)
      }
    })

    socket.on("location-updated", (data) => {
      console.log("Location update confirmed by server:", data)
    })

    socket.on("status-changed", (data) => {
      console.log("Status change confirmed by server:", data)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      Alert.alert("Connection Error", "Failed to connect to the server. Please check your internet connection.")
    })

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason)
    })

    return () => {
      if (socket) {
        console.log("Disconnecting socket")
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [user])

  // Request location permission and set up periodic updates
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          if (permission.state === 'granted') {
            setPermissionGranted(true)
            if (isOnline) {
              startLocationTracking()
            }
          } else if (permission.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(
              () => {
                setPermissionGranted(true)
                if (isOnline) {
                  startLocationTracking()
                }
              },
              handleLocationError,
              { enableHighAccuracy: true }
            )
          }
          
          permission.onchange = () => {
            if (permission.state === 'granted') {
              setPermissionGranted(true)
              if (isOnline) {
                startLocationTracking()
              }
            } else {
              setPermissionGranted(false)
              stopLocationTracking()
            }
          }
        } else {
          // Fallback for browsers that don't support permissions API
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissionGranted(true)
              if (isOnline) {
                startLocationTracking()
              }
            },
            handleLocationError,
            { enableHighAccuracy: true }
          )
        }
      } catch (error) {
        console.error("Error checking permissions:", error)
        // Try the fallback method
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissionGranted(true)
            if (isOnline) {
              startLocationTracking()
            }
          },
          handleLocationError,
          { enableHighAccuracy: true }
        )
      }
    }

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Location error:", error)
      switch(error.code) {
        case error.PERMISSION_DENIED:
          Alert.alert("Permission Denied", "Please enable location permissions in your browser settings.")
          break
        case error.POSITION_UNAVAILABLE:
          Alert.alert("Position Unavailable", "Location information is unavailable.")
          break
        case error.TIMEOUT:
          // Don't show alert for timeout errors, just log them
          console.log("Location request timed out, will retry...")
          break
        default:
          Alert.alert("Error", "An unknown error occurred while getting your location.")
      }
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.")
      Alert.alert("Geolocation Not Supported", "Please use a modern browser that supports geolocation.")
      return
    }

    requestLocationPermission()

    return () => {
      stopLocationTracking()
    }
  }, [isOnline])

  // Start location tracking with more frequent updates and high accuracy
  const startLocationTracking = () => {
    if (!permissionGranted || !isOnline) return

    // Clear any existing watch
    stopLocationTracking()

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // Increased timeout to 10 seconds
      maximumAge: 0,
    }

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePositionUpdate(position)
      },
      (error) => {
        console.error("Error getting initial position:", error)
        // If initial position fails, try again after a short delay
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            handlePositionUpdate,
            (err) => console.error("Retry failed:", err),
            options
          )
        }, 1000)
      },
      options
    )

    // Set up watchPosition with more relaxed parameters
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (error) => {
        console.error("Error watching location:", error)
        // If watch fails, try to restart it
        if (error.code === error.TIMEOUT) {
          setTimeout(() => {
            if (isOnline && permissionGranted) {
              startLocationTracking()
            }
          }, 2000)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Longer timeout for watchPosition
        maximumAge: 5000, // Allow slightly older positions
      }
    )

    console.log("Started location tracking with ID:", locationWatchIdRef.current)
  }

  const handlePositionUpdate = (position: GeolocationPosition) => {
    // If we're offline, don't update anything
    if (!isOnline) return;
    
    const { latitude, longitude, accuracy } = position.coords
    console.log(`Position updated at ${new Date().toISOString()} with accuracy: ${accuracy} meters`)

    // Store location with full precision
    const location = { 
      name: "User", 
      lat: latitude, 
      lng: longitude 
    }
    setUserLocation(location)
    setLocationAccuracy(accuracy)

    if (socketRef.current && isOnline) {
      socketRef.current.emit("update-location", {
        latitude,
        longitude,
        accuracy,
        isOnline: true,
        isDriver: true,
        userId: user?.id,
        timestamp: Date.now()
      })
    }
    
    // If we have a map reference, update the map directly using postMessage to the iframe
    if (mapRef.current?.contentWindow) {
      try {
        mapRef.current.contentWindow.postMessage({
          action: 'updateLocation',
          latitude,
          longitude,
          accuracy
        }, '*');
      } catch (err) {
        console.error("Failed to send location to map iframe:", err);
      }
    }
  }

  const stopLocationTracking = () => {
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current)
      locationWatchIdRef.current = null
      console.log("Stopped location tracking")
    }
  }

  // Setup message listener for iframe communication
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Only handle messages from our map iframe
      if (event.source === mapRef.current?.contentWindow) {
        if (event.data.type === 'mapReady') {
          // Map is ready to receive location data
          if (userLocation && isOnline) {
            mapRef.current?.contentWindow?.postMessage({
              action: 'updateLocation',
              latitude: userLocation.lat,
              longitude: userLocation.lng,
              accuracy: locationAccuracy
            }, '*');
          }
        }
      }
    };
    
    window.addEventListener('message', handleIframeMessage);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [userLocation, locationAccuracy, isOnline]);

  const handleToggleOnline = (status: boolean) => {
    if (!socketRef.current) {
      Alert.alert("Error", "Cannot update status. Please try again later.")
      return
    }

    setIsOnline(status)
    console.log(`User is now ${status ? "online" : "offline"}`)

    // Always notify the server of status change regardless of location
    socketRef.current.emit("toggle-online-status", {
      status,
      isDriver: true,
      userId: user?.id
    })

    // If going online, check for location permissions and start tracking
    if (status && permissionGranted) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          // Update server with initial location
          socketRef.current?.emit("update-location", {
            latitude,
            longitude,
            accuracy,
            isOnline: true,
            isDriver: true,
            userId: user?.id,
            timestamp: Date.now()
          })
          
          // Start continuous tracking
          startLocationTracking()
        },
        (error) => {
          console.error("Error getting location for status update:", error)
          // Even if initial location fails, start tracking anyway
          startLocationTracking()
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      // If going offline, stop tracking
      stopLocationTracking()
    }
  }

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev)
  }

  const handleLogout = () => {
    if (isOnline) {
      handleToggleOnline(false)
    }
    
    // Ensure socket is disconnected
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    setMenuVisible(false)
    onLogout()
  }

  const navigateToProfile = () => {
    setPreviousPage(currentPage)
    setCurrentPage("Profile")
    setMenuVisible(false)
  }

  const navigateToHome = () => {
    setPreviousPage(currentPage)
    setCurrentPage("Home")
    setMenuVisible(false)
  }

  const navigateToSettings = () => {
    setPreviousPage(currentPage)
    setCurrentPage("Settings")
    setMenuVisible(false)
  }

  const switchToPassengerMode = () => {
    if (isOnline) {
      handleToggleOnline(false)
    }
    router.push("/lists")
    setMenuVisible(false)
  }

  const handleBack = () => {
    setCurrentPage(previousPage)
  }

  const createMapUrl = () => {
    const baseLocation = userLocation || defaultLocation
    let mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
      baseLocation.lng - zoomLevel
    },${baseLocation.lat - zoomLevel},${baseLocation.lng + zoomLevel},${
      baseLocation.lat + zoomLevel
    }&layer=mapnik&lang=en&doubleClickZoom=false`

    // We'll handle marker and accuracy circle via custom script
    return mapUrl
  }

  const openStreetMapUrl = createMapUrl()

  // Create custom map HTML with smaller radius and higher precision
  const createCustomMapHtml = () => {
    const baseLocation = userLocation || defaultLocation;
    const accuracy = locationAccuracy || 50; // Default accuracy if none provided
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Driver Location Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js"></script>
        <style>
          body, html, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .accuracy-circle {
            stroke: #4285F4;
            stroke-opacity: 0.6;
            fill: #4285F4;
            fill-opacity: 0.15;
          }
          .location-dot {
            background-color: #4285F4;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 3px rgba(0,0,0,0.3);
          }
          .pulse {
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(66, 133, 244, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
            }
          }
          .offline-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            display: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="offline-message" class="offline-message">You are currently offline</div>
        <script>
          // Initialize map
          const map = L.map('map').setView([${baseLocation.lat}, ${baseLocation.lng}], 18); // Higher initial zoom
          
          // Add tile layer (OpenStreetMap)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          let accuracyCircle = null;
          let locationMarker = null;
          let isDriverOnline = ${isOnline};
          
          // Custom marker icon resembling Google Maps
          const locationIcon = L.divIcon({
            className: 'location-dot pulse',
            iconSize: [14, 14], // Slightly smaller dot
            iconAnchor: [7, 7]
          });
          
          // Initialize location with improved precision and smaller radius
          function initializeLocation(lat, lng, accuracy) {
            // Remove existing marker and circle if they exist
            if (accuracyCircle) {
              map.removeLayer(accuracyCircle);
            }
            if (locationMarker) {
              map.removeLayer(locationMarker);
            }
            
            // Calculate scaled down radius for better visualization
            // Make the radius smaller - this is the key change you requested
            const scaledRadius = Math.min(accuracy * 0.7, accuracy - 2);
            
            // Add accuracy circle with smaller radius
            accuracyCircle = L.circle([lat, lng], {
              radius: scaledRadius, // Smaller radius for better visualization
              className: 'accuracy-circle'
            }).addTo(map);
            
            // Add marker at center
            locationMarker = L.marker([lat, lng], {
              icon: locationIcon
            }).addTo(map);
            
            // Center map on location with higher zoom level
            map.setView([lat, lng], getZoomForAccuracy(accuracy));
          }
          
          // Calculate appropriate zoom level based on accuracy - increased precision
          function getZoomForAccuracy(accuracy) {
            if (accuracy <= 5) return 20; // Extremely accurate
            if (accuracy <= 10) return 19; // Very accurate
            if (accuracy <= 30) return 18;
            if (accuracy <= 70) return 17;
            if (accuracy <= 150) return 16;
            if (accuracy <= 500) return 15;
            return 14; // Less accurate, zoom out more
          }
          
          // Setup message listener
          window.addEventListener('message', function(event) {
            if (event.data.action === 'updateLocation') {
              const { latitude, longitude, accuracy } = event.data;
              
              // Use the full precision of the coordinates (no rounding)
              initializeLocation(latitude, longitude, accuracy);
              document.getElementById('offline-message').style.display = 'none';
            } else if (event.data.action === 'setOffline') {
              // Display offline message and disable marker
              document.getElementById('offline-message').style.display = 'block';
              if (accuracyCircle) {
                map.removeLayer(accuracyCircle);
                accuracyCircle = null;
              }
              if (locationMarker) {
                map.removeLayer(locationMarker);
                locationMarker = null;
              }
            }
          });
          
          // Initialize with default location
          initializeLocation(${baseLocation.lat}, ${baseLocation.lng}, ${accuracy});
          
          // Show/hide offline message based on initial status
          if (!${isOnline}) {
            document.getElementById('offline-message').style.display = 'block';
          }
          
          // Let parent know we're ready
          if (window.parent) {
            window.parent.postMessage({ type: 'mapReady' }, '*');
          }
        </script>
      </body>
      </html>
    `;
  };

  // Effect to update map when online status changes
  useEffect(() => {
    if (mapRef.current?.contentWindow) {
      if (!isOnline) {
        // If offline, tell the map to hide the marker
        mapRef.current.contentWindow.postMessage({
          action: 'setOffline'
        }, '*');
      } else if (userLocation && isOnline) {
        // If online and we have location, update the marker
        mapRef.current.contentWindow.postMessage({
          action: 'updateLocation',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          accuracy: locationAccuracy
        }, '*');
      }
    }
  }, [isOnline]);

  const renderHamburgerButton = () => {
    if (currentPage !== "Home") return null;

    return (
      <View style={styles.leftControlsContainer}>
        <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
          <View style={styles.outsideBar} />
          <View style={styles.outsideBar} />
          <View style={styles.outsideBar} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleToggleOnline(!isOnline)}
          style={[
            styles.onlineToggle,
            { backgroundColor: isOnline ? "rgba(46, 204, 113, 0.8)" : "rgba(231, 76, 60, 0.8)" },
          ]}
        >
          <Text style={styles.onlineToggleText}>{isOnline ? "Online" : "Offline"}</Text>
        </TouchableOpacity>
        
        {userLocation && isOnline && (
          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyText}>
              Accuracy: {locationAccuracy ? `${Math.round(locationAccuracy)}m` : 'Unknown'}
            </Text>
          </View>
        )}
      </View>
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
      </View>
    )
  }

  if (currentPage === "Settings") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonSettings}>
          <Icon name="arrow-back" size={30} color="black" />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
        <Settings />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderHamburgerButton()}

      {!permissionGranted ? (
        <Text style={styles.permissionText}>
          Location permission is required to use the map. Please enable it in your browser settings.
        </Text>
      ) : (
        // Use a custom iframe with HTML that includes both map and location dot with accuracy circle
        <iframe 
          ref={mapRef} 
          srcDoc={createCustomMapHtml()}
          style={styles.map} 
          title="OpenStreetMap" 
          allow="geolocation *" 
          frameBorder="0"
        />
      )}

      {menuVisible && (
        <HamburgerMenu
          onNavigateHome={navigateToHome}
          onNavigateProfile={navigateToProfile}
          onNavigateSettings={navigateToSettings}
          onLogout={handleLogout}
          onSwitchMode={switchToPassengerMode}
          onClose={toggleMenu}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  permissionText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "red",
  },
  leftControlsContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 3,
    alignItems: "flex-start",
  },
  hamburgerButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 5,
    marginBottom: 10,
  },
  outsideBar: {
    height: 4,
    width: 30,
    backgroundColor: "black",
    marginVertical: 3,
    borderRadius: 2,
  },
  onlineToggle: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
    marginBottom: 10,
  },
  onlineToggleText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  accuracyContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 5,
    padding: 8,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 5,
  },
  backButtonSettings: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  settingsText: {
    fontSize: 20,
    fontWeight: "600",
    color: "black",
    marginLeft: 10,
  },
  profileDetails: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 60,
  },
  permissionErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  permissionErrorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryPermissionButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  retryPermissionButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
})

export default DriverUI