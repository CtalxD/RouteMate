import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "expo-router"
import Profile from "./Profile"
import { useGetProfile } from "@/services/profile.service"
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

  const { data: profileData } = useGetProfile()
  const [menuVisible, setMenuVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState("Home")
  const [previousPage, setPreviousPage] = useState("Home")
  const { onLogout } = useAuth()

  // Initialize Socket.io connection
  useEffect(() => {
    socketRef.current = io(API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    })

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
            startLocationTracking()
          } else if (permission.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(
              () => {
                setPermissionGranted(true)
                startLocationTracking()
              },
              handleLocationError,
              { enableHighAccuracy: true }
            )
          }
          
          permission.onchange = () => {
            if (permission.state === 'granted') {
              setPermissionGranted(true)
              startLocationTracking()
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
              startLocationTracking()
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
            startLocationTracking()
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
          Alert.alert("Timeout", "The request to get user location timed out.")
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
  }, [])

  // Start location tracking with 5-second updates
  const startLocationTracking = () => {
    if (!permissionGranted) return

    // Clear any existing watch
    stopLocationTracking()

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // Increased timeout for better reliability
      maximumAge: 0, // Always get fresh position
    }

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePositionUpdate(position)
      },
      (error) => {
        console.error("Error getting initial position:", error)
      },
      options
    )

    // Set up periodic updates (every 5 seconds)
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (error) => {
        console.error("Error watching location:", error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Accept positions up to 5 seconds old
      }
    )

    // Also set up a backup interval in case watchPosition fails
    const backupInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        (error) => {
          console.error("Backup location error:", error)
        },
        options
      )
    }, 5000) // 5 seconds

    return () => {
      clearInterval(backupInterval)
    }
  }

  const handlePositionUpdate = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    console.log(`Position updated at ${new Date().toISOString()} with accuracy: ${accuracy} meters`)

    const location = { name: "User", lat: latitude, lng: longitude }
    setUserLocation(location)

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
  }

  const stopLocationTracking = () => {
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current)
      locationWatchIdRef.current = null
    }
  }

  // Handle online status changes
  useEffect(() => {
    if (isOnline && permissionGranted) {
      startLocationTracking()
    } else {
      stopLocationTracking()
    }

    return () => {
      stopLocationTracking()
    }
  }, [isOnline, permissionGranted])

  const handleToggleOnline = (status: boolean) => {
    if (!socketRef.current) {
      Alert.alert("Error", "Cannot update status. Please try again later.")
      return
    }

    setIsOnline(status)
    console.log(`User is now ${status ? "online" : "offline"}`)

    if (status && permissionGranted) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          socketRef.current?.emit("toggle-online-status", {
            status,
            isDriver: true,
            latitude,
            longitude,
            accuracy,
            userId: user?.id
          })
        },
        (error) => {
          console.error("Error getting location for status update:", error)
          socketRef.current?.emit("toggle-online-status", {
            status,
            isDriver: true,
            userId: user?.id
          })
        },
        { enableHighAccuracy: true }
      )
    } else {
      socketRef.current.emit("toggle-online-status", {
        status,
        isDriver: true,
        userId: user?.id
      })
    }
  }

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev)
  }

  const handleLogout = () => {
    if (isOnline) {
      handleToggleOnline(false)
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

    if (userLocation && isOnline) {
      mapUrl += `&marker=${userLocation.lat},${userLocation.lng}`
    }

    return mapUrl
  }

  const openStreetMapUrl = createMapUrl()

  const renderHamburgerButton = () => {
    if (currentPage !== "Home") return null

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
      </View>
    )
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
        <iframe 
          ref={mapRef} 
          src={openStreetMapUrl} 
          style={styles.map} 
          title="OpenStreetMap" 
          allow="geolocation *" 
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
  },
  onlineToggleText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
})

export default DriverUI