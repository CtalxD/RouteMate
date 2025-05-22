import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useRouter } from "expo-router"

// Define types for ticket data
interface User {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface Ticket {
  id: string
  busNumberPlate: string
  from: string
  to: string
  departureTime: string
  estimatedTime: string
  totalPrice: number
  passengerNames: string[]
  paymentStatus: "PENDING" | "PAID" | "CANCELLED"
  createdAt: string
  expiresAt: string // Changed from validTill to expiresAt
  user: User | null
}

const Passengers = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Calculate expiration date (2 hours after booking) - matching ticketDetails.tsx logic
  const calculateExpirationDate = (createdAtString: string): string => {
    try {
      const createdAt = new Date(createdAtString)
      if (isNaN(createdAt.getTime())) {
        console.log("Invalid created date:", createdAtString)
        return "N/A"
      }

      // Add 2 hours to the created date (matching ticketDetails.tsx)
      const expiresAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000)
      return expiresAt.toISOString()
    } catch (error) {
      console.error("Error calculating expiration date:", error)
      return "N/A"
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://localhost:5000/tickets")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Filter to only include PAID and PENDING tickets
        const filteredTickets = data.data.filter((ticket: Ticket) => 
          ticket.paymentStatus === "PAID" || ticket.paymentStatus === "PENDING"
        ).map((ticket: any) => ({
          ...ticket,
          // Ensure expiresAt is calculated if not present in the API response
          expiresAt: ticket.expiresAt || calculateExpirationDate(ticket.createdAt)
        }))
        setTickets(filteredTickets)
      } else {
        throw new Error(data.message || "Failed to fetch tickets")
      }
    } catch (err) {
      console.error("Error fetching tickets:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      Alert.alert("Error", "Failed to load passenger information. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleRefresh = () => {
    fetchTickets()
  }

  // Helper function to get first word of location
  const getFirstWord = (location: string) => {
    return location.split(',')[0].split(' ')[0];
  }

  // Helper function to format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === "N/A") return { date: "N/A", time: "N/A" }

    try {
      // Handle time-only strings (like "10:30 AM")
      if (dateString.includes(":") && !dateString.includes("T")) {
        return { date: dateString, time: "" }
      }

      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.log("Invalid date encountered:", dateString)
        return { date: dateString, time: "" }
      }

      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
      
      const formattedDate = date.toLocaleDateString('en-US', dateOptions)
      const formattedTime = date.toLocaleTimeString('en-US', timeOptions)
      
      return { date: formattedDate, time: formattedTime }
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return { date: dateString, time: "" }
    }
  }

  // Helper function to check if ticket is expired - using expiresAt
  const isTicketExpired = (expiresAt: string) => {
    if (!expiresAt || expiresAt === "N/A") return false

    try {
      const expiryDate = new Date(expiresAt)
      const currentDate = new Date()
      return currentDate > expiryDate
    } catch (error) {
      console.error('Error checking expiry:', error)
      return false
    }
  }

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    // Get passenger names
    const passengerList = item.passengerNames.join(", ")

    // Format booking time and expiry date
    const bookingDateTime = formatDateTime(item.createdAt)
    const expiryDateTime = formatDateTime(item.expiresAt) // Using expiresAt
    
    // Check if ticket is expired using expiresAt
    const expired = isTicketExpired(item.expiresAt)

    // Determine status color
    let statusColor = "#FFC107" // Yellow for pending
    if (item.paymentStatus === "PAID") {
      statusColor = "#4CAF50" // Green for paid
    }
    if (expired) {
      statusColor = "#F44336" // Red for expired
    }

    return (
      <View style={[styles.ticketCard, expired && styles.expiredCard]}>
        <View style={styles.ticketHeader}>
          <Text style={styles.busNumber}>Bus: {item.busNumberPlate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {expired ? "EXPIRED" : item.paymentStatus}
            </Text>
          </View>
        </View>

        <View style={styles.passengerInfo}>
          <Text style={styles.passengerLabel}>Passenger(s):</Text>
          <Text style={styles.passengerNames}>{passengerList}</Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationContainer}>
            <Icon name="location" size={20} color="#DB2955" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>From:</Text>
              <Text style={styles.locationText}>{getFirstWord(item.from)}</Text>
            </View>
          </View>
          
          <View style={styles.routeArrow}>
            <Icon name="arrow-forward" size={20} color="#082A3F" />
          </View>
          
          <View style={styles.locationContainer}>
            <Icon name="navigate" size={20} color="#082A3F" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>To:</Text>
              <Text style={styles.locationText}>{getFirstWord(item.to)}</Text>
            </View>
          </View>
        </View>

        {/* Booking and Expiry Information */}
        <View style={styles.timeInfoContainer}>
          <View style={styles.timeInfoRow}>
            <View style={styles.timeInfoItem}>
              <Icon name="calendar-outline" size={16} color="#666" />
              <View style={styles.timeInfoTextContainer}>
                <Text style={styles.timeInfoLabel}>Booked:</Text>
                <Text style={styles.timeInfoDate}>{bookingDateTime.date}</Text>
                {bookingDateTime.time && (
                  <Text style={styles.timeInfoTime}>{bookingDateTime.time}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.timeInfoItem}>
              <Icon name="time-outline" size={16} color={expired ? "#F44336" : "#666"} />
              <View style={styles.timeInfoTextContainer}>
                <Text style={[styles.timeInfoLabel, expired && styles.expiredText]}>
                  Expires:
                </Text>
                <Text style={[styles.timeInfoDate, expired && styles.expiredText]}>
                  {expiryDateTime.date}
                </Text>
                {expiryDateTime.time && (
                  <Text style={[styles.timeInfoTime, expired && styles.expiredText]}>
                    {expiryDateTime.time}
                    {expired && " (Expired)"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.ticketFooter}>
          <Text style={styles.departureTime}>Departure: {item.departureTime}</Text>
          <Text style={styles.price}>Rs {item.totalPrice}</Text>
        </View>
      </View>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="ticket-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No passengers found</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passengers</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DB2955" />
          <Text style={styles.loadingText}>Loading passengers...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color="#DB2955" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshing={loading}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#082A3F",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeFilter: {
    backgroundColor: "#DB2955",
  },
  filterText: {
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  ticketCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expiredCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ffcccb",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  passengerInfo: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
  },
  passengerLabel: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  passengerNames: {
    fontSize: 15,
  },
  userInfo: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f0f7ff",
    borderRadius: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  routeArrow: {
    marginHorizontal: 8,
  },
  timeInfoContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
  },
  timeInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInfoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginHorizontal: 4,
  },
  timeInfoTextContainer: {
    marginLeft: 6,
    flex: 1,
  },
  timeInfoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  timeInfoDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  timeInfoTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  expiredText: {
    color: "#F44336",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  departureTime: {
    fontSize: 13,
    color: "#666",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#082A3F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#DB2955",
    borderRadius: 6,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: "#666",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
})

export default Passengers