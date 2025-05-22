import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import Khalti from "./Khalti"

type Ticket = {
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
  expiresAt: string
}

const TicketDetails = () => {
  const params = useLocalSearchParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingTicket, setCancellingTicket] = useState(false)
  const router = useRouter()

  const API_BASE_URL = "http://localhost:5000"

  // Calculate expiration date (4 hours after booking)
  const calculateExpirationDate = (createdAtString: string): string => {
    try {
      const createdAt = new Date(createdAtString)
      if (isNaN(createdAt.getTime())) {
        console.log("Invalid created date:", createdAtString)
        return "N/A"
      }

      // Add 4 hours to the created date
      const expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000)
      return expiresAt.toISOString()
    } catch (error) {
      console.error("Error calculating expiration date:", error)
      return "N/A"
    }
  }

  useEffect(() => {
    if (params.id && params.busNumberPlate) {
      try {
        const parsedPassengerNames = typeof params.passengerNames === "string" ? JSON.parse(params.passengerNames) : []

        const createdAtString = String(params.createdAt || new Date().toISOString())
        const expiresAtString = calculateExpirationDate(createdAtString)

        setTicket({
          id: String(params.id),
          busNumberPlate: String(params.busNumberPlate),
          from: String(params.from || ""),
          to: String(params.to || ""),
          departureTime: String(params.departureTime || ""),
          estimatedTime: String(params.estimatedTime || ""),
          totalPrice: Number.parseFloat(String(params.totalPrice || "0")),
          passengerNames: parsedPassengerNames,
          paymentStatus: String(params.paymentStatus || "PENDING") as "PENDING" | "PAID" | "CANCELLED",
          createdAt: createdAtString,
          expiresAt: expiresAtString,
        })

        console.log("Parsed departure time:", params.departureTime)
      } catch (error) {
        console.error("Error parsing ticket data from params:", error)
        Alert.alert("Error", "Failed to load ticket details")
      }
      setLoading(false)
      return
    }

    const fetchTicket = async () => {
      try {
        if (!params.id) {
          setLoading(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/tickets/${params.id}`)
        const data = await response.json()

        if (response.ok) {
          // Add expiration date to the fetched ticket data
          const ticketData = data.data
          ticketData.expiresAt = calculateExpirationDate(ticketData.createdAt)
          setTicket(ticketData)
        } else {
          Alert.alert("Error", data.message || "Failed to fetch ticket details")
        }
      } catch (error) {
        console.error("Error fetching ticket:", error)
        Alert.alert("Error", "Failed to fetch ticket details")
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [params.id])

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A"

    try {
      if (dateString.includes(":") && !dateString.includes("T")) {
        return dateString
      }

      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.log("Invalid date encountered:", dateString)
        return dateString
      }

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return dateString
    }
  }

  // Check if ticket is expired
  const isTicketExpired = (expiresAt: string): boolean => {
    if (!expiresAt || expiresAt === "N/A") return false

    try {
      const expirationDate = new Date(expiresAt)
      const now = new Date()
      return expirationDate < now
    } catch (error) {
      console.error("Error checking ticket expiration:", error)
      return false
    }
  }

  const handleCancelBooking = () => {
    // Show the custom cancel confirmation modal
    setShowCancelModal(true)
  }

  const confirmCancelBooking = async () => {
    // Close the modal
    setShowCancelModal(false)

    if (!ticket || !ticket.id) {
      Alert.alert("Error", "Ticket information not available")
      return
    }

    try {
      setCancellingTicket(true)
      // First try to cancel the ticket (PATCH endpoint)
      const cancelResponse = await fetch(`${API_BASE_URL}/tickets/${ticket.id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const cancelData = await cancelResponse.json()

      if (cancelResponse.ok) {
        // Update the ticket status locally
        setTicket({ ...ticket, paymentStatus: "CANCELLED" })
        Alert.alert("Success", "Your booking has been cancelled successfully")
      } else {
        // If PATCH fails, try to delete the ticket (DELETE endpoint)
        const deleteResponse = await fetch(`${API_BASE_URL}/tickets/${ticket.id}`, {
          method: "DELETE",
        })

        if (deleteResponse.ok) {
          Alert.alert("Success", "Your booking has been deleted successfully", [
            { text: "OK", onPress: () => router.back() },
          ])
        } else {
          const deleteData = await deleteResponse.json()
          Alert.alert("Error", deleteData.message || "Failed to cancel booking")
        }
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error)
      Alert.alert("Error", "Failed to cancel booking. Please try again.")
    } finally {
      setCancellingTicket(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    )
  }

  if (!ticket) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    )
  }

  const ticketExpired = isTicketExpired(ticket.expiresAt)

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#4a90e2" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View
        style={[
          styles.ticketContainer,
          ticket.paymentStatus === "PAID" && styles.paidTicket,
          ticket.paymentStatus === "PENDING" && styles.pendingTicket,
          ticket.paymentStatus === "CANCELLED" && styles.cancelledTicket,
        ]}
      >
        <Text style={styles.title}>Ticket Details</Text>

        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusBadgeText,
              ticket.paymentStatus === "PAID" && styles.statusPaidBadge,
              ticket.paymentStatus === "PENDING" && styles.statusPendingBadge,
              ticket.paymentStatus === "CANCELLED" && styles.statusCancelledBadge,
            ]}
          >
            {ticket.paymentStatus}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bus Number:</Text>
          <Text style={styles.detailValue}>{ticket.busNumberPlate}</Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationContainer}>
            <View style={styles.dot} />
            <Text style={styles.locationText}>{ticket.from}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationContainer}>
            <View style={styles.dot} />
            <Text style={styles.locationText}>{ticket.to}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Departure:</Text>
          <Text style={styles.detailValue}>{formatDateTime(ticket.departureTime)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Est. Travel Time:</Text>
          <Text style={styles.detailValue}>{ticket.estimatedTime}</Text>
        </View>

        <View style={styles.passengersContainer}>
          <Text style={styles.detailLabel}>Passengers:</Text>
          {ticket.passengerNames && ticket.passengerNames.length > 0 ? (
            ticket.passengerNames.map((name, index) => (
              <View key={index} style={styles.passengerItem}>
                <Ionicons name="person-circle-outline" size={18} color="#666" />
                <Text style={styles.passengerName}>{name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.detailValue}>No passenger names available</Text>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.detailLabel}>Total Price:</Text>
          <Text style={styles.priceValue}>Rs {ticket.totalPrice}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booked On:</Text>
          <Text style={styles.detailValue}>{formatDateTime(ticket.createdAt)}</Text>
        </View>

        {/* Expiration Date Row - Only show for non-cancelled tickets */}
        {ticket.paymentStatus !== "CANCELLED" && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires On:</Text>
            <Text style={[styles.detailValue, ticketExpired && styles.expiredText]}>
              {formatDateTime(ticket.expiresAt)}
              {ticketExpired && ticket.paymentStatus === "PENDING" && " (Expired)"}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          
            {ticket.paymentStatus === "PENDING" && !ticketExpired && (
            <Khalti
              amount={ticket.totalPrice * 1}
              onSuccess={(ticketId: string) => {
          Alert.alert("Payment Successful", "Your ticket has been paid successfully");
              setTicket({ ...ticket, paymentStatus: "PAID" });
              }}
              onError={(error: string) => {
            Alert.alert("Payment Failed", error || "Payment could not be completed");
           }}
            ticketId={ticket.id}
            />
            )}

          {ticket.paymentStatus === "PENDING" && ticketExpired && (
            <View style={styles.expiredNotice}>
              <Ionicons name="alert-circle" size={20} color="#f44336" />
              <Text style={styles.expiredNoticeText}>
                This ticket reservation has expired. Please book a new ticket.
              </Text>
            </View>
          )}

          {ticket.paymentStatus !== "CANCELLED" && !ticketExpired && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Improved Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={28} color="#f44336" />
              <Text style={styles.modalTitle}>Cancel Booking</Text>
            </View>

            <Text style={styles.modalMessage}>Are you sure you want to cancel this booking?</Text>
            <Text style={styles.modalSubMessage}>This action cannot be undone.</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonNo]}
                onPress={() => setShowCancelModal(false)}
                disabled={cancellingTicket}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonNoText}>No, Keep It</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonYes]}
                onPress={confirmCancelBooking}
                disabled={cancellingTicket}
                activeOpacity={0.7}
              >
                {cancellingTicket ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.modalButtonYesText}>Yes, Cancel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#f44336",
    textAlign: "center",
    marginTop: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4a90e2",
    marginLeft: 5,
  },
  ticketContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paidTicket: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
  },
  pendingTicket: {
    borderLeftWidth: 5,
    borderLeftColor: "#FFC107",
  },
  cancelledTicket: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  statusBadge: {
    alignSelf: "center",
    marginBottom: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusPaidBadge: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
  },
  statusPendingBadge: {
    backgroundColor: "#FFF8E1",
    color: "#FFC107",
  },
  statusCancelledBadge: {
    backgroundColor: "#FFEBEE",
    color: "#F44336",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  expiredText: {
    color: "#f44336",
    fontWeight: "500",
  },
  routeContainer: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4a90e2",
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: "#4a90e2",
    marginLeft: 5,
    marginVertical: -10,
  },
  passengersContainer: {
    marginBottom: 15,
  },
  passengerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 10,
  },
  passengerName: {
    fontSize: 15,
    marginLeft: 5,
    color: "#333",
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b00",
  },
  actionsContainer: {
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  expiredNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  expiredNoticeText: {
    color: "#D32F2F",
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  // Improved Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: "45%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonNo: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalButtonNoText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 15,
  },
  modalButtonYes: {
    backgroundColor: "#f44336",
  },
  modalButtonYesText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  buttonIcon: {
    marginRight: 6,
  },
})

export default TicketDetails