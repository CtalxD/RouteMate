"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import axios from "axios"
import { useRouter } from "expo-router"

type BusRecommendation = {
  id: string
  numberPlate: string
  from: string
  to: string
  departureTime: string
  estimatedTime: string
  price: string
}

type OverlayProps = {
  searchQuery: { from: string; to: string }
  distance: number | null
  duration: number | null
  onClose: () => void
}

const Overlay: React.FC<OverlayProps> = ({ searchQuery, distance, duration, onClose }) => {
  const router = useRouter()
  const [busRecommendations, setBusRecommendations] = useState<BusRecommendation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const getDepartureTime = (index: number): string => {
    // Get current time
    const now = new Date()

    // If it's before 7 AM, start from 7 AM
    let startHour = now.getHours()
    let startMinute = now.getMinutes()

    if (startHour < 7) {
      startHour = 7
      startMinute = 0
    }

    // Round up to the nearest 20 minutes
    startMinute = Math.ceil(startMinute / 20) * 20
    if (startMinute >= 60) {
      startHour += 1
      startMinute = 0
    }

    // Calculate departure time with 20-minute intervals
    const minutesToAdd = index * 20
    let departureMinutes = startMinute + minutesToAdd
    const departureHours = startHour + Math.floor(departureMinutes / 60)
    departureMinutes = departureMinutes % 60

    // Limit to 2 hours from current time
    const maxDepartureTime = new Date(now)
    maxDepartureTime.setHours(maxDepartureTime.getHours() + 2)

    // Format the time
    const ampm = departureHours >= 12 ? "PM" : "AM"
    const displayHours = departureHours > 12 ? departureHours - 12 : departureHours
    return `${displayHours}:${departureMinutes.toString().padStart(2, "0")} ${ampm}`
  }

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch bus data from the API
        const response = await axios.get("http://localhost:5000/buses")

        // Calculate how many 20-minute intervals fit in 2 hours (6 intervals)
        const maxIntervals = 6

        // Transform the API data to match our BusRecommendation type
        const busesWithRouteInfo = response.data
          .slice(0, Math.min(response.data.length, maxIntervals))
          .map((bus: any, index: number) => ({
            id: bus.busId,
            numberPlate: bus.busNumber,
            from: searchQuery.from,
            to: searchQuery.to,
            departureTime: getDepartureTime(index),
            // Always use the provided duration or default to 30 minutes
            estimatedTime: duration ? `${Math.round(duration)} mins` : "30 mins",
            price: getPrice(index),
          }))

        setBusRecommendations(busesWithRouteInfo)
      } catch (err) {
        console.error("Error fetching buses:", err)
        setError("Failed to fetch bus recommendations")
      } finally {
        setLoading(false)
      }
    }

    fetchBuses()
  }, [searchQuery, duration])

  const getEstimatedTime = (index: number): string => {
    // If duration is provided, use it; otherwise default to 30 minutes
    return duration ? `${Math.round(duration)} mins` : "30 mins"
  }

  const getPrice = (index: number): string => {
    const price = 30 + index * 5
    return `${price} Rs`
  }

  const handleBookNow = (bus: BusRecommendation, index: number) => {
    router.push({
      pathname: "/payment",
      params: {
        busId: bus.id,
        busNumber: bus.numberPlate,
        from: bus.from,
        to: bus.to,
        departureTime: bus.departureTime,
        estimatedTime: bus.estimatedTime,
        price: bus.price,
        index: index.toString(),
      },
    })

    onClose()
  }

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.overlayTitle}>Bus Recommendations</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <Icon name="location" size={20} color="blue" style={styles.routeIcon} />
          <Text style={styles.routeText}>{searchQuery.from}</Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeItem}>
          <Icon name="location" size={20} color="red" style={styles.routeIcon} />
          <Text style={styles.routeText}>{searchQuery.to}</Text>
        </View>
      </View>

      <View style={styles.routeInfoContainer}>
        {distance && <Text style={styles.routeInfoText}>Distance: {distance.toFixed(2)} km</Text>}
        <Text style={styles.routeInfoText}>
          Estimated Duration: {duration ? `${Math.round(duration)} mins` : "30 mins"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DB2955" />
          <Text style={styles.loadingText}>Loading buses...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={30} color="#DB2955" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : busRecommendations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bus" size={30} color="#DB2955" />
          <Text style={styles.emptyText}>No buses available for this route</Text>
        </View>
      ) : (
        <View style={styles.scrollContainer}>
          <ScrollView
            style={styles.recommendationsScrollView}
            contentContainerStyle={styles.recommendationsContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {busRecommendations.map((bus, index) => (
              <View key={bus.id} style={styles.busCard}>
                <View style={styles.numberPlateContainer}>
                  <Text style={styles.numberPlateText}>{bus.numberPlate}</Text>
                </View>
                <Text style={styles.busRoute}>
                  {bus.from} → {bus.to}
                </Text>
                <Text style={styles.busDetails}>
                  Departure: {bus.departureTime} | Estimated Time: {bus.estimatedTime}
                </Text>
                <Text style={styles.busPrice}>Price: {bus.price}</Text>
                <TouchableOpacity style={styles.bookNowButton} onPress={() => handleBookNow(bus, index)}>
                  <Text style={styles.bookNowButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    zIndex: 10,
    maxHeight: "85%", // Increased max height for better scrolling
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  routeContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  routeIcon: {
    marginRight: 10,
  },
  routeText: {
    fontSize: 16,
    color: "#333",
  },
  routeDivider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 10,
  },
  routeInfoContainer: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  routeInfoText: {
    fontSize: 14,
    color: "#1976d2",
    marginBottom: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  recommendationsScrollView: {
    flex: 1,
  },
  recommendationsContentContainer: {
    paddingBottom: 20, // Extra padding at the bottom for better scrolling
  },
  busCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  numberPlateContainer: {
    backgroundColor: "#333",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  numberPlateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  busRoute: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  busDetails: {
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },
  busPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#DB2955",
  },
  bookNowButton: {
    backgroundColor: "#DB2955",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  bookNowButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: "#DB2955",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: "#555",
    textAlign: "center",
  },
})

export default Overlay