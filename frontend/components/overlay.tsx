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
  onClose: () => void
}

const Overlay: React.FC<OverlayProps> = ({ searchQuery, onClose }) => {
  const router = useRouter()
  const [busRecommendations, setBusRecommendations] = useState<BusRecommendation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true)
        setError(null)

        // In a real app, you would fetch buses based on the route (from/to)
        // For now, we'll just fetch all buses and add the route info
        const response = await axios.get("http://localhost:5000/buses")

        // Transform the API data to match our BusRecommendation type
        const busesWithRouteInfo = response.data.map((bus: any, index: number) => ({
          id: bus.busId,
          numberPlate: bus.busNumber,
          from: searchQuery.from,
          to: searchQuery.to,
          departureTime: getDepartureTime(index),
          estimatedTime: getEstimatedTime(index),
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
  }, [searchQuery])

  // Helper functions to generate departure time, estimated time, and price
  const getDepartureTime = (index: number): string => {
    const hours = 10 + Math.floor(index / 2)
    const minutes = (index % 2) * 30
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`
  }

  const getEstimatedTime = (index: number): string => {
    const minutes = 30 + index * 5
    return `${minutes} mins`
  }

  const getPrice = (index: number): string => {
    const price = 30 + index * 5
    return `${price} Rs`
  }

  const handleBookNow = (bus: BusRecommendation, index: number) => {
    // Navigate to payment screen with bus details as params
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

    // Close the overlay after navigation
    onClose()
  }

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.overlayTitle}>Bus Recommendations</Text>

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
        <ScrollView style={styles.recommendationsList}>
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
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 11,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  routeContainer: {
    marginBottom: 20,
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
  recommendationsList: {
    flex: 1,
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
