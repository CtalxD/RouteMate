"use client"

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

const API_URL = "http://localhost:5000" // Update this with your actual backend URL

const DriverUI = () => {
  const [zoomLevel] = useState(0.01)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const auth = useAuth()
  const [otherUsers, setOtherUsers] = useState<Record<string, UserLocation>>({})
  const mapRef = useRef<HTMLIFrameElement>(null)
  const locationWatchIdRef = useRef<number | null>(null)

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
    // Connect to Socket.io server
    socketRef.current = io(API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id)

      // If was online before, restore status
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

    // Clean up socket connection on component unmount
    return () => {
      if (socket) {
        console.log("Disconnecting socket")
        socket.disconnect()
      }
    }
  }, [])

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev)
  }

  const handleLogout = () => {
    // Set offline before logout
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
    // Set offline before switching modes
    if (isOnline) {
      handleToggleOnline(false)
    }
    router.push("/lists")
    setMenuVisible(false)
  }

  const handleBack = () => {
    setCurrentPage(previousPage)
  }

  const handleToggleOnline = (status: boolean) => {
    if (!socketRef.current) {
      Alert.alert("Error", "Cannot update status. Please try again later.")
      return
    }

    setIsOnline(status)
    console.log(`User is now ${status ? "online" : "offline"}`)

    // Send status update to server via socket
    socketRef.current.emit("toggle-online-status", {
      status,
    })

    // Start or stop location tracking based on online status
    if (status) {
      startLocationTracking()
    } else {
      stopLocationTracking()
    }
  }

  // Request location permission
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" })
        if (permission.state === "granted") {
          setPermissionGranted(true)
        } else if (permission.state === "prompt") {
          // Request permission with high accuracy options
          navigator.geolocation.getCurrentPosition(
            () => setPermissionGranted(true),
            (error) => handleLocationError(error),
            { enableHighAccuracy: true },
          )
        }
      } catch (error) {
        // Fallback for browsers that don't support permissions API
        navigator.geolocation.getCurrentPosition(
          () => setPermissionGranted(true),
          (error) => handleLocationError(error),
          { enableHighAccuracy: true },
        )
      }
    }

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Error getting location permission:", error)
      if (error.code === 1) {
        alert("Location permission is required to use this feature. Please enable it in your browser settings.")
      } else {
        alert("An error occurred while fetching your location. Please try again.")
      }
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.")
      alert("Geolocation is not supported by your browser. Please use a modern browser.")
      return
    }

    requestLocationPermission()
  }, [])

  // Start location tracking
  const startLocationTracking = () => {
    if (!permissionGranted) return

    // Clear any existing watch
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current)
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0, // No cache, always get fresh position
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log(`Position acquired with accuracy: ${accuracy} meters`)

        const location = { name: "User", lat: latitude, lng: longitude }
        setUserLocation(location)

        // Send location updates to server since we're online
        if (socketRef.current) {
          socketRef.current.emit("update-location", {
            latitude,
            longitude,
            accuracy,
            isOnline: true,
          })
        }
      },
      (error) => {
        console.error("Error getting location:", error)
      },
      options,
    )
  }

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current)
      locationWatchIdRef.current = null
    }
  }

  // Start or stop location tracking when online status or permission changes
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

  // Create map URL based on user's location
  const createMapUrl = () => {
    const baseLocation = userLocation || defaultLocation

    // Start with the base map URL
    let mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
      baseLocation.lng - zoomLevel
    },${baseLocation.lat - zoomLevel},${baseLocation.lng + zoomLevel},${
      baseLocation.lat + zoomLevel
    }&layer=mapnik&lang=en&doubleClickZoom=false`

    // Add the current user's marker only if online
    if (userLocation && isOnline) {
      mapUrl += `&marker=${userLocation.lat},${userLocation.lng}`
    }

    return mapUrl
  }

  const openStreetMapUrl = createMapUrl()

  const renderHamburgerButton = () => {
    if (currentPage !== "Home") return null

    return (
      <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
        <View style={styles.outsideBar} />
        <View style={styles.outsideBar} />
        <View style={styles.outsideBar} />
      </TouchableOpacity>
    )
  }

  // Online/Offline toggle button
  const renderOnlineToggle = () => {
    if (currentPage !== "Home") return null

    return (
      <TouchableOpacity
        onPress={() => handleToggleOnline(!isOnline)}
        style={[
          styles.onlineToggle,
          { backgroundColor: isOnline ? "rgba(46, 204, 113, 0.8)" : "rgba(231, 76, 60, 0.8)" },
        ]}
      >
        <Text style={styles.onlineToggleText}>{isOnline ? "Online" : "Offline"}</Text>
      </TouchableOpacity>
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
      {renderOnlineToggle()}

      {!permissionGranted ? (
        <Text style={styles.permissionText}>
          Location permission is required to use the map. Please enable it in your browser settings.
        </Text>
      ) : (
        <iframe ref={mapRef} src={openStreetMapUrl} style={styles.map} title="OpenStreetMap" allow="geolocation" />
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
  hamburgerButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 5,
  },
  outsideBar: {
    height: 4,
    width: 30,
    backgroundColor: "black",
    marginVertical: 3,
    borderRadius: 2,
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
  onlineToggle: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 3,
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
})

export default DriverUI