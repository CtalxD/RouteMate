"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "expo-router"
import Icon from "react-native-vector-icons/Ionicons"
import { useGetProfile } from "@/services/profile.service"
import Booking from "./Booking"
import Settings from "./Settings"
import Overlay from "./overlay"
import type { WebViewMessageEvent } from "react-native-webview"
import { io, type Socket } from "socket.io-client"
import AsyncStorage from "@react-native-async-storage/async-storage"

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

interface NearestBusStop {
  id: string
  name: string
  lat: number
  lon: number
  distance: number
}

interface DriverLocation {
  socketId: string
  userId: string
  latitude: number
  longitude: number
  accuracy: number
  isOnline: boolean
  lastUpdated: number
}

interface MapState {
  fromLocation: string
  toLocation: string
  selectedFromLocation: SelectedLocation | null
  selectedToLocation: SelectedLocation | null
  busStops: BusStop[]
  showBusStops: boolean
  nearestBusStop: NearestBusStop | null
  isShowingNearestBusStop: boolean
  routeDistance: number | null
  routeDuration: number | null
}

const API_URL = "http://localhost:5000"
const STORAGE_KEY = "contactMapState"

// Conditionally import WebView to handle platform differences
let WebView: any
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView
} else {
  WebView = null
}

// Kathmandu bounding box coordinates
const KATHMANDU_BOUNDS = {
  minLon: 85.2,
  minLat: 27.6,
  maxLon: 85.5,
  maxLat: 27.8,
}

