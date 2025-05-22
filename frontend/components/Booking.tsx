"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useAuth } from "@/context/auth-context"

type Ticket = {
  id: string
  busNumberPlate: string
  from: string
  to: string
  departureTime: string
  estimatedTime: string
  totalPrice: number
  passengerNames: string[]
  paymentStatus: "PENDING" | "PAID" | "CANCELLED" | "COMPLETED"
  createdAt: string
  expiresAt?: string
  userRating?: number | null
}

const { width } = Dimensions.get("window")

const Booking = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"PENDING" | "COMPLETED" | "CANCELLED">("PENDING")
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [tabIndicatorPosition] = useState(new Animated.Value(0))
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [currentRatingTicket, setCurrentRatingTicket] = useState<Ticket | null>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)

  const API_BASE_URL = "http://localhost:5000"
  const router = useRouter()
  const { authState } = useAuth()

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color="#DB2955" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Bookings</Text>
      <View style={styles.headerRight} />
    </View>
  )

  const formatDateTime = (dateString: string) => {
    if (!dateString) return ""

    try {
      if (dateString.includes(":") && !dateString.includes("T")) {
        return dateString
      }

      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return ""
      }

      return date.toLocaleString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return ""
    }
  }

  const calculateExpirationDate = (createdAtString: string): string => {
    try {
      const createdAt = new Date(createdAtString)
      if (isNaN(createdAt.getTime())) {
        return ""
      }

      const expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000)
      return expiresAt.toISOString()
    } catch (error) {
      console.error("Error calculating expiration date:", error)
      return ""
    }
  }

  const isTicketExpired = (expiresAt: string): boolean => {
    if (!expiresAt) return false

    try {
      const expirationDate = new Date(expiresAt)
      const now = new Date()
      return expirationDate < now
    } catch (error) {
      console.error("Error checking ticket expiration:", error)
      return false
    }
  }

  const calculateArrivalTime = (departureTime: string, estimatedTime: string) => {
    try {
      const departure = new Date(departureTime)
      if (isNaN(departure.getTime())) {
        return ""
      }

      const timeMatch = estimatedTime.match(/(\d+)h\s*(?:(\d+)m)?/)

      if (!timeMatch) {
        return ""
      }

      const hours = Number.parseInt(timeMatch[1] || "0")
      const minutes = Number.parseInt(timeMatch[2] || "0")

      const arrivalTime = new Date(departure.getTime() + (hours * 60 + minutes) * 60 * 1000)

      return arrivalTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error calculating arrival time:", error)
      return ""
    }
  }

  useEffect(() => {
    fetchTickets()

    const tabPosition = activeTab === "PENDING" ? 0 : activeTab === "COMPLETED" ? 1 : 2
    Animated.spring(tabIndicatorPosition, {
      toValue: tabPosition,
      useNativeDriver: false,
      friction: 8,
      tension: 70,
    }).start()
  }, [activeTab])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setRefreshing(true)

      const statusParam = activeTab
      const response = await fetch(`${API_BASE_URL}/tickets?status=${statusParam}`, {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const ticketsWithRatings = await Promise.all(
          (data.data || []).map(async (ticket: Ticket) => {
            try {
              const ratingResponse = await fetch(
                `${API_BASE_URL}/ratings/user/${authState.user?.id}/bus/${ticket.busNumberPlate}`,
                {
                  headers: {
                    Authorization: `Bearer ${authState.accessToken}`,
                  },
                },
              )

              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json()
                if (ratingData.success && ratingData.data) {
                  return {
                    ...ticket,
                    expiresAt: calculateExpirationDate(ticket.createdAt),
                    userRating: ratingData.data.rating,
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching rating:", error)
            }

            return {
              ...ticket,
              expiresAt: calculateExpirationDate(ticket.createdAt),
              userRating: null,
            }
          }),
        )

        setTickets(ticketsWithRatings)
      } else {
        console.error("Failed to fetch tickets:", data.message)
        Alert.alert("Error", data.message || "Failed to fetch tickets")
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to fetch tickets. Please check your connection.",
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const toggleTicketDetails = (ticketId: string) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId)
  }

  const navigateToTicketDetails = (ticket: Ticket) => {
    router.push({
      pathname: "/uiTicks",
      params: {
        id: ticket.id,
        busNumberPlate: ticket.busNumberPlate,
        from: ticket.from,
        to: ticket.to,
        departureTime: ticket.departureTime,
        estimatedTime: ticket.estimatedTime,
        totalPrice: ticket.totalPrice.toString(),
        passengerNames: JSON.stringify(ticket.passengerNames),
        paymentStatus: ticket.paymentStatus,
        createdAt: ticket.createdAt,
        expiresAt: ticket.expiresAt,
        userRating: ticket.userRating?.toString() || "",
      },
    })
  }

  const getStatusColor = (status: string, isExpired: boolean) => {
    if (status === "PENDING" && isExpired) return "#DB2955"
    if (status === "PENDING") return "#FFC107"
    if (status === "PAID") return "#4CAF50"
    if (status === "COMPLETED") return "#2196F3"
    if (status === "CANCELLED") return "#DB2955"
    return "#666"
  }

  const handleRateBus = async () => {
    if (!currentRatingTicket || selectedRating === 0 || !authState.user?.id) {
      Alert.alert("Error", "Please select a rating before submitting")
      return
    }

    try {
      setIsSubmittingRating(true)

      const requestBody = {
        userId: authState.user.id.toString(),
        busId: currentRatingTicket.busNumberPlate,
        rating: selectedRating,
        comment: ratingComment.trim() || null,
      }

      console.log("Submitting rating:", requestBody)

      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("Rating response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit rating")
      }

      if (data.success) {
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.id === currentRatingTicket.id ? { ...ticket, userRating: selectedRating } : ticket,
          ),
        )

        Alert.alert(
          "Success",
          data.message || `Rating submitted successfully! You rated this bus ${selectedRating} stars.`,
          [
            {
              text: "OK",
              onPress: () => {
                setRatingModalVisible(false)
                setCurrentRatingTicket(null)
                setSelectedRating(0)
                setRatingComment("")
              },
            },
          ],
        )
      } else {
        throw new Error(data.message || "Failed to submit rating")
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to submit rating. Please try again.")
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const openRatingModal = (ticket: Ticket) => {
    setCurrentRatingTicket(ticket)
    setSelectedRating(ticket.userRating || 0)
    setRatingComment("")
    setRatingModalVisible(true)
  }

  const closeRatingModal = () => {
    setRatingModalVisible(false)
    setCurrentRatingTicket(null)
    setSelectedRating(0)
    setRatingComment("")
  }

  const renderRatingModal = () => (
    <Modal animationType="slide" transparent={true} visible={ratingModalVisible} onRequestClose={closeRatingModal}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{currentRatingTicket?.userRating ? "Update Rating" : "Rate Your Trip"}</Text>
          <Text style={styles.modalSubtitle}>Bus {currentRatingTicket?.busNumberPlate}</Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setSelectedRating(star)}
                accessibilityLabel={`Rate ${star} stars`}
                style={styles.starButton}
                disabled={isSubmittingRating}
              >
                <View>
                  <Ionicons
                    name={star <= selectedRating ? "star" : "star-outline"}
                    size={40}
                    color={star <= selectedRating ? "#FFD700" : "#D1D1D1"}
                  />
                  <Text style={styles.starText}>{star}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience (optional)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={ratingComment}
            onChangeText={setRatingComment}
            editable={!isSubmittingRating}
          />

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={closeRatingModal}
              disabled={isSubmittingRating}
            >
              <Text style={styles.buttonTextCancel}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.submitButton,
                (selectedRating === 0 || isSubmittingRating) && styles.disabledButton,
              ]}
              onPress={handleRateBus}
              disabled={selectedRating === 0 || isSubmittingRating}
            >
              {isSubmittingRating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>{currentRatingTicket?.userRating ? "Update" : "Submit"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderRatingSection = (ticket: Ticket) => {
    return (
      <View style={styles.ratingSection}>
        <Text style={styles.ratingSectionTitle}>Rate this Bus</Text>
        <View style={styles.ratingContent}>
          <View style={styles.ratingInfo}>
            <Ionicons name="bus-outline" size={24} color="#082A3F" style={styles.ratingBusIcon} />
            <Text style={styles.ratingBusNumber}>{ticket.busNumberPlate}</Text>
          </View>

          {ticket.userRating ? (
            <View style={styles.userRatingContainer}>
              <Text style={styles.userRatingText}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= ticket.userRating! ? "star" : "star-outline"}
                    size={20}
                    color="#FFD700"
                    style={styles.smallStar}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.updateRatingButton}
                onPress={() => openRatingModal(ticket)}
                disabled={isSubmittingRating}
              >
                <Text style={styles.updateRatingText}>Update Rating</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.rateNowButton}
              onPress={() => openRatingModal(ticket)}
              disabled={isSubmittingRating}
            >
              <Ionicons name="star" size={18} color="white" style={styles.rateNowIcon} />
              <Text style={styles.rateNowText}>Rate Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  const renderTicketItem = ({ item, index }: { item: Ticket; index: number }) => {
    const departureFormatted = formatDateTime(item.departureTime)
    const arrivalTime = calculateArrivalTime(item.departureTime, item.estimatedTime)
    const ticketExpired = item.paymentStatus === "PENDING" && isTicketExpired(item.expiresAt || "")
    const statusColor = getStatusColor(item.paymentStatus, ticketExpired)
    const isExpanded = expandedTicketId === item.id

    return (
      <Animated.View
        style={[
          styles.ticketCard,
          {
            transform: [
              {
                scale: isExpanded ? 1 : 0.99,
              },
            ],
            borderLeftWidth: 5,
            borderLeftColor: statusColor,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => navigateToTicketDetails(item)}
          activeOpacity={0.9}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.busInfoContainer}>
              <Ionicons name="bus-outline" size={20} color="#082A3F" />
              <Text style={styles.busNumber}>{item.busNumberPlate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {ticketExpired ? "EXPIRED" : item.paymentStatus}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.timeLocationContainer}>
              <Text style={styles.timeText}>
                {new Date(item.departureTime).getTime()
                  ? new Date(item.departureTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </Text>
              <View style={styles.dotLineContainer}>
                <View style={[styles.dot, { backgroundColor: "#DB2955" }]} />
                <View style={[styles.verticalLine, { backgroundColor: "#DB2955" }]} />
              </View>
              <Text style={styles.locationText}>{item.from}</Text>
            </View>

            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>{item.estimatedTime}</Text>
              <Ionicons name="arrow-forward" size={16} color="#666" style={styles.arrowIcon} />
            </View>

            <View style={styles.timeLocationContainer}>
              <Text style={styles.timeText}>{arrivalTime}</Text>
              <View style={styles.dotLineContainer}>
                <View style={[styles.dot, styles.destinationDot]} />
              </View>
              <Text style={styles.locationText}>{item.to}</Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.passengersContainer}>
              <Ionicons name="people-outline" size={18} color="#082A3F" />
              <Text style={styles.passengerCount}>
                {item.passengerNames.length} {item.passengerNames.length === 1 ? "Passenger" : "Passengers"}
              </Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total:</Text>
              <Text style={styles.priceValue}>Rs {item.totalPrice}</Text>
            </View>
          </View>

          {item.paymentStatus === "PENDING" && (
            <View style={[styles.expiryInfoContainer, { backgroundColor: ticketExpired ? "#FFEBEE" : "#FFF8E1" }]}>
              <Ionicons
                name={ticketExpired ? "alert-circle" : "time-outline"}
                size={18}
                color={ticketExpired ? "#DB2955" : "#FFC107"}
              />
              <Text style={[styles.expiryInfoText, { color: ticketExpired ? "#DB2955" : "#FFA000" }]}>
                {ticketExpired
                  ? "Reservation expired. Please book a new ticket."
                  : `Expires on ${formatDateTime(item.expiresAt || "")}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.detailsButton, isExpanded && styles.detailsButtonActive]}
            onPress={() => toggleTicketDetails(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsButtonText}>{isExpanded ? "Hide Details" : "Show Details"}</Text>
            <Ionicons name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <Animated.View style={[styles.expandedDetails, { opacity: isExpanded ? 1 : 0 }]}>
            <View style={styles.expandedDetailsContent}>
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Booked on:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(item.createdAt)}</Text>
                </View>

                {item.paymentStatus === "PENDING" && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Expires on:</Text>
                    <Text style={[styles.detailValue, ticketExpired && styles.expiredText]}>
                      {formatDateTime(item.expiresAt || "")}
                      {ticketExpired && " (Expired)"}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.passengersTitle}>Passengers:</Text>
              <View style={styles.passengersGrid}>
                {item.passengerNames.map((name, index) => (
                  <View key={index} style={styles.passengerItem}>
                    <Ionicons name="person-circle-outline" size={18} color="#082A3F" />
                    <Text style={styles.passengerName}>{name}</Text>
                  </View>
                ))}
              </View>

              {item.paymentStatus === "COMPLETED" && renderRatingSection(item)}

              <View style={styles.expandedActionButtons}>
                <TouchableOpacity
                  style={styles.locateButton}
                  onPress={() => {
                    router.push({
                      pathname: "/lists",
                      params: {
                        from: item.from,
                        to: item.to,
                      },
                    })
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color="#fff" />
                  <Text style={styles.locateButtonText}>Locate on Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewFullDetailsButton}
                  onPress={() => navigateToTicketDetails(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewFullDetailsText}>View Full Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#DB2955" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    )
  }

  const tabWidth = (width - 32) / 3
  const translateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  })

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderRatingModal()}

      <View style={styles.tabsContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: tabWidth,
              transform: [{ translateX }],
            },
          ]}
        />
        <TouchableOpacity style={[styles.tabButton]} onPress={() => setActiveTab("PENDING")}>
          <Text style={[styles.tabText, activeTab === "PENDING" && styles.activeTabText]}>Current</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton]} onPress={() => setActiveTab("COMPLETED")}>
          <Text style={[styles.tabText, activeTab === "COMPLETED" && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton]} onPress={() => setActiveTab("CANCELLED")}>
          <Text style={[styles.tabText, activeTab === "CANCELLED" && styles.activeTabText]}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {loading && tickets.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DB2955" />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>No tickets found</Text>
          <Text style={styles.emptyText}>You don't have any {activeTab.toLowerCase()} bookings</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchTickets} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#fff" style={styles.refreshIcon} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchTickets} colors={["#DB2955"]} tintColor="#DB2955" />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 16,
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#082A3F",
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
    position: "relative",
    height: 48,
  },
  tabIndicator: {
    position: "absolute",
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    top: 4,
    left: 4,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  tabText: {
    fontWeight: "600",
    color: "#666",
    fontSize: 15,
  },
  activeTabText: {
    color: "#DB2955",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#082A3F",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#DB2955",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTouchable: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  busInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  busNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#082A3F",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  routeContainer: {
    marginVertical: 12,
  },
  timeLocationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  timeText: {
    width: 80,
    fontSize: 16,
    fontWeight: "bold",
    paddingTop: 2,
    color: "#082A3F",
  },
  dotLineContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  destinationDot: {
    backgroundColor: "#082A3F",
  },
  verticalLine: {
    width: 2,
    height: 40,
    marginTop: 5,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingTop: 2,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 80,
    marginBottom: 8,
    paddingLeft: 34,
  },
  durationText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  arrowIcon: {
    marginLeft: 6,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  passengersContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  passengerCount: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#555",
    marginRight: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#DB2955",
  },
  actionButtonsContainer: {
    padding: 12,
    paddingTop: 0,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#082A3F",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: "100%",
  },
  detailsButtonActive: {
    backgroundColor: "#DB2955",
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 6,
  },
  expandedDetails: {
    overflow: "hidden",
  },
  expandedDetailsContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  detailItem: {
    marginRight: 24,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
  },
  expiredText: {
    color: "#DB2955",
    fontWeight: "500",
  },
  passengersTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#082A3F",
  },
  passengersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  passengerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginRight: 16,
    minWidth: "45%",
  },
  passengerName: {
    fontSize: 14,
    marginLeft: 8,
    color: "#333",
  },
  expiryInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  expiryInfoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  expandedActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },
  locateButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  viewFullDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  viewFullDetailsText: {
    color: "#DB2955",
    fontWeight: "600",
    marginRight: 6,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#082A3F",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 25,
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    padding: 10,
  },
  commentInput: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  submitButton: {
    backgroundColor: "#DB2955",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  buttonTextCancel: {
    color: "#082A3F",
    fontWeight: "bold",
  },
  starButton: {
    padding: 8,
    alignItems: "center",
  },
  starText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
    textAlign: "center",
  },
  // New styles for rating section in expanded details
  ratingSection: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#082A3F",
    marginBottom: 12,
  },
  ratingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBusIcon: {
    marginRight: 8,
  },
  ratingBusNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  rateNowButton: {
    backgroundColor: "#DB2955",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rateNowIcon: {
    marginRight: 6,
  },
  rateNowText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  userRatingContainer: {
    alignItems: "center",
  },
  userRatingText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 6,
  },
  smallStar: {
    marginHorizontal: 2,
  },
  updateRatingButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  updateRatingText: {
    color: "#082A3F",
    fontSize: 12,
    fontWeight: "500",
  },
})

export default Booking
