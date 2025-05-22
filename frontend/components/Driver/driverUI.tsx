"use client"

//from frontend/components/Driver/driverUI.tsx

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { View, StyleSheet, Text, TouchableOpacity, Alert, TextInput, FlatList, ActivityIndicator } from "react-native"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "expo-router"
import Settings from "./Settings"
import Icon from "react-native-vector-icons/Ionicons"
import HamburgerMenu from "./HamburgerMenu"
import { io, type Socket } from "socket.io-client"
import EmergencyButton from "./emergency"

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

// Define types for location suggestions and selected locations
interface LocationSuggestion {
  id: string
  name: string
  lat: number
  lon: number
}

interface SelectedLocation {
  name: string
  lat: number
  lon: number
}

interface BusStop {
  id: string
  lat: number
  lon: number
  name?: string
  tags?: Record<string, string>
}

const API_URL = "http://localhost:5000"

// Kathmandu bounding box coordinates
const KATHMANDU_BOUNDS = {
  minLon: 85.2,
  minLat: 27.6,
  maxLon: 85.5,
  maxLat: 27.8,
}

const DriverUI = () => {
  const [zoomLevel] = useState(0.01)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false) // New state to track explicit denial
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

  // Routing functionality from contact-map.tsx
  const [searchVisible, setSearchVisible] = useState(false)
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [fromSuggestions, setFromSuggestions] = useState<LocationSuggestion[]>([])
  const [toSuggestions, setToSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingFrom, setIsLoadingFrom] = useState(false)
  const [isLoadingTo, setIsLoadingTo] = useState(false)
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedFromLocation, setSelectedFromLocation] = useState<SelectedLocation | null>(null)
  const [selectedToLocation, setSelectedToLocation] = useState<SelectedLocation | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [busStops, setBusStops] = useState<BusStop[]>([])
  const [showBusStops, setShowBusStops] = useState(false)
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false)
  const [isOutOfServiceArea, setIsOutOfServiceArea] = useState(false)
  const [isRideStarted, setIsRideStarted] = useState(false)
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState<string | null>(null)
  const [distanceCovered, setDistanceCovered] = useState<number>(0)
  const [totalDistance, setTotalDistance] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null)

  // Initialize Socket.io connection
  useEffect(() => {
    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(API_URL, {
        withCredentials: true,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
    }

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id)

      // Authenticate immediately after connection
      if (user?.id) {
        socket.emit("authenticate", {
          userId: user.id,
          userType: "driver",
        })
      }

      // If we were online before reconnection, update status
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

      // If the disconnection was not initiated by the client, try to reconnect
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, reconnect manually
        socket.connect()
      }
      // else the socket will automatically try to reconnect
    })

    // Clean up function
    return () => {
      if (socket) {
        console.log("Disconnecting socket")
        socket.off("connect")
        socket.off("location-updated")
        socket.off("status-changed")
        socket.off("connect_error")
        socket.off("disconnect")
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
          const permission = await navigator.permissions.query({ name: "geolocation" })

          if (permission.state === "granted") {
            setPermissionGranted(true)
            setPermissionDenied(false)
            if (isOnline) {
              startLocationTracking()
            }
          } else if (permission.state === "prompt") {
            // User hasn't made a decision yet, let's ask
            navigator.geolocation.getCurrentPosition(
              () => {
                setPermissionGranted(true)
                setPermissionDenied(false)
                if (isOnline) {
                  startLocationTracking()
                }
              },
              (error) => {
                handleLocationError(error)
                if (error.code === 1) {
                  // PERMISSION_DENIED
                  setPermissionDenied(true)
                }
              },
              { enableHighAccuracy: true },
            )
          } else if (permission.state === "denied") {
            // Permission was already denied
            setPermissionGranted(false)
            setPermissionDenied(true)
            console.log("Geolocation permission was previously denied")
          }

          permission.onchange = () => {
            if (permission.state === "granted") {
              setPermissionGranted(true)
              setPermissionDenied(false)
              if (isOnline) {
                startLocationTracking()
              }
            } else if (permission.state === "denied") {
              setPermissionGranted(false)
              setPermissionDenied(true)
              stopLocationTracking()
            }
          }
        } else {
          // Fallback for browsers that don't support permissions API
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissionGranted(true)
              setPermissionDenied(false)
              if (isOnline) {
                startLocationTracking()
              }
            },
            (error) => {
              handleLocationError(error)
              if (error.code === 1) {
                // PERMISSION_DENIED
                setPermissionDenied(true)
              }
            },
            { enableHighAccuracy: true },
          )
        }
      } catch (error) {
        console.error("Error checking permissions:", error)
        // Try the fallback method
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissionGranted(true)
            setPermissionDenied(false)
            if (isOnline) {
              startLocationTracking()
            }
          },
          (error) => {
            handleLocationError(error)
            if (error.code === 1) {
              // PERMISSION_DENIED
              setPermissionDenied(true)
            }
          },
          { enableHighAccuracy: true },
        )
      }
    }

    const handleLocationError = (error: GeolocationPositionError) => {
      console.error("Location error:", error)
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setPermissionDenied(true)
          setPermissionGranted(false)
          // Only show alert once, not on retries
          if (!permissionDenied) {
            Alert.alert(
              "Location Permission Required",
              "This app needs your location to function properly. Please enable location permissions in your browser settings.",
              [
                {
                  text: "Settings",
                  onPress: () => {
                    // On mobile, this might open settings. On web, provide instructions
                    Alert.alert(
                      "Enable Location",
                      "To enable location: Click the lock/info icon in your browser's address bar and allow location access.",
                    )
                  },
                },
                { text: "Continue without location", style: "cancel" },
              ],
            )
          }
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

    // Only request permission if we haven't been explicitly denied
    if (!permissionDenied) {
      requestLocationPermission()
    }

    return () => {
      stopLocationTracking()
    }
  }, [isOnline, permissionDenied])

  // Start location tracking with more frequent updates and high accuracy
  const startLocationTracking = () => {
    if (!permissionGranted || !isOnline || permissionDenied) return

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
        // If permission denied, don't retry
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionDenied(true)
          setPermissionGranted(false)
          return
        }

        // If initial position fails for other reasons, try again after a short delay
        setTimeout(() => {
          if (permissionDenied) return // Don't retry if permission was denied

          navigator.geolocation.getCurrentPosition(
            handlePositionUpdate,
            (err) => {
              console.error("Retry failed:", err)
              if (err.code === err.PERMISSION_DENIED) {
                setPermissionDenied(true)
                setPermissionGranted(false)
              }
            },
            options,
          )
        }, 1000)
      },
      options,
    )

    // Only set up watchPosition if we have permission
    if (!permissionDenied) {
      // Set up watchPosition with more relaxed parameters
      locationWatchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => {
          console.error("Error watching location:", error)

          // If permission denied, stop tracking
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionDenied(true)
            setPermissionGranted(false)
            stopLocationTracking()
            return
          }

          // If watch fails for other reasons, try to restart it
          if (error.code === error.TIMEOUT) {
            setTimeout(() => {
              if (isOnline && permissionGranted && !permissionDenied) {
                startLocationTracking()
              }
            }, 2000)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Longer timeout for watchPosition
          maximumAge: 5000, // Allow slightly older positions
        },
      )

      console.log("Started location tracking with ID:", locationWatchIdRef.current)
    }
  }

  const handlePositionUpdate = (position: GeolocationPosition) => {
    // If we're offline, don't update anything
    if (!isOnline) return

    const { latitude, longitude, accuracy } = position.coords
    console.log(`Position updated at ${new Date().toISOString()} with accuracy: ${accuracy} meters`)

    // Store location with full precision
    const location = {
      name: "User",
      lat: latitude,
      lng: longitude,
    }
    setUserLocation(location)
    setLocationAccuracy(accuracy)

    // Make sure socket exists and is connected before sending updates
    if (socketRef.current && socketRef.current.connected && isOnline) {
      socketRef.current.emit("update-location", {
        latitude,
        longitude,
        accuracy,
        isOnline: true,
        isDriver: true,
        userId: user?.id,
        timestamp: Date.now(),
      })
    } else if (isOnline) {
      console.log("Socket not connected, cannot send location update")
      // Try to reconnect if socket is not connected but we're online
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect()
      }
    }

    // If we have a map reference, update the map directly using postMessage to the iframe
    if (mapRef.current?.contentWindow) {
      try {
        mapRef.current.contentWindow.postMessage(
          {
            action: "updateLocation",
            latitude,
            longitude,
            accuracy,
          },
          "*",
        )
      } catch (err) {
        console.error("Failed to send location to map iframe:", err)
      }
    }

    // Track distance covered if ride is started
    if (isRideStarted && lastPosition) {
      const newDistanceCovered = calculateDistance(lastPosition.lat, lastPosition.lng, latitude, longitude) / 1000 // Convert to km

      setDistanceCovered((prev) => prev + newDistanceCovered)
      setLastPosition({
        lat: latitude,
        lng: longitude,
      })

      // Update estimated arrival time based on progress
      if (totalDistance && totalDistance > 0) {
        const remainingDistance = totalDistance - distanceCovered

        if (startTime && routeDuration) {
          const elapsedMinutes = (Date.now() - startTime) / (60 * 1000)
          const totalEstimatedMinutes = routeDuration
          const remainingMinutes = Math.max(0, totalEstimatedMinutes - elapsedMinutes)

          const arrivalDate = new Date(Date.now() + remainingMinutes * 60 * 1000)
          const hours = arrivalDate.getHours()
          const minutes = arrivalDate.getMinutes()
          const formattedTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`
          setEstimatedArrivalTime(formattedTime)
        }
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

  // Function to manually request location permission again
  const requestLocationPermissionAgain = () => {
    if (permissionDenied) {
      Alert.alert(
        "Location Permission Required",
        "Please enable location access in your browser settings and then try again.",
        [
          {
            text: "How to enable",
            onPress: () => {
              Alert.alert(
                "Enable Location Access",
                "1. Click on the lock/info icon in your browser's address bar\n" +
                  "2. Find 'Location' or 'Site settings'\n" +
                  "3. Change the setting to 'Allow'\n" +
                  "4. Refresh the page",
              )
            },
          },
          {
            text: "Try again",
            onPress: () => {
              // Reset permission states
              setPermissionDenied(false)

              // Try to get location again
              navigator.geolocation.getCurrentPosition(
                () => {
                  setPermissionGranted(true)
                  setPermissionDenied(false)
                  if (isOnline) {
                    startLocationTracking()
                  }
                },
                (error) => {
                  console.error("Error getting location after retry:", error)
                  if (error.code === error.PERMISSION_DENIED) {
                    setPermissionDenied(true)
                    setPermissionGranted(false)
                  }
                },
                { enableHighAccuracy: true },
              )
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
      )
    }
  }

  // Setup message listener for iframe communication
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Only handle messages from our map iframe
      if (event.source === mapRef.current?.contentWindow) {
        if (event.data.type === "mapReady") {
          // Map is ready to receive location data
          setIsMapReady(true)
          if (userLocation && isOnline) {
            mapRef.current?.contentWindow?.postMessage(
              {
                action: "updateLocation",
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                accuracy: locationAccuracy,
              },
              "*",
            )
          }
        }
      }

      // Add this to the useEffect that has the handleIframeMessage function
      if (event.data.type === "MAP_LOCATION_SELECTED") {
        const { field, lat, lng } = event.data
        // Reopen search panel
        setSearchVisible(true)

        // Get location name from coordinates using reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then((response) => response.json())
          .then((data) => {
            const locationName = data.display_name || `Selected Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`

            if (field === "from") {
              setFromLocation(locationName)
              setSelectedFromLocation({
                name: locationName,
                lat: lat,
                lon: lng,
              })

              sendMessageToMap({
                type: "ADD_FROM_MARKER",
                lat: lat,
                lon: lng,
                name: locationName,
              })
            } else {
              setToLocation(locationName)
              setSelectedToLocation({
                name: locationName,
                lat: lat,
                lon: lng,
              })

              sendMessageToMap({
                type: "ADD_TO_MARKER",
                lat: lat,
                lon: lng,
                name: locationName,
              })
            }
          })
          .catch((error) => {
            console.error("Error in reverse geocoding:", error)
            const locationName = `Selected Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`

            if (field === "from") {
              setFromLocation(locationName)
              setSelectedFromLocation({
                name: locationName,
                lat: lat,
                lon: lng,
              })

              sendMessageToMap({
                type: "ADD_FROM_MARKER",
                lat: lat,
                lon: lng,
                name: locationName,
              })
            } else {
              setToLocation(locationName)
              setSelectedToLocation({
                name: locationName,
                lat: lat,
                lon: lng,
              })

              sendMessageToMap({
                type: "ADD_TO_MARKER",
                lat: lat,
                lon: lng,
                name: locationName,
              })
            }
          })
      }
    }

    window.addEventListener("message", handleIframeMessage)

    return () => {
      window.removeEventListener("message", handleIframeMessage)
    }
  }, [userLocation, locationAccuracy, isOnline])

  const handleEmergency = () => {
    // Send emergency alert to server if socket is connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("emergency-alert", {
        driverId: user?.id,
        timestamp: Date.now(),
        location: userLocation
          ? {
              lat: userLocation.lat,
              lng: userLocation.lng,
              accuracy: locationAccuracy,
            }
          : null,
      })
    }
  }

  const handleToggleOnline = (status: boolean) => {
    // Check if socket exists and is connected
    if (!socketRef.current) {
      console.log("Socket not initialized, creating new connection")
      socketRef.current = io(API_URL, {
        withCredentials: true,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      // Set up event listeners for the new socket
      const socket = socketRef.current
      socket.on("connect", () => {
        console.log("Socket connected in handleToggleOnline")
        continueToggleOnline(status)
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error in handleToggleOnline:", error)
        Alert.alert("Connection Error", "Failed to connect to the server. Please try again later.")
        setIsOnline(false)
      })

      // If socket is already connected, continue with toggle
      if (socket.connected) {
        continueToggleOnline(status)
      }
    } else if (!socketRef.current.connected) {
      console.log("Socket exists but not connected, reconnecting")
      socketRef.current.connect()

      // Wait for connection before continuing
      socketRef.current.once("connect", () => {
        console.log("Socket reconnected in handleToggleOnline")
        continueToggleOnline(status)
      })
    } else {
      // Socket exists and is connected
      continueToggleOnline(status)
    }

    function continueToggleOnline(status: boolean) {
      setIsOnline(status)
      console.log(`User is now ${status ? "online" : "offline"}`)

      // Always notify the server of status change
      socketRef.current?.emit("toggle-online-status", {
        status,
        isDriver: true,
        userId: user?.id,
      })

      // If going online, check for location permissions and start tracking
      if (status) {
        if (permissionDenied) {
          // If permission is denied, prompt the user to enable it
          Alert.alert(
            "Location Required",
            "Location permission is required to go online. Would you like to enable location access?",
            [
              {
                text: "Yes",
                onPress: requestLocationPermissionAgain,
              },
              {
                text: "No",
                onPress: () => {
                  // If user doesn't want to enable location, set them back offline
                  setIsOnline(false)
                  socketRef.current?.emit("toggle-online-status", {
                    status: false,
                    isDriver: true,
                    userId: user?.id,
                  })
                },
                style: "cancel",
              },
            ],
          )
          return
        }

        if (permissionGranted) {
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
                timestamp: Date.now(),
              })

              // Start continuous tracking
              startLocationTracking()
            },
            (error) => {
              console.error("Error getting location for status update:", error)

              // If permission denied, handle appropriately
              if (error.code === error.PERMISSION_DENIED) {
                setPermissionDenied(true)
                setPermissionGranted(false)

                // Set back to offline since we can't track location
                setIsOnline(false)
                socketRef.current?.emit("toggle-online-status", {
                  status: false,
                  isDriver: true,
                  userId: user?.id,
                })

                Alert.alert(
                  "Cannot Go Online",
                  "Location permission is required to go online. Please enable location access in your browser settings.",
                )
              } else {
                // For other errors, still try to start tracking
                startLocationTracking()
              }
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        } else {
          // If permission not yet granted, try to request it
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setPermissionGranted(true)
              setPermissionDenied(false)

              const { latitude, longitude, accuracy } = position.coords
              // Update server with initial location
              socketRef.current?.emit("update-location", {
                latitude,
                longitude,
                accuracy,
                isOnline: true,
                isDriver: true,
                userId: user?.id,
                timestamp: Date.now(),
              })

              // Start continuous tracking
              startLocationTracking()
            },
            (error) => {
              console.error("Error getting location for status update:", error)

              // If permission denied, handle appropriately
              if (error.code === error.PERMISSION_DENIED) {
                setPermissionDenied(true)
                setPermissionGranted(false)

                // Set back to offline since we can't track location
                setIsOnline(false)
                socketRef.current?.emit("toggle-online-status", {
                  status: false,
                  isDriver: true,
                  userId: user?.id,
                })

                Alert.alert(
                  "Cannot Go Online",
                  "Location permission is required to go online. Please enable location access in your browser settings.",
                )
              }
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        }
      } else {
        // If going offline, stop tracking
        stopLocationTracking()
      }
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
      // First emit an offline status update
      socketRef.current.emit("toggle-online-status", {
        status: false,
        isDriver: true,
        userId: user?.id,
      })

      // Then disconnect
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setMenuVisible(false)
    onLogout()
  }

  const navigateToProfile = () => {
    setMenuVisible(false)
    router.push("/(tabs)/prf")
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

  const navigateToPassengers = () => {
    setPreviousPage(currentPage)
    setMenuVisible(false)
    router.push("/pass")
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

  // Routing functionality from contact-map.tsx
  const toggleSearch = () => {
    setSearchVisible(!searchVisible)
    if (!searchVisible) {
      setFromSuggestions([])
      setToSuggestions([])
      setActiveField(null)
    } else {
      // Only reset form fields when closing the search panel if no locations are input
      if (!fromLocation && !toLocation) {
        resetFormFields()
      } else {
        // Just clear suggestions without removing markers
        setFromSuggestions([])
        setToSuggestions([])
      }
    }
  }

  // Function to reset form fields
  const resetFormFields = () => {
    setFromLocation("")
    setToLocation("")
    setSelectedFromLocation(null)
    setSelectedToLocation(null)
    setFromSuggestions([])
    setToSuggestions([])

    // Only clear markers from the map if no locations are input
    if (!fromLocation && !toLocation) {
      if (mapRef.current?.contentWindow) {
        mapRef.current.contentWindow.postMessage(
          {
            type: "REMOVE_FROM_MARKER",
          },
          "*",
        )
        mapRef.current.contentWindow.postMessage(
          {
            type: "REMOVE_TO_MARKER",
          },
          "*",
        )
      }
    }
  }

  const toggleBusStops = async () => {
    const newShowState = !showBusStops
    setShowBusStops(newShowState)

    if (isMapReady) {
      if (newShowState) {
        // First check if we already have bus stops loaded
        if (busStops.length > 0) {
          // Send existing bus stops to the map
          sendMessageToMap({
            type: "ADD_BUS_STOPS",
            stops: busStops,
          })
          // Explicitly tell the map to show the bus stops
          sendMessageToMap({
            type: "SHOW_BUS_STOPS",
          })
        } else {
          // Fetch bus stops if we don't have them yet
          setIsLoadingBusStops(true)
          try {
            const stops = await fetchBusStops()
            // Important: Make sure we're still in "show" mode before displaying
            if (newShowState) {
              // Send the fetched bus stops to the map immediately
              sendMessageToMap({
                type: "ADD_BUS_STOPS",
                stops: stops,
              })
              // Explicitly tell the map to show the bus stops
              sendMessageToMap({
                type: "SHOW_BUS_STOPS",
              })
            }
          } catch (error) {
            console.error("Error in toggleBusStops:", error)
          } finally {
            setIsLoadingBusStops(false)
          }
        }
      } else {
        // Hide bus stops
        sendMessageToMap({
          type: "HIDE_BUS_STOPS",
        })
      }
    }
  }

  // Initial fetch of bus stops when map is ready
  useEffect(() => {
    if (isMapReady && busStops.length === 0) {
      console.log("Map is ready, fetching bus stops data")
      fetchBusStops()
    }
  }, [isMapReady, busStops.length])

  // Check if locations are outside Kathmandu bounds
  useEffect(() => {
    if (selectedFromLocation && selectedToLocation) {
      const isFromOutsideKathmandu =
        selectedFromLocation.lat < KATHMANDU_BOUNDS.minLat ||
        selectedFromLocation.lat > KATHMANDU_BOUNDS.maxLat ||
        selectedFromLocation.lon < KATHMANDU_BOUNDS.minLon ||
        selectedFromLocation.lon > KATHMANDU_BOUNDS.maxLon

      const isToOutsideKathmandu =
        selectedToLocation.lat < KATHMANDU_BOUNDS.minLat ||
        selectedToLocation.lat > KATHMANDU_BOUNDS.maxLat ||
        selectedToLocation.lon < KATHMANDU_BOUNDS.minLon ||
        selectedToLocation.lon > KATHMANDU_BOUNDS.maxLon

      setIsOutOfServiceArea(isFromOutsideKathmandu || isToOutsideKathmandu)
    } else {
      setIsOutOfServiceArea(false)
    }
  }, [selectedFromLocation, selectedToLocation])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // distance in meters
  }

  const fetchBusStops = useCallback(async () => {
    // Check if we already have bus stops loaded
    if (busStops.length > 0) {
      console.log("Using cached bus stops data, already have", busStops.length, "stops")
      return busStops
    }

    try {
      setIsLoadingBusStops(true)
      console.log("Fetching bus stops from OpenStreetMap...")

      // Use a more reliable API endpoint with a simpler query
      const overpassQuery = `[out:json][timeout:90];
      (
        node["highway"="bus_stop"](27.65,85.25,27.75,85.45);
        node["public_transport"="stop_position"](27.65,85.25,27.75,85.45);
      );
      out body;`

      // Add a longer timeout for the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
        { signal: controller.signal },
      )

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log(`Fetched ${data.elements.length} bus stops from OpenStreetMap`)

        const stops = data.elements.map((element: any) => ({
          id: element.id.toString(),
          lat: element.lat,
          lon: element.lon,
          name: element.tags?.name || `Bus Stop ${element.id}`,
          tags: element.tags || {},
        }))

        // Update state with the fetched bus stops
        setBusStops(stops)

        // Return the stops for use in the Promise chain
        return stops
      } else {
        console.error("Failed to fetch bus stops:", response.status)

        // Fallback to hardcoded bus stops if API fails
        const fallbackStops = generateFallbackBusStops()
        setBusStops(fallbackStops)
        return fallbackStops
      }
    } catch (error) {
      console.error("Error fetching bus stops:", error)

      // Fallback to hardcoded bus stops if API fails
      const fallbackStops = generateFallbackBusStops()
      setBusStops(fallbackStops)
      return fallbackStops
    } finally {
      setIsLoadingBusStops(false)
    }
  }, [busStops])

  // Generate fallback bus stops for Kathmandu
  const generateFallbackBusStops = () => {
    // These are some major bus stops in Kathmandu
    return [
      { id: "f1", lat: 27.7172, lon: 85.324, name: "Ratnapark Bus Stop" },
      { id: "f2", lat: 27.7041, lon: 85.3145, name: "Kalanki Bus Stop" },
      { id: "f3", lat: 27.698, lon: 85.3592, name: "Koteshwor Bus Stop" },
      { id: "f4", lat: 27.7304, lon: 85.3415, name: "Chabahil Bus Stop" },
      { id: "f5", lat: 27.6796, lon: 85.3371, name: "Satdobato Bus Stop" },
      { id: "f6", lat: 27.7116, lon: 85.3159, name: "Tripureshwor Bus Stop" },
      { id: "f7", lat: 27.7105, lon: 85.3414, name: "Baneshwor Bus Stop" },
      { id: "f8", lat: 27.7192, lon: 85.3079, name: "Swayambhu Bus Stop" },
      { id: "f9", lat: 27.7308, lon: 85.3299, name: "Maharajgunj Bus Stop" },
      { id: "f10", lat: 27.671, lon: 85.4298, name: "Bhaktapur Bus Stop" },
      { id: "f11", lat: 27.6747, lon: 85.3206, name: "Balkhu Bus Stop" },
      { id: "f12", lat: 27.7385, lon: 85.336, name: "Budhanilkantha Bus Stop" },
      { id: "f13", lat: 27.7269, lon: 85.3657, name: "Jorpati Bus Stop" },
      { id: "f14", lat: 27.6816, lon: 85.3019, name: "Thankot Bus Stop" },
      { id: "f15", lat: 27.7006, lon: 85.3293, name: "Kalimati Bus Stop" },
    ]
  }

  const fetchSuggestions = async (
    query: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setSuggestions: React.Dispatch<React.SetStateAction<LocationSuggestion[]>>,
  ) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}` +
          `&format=json` +
          `&viewbox=${KATHMANDU_BOUNDS.minLon},${KATHMANDU_BOUNDS.minLat},${KATHMANDU_BOUNDS.maxLon},${KATHMANDU_BOUNDS.maxLat}` +
          `&bounded=1` +
          `&limit=5` +
          `&addressdetails=1`,
      )

      if (response.ok) {
        const data = await response.json()
        const formattedSuggestions = data.map((item: any) => ({
          id: item.place_id.toString(),
          name: item.display_name,
          lat: Number.parseFloat(item.lat),
          lon: Number.parseFloat(item.lon),
        }))

        setSuggestions(formattedSuggestions)
      } else {
        console.error("Failed to fetch suggestions:", response.status)
        setSuggestions([])
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const sendMessageToMap = (message: any) => {
    if (mapRef.current?.contentWindow) {
      mapRef.current.contentWindow.postMessage(message, "*")
      return true
    }
    return false
  }

  const handleFromLocationChange = (text: string) => {
    setFromLocation(text)
    setActiveField("from")

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      fetchSuggestions(text, setIsLoadingFrom, setFromSuggestions)
    }, 500)

    setDebounceTimer(timer)
  }

  const handleToLocationChange = (text: string) => {
    setToLocation(text)
    setActiveField("to")

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      fetchSuggestions(text, setIsLoadingTo, setToSuggestions)
    }, 500)

    setDebounceTimer(timer)
  }

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    if (activeField === "from") {
      setFromLocation(suggestion.name)
      setFromSuggestions([])
      setSelectedFromLocation({
        name: suggestion.name,
        lat: suggestion.lat,
        lon: suggestion.lon,
      })

      sendMessageToMap({
        type: "ADD_FROM_MARKER",
        lat: suggestion.lat,
        lon: suggestion.lon,
        name: suggestion.name,
      })
    } else if (activeField === "to") {
      setToLocation(suggestion.name)
      setToSuggestions([])
      setSelectedToLocation({
        name: suggestion.name,
        lat: suggestion.lat,
        lon: suggestion.lon,
      })

      sendMessageToMap({
        type: "ADD_TO_MARKER",
        lat: suggestion.lat,
        lon: suggestion.lon,
        name: suggestion.name,
      })
    }

    setActiveField(null)

    // Make sure user location is still displayed by sending it to the map again
    if (userLocation && isOnline) {
      sendMessageToMap({
        action: "updateLocation",
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        accuracy: locationAccuracy,
      })
    }
  }

  const handleSetLocationFromMap = (field: "from" | "to") => {
    // Close the suggestions
    if (field === "from") {
      setFromSuggestions([])
    } else {
      setToSuggestions([])
    }

    // Set active field for the map to know which marker to update
    setActiveField(field)

    // Close search panel temporarily
    setSearchVisible(false)

    // Send message to map to enter location selection mode
    sendMessageToMap({
      type: "ENTER_MAP_SELECTION_MODE",
      field: field,
    })

    // Show notification to user
    Alert.alert("Select Location", "Tap on the map to select your location", [
      {
        text: "Cancel",
        onPress: () => {
          // Exit map selection mode
          sendMessageToMap({
            type: "EXIT_MAP_SELECTION_MODE",
          })
          // Reopen search panel
          setSearchVisible(true)
        },
        style: "cancel",
      },
    ])
  }

  const handleUseCurrentLocation = () => {
    if (!userLocation) {
      Alert.alert(
        "Location Unavailable",
        "Your current location is not available. Please ensure location services are enabled.",
      )
      return
    }

    // Use current location as "from" location
    const locationName = "My Current Location"
    setFromLocation(locationName)
    setSelectedFromLocation({
      name: locationName,
      lat: userLocation.lat,
      lon: userLocation.lng,
    })

    // Add marker on map
    sendMessageToMap({
      type: "ADD_FROM_MARKER",
      lat: userLocation.lat,
      lon: userLocation.lng,
      name: locationName,
    })

    // Close suggestions
    setFromSuggestions([])
    setActiveField(null)
  }

  const handleFindRoute = () => {
    if (selectedFromLocation && selectedToLocation) {
      if (isOutOfServiceArea) {
        Alert.alert("Out of Service", "This area is out of service")
        return
      }

      sendMessageToMap({
        type: "SHOW_ROUTE",
        from: selectedFromLocation,
        to: selectedToLocation,
      })

      // Calculate a more realistic distance and duration
      const distance =
        calculateDistance(
          selectedFromLocation.lat,
          selectedFromLocation.lon,
          selectedToLocation.lat,
          selectedToLocation.lon,
        ) / 1000 // Convert to km

      // Assume average speed of 20 km/h in city traffic
      const duration = (distance / 20) * 60 // Convert to minutes

      setRouteDistance(distance)
      setRouteDuration(duration)

      Alert.alert("Route Found", `Distance: ${distance.toFixed(2)} km\nEstimated time: ${Math.round(duration)} minutes`)

      // Make sure user location is still displayed
      if (userLocation && isOnline) {
        setTimeout(() => {
          sendMessageToMap({
            action: "updateLocation",
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            accuracy: locationAccuracy,
          })
        }, 500)
      }
    } else {
      Alert.alert("Input Required", "Please select both starting and destination locations")
    }
  }

  const handleStartRide = () => {
    if (!selectedFromLocation || !selectedToLocation) {
      Alert.alert("Route Required", "Please select a route first")
      return
    }

    if (isRideStarted) {
      // End the ride
      setIsRideStarted(false)
      setEstimatedArrivalTime(null)
      setDistanceCovered(0)
      setTotalDistance(null)
      setStartTime(null)
      setLastPosition(null)

      // Emit ride ended event to server
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("ride-ended", {
          driverId: user?.id,
          timestamp: Date.now(),
        })
      }

      Alert.alert("Ride Ended", `Total distance covered: ${distanceCovered.toFixed(2)} km`)
      return
    }

    // Start the ride
    setIsRideStarted(true)
    setDistanceCovered(0)
    setTotalDistance(routeDistance || 0)
    setStartTime(Date.now())

    if (userLocation) {
      setLastPosition({
        lat: userLocation.lat,
        lng: userLocation.lng,
      })
    }

    // Calculate estimated arrival time
    if (routeDuration) {
      const arrivalDate = new Date(Date.now() + routeDuration * 60 * 1000)
      const hours = arrivalDate.getHours()
      const minutes = arrivalDate.getMinutes()
      const formattedTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`
      setEstimatedArrivalTime(formattedTime)
    }

    // Emit ride started event to server with all necessary information
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("ride-started", {
        driverId: user?.id,
        fromLocation: selectedFromLocation,
        toLocation: selectedToLocation,
        startTime: Date.now(),
        estimatedDuration: routeDuration,
        estimatedDistance: routeDistance,
        estimatedArrivalTime: estimatedArrivalTime,
        driverLocation: userLocation
          ? {
              lat: userLocation.lat,
              lng: userLocation.lng,
            }
          : null,
      })
    }

    Alert.alert("Ride Started", "Your ride has started. Follow the route on the map.")
  }

  const createMapUrl = () => {
    const baseLocation = userLocation || defaultLocation
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
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
    const baseLocation = userLocation || defaultLocation
    const accuracy = locationAccuracy || 50 // Default accuracy if none provided

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Driver Location Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
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
          .bus-stop-cluster {
            background-color: rgba(0, 123, 255, 0.6);
            border-radius: 50%;
            text-align: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .bus-stop-cluster div {
            width: 100%;
            text-align: center;
          }
          .leaflet-routing-container {
            display: none;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            font-size: 12px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="offline-message" class="offline-message">You are currently offline</div>
        <div id="notification" class="notification"></div>
        
        <script>
          // Initialize map
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${baseLocation.lat}, ${baseLocation.lng}], 18); // Higher initial zoom
          
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
          
          // Routing functionality
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
          
          const busSVG = \`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#0D6EFD">
    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
  </svg>
\`;
          
          const busStopIcon = L.divIcon({
            html: busSVG,
            className: 'bus-stop-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          let fromMarker = null;
          let toMarker = null;
          let routeControl = null;
          let busStopMarkers = null;
          let busStopCluster = L.markerClusterGroup({
            iconCreateFunction: function(cluster) {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: '<div>' + count + '</div>',
                className: 'bus-stop-cluster',
                iconSize: L.point(30, 30, true)
              });
            },
            maxClusterRadius: 40
          });
          
          function addFromMarker(lat, lon, name) {
            if (fromMarker) {
              map.removeLayer(fromMarker);
            }
            
            fromMarker = L.marker([lat, lon], {icon: fromIcon})
              .addTo(map);
              
            map.setView([lat, lon], 15);
            return fromMarker;
          }
          
          function addToMarker(lat, lon, name) {
            if (toMarker) {
              map.removeLayer(toMarker);
            }
            
            toMarker = L.marker([lat, lon], {icon: toIcon})
              .addTo(map);
              
            map.setView([lat, lon], 15);
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
            return routeControl;
          }
          
          function addBusStops(stops) {
            if (busStopMarkers) {
              busStopCluster.removeLayer(busStopMarkers);
            }
            
            busStopMarkers = L.layerGroup();
            
            stops.forEach(stop => {
              const marker = L.marker([stop.lat, stop.lon], {
                icon: busStopIcon
              }).bindPopup(
                '<b>' + (stop.name || 'Bus Stop') + '</b>' + 
                '<br>Lat: ' + stop.lat.toFixed(6) + 
                '<br>Lon: ' + stop.lon.toFixed(6)
              );
              
              busStopMarkers.addLayer(marker);
            });
            
            busStopCluster.addLayer(busStopMarkers);
            return busStopCluster;
          }
          
          function showBusStops() {
            if (busStopMarkers && busStopCluster) {
              map.addLayer(busStopCluster);
              showNotification("Showing " + busStopCluster.getLayers().length + " bus stops");
            }
          }
          
          function hideBusStops() {
            if (busStopMarkers && busStopCluster) {
              map.removeLayer(busStopCluster);
              showNotification("Bus stops hidden");
            }
          }
          
          function showNotification(message, duration = 3000) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.style.display = 'block';
            
            setTimeout(() => {
              notification.style.display = 'none';
            }, duration);
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
            } else if (event.data.type === 'ADD_FROM_MARKER') {
              addFromMarker(event.data.lat, event.data.lon, event.data.name);
            } else if (event.data.type === 'ADD_TO_MARKER') {
              addToMarker(event.data.lat, event.data.lon, event.data.name);
            } else if (event.data.type === 'SHOW_ROUTE') {
              const from = event.data.from;
              const to = event.data.to;
              
              if (!fromMarker) {
                addFromMarker(from.lat, from.lon, from.name);
              }
              
              if (!toMarker) {
                addToMarker(to.lat, to.lon, to.name);
              }
              
              showRoute(from.lat, from.lon, to.lat, to.lon);
            } else if (event.data.type === 'ADD_BUS_STOPS') {
              addBusStops(event.data.stops);
            } else if (event.data.type === 'SHOW_BUS_STOPS') {
              showBusStops();
            } else if (event.data.type === 'HIDE_BUS_STOPS') {
              hideBusStops();
            } else if (event.data.type === 'REMOVE_FROM_MARKER') {
              if (fromMarker) {
                map.removeLayer(fromMarker);
                fromMarker = null;
              }
            } else if (event.data.type === 'REMOVE_TO_MARKER') {
              if (toMarker) {
                map.removeLayer(toMarker);
                toMarker = null;
              }
            } else if (event.data.type === 'ENTER_MAP_SELECTION_MODE') {
              // Store the field we're selecting for
              const selectionField = event.data.field;
              
              // Enable map selection mode
              let mapSelectionMode = true;
              
              // Show notification
              showNotification("Tap on map to select location", 10000);
              
              // Add one-time click handler
              const mapClickHandler = function(e) {
                if (mapSelectionMode) {
                  const lat = e.latlng.lat;
                  const lng = e.latlng.lng;
                  
                  // Send selected location back to React
                  window.parent.postMessage({
                    type: 'MAP_LOCATION_SELECTED',
                    field: selectionField,
                    lat: lat,
                    lng: lng
                  }, '*');
                  
                  // Disable selection mode
                  mapSelectionMode = false;
                  map.off('click', mapClickHandler);
                  
                  showNotification("Location selected", 2000);
                }
              };
              
              map.on('click', mapClickHandler);
              
              // Allow canceling selection mode
              window.addEventListener('message', function cancelSelectionMode(event) {
                if (event.data.type === 'EXIT_MAP_SELECTION_MODE') {
                  mapSelectionMode = false;
                  map.off('click', mapClickHandler);
                  window.removeEventListener('message', cancelSelectionMode);
                  showNotification("Selection canceled", 2000);
                }
              });
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
    `
  }

  // Effect to update map when online status changes
  useEffect(() => {
    if (mapRef.current?.contentWindow) {
      if (!isOnline) {
        // If offline, tell the map to hide the marker
        mapRef.current.contentWindow.postMessage(
          {
            action: "setOffline",
          },
          "*",
        )
      } else if (userLocation && isOnline) {
        // If online and we have location, update the marker
        mapRef.current.contentWindow.postMessage(
          {
            action: "updateLocation",
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            accuracy: locationAccuracy,
          },
          "*",
        )
      }
    }
  }, [isOnline])

  // Add this new useEffect to handle socket reconnection and authentication
  useEffect(() => {
    // Listen for online/offline status changes
    const handleOnline = () => {
      console.log("Browser is online")
      if (socketRef.current && !socketRef.current.connected && isOnline) {
        console.log("Reconnecting socket after network recovery")
        socketRef.current.connect()
      }
    }

    const handleOffline = () => {
      console.log("Browser is offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Set up a periodic ping to keep the socket connection alive
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected && isOnline) {
        // Send a small ping to keep the connection alive
        socketRef.current.emit("ping")
      }
    }, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(pingInterval)
    }
  }, [isOnline])

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

        {userLocation && isOnline && (
          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyText}>
              Accuracy: {locationAccuracy ? `${Math.round(locationAccuracy)}m` : "Unknown"}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderSearchToggleButton = () => (
    <TouchableOpacity onPress={toggleSearch} style={styles.searchToggleButton}>
      <Icon name="search" size={24} color="black" />
    </TouchableOpacity>
  )

  const renderBusStopToggleButton = () => (
    <View style={styles.busStopButtonsContainer}>
      <EmergencyButton onPress={handleEmergency} />
      <TouchableOpacity
        onPress={toggleBusStops}
        style={[
          styles.busStopToggleButton,
          showBusStops ? styles.busStopToggleButtonActive : styles.busStopToggleButtonInactive,
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.busStopToggleContent}>
          <Icon name="bus" size={20} color={showBusStops ? "white" : "#0D6EFD"} style={styles.busStopToggleIcon} />
          <Text
            style={[
              styles.busStopToggleButtonText,
              showBusStops ? styles.busStopToggleTextActive : styles.busStopToggleTextInactive,
            ]}
          >
            {showBusStops ? "Hide Stops" : "Show Stops"}
          </Text>
        </View>
        {isLoadingBusStops && (
          <ActivityIndicator size="small" color={showBusStops ? "white" : "#0D6EFD"} style={styles.busStopLoader} />
        )}
      </TouchableOpacity>
      {showBusStops && (
        <TouchableOpacity onPress={fetchBusStops} style={styles.refreshBusStopsButton}>
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  )

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
            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
              <Icon name="location" size={16} color="#DB2955" style={styles.suggestionIcon} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          style={suggestions.length > 0 ? styles.suggestionsList : { height: 0 }}
        />
      )}
    </View>
  )

  const renderOutOfServiceMessage = () => {
    if (!isOutOfServiceArea || !selectedFromLocation || !selectedToLocation) return null

    return (
      <View style={styles.outOfServiceContainer}>
        <Icon name="alert-circle" size={24} color="#DB2955" style={styles.outOfServiceIcon} />
        <Text style={styles.outOfServiceText}>This area is out of service</Text>
      </View>
    )
  }

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
          onFocus={() => setActiveField("from")}
        />
        {fromLocation.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setFromLocation("")
              setFromSuggestions([])
              if (selectedFromLocation) {
                setSelectedFromLocation(null)
                sendMessageToMap({
                  type: "REMOVE_FROM_MARKER",
                })
              }
            }}
          >
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {activeField === "from" && (
        <View style={styles.locationOptionsContainer}>
          <TouchableOpacity style={styles.locationOptionButton} onPress={handleUseCurrentLocation}>
            <Icon name="navigate" size={16} color="#DB2955" />
            <Text style={styles.locationOptionText}>Use my location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationOptionButton} onPress={() => handleSetLocationFromMap("from")}>
            <Icon name="map" size={16} color="#DB2955" />
            <Text style={styles.locationOptionText}>Set on map</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeField === "from" && renderSuggestionsList(fromSuggestions, isLoadingFrom)}

      <View style={styles.dividerLine} />

      <View style={styles.inputContainer}>
        <Icon name="navigate" size={20} color="#082A3F" style={styles.inputIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="To"
          value={toLocation}
          onChangeText={handleToLocationChange}
          placeholderTextColor="#999"
          onFocus={() => setActiveField("to")}
        />
        {toLocation.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setToLocation("")
              setToSuggestions([])
              if (selectedToLocation) {
                setSelectedToLocation(null)
                sendMessageToMap({
                  type: "REMOVE_TO_MARKER",
                })
              }
            }}
          >
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {activeField === "to" && (
        <View style={styles.locationOptionsContainer}>
          <TouchableOpacity style={styles.locationOptionButton} onPress={() => handleSetLocationFromMap("to")}>
            <Icon name="map" size={16} color="#082A3F" />
            <Text style={styles.locationOptionText}>Set on map</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeField === "to" && renderSuggestionsList(toSuggestions, isLoadingTo)}
      {renderOutOfServiceMessage()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleFindRoute}
          style={[
            styles.showRouteButton,
            (!selectedFromLocation || !selectedToLocation) && styles.disabledButton,
            isOutOfServiceArea && styles.disabledButton,
          ]}
          disabled={!selectedFromLocation || !selectedToLocation || isOutOfServiceArea}
        >
          <Text style={styles.showRouteButtonText}>Find Route</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleStartRide}
          style={[
            styles.startRideButton,
            (!routeDistance || !routeDuration) && styles.disabledButton,
            isRideStarted && styles.endRideButton,
          ]}
          disabled={!routeDistance || !routeDuration}
        >
          <Text style={styles.startRideButtonText}>{isRideStarted ? "End Ride" : "Start Ride"}</Text>
        </TouchableOpacity>
      </View>

      {estimatedArrivalTime && isRideStarted && (
        <View style={styles.arrivalInfoContainer}>
          <Icon name="time" size={18} color="#fff" style={styles.arrivalIcon} />
          <Text style={styles.arrivalTimeText}>Estimated arrival: {estimatedArrivalTime}</Text>
          <Text style={styles.distanceText}>
            {distanceCovered.toFixed(1)} / {totalDistance?.toFixed(1)} km
          </Text>
        </View>
      )}
    </View>
  )

  // Render a permission error UI with retry button
  const renderPermissionError = () => (
    <View style={styles.permissionErrorContainer}>
      <Text style={styles.permissionErrorText}>
        Location permission is required to use the map. Please enable it in your browser settings.
      </Text>
      <TouchableOpacity style={styles.retryPermissionButton} onPress={requestLocationPermissionAgain}>
        <Text style={styles.retryPermissionButtonText}>Enable Location</Text>
      </TouchableOpacity>
    </View>
  )

  if (currentPage === "Profile") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <View style={styles.profileDetails}></View>
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
      {renderSearchToggleButton()}
      {renderBusStopToggleButton()}

      {permissionDenied ? (
        renderPermissionError()
      ) : !permissionGranted ? (
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

      {searchVisible && renderSearchPanel()}

      {menuVisible && (
        <HamburgerMenu
          onNavigateHome={navigateToHome}
          onNavigateProfile={navigateToProfile}
          onNavigateSettings={navigateToSettings}
          onNavigatePassengers={navigateToPassengers}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  permissionErrorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryPermissionButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  retryPermissionButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  // Routing styles from contact-map.tsx
  searchToggleButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 3,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 5,
  },
  searchOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: "#082A3F",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "white",
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
    color: "black",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  showRouteButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    alignItems: "center",
  },
  showRouteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  suggestionsContainer: {
    marginBottom: 10,
  },
  suggestionsList: {
    maxHeight: 150,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    color: "#333",
  },
  loadingContainer: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  busStopButtonsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 3,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  busStopToggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 140,
  },
  busStopToggleButtonActive: {
    backgroundColor: "#4CAF50",
  },
  busStopToggleButtonInactive: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#0D6EFD",
  },
  busStopToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  busStopToggleIcon: {
    marginRight: 8,
  },
  busStopToggleButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  busStopToggleTextActive: {
    color: "white",
  },
  busStopToggleTextInactive: {
    color: "#0D6EFD",
  },
  busStopLoader: {
    marginLeft: 8,
  },
  outOfServiceContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    marginVertical: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  outOfServiceIcon: {
    marginRight: 10,
  },
  outOfServiceText: {
    color: "#DB2955",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  locationOptionsContainer: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
  locationOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 5,
  },
  locationOptionText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
  },
  startRideButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#2196F3",
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  endRideButton: {
    backgroundColor: "#F44336",
  },
  startRideButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  arrivalInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  arrivalIcon: {
    marginRight: 8,
  },
  arrivalTimeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    flex: 1,
  },
  distanceText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  refreshBusStopsButton: {
    backgroundColor: "#0D6EFD",
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})

export default DriverUI