const ContactMap = () => {
  const webViewRef = useRef<any>(null)
  const router = useRouter()
  const { data: profileData } = useGetProfile()
  const [menuVisible, setMenuVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState("Home")
  const [previousPage, setPreviousPage] = useState("Home")
  const { onLogout, user } = useAuth()
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
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [routeDuration, setRouteDuration] = useState<number | null>(null)
  const [busStops, setBusStops] = useState<BusStop[]>([])
  const [showBusStops, setShowBusStops] = useState(false)
  const [isLoadingBusStops, setIsLoadingBusStops] = useState(false)
  const [nearestBusStop, setNearestBusStop] = useState<NearestBusStop | null>(null)
  const [isShowingNearestBusStop, setIsShowingNearestBusStop] = useState(false)
  const [driverLocations, setDriverLocations] = useState<Record<string, DriverLocation>>({})
  const socketRef = useRef<Socket | null>(null)
  const [isOutOfServiceArea, setIsOutOfServiceArea] = useState(false)
  const [stateRestored, setStateRestored] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  // Save state to AsyncStorage whenever relevant state changes
  // Remove this entire useEffect block
  // useEffect(() => {
  //   const saveState = async () => {
  //     try {
  //       const state: MapState = {
  //         fromLocation,
  //         toLocation,
  //         selectedFromLocation,
  //         selectedToLocation,
  //         busStops,
  //         showBusStops,
  //         nearestBusStop,
  //         isShowingNearestBusStop,
  //         routeDistance,
  //         routeDuration,
  //       }
  //       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  //       console.log("Map state saved to storage")
  //     } catch (error) {
  //       console.error("Error saving map state:", error)
  //     }
  //   }
  //
  //   // Only save state if we've already restored it once (to avoid overwriting with empty state)
  //   if (stateRestored) {
  //     saveState()
  //   }
  // }, [
  //   fromLocation,
  //   toLocation,
  //   selectedFromLocation,
  //   selectedToLocation,
  //   busStops,
  //   showBusStops,
  //   nearestBusStop,
  //   isShowingNearestBusStop,
  //   routeDistance,
  //   routeDuration,
  //   stateRestored,
  // ])

  // Restore state from AsyncStorage on component mount
  // Remove the existing useEffect for restoring state and replace with this
  useEffect(() => {
    // Reset all state on component mount instead of restoring
    setFromLocation("")
    setToLocation("")
    setSelectedFromLocation(null)
    setSelectedToLocation(null)
    setBusStops([])
    setShowBusStops(false)
    setNearestBusStop(null)
    setIsShowingNearestBusStop(false)
    setRouteDistance(null)
    setRouteDuration(null)
    setStateRestored(true)

    // Clear any saved state
    AsyncStorage.removeItem(STORAGE_KEY)
      .then(() => {
        if (__DEV__) console.log("Map state cleared on reload")
      })
      .catch((error) => {
        if (__DEV__) console.error("Error clearing map state:", error)
      })
  }, [])

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
          userType: "passenger",
        })
      }
    })

    socket.on("driver-location-updated", (data) => {
      console.log("Driver location update received:", data)
      setDriverLocations((prev) => ({
        ...prev,
        [data.socketId]: {
          socketId: data.socketId,
          userId: data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          isOnline: data.isOnline,
          lastUpdated: Date.now(),
        },
      }))

      // Update the map with the new driver location
      if (isMapReady) {
        sendMessageToMap({
          type: "UPDATE_DRIVER_LOCATION",
          driver: {
            id: data.userId || data.socketId,
            lat: data.latitude,
            lng: data.longitude,
            accuracy: data.accuracy,
            isOnline: data.isOnline,
          },
        })
      }
    })

    socket.on("driver-status-changed", (data) => {
      console.log("Driver status changed:", data)
      setDriverLocations((prev) => {
        const updated = { ...prev }
        if (updated[data.socketId]) {
          updated[data.socketId].isOnline = data.status
          updated[data.socketId].lastUpdated = Date.now()
        }
        return updated
      })

      if (isMapReady) {
        sendMessageToMap({
          type: "UPDATE_DRIVER_STATUS",
          driverId: data.userId || data.socketId,
          isOnline: data.status,
        })
      }
    })

    socket.on("current-drivers", (drivers) => {
      console.log("Received current drivers:", drivers)
      const newDriverLocations: Record<string, DriverLocation> = {}

      drivers.forEach((driver: any) => {
        newDriverLocations[driver.socketId] = {
          socketId: driver.socketId,
          userId: driver.userId || driver.socketId,
          latitude: driver.latitude,
          longitude: driver.longitude,
          accuracy: driver.accuracy,
          isOnline: driver.isOnline,
          lastUpdated: Date.now(),
        }
      })

      setDriverLocations(newDriverLocations)

      if (isMapReady) {
        sendMessageToMap({
          type: "UPDATE_ALL_DRIVERS",
          drivers: drivers.map((driver: any) => ({
            id: driver.userId || driver.socketId,
            lat: driver.latitude,
            lng: driver.longitude,
            accuracy: driver.accuracy,
            isOnline: driver.isOnline,
          })),
        })
      }
    })

    socket.on("driver-disconnected", (data) => {
      console.log("Driver disconnected:", data)
      setDriverLocations((prev) => {
        const updated = { ...prev }
        delete updated[data.socketId]
        return updated
      })

      if (isMapReady) {
        sendMessageToMap({
          type: "REMOVE_DRIVER",
          driverId: data.userId || data.socketId,
        })
      }
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      Alert.alert("Connection Error", "Failed to connect to the server. Please check your internet connection.")
    })

    // Add the following socket event listeners in the useEffect block where you initialize the Socket.io connection (after the existing socket.on events):

    socket.on("ride-started", (data) => {
      console.log("Ride started:", data)
      if (isMapReady) {
        sendMessageToMap({
          type: "SHOW_ACTIVE_RIDE",
          ride: {
            id: data.driverId,
            from: data.fromLocation,
            to: data.toLocation,
            startTime: data.startTime,
            estimatedDuration: data.estimatedDuration,
            estimatedDistance: data.estimatedDistance,
          },
        })
      }
    })

    socket.on("ride-ended", (data) => {
      console.log("Ride ended:", data)
      if (isMapReady) {
        sendMessageToMap({
          type: "REMOVE_ACTIVE_RIDE",
          driverId: data.driverId,
        })
      }
    })

    // Request current drivers when connected
    socket.emit("get-current-drivers")

    return () => {
      if (socket) {
        console.log("Disconnecting socket")
        socket.disconnect()
      }
    }
  }, [user])

  // Clean up stale driver locations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setDriverLocations((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((socketId) => {
          if (now - updated[socketId].lastUpdated > 60000) {
            // 1 minute
            delete updated[socketId]
          }
        })
        return updated
      })
    }, 30000) // Run every 30 seconds

    return () => clearInterval(interval)
  }, [])

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

  const findNearestBusStop = (lat: number, lon: number): NearestBusStop | null => {
    if (busStops.length === 0) return null

    let nearestStop: NearestBusStop | null = null
    let minDistance = Number.POSITIVE_INFINITY

    busStops.forEach((stop) => {
      const distance = calculateDistance(lat, lon, stop.lat, stop.lon)
      if (distance < minDistance) {
        minDistance = distance
        nearestStop = {
          id: stop.id,
          name: stop.name || `Bus Stop ${stop.id}`,
          lat: stop.lat,
          lon: stop.lon,
          distance: distance,
        }
      }
    })

    return nearestStop
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

          // Show nearest bus stop if we have a from location
          if (selectedFromLocation && !isShowingNearestBusStop) {
            const nearest = findNearestBusStop(selectedFromLocation.lat, selectedFromLocation.lon)
            if (nearest) {
              setNearestBusStop(nearest)
              setIsShowingNearestBusStop(true)
              sendMessageToMap({
                type: "HIGHLIGHT_NEAREST_BUS_STOP",
                stop: nearest,
              })
            }
          }
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

              // Show nearest bus stop if we have a from location
              if (selectedFromLocation && !isShowingNearestBusStop) {
                const nearest = findNearestBusStop(selectedFromLocation.lat, selectedFromLocation.lon)
                if (nearest) {
                  setNearestBusStop(nearest)
                  setIsShowingNearestBusStop(true)
                  sendMessageToMap({
                    type: "HIGHLIGHT_NEAREST_BUS_STOP",
                    stop: nearest,
                  })
                }
              }
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

        // Also hide nearest bus stop when toggling off
        if (nearestBusStop) {
          sendMessageToMap({
            type: "REMOVE_NEAREST_BUS_STOP",
          })
          setNearestBusStop(null)
          setIsShowingNearestBusStop(false)
        }
      }
    }
  }

  // Enhanced map ready handler to restore state
  useEffect(() => {
    if (isMapReady && stateRestored) {
      console.log("Map is ready, but not restoring visual state due to reset requirement")

      // Send all current driver locations to the map
      const drivers = Object.values(driverLocations).map((driver) => ({
        id: driver.userId || driver.socketId,
        lat: driver.latitude,
        lng: driver.longitude,
        accuracy: driver.accuracy,
        isOnline: driver.isOnline,
      }))

      if (drivers.length > 0) {
        sendMessageToMap({
          type: "UPDATE_ALL_DRIVERS",
          drivers: drivers,
        })
      }
    }
  }, [isMapReady, stateRestored])

  // Initial fetch of bus stops when map is ready
  useEffect(() => {
    if (isMapReady && busStops.length === 0) {
      console.log("Map is ready, fetching bus stops data")
      fetchBusStops()
    }
  }, [isMapReady, busStops.length])

  // Replace the fetchBusStops function with:
  const fetchBusStops = useCallback(async () => {
    // Check if we already have bus stops loaded
    if (busStops.length > 0) {
      console.log("Using cached bus stops data, already have", busStops.length, "stops")
      return busStops
    }

    try {
      setIsLoadingBusStops(true)
      console.log("Fetching bus stops from OpenStreetMap...")

      // Use multiple fetch attempts with different queries for redundancy
      const fetchWithTimeout = async (url: string, timeout: number) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      }

      // Primary query - more specific for bus stops
      const overpassQuery1 = `[out:json][timeout:90];
      (
        node["highway"="bus_stop"](27.65,85.25,27.75,85.45);
        node["public_transport"="stop_position"](27.65,85.25,27.75,85.45);
      );
      out body;`

      // Backup query - broader to catch more potential stops
      const overpassQuery2 = `[out:json][timeout:90];
      (
        node["public_transport"](27.65,85.25,27.75,85.45);
        node["bus"="yes"](27.65,85.25,27.75,85.45);
        node["highway"="bus_stop"](27.65,85.25,27.75,85.45);
      );
      out body;`

      // Try primary query first
      let response
      let data

      try {
        console.log("Trying primary bus stop query...")
        response = await fetchWithTimeout(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery1)}`,
          15000, // 15 second timeout
        )

        if (response.ok) {
          data = await response.json()
          console.log(`Primary query successful: Fetched ${data.elements.length} bus stops`)
        }
      } catch (error) {
        console.warn("Primary bus stop query failed:", error)
      }

      // If primary query failed or returned no results, try backup query
      if (!data || !data.elements || data.elements.length === 0) {
        try {
          console.log("Primary query failed or returned no results. Trying backup query...")
          response = await fetchWithTimeout(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery2)}`,
            20000, // 20 second timeout
          )

          if (response.ok) {
            data = await response.json()
            console.log(`Backup query successful: Fetched ${data.elements.length} bus stops`)
          }
        } catch (error) {
          console.warn("Backup bus stop query failed:", error)
        }
      }

      // If we have data from either query, process it
      if (data && data.elements && data.elements.length > 0) {
        console.log(`Processing ${data.elements.length} bus stops from OpenStreetMap`)

        // Process and deduplicate the stops
        const stopsMap = new Map()

        data.elements.forEach((element: any) => {
          const id = element.id.toString()
          if (!stopsMap.has(id)) {
            stopsMap.set(id, {
              id: id,
              lat: element.lat,
              lon: element.lon,
              name: element.tags?.name || element.tags?.["name:en"] || `Bus Stop ${id}`,
              tags: element.tags || {},
            })
          }
        })

        const stops = Array.from(stopsMap.values())
        console.log(`Processed ${stops.length} unique bus stops`)

        // Update state with the fetched bus stops
        setBusStops(stops)
        return stops
      } else {
        console.warn("Both queries failed or returned no results, using fallback stops")
        // Use fallback hardcoded bus stops
        const fallbackStops = generateFallbackBusStops()
        setBusStops(fallbackStops)
        return fallbackStops
      }
    } catch (error) {
      console.error("Error fetching bus stops:", error)

      // Use fallback hardcoded bus stops if API fails
      const fallbackStops = generateFallbackBusStops()
      setBusStops(fallbackStops)
      return fallbackStops
    } finally {
      setIsLoadingBusStops(false)
    }
  }, [busStops.length])

  // Add this function after the fetchBusStops function:

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

  // Add this function to improve bus stop handling:
  const refreshBusStops = useCallback(() => {
    // Clear existing bus stops
    setBusStops([])

    // If bus stops are currently being shown, fetch and display new ones
    if (showBusStops && isMapReady) {
      setIsLoadingBusStops(true)

      fetchBusStops()
        .then((stops) => {
          if (stops && stops.length > 0 && showBusStops) {
            // Send the fetched bus stops to the map
            sendMessageToMap({
              type: "ADD_BUS_STOPS",
              stops: stops,
            })

            // Explicitly tell the map to show the bus stops
            sendMessageToMap({
              type: "SHOW_BUS_STOPS",
              stops: stops,
            })

            // Show nearest bus stop if we have a from location
            if (selectedFromLocation) {
              const nearest = findNearestBusStop(selectedFromLocation.lat, selectedFromLocation.lon)
              if (nearest) {
                setNearestBusStop(nearest)
                setIsShowingNearestBusStop(true)
                sendMessageToMap({
                  type: "HIGHLIGHT_NEAREST_BUS_STOP",
                  stop: nearest,
                })
              }
            }

            showNotification(`Refreshed ${stops.length} bus stops`, 2000)
          }
        })
        .catch((error) => {
          console.error("Error refreshing bus stops:", error)
          showNotification("Failed to refresh bus stops", 2000)
        })
        .finally(() => {
          setIsLoadingBusStops(false)
        })
    }
  }, [fetchBusStops, showBusStops, isMapReady, selectedFromLocation])

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
    if (Platform.OS === "web") {
      const iframe = document.querySelector("iframe")
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, "*")
        return true
      }
      return false
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message))
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

      // Clear any existing nearest bus stop highlight
      if (nearestBusStop) {
        sendMessageToMap({
          type: "REMOVE_NEAREST_BUS_STOP",
        })
        setNearestBusStop(null)
        setIsShowingNearestBusStop(false)
      }

      if (busStops.length > 0 && showBusStops) {
        const nearest = findNearestBusStop(suggestion.lat, suggestion.lon)
        if (nearest) {
          setNearestBusStop(nearest)
          setIsShowingNearestBusStop(true)

          sendMessageToMap({
            type: "HIGHLIGHT_NEAREST_BUS_STOP",
            stop: nearest,
          })
        }
      } else if (isMapReady && showBusStops) {
        fetchBusStops().then((stops) => {
          if (stops && stops.length > 0) {
            const nearest = findNearestBusStop(suggestion.lat, suggestion.lon)
            if (nearest) {
              setNearestBusStop(nearest)
              setIsShowingNearestBusStop(true)

              sendMessageToMap({
                type: "HIGHLIGHT_NEAREST_BUS_STOP",
                stop: nearest,
              })
            }
          }
        })
      }
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

  useEffect(() => {
    if (!searchVisible) {
      setFromSuggestions([])
      setToSuggestions([])
      setActiveField(null)
    }
  }, [searchVisible])

  // Update map when showBusStops changes
  useEffect(() => {
    if (isMapReady && showBusStops && busStops.length > 0) {
      // When showBusStops becomes true and we have bus stops, show them
      sendMessageToMap({
        type: "ADD_BUS_STOPS",
        stops: busStops,
      })
      sendMessageToMap({
        type: "SHOW_BUS_STOPS",
      })
    } else if (isMapReady && !showBusStops) {
      // When showBusStops becomes false, hide them
      sendMessageToMap({
        type: "HIDE_BUS_STOPS",
      })
    }
  }, [isMapReady, showBusStops, busStops.length])

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleIframeMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "MAP_READY") {
          console.log("Map is ready (web)")
          setIsMapReady(true)
        }
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
    }
  }, [])

  const toggleMenu = () => {
    setMenuVisible(!menuVisible)
  }

  const toggleSearch = () => {
    setSearchVisible(!searchVisible)
  }

  // Modify the renderBusStopToggleButton function to add a refresh button:
  const renderBusStopToggleButton = () => (
    <View style={styles.busStopButtonsContainer}>
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
        <TouchableOpacity onPress={refreshBusStops} style={styles.refreshBusStopsButton} disabled={isLoadingBusStops}>
          <Icon name="refresh" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  )

  // Add this function after the fetchBusStops function:

  // Add this function after the renderBusStopToggleButton function
  const renderNoBusesMessage = () => {
    if (Object.keys(driverLocations).length === 0) {
      return (
        <View style={styles.noBusesContainer}>
          <Icon name="alert-circle" size={24} color="#DB2955" style={styles.noBusesIcon} />
          <Text style={styles.noBusesText}>No buses available at the moment</Text>
        </View>
      )
    }
    return null
  }

  // Add this function to show notifications on the map:
  const showNotification = (message: string, duration = 3000) => {
    if (isMapReady) {
      sendMessageToMap({
        type: "SHOW_NOTIFICATION",
        message,
        duration,
      })
    }
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
    } else {
      Alert.alert("Input Required", "Please select both starting and destination locations")
    }
  }

  const handleSearch = () => {
    if (selectedFromLocation && selectedToLocation) {
      if (isOutOfServiceArea) {
        Alert.alert("Out of Service", "This area is out of service")
        return
      }

      setIsOverlayVisible(true)
    } else {
      Alert.alert("Input Required", "Please select both starting and destination locations")
    }
  }

  const handleLogout = () => {
    setMenuVisible(false)
    onLogout()
  }

  const navigateToProfile = () => {
    setMenuVisible(false)
    router.push("/(tabs)/prf")
  }

  const navigateToBooking = () => {
    setMenuVisible(false)
    router.push("/(tabs)/booked")
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

  const handleBack = () => {
    setCurrentPage(previousPage)
  }

  const switchToDriverMode = () => {
    setMenuVisible(false)
    if (profileData?.role === "DRIVER") {
      router.push("/(tabs)/driver")
    } else {
      router.push("/(tabs)/busdocs")
      Alert.alert("Access Denied", "You are not assigned the driver role.")
    }
  }

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
          .driver-marker {
            background-color: #4CAF50;
            border-radius: 50%;
            border: 2px solid white;
          }
          .driver-marker-offline {
            background-color: #9E9E9E;
            border-radius: 50%;
            border: 2px solid white;
          }
          .driver-marker-pulse {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="notification" class="notification" style="display: none;"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
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
          
          const driverIcon = L.divIcon({
            className: 'driver-marker driver-marker-pulse',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          const driverOfflineIcon = L.divIcon({
            className: 'driver-marker-offline',
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
          
          const driverMarkers = {};
          
          // Add these functions inside the script tag in the HTML
          
          // Add this after the driverMarkers declaration
          const activeRides = {};
          
          // Add this after the updateDriverStatus function
          function showActiveRide(ride) {
            // Remove any existing ride for this driver
            removeActiveRide(ride.id);
            
            // Create a route between from and to locations
            const routeControl = L.Routing.control({
              waypoints: [
                L.latLng(ride.from.lat, ride.from.lon),
                L.latLng(ride.to.lat, ride.to.lon)
              ],
              routeWhileDragging: false,
              showAlternatives: false,
              fitSelectedRoutes: false,
              show: false,
              lineOptions: {
                styles: [
                  {color: '#DB2955', opacity: 0.8, weight: 6},
                  {color: '#DB2955', opacity: 0.9, weight: 4}
                ]
              },
              createMarker: function() {
                return null;
              }
            }).addTo(map);
            
            // Store the route control
            activeRides[ride.id] = {
              routeControl: routeControl,
              fromMarker: L.marker([ride.from.lat, ride.from.lon], {icon: fromIcon}).addTo(map),
              toMarker: L.marker([ride.to.lat, ride.to.lon], {icon: toIcon}).addTo(map)
            };
            
            // If we have a driver marker, make it pulse
            if (driverMarkers[ride.id]) {
              driverMarkers[ride.id].setIcon(driverIcon);
            }
            
            return activeRides[ride.id];
          }
          
          function removeActiveRide(driverId) {
            if (activeRides[driverId]) {
              map.removeControl(activeRides[driverId].routeControl);
              map.removeLayer(activeRides[driverId].fromMarker);
              map.removeLayer(activeRides[driverId].toMarker);
              delete activeRides[driverId];
            }
          }
          
          function hideAllActiveRides() {
            Object.keys(activeRides).forEach(driverId => {
              removeActiveRide(driverId);
            });
          }
          
          let nearestBusStopMarker = null;
          
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
          
          function updateDriverLocation(driver) {
            if (driverMarkers[driver.id]) {
              // Update existing marker
              driverMarkers[driver.id].setLatLng([driver.lat, driver.lng]);
              if (driver.isOnline) {
                driverMarkers[driver.id].setIcon(driverIcon);
                // Update popup content with status and last updated time
                driverMarkers[driver.id].setPopupContent(
                  '<div style="text-align: center;">' +
                  '<strong style="font-size: 14px; color: #4CAF50;">Active Bus</strong><br>' +
                  '<span style="font-size: 12px;">Status: Online</span><br>' +
                  '<span style="font-size: 12px;">Last updated: ' + new Date().toLocaleTimeString() + '</span>' +
                  '</div>'
                );
              } else {
                driverMarkers[driver.id].setIcon(driverOfflineIcon);
                // Update popup content with offline status
                driverMarkers[driver.id].setPopupContent(
                  '<div style="text-align: center;">' +
                  '<strong style="font-size: 14px; color: #9E9E9E;">Inactive Bus</strong><br>' +
                  '<span style="font-size: 12px;">Status: Offline</span><br>' +
                  '<span style="font-size: 12px;">Last updated: ' + new Date().toLocaleTimeString() + '</span>' +
                  '</div>'
                );
              }
            } else {
              // Create new marker
              const icon = driver.isOnline ? driverIcon : driverOfflineIcon;
              driverMarkers[driver.id] = L.marker([driver.lat, driver.lng], {
                icon: icon
              }).bindPopup(
                '<div style="text-align: center;">' +
                '<strong style="font-size: 14px; color: ' + (driver.isOnline ? '#4CAF50' : '#9E9E9E') + ';">' + 
                (driver.isOnline ? 'Active Bus' : 'Inactive Bus') + '</strong><br>' +
                '<span style="font-size: 12px;">Status: ' + (driver.isOnline ? 'Online' : 'Offline') + '</span><br>' +
                '<span style="font-size: 12px;">Last updated: ' + new Date().toLocaleTimeString() + '</span>' +
                '</div>'
              ).addTo(map);
            }
          }
          
          function updateAllDrivers(drivers) {
            // Remove any drivers that are not in the new list
            Object.keys(driverMarkers).forEach(id => {
              if (!drivers.some(d => d.id === id)) {
                map.removeLayer(driverMarkers[id]);
                delete driverMarkers[id];
              }
            });
            
            // Add or update all drivers in the list
            drivers.forEach(driver => {
              updateDriverLocation(driver);
            });
          }
          
          function removeDriver(driverId) {
            if (driverMarkers[driverId]) {
              map.removeLayer(driverMarkers[driverId]);
              delete driverMarkers[driverId];
            }
          }
          
          function updateDriverStatus(driverId, isOnline) {
            if (driverMarkers[driverId]) {
              if (isOnline) {
                driverMarkers[driverId].setIcon(driverIcon);
                driverMarkers[driverId].getPopup().setContent(
                  driverMarkers[driverId].getPopup().getContent().replace(
                    /Status: (Online|Offline)/, 
                    'Status: Online'
                  )
                );
              } else {
                driverMarkers[driverId].setIcon(driverOfflineIcon);
                driverMarkers[driverId].getPopup().setContent(
                  driverMarkers[driverId].getPopup().getContent().replace(
                    /Status: (Online|Offline)/, 
                    'Status: Offline'
                  )
                );
              }
            }
          }
          
          function highlightNearestBusStop(stop) {
            // Remove previous nearest bus stop marker if it exists
            if (nearestBusStopMarker) {
              map.removeLayer(nearestBusStopMarker);
            }
            
            const nearestBusStopIcon = L.divIcon({
              html: busSVG,
              className: 'nearest-bus-stop-icon',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            
            nearestBusStopMarker = L.marker([stop.lat, stop.lon], {
              icon: nearestBusStopIcon
            }).bindPopup(
              '<div style="text-align: center;">' +
              '<strong style="font-size: 14px; color: #0D6EFD;">Nearest Bus Stop</strong><br>' +
              '<span style="font-size: 12px;">' + stop.name + '</span><br>' +
              '<span style="font-size: 12px;">' + (stop.distance < 1000 ? Math.round(stop.distance) + ' meters away' : (stop.distance / 1000).toFixed(2) + ' km away') + '</span>' +
              '</div>'
            ).addTo(map).openPopup();
            
            map.panTo([stop.lat, stop.lon]);
            showNotification("Nearest bus stop found: " + stop.name);
            
            return nearestBusStopMarker;
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
                  
                case 'ADD_BUS_STOPS':
                  addBusStops(data.stops);
                  break;
                  
                case 'SHOW_BUS_STOPS':
                  showBusStops();
                  break;
                  
                case 'HIDE_BUS_STOPS':
                  hideBusStops();
                  break;
                  
                case 'HIGHLIGHT_NEAREST_BUS_STOP':
                  highlightNearestBusStop(data.stop);
                  break;
                  
                case 'UPDATE_DRIVER_LOCATION':
                  updateDriverLocation(data.driver);
                  break;
                  
                case 'UPDATE_ALL_DRIVERS':
                  updateAllDrivers(data.drivers);
                  break;
                  
                case 'UPDATE_DRIVER_STATUS':
                  updateDriverStatus(data.driverId, data.isOnline);
                  break;
                  
                case 'REMOVE_DRIVER':
                  removeDriver(data.driverId);
                  break;
                  
                case 'REMOVE_FROM_MARKER':
                  if (fromMarker) {
                    map.removeLayer(fromMarker);
                    fromMarker = null;
                  }
                  break;
                  
                case 'REMOVE_TO_MARKER':
                  if (toMarker) {
                    map.removeLayer(toMarker);
                    toMarker = null;
                  }
                  break;
                  
                case 'ENTER_MAP_SELECTION_MODE':
                  enterMapSelectionMode(data.field);
                  break;
                  
                case 'EXIT_MAP_SELECTION_MODE':
                  exitMapSelectionMode();
                  break;
                  
                // Add this case to the switch statement in the handleMessage function in the generateMapHTML function
                case 'REMOVE_NEAREST_BUS_STOP':
                  if (nearestBusStopMarker) {
                    map.removeLayer(nearestBusStopMarker);
                    nearestBusStopMarker = null;
                  }
                  break;
                  
                case 'SHOW_NOTIFICATION':
                  showNotification(data.message, data.duration);
                  break;
                  
                case 'SHOW_ACTIVE_RIDE':
                  showActiveRide(data.ride);
                  break;
                  
                case 'REMOVE_ACTIVE_RIDE':
                  removeActiveRide(data.driverId);
                  break;
                  
                case 'HIDE_ALL_ACTIVE_RIDES':
                  hideAllActiveRides();
                  break;
                  
                case 'FOCUS_ON_DRIVER':
                  const driverId = data.driverId;
                  if (driverMarkers[driverId]) {
                    map.setView(driverMarkers[driverId].getLatLng(), 16);
                    driverMarkers[driverId].openPopup();
                    showNotification("Tracking bus location", 2000);
                  } else {
                    showNotification("Bus not found on map", 2000);
                  }
                  break;
                  
                default:
                  console.log('Unknown message type:', data.type);
              }
            } catch (e) {
              console.error('Error handling message:', e);
            }
          }
          
          // Add this to handle map selection mode
          let mapSelectionMode = false;
          let selectionField = null;

          function enterMapSelectionMode(field) {
            mapSelectionMode = true;
            selectionField = field;
            showNotification("Tap on map to select location", 10000);
          }

          function exitMapSelectionMode() {
            mapSelectionMode = false;
            selectionField = null;
            showNotification("Selection canceled", 2000);
          }

          // Add click handler for map selection
          map.on('click', function(e) {
            if (mapSelectionMode) {
              const lat = e.latlng.lat;
              const lng = e.latlng.lng;
              
              // Send selected location back to React
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'MAP_LOCATION_SELECTED',
                  field: selectionField,
                  lat: lat,
                  lng: lng
                }));
              } else {
                window.parent.postMessage({
                  type: 'MAP_LOCATION_SELECTED',
                  field: selectionField,
                  lat: lat,
                  lng: lng
                }, '*');
              }
              
              // Disable selection mode
              mapSelectionMode = false;
              selectionField = null;
              
              showNotification("Location selected", 2000);
            }
          });
          
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
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'MAP_READY'}));
            } else {
              window.parent.postMessage({type: 'MAP_READY'}, '*');
            }
          };
        </script>
      </body>
      </html>
    `
  }

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      switch (data.type) {
        case "MAP_READY":
          console.log("Map is ready")
          setIsMapReady(true)
          break

        default:
          console.log("Other message from WebView:", data)
      }
    } catch (e) {
      console.error("Error parsing WebView message:", e)
    }
  }

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleIframeMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "MAP_READY") {
          console.log("Map is ready (web)")
          setIsMapReady(true)
        }
      }

      window.addEventListener("message", handleIframeMessage)

      return () => {
        window.removeEventListener("message", handleIframeMessage)
      }
    }
  }, [])

  const renderHamburgerButton = () => (
    <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
      <View style={styles.outsideBar} />
      <View style={styles.outsideBar} />
      <View style={styles.outsideBar} />
    </TouchableOpacity>
  )

  const renderSearchToggleButton = () => (
    <TouchableOpacity onPress={toggleSearch} style={styles.searchToggleButton}>
      <Icon name="search" size={24} color="black" />
    </TouchableOpacity>
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

  const renderNearestBusStop = () => {
    if (!nearestBusStop || !isShowingNearestBusStop) return null

    return (
      <View style={styles.nearestBusStopContainer}>
        <View style={styles.nearestBusStopHeader}>
          <Icon name="bus" size={18} color="#0D6EFD" />
          <Text style={styles.nearestBusStopTitle}>Nearest Bus Stop</Text>
          <TouchableOpacity onPress={() => setIsShowingNearestBusStop(false)} style={styles.nearestBusStopCloseButton}>
            <Icon name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.nearestBusStopContent}>
          <Text style={styles.nearestBusStopName}>{nearestBusStop.name}</Text>
          <Text style={styles.nearestBusStopDistance}>
            {nearestBusStop.distance < 1000
              ? `${Math.round(nearestBusStop.distance)} meters away`
              : `${(nearestBusStop.distance / 1000).toFixed(2)} km away`}
          </Text>
          <TouchableOpacity
            style={styles.nearestBusStopButton}
            onPress={() => {
              if (nearestBusStop) {
                setFromLocation(nearestBusStop.name)
                setSelectedFromLocation({
                  name: nearestBusStop.name,
                  lat: nearestBusStop.lat,
                  lon: nearestBusStop.lon,
                })

                sendMessageToMap({
                  type: "ADD_FROM_MARKER",
                  lat: nearestBusStop.lat,
                  lon: nearestBusStop.lon,
                  name: nearestBusStop.name,
                })

                setIsShowingNearestBusStop(false)
              }
            }}
          >
            <Text style={styles.nearestBusStopButtonText}>Use This Bus Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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
      {renderNearestBusStop()}
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
          onPress={handleSearch}
          style={[
            styles.searchButton,
            (!selectedFromLocation || !selectedToLocation) && styles.disabledButton,
            isOutOfServiceArea && styles.disabledButton,
          ]}
          disabled={!selectedFromLocation || !selectedToLocation || isOutOfServiceArea}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <View style={styles.profileContainer}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileInitials}>{profileData?.firstName?.[0]?.toUpperCase() || "U"}</Text>
          </View>
          <Text style={styles.profileText}>{profileData?.firstName || "User"}</Text>
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
  )

  const renderMap = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.map}>
          <iframe
            src={`data:text/html;charset=utf-8,${encodeURIComponent(generateMapHTML())}`}
            style={{
              border: "none",
              width: "100%",
              height: "100%",
            }}
            title="Map"
          />
        </View>
      )
    }

    return (
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html: generateMapHTML() }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    )
  }

  if (currentPage === "Profile") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <View style={styles.profileDetails}></View>
        {menuVisible && renderMenu()}
      </View>
    )
  }

  if (currentPage === "Booking") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="black" />
        </TouchableOpacity>
        <Booking />
        {menuVisible && renderMenu()}
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
        {menuVisible && renderMenu()}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderMap()}
      {renderNoBusesMessage()}
      {renderHamburgerButton()}
      {renderSearchToggleButton()}
      {renderBusStopToggleButton()}
      {/* Track Bus Button */}
      <View style={styles.trackBusButtonContainer}>
        <TouchableOpacity
          onPress={() => {
            if (Object.keys(driverLocations).length > 0) {
              // If we have driver locations, center the map on them
              const activeDrivers = Object.values(driverLocations).filter((driver) => driver.isOnline)

              if (activeDrivers.length > 0) {
                // Focus on the first active driver
                sendMessageToMap({
                  type: "FOCUS_ON_DRIVER",
                  driverId: activeDrivers[0].userId || activeDrivers[0].socketId,
                })
                showNotification("Tracking active bus", 2000)
              } else {
                Alert.alert("No Active Buses", "There are no active buses at the moment. Please try again later.")
              }
            } else {
              Alert.alert("No Buses Available", "There are no buses available at the moment. Please try again later.")
            }
          }}
          style={styles.trackBusButton}
          activeOpacity={0.8}
        >
          <View style={styles.trackBusContent}>
            <Icon name="locate" size={20} color="white" style={styles.trackBusIcon} />
            <Text style={styles.trackBusText}>Track Bus</Text>
          </View>
        </TouchableOpacity>
      </View>
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
    ...StyleSheet.absoluteFillObject,
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
    marginRight: 10,
  },
  showRouteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  searchButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#DB2955",
    borderRadius: 10,
    alignItems: "center",
  },
  searchButtonText: {
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
  menuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: "100%",
    backgroundColor: "#082A3F",
    padding: 20,
    zIndex: 10,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  profileText: {
    fontSize: 18,
    color: "white",
  },
  menuItem: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#082A3F",
  },
  menuText: {
    fontSize: 16,
    color: "white",
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
  driverButton: {
    padding: 10,
    backgroundColor: "#DB2955",
    borderRadius: 5,
    alignSelf: "center",
    marginTop: "auto",
  },
  driverButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  busStopButtonsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
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
  nearestBusStopContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    marginVertical: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nearestBusStopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  nearestBusStopTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D6EFD",
    marginLeft: 8,
    flex: 1,
  },
  nearestBusStopCloseButton: {
    padding: 5,
  },
  nearestBusStopContent: {
    paddingLeft: 26,
  },
  nearestBusStopName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  nearestBusStopDistance: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  nearestBusStopButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  nearestBusStopButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
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
  noBusesContainer: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 3,
  },
  noBusesIcon: {
    marginRight: 10,
  },
  noBusesText: {
    color: "#DB2955",
    fontSize: 16,
    fontWeight: "bold",
  },
  trackBusButtonContainer: {
    position: "absolute",
    bottom: 80, // Position above the bus stop button
    right: 20,
    zIndex: 3,
  },
  trackBusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    backgroundColor: "#DB2955",
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
  trackBusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trackBusIcon: {
    marginRight: 8,
  },
  trackBusText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
})

export default ContactMap