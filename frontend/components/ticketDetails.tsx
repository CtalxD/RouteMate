import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Ticket {
  id: string;
  busNumberPlate: string;
  from: string;
  to: string;
  departureTime: string;
  estimatedTime: string;
  totalPrice: number;
  passengerNames: string[];
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

const API_URL = 'http://localhost:5000/tickets';

const TicketDetailsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to fetch specific ticket if ID is provided
      if (params.id) {
        try {
          const response = await fetch(`${API_URL}/${params.id}`);
          const data = await response.json();
          
          if (data.success) {
            setTicket(data.data);
            return;
          }
        } catch (e) {
          console.log('Specific ticket endpoint not available, falling back to all tickets');
        }
      }

      // Fallback to fetching all tickets and filtering
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data.success) {
        const foundTicket = params.id 
          ? data.data.find((t: Ticket) => t.id === params.id)
          : data.data[0]; // Fallback to first ticket if no ID provided
        
        if (foundTicket) {
          setTicket(foundTicket);
        } else {
          setError('Ticket not found');
        }
      } else {
        setError('Failed to load tickets');
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTicket();
  };

  const handleBack = () => {
    router.back();
  };

  const handleDone = () => {
    router.push('/lists'); // Navigate to tickets list screen
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return [styles.statusBadge, styles.paidBadge];
      case 'PENDING':
        return [styles.statusBadge, styles.pendingBadge];
      case 'CANCELLED':
        return [styles.statusBadge, styles.cancelledBadge];
      default:
        return [styles.statusBadge, styles.pendingBadge];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Pending Payment';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading ticket details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={50} color="#FF6B6B" style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchTicket} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDone} style={styles.backButton}>
          <Text style={styles.backButtonText}>View All Tickets</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="ticket" size={50} color="#4A90E2" style={styles.errorIcon} />
        <Text style={styles.errorText}>No ticket data available</Text>
        <TouchableOpacity onPress={fetchTicket} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDone} style={styles.backButton}>
          <Text style={styles.backButtonText}>View All Tickets</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4A90E2']}
          tintColor="#4A90E2"
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>

        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketId}>Ticket #{ticket.id.substring(0, 8)}</Text>
            <View style={getStatusBadgeStyle(ticket.paymentStatus)}>
              <Text style={styles.statusText}>
                {getStatusText(ticket.paymentStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.routeContainer}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeFrom}>{ticket.from.split(',')[0]}</Text>
              <View style={styles.routeLine}>
                <View style={styles.routeDot} />
                <View style={styles.routeLineMiddle} />
                <View style={styles.routeDotEnd} />
              </View>
              <Text style={styles.routeTo}>{ticket.to.split(',')[0]}</Text>
            </View>
            <View style={styles.routeTiming}>
              <Text style={styles.routeTime}>{formatTime(ticket.departureTime)}</Text>
              <Text style={styles.routeDuration}>{ticket.estimatedTime}</Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="bus" size={18} color="#666" />
              </View>
              <Text style={styles.detailLabel}>Bus Number:</Text>
              <Text style={styles.detailValue}>{ticket.busNumberPlate}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="people" size={18} color="#666" />
              </View>
              <Text style={styles.detailLabel}>Passengers:</Text>
              <Text style={styles.detailValue}>{ticket.passengerNames.length}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar" size={18} color="#666" />
              </View>
              <Text style={styles.detailLabel}>Booked On:</Text>
              <Text style={styles.detailValue}>{formatDate(ticket.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.passengerSection}>
            <Text style={styles.sectionTitle}>Passenger List</Text>
            {ticket.passengerNames.map((name: string, index: number) => (
              <View key={index} style={styles.passengerRow}>
                <Text style={styles.passengerNumber}>{index + 1}.</Text>
                <Text style={styles.passengerName}>{name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentValue}>Rs {ticket.totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentStatusRow}>
              <Text style={styles.paymentLabel}>Status:</Text>
              <View style={getStatusBadgeStyle(ticket.paymentStatus)}>
                <Text style={styles.statusText}>
                  {getStatusText(ticket.paymentStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Important Information</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="information-circle" size={18} color="#4A90E2" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Please arrive at least 30 minutes before departure
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="information-circle" size={18} color="#4A90E2" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Show this ticket or provide booking ID at boarding
            </Text>
          </View>
          {ticket.paymentStatus === 'PENDING' && (
            <View style={styles.instructionItem}>
              <Ionicons name="information-circle" size={18} color="#FFA726" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Complete payment at the bus counter before boarding
              </Text>
            </View>
          )}
          {ticket.paymentStatus === 'CANCELLED' && (
            <View style={styles.instructionItem}>
              <Ionicons name="information-circle" size={18} color="#FF6B6B" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                This ticket has been cancelled and is no longer valid
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>Back to Tickets</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButtonText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ticketId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidBadge: {
    backgroundColor: '#E3F2FD',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidStatusText: {
    color: '#1E88E5',
  },
  pendingStatusText: {
    color: '#FB8C00',
  },
  cancelledStatusText: {
    color: '#E53935',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  routeContainer: {
    marginBottom: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeFrom: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  routeTo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  routeLine: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
  },
  routeDotEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  routeLineMiddle: {
    width: 2,
    height: 20,
    backgroundColor: '#4A90E2',
    marginVertical: 2,
  },
  routeTiming: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeTime: {
    fontSize: 14,
    color: '#666',
  },
  routeDuration: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#444',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  passengerSection: {
    marginBottom: 10,
  },
  passengerRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  passengerNumber: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  paymentSection: {
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#666',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  instructionsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  instructionIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TicketDetailsScreen;