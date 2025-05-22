import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type BusRecommendation = {
  id: string;
  numberPlate: string;
  from: string;
  to: string;
  departureTime: string;
  estimatedTime: string;
  price: string;
};

type TicketProps = {
  bus: BusRecommendation;
  onBack: () => void;
};

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

const Ticket: React.FC<TicketProps> = ({ bus, onBack }) => {
  const [numberOfTickets, setNumberOfTickets] = useState<number>(1);
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Function to show success message with animation
  const showSuccess = () => {
    setShowSuccessMessage(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000), // Show for 3 seconds
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccessMessage(false));
  };

  const handleNumberOfTicketsChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num)) {
      const newCount = Math.max(1, Math.min(10, num));
      setNumberOfTickets(newCount);
      
      // Update passenger names array based on new ticket count
      setPassengerNames(prevNames => {
        // If increasing, add empty strings
        if (newCount > prevNames.length) {
          return [...prevNames, ...Array(newCount - prevNames.length).fill('')];
        }
        // If decreasing, truncate the array
        return prevNames.slice(0, newCount);
      });
    } else if (text === '') {
      setNumberOfTickets(0);
      setPassengerNames([]);
    }
  };

  const handlePassengerNameChange = (text: string, index: number) => {
    setPassengerNames(prevNames => {
      const newNames = [...prevNames];
      newNames[index] = text;
      return newNames;
    });
  };

  const getFirstWord = (location: string) => {
    return location.split(' ')[0];
  };

  const fromFirstWord = getFirstWord(bus.from);
  const toFirstWord = getFirstWord(bus.to);

  const getEndOfDay = (dateString: string) => {
    try {
      // Parse the departure time (assuming format like "10:30 AM")
      const [time, modifier] = dateString.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      // Create date object for today
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      // Set to end of day (23:59:59)
      date.setHours(23, 59, 59, 999);
      
      return date.toISOString();
    } catch (error) {
      console.error('Error parsing departure time:', error);
      // Fallback to current date end of day
      const date = new Date();
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    }
  };

  const validateInputs = () => {
    // Check if any passenger name is empty
    const hasEmptyName = passengerNames.some(name => !name.trim());
    if (hasEmptyName) {
      Alert.alert('Validation Error', 'Please enter all passenger names');
      return false;
    }

    if (numberOfTickets < 1) {
      Alert.alert('Validation Error', 'Number of tickets must be at least 1');
      return false;
    }

    if (numberOfTickets > 10) {
      Alert.alert('Validation Error', 'Maximum 10 tickets per booking');
      return false;
    }

    return true;
  };

  const createTicketInDatabase = async (paymentStatus: string = 'PENDING') => {
    try {
      if (!validateInputs()) {
        return null;
      }

      const priceNumber = parseFloat(bus.price.replace('Rs', '').trim());
      const totalPrice = priceNumber * numberOfTickets;
      const validTill = getEndOfDay(bus.departureTime);

      const userId = localStorage.getItem('userId') || '1';
      
      console.log('Sending ticket data:', {
        busNumberPlate: bus.numberPlate,
        from: bus.from,
        to: bus.to,
        departureTime: bus.departureTime,
        estimatedTime: bus.estimatedTime,
        totalPrice: totalPrice.toString(),
        passengerNames: passengerNames,
        paymentStatus: paymentStatus,
        validTill: validTill,
        userId: userId
      });

      const response = await fetch('http://localhost:5000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          busNumberPlate: bus.numberPlate,
          from: bus.from,
          to: bus.to,
          departureTime: bus.departureTime,
          estimatedTime: bus.estimatedTime,
          totalPrice: totalPrice.toString(),
          passengerNames: passengerNames,
          paymentStatus: paymentStatus,
          validTill: validTill,
          userId: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create ticket');
      }

      const data = await response.json();

      if (paymentStatus === 'PENDING') {
        localStorage.setItem('pendingTicketId', data.data.id);
      }

      // Show success message
      showSuccess();

      return data.data;
    } catch (error) {
      console.error('Ticket creation error:', error);
      throw error;
    }
  };

  const handlePayLater = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const ticketData = await createTicketInDatabase('PENDING');
      if (ticketData) {
        // Show success message and wait 2 seconds before navigating
        setTimeout(() => {
          router.push({
            pathname: '/uiTicks',
            params: {
              ...ticketData,
              passengerNames: JSON.stringify(ticketData.passengerNames),
              validTill: ticketData.validTill
            }
          });
        }, 2000);
      }
    } catch (error) {
      let errorMessage = 'Failed to create ticket. Please try again.';
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = passengerNames.every(name => name.trim()) && numberOfTickets >= 1;
  const totalPrice = parseFloat(bus.price.replace('Rs', '').trim()) * numberOfTickets;

  // Generate passenger name input fields based on number of tickets
  const renderPassengerInputs = () => {
    return passengerNames.map((name, index) => (
      <View key={index} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Passenger {index + 1} Full Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder={`Enter passenger ${index + 1} full name`}
          placeholderTextColor="#999"
          value={name}
          onChangeText={(text) => handlePassengerNameChange(text, index)}
        />
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Success message overlay */}
      {showSuccessMessage && (
        <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.successText}>Ticket booked successfully!</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Your Ticket</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeCity}>{fromFirstWord}</Text>
            <Ionicons name="arrow-forward" size={20} color="#666" style={styles.routeArrow} />
            <Text style={styles.routeCity}>{toFirstWord}</Text>
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.departureTime}>{bus.departureTime}</Text>
            <Text style={styles.estimatedTime}>Est. {bus.estimatedTime}</Text>
          </View>
        </View>

        <View style={styles.busInfoCard}>
          <View style={styles.busInfoRow}>
            <Ionicons name="bus-outline" size={18} color="#666" />
            <Text style={styles.busInfoLabel}>Bus Number:</Text>
            <Text style={styles.busInfoValue}>{bus.numberPlate}</Text>
          </View>
          <View style={styles.busInfoRow}>
            <Ionicons name="pricetag-outline" size={18} color="#666" />
            <Text style={styles.busInfoLabel}>Price per Ticket:</Text>
            <Text style={styles.busInfoValue}>{bus.price}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Passenger Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Number of Tickets</Text>
            <View style={styles.ticketCountContainer}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => {
                  const newCount = Math.max(1, numberOfTickets - 1);
                  setNumberOfTickets(newCount);
                  setPassengerNames(prevNames => prevNames.slice(0, newCount));
                }}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.ticketCountInput}
                keyboardType="numeric"
                value={numberOfTickets > 0 ? numberOfTickets.toString() : ''}
                onChangeText={handleNumberOfTicketsChange}
                maxLength={2}
              />
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => {
                  const newCount = Math.min(10, numberOfTickets + 1);
                  setNumberOfTickets(newCount);
                  setPassengerNames(prevNames => {
                    if (newCount > prevNames.length) {
                      return [...prevNames, ...Array(newCount - prevNames.length).fill('')];
                    }
                    return prevNames;
                  });
                }}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Maximum 10 tickets per booking</Text>
          </View>
          
          {/* Dynamic passenger name input fields */}
          {renderPassengerInputs()}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price per ticket</Text>
            <Text style={styles.summaryValue}>{bus.price}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Number of tickets</Text>
            <Text style={styles.summaryValue}>{numberOfTickets}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <TouchableOpacity
            style={[
              styles.payButton,
              !isFormValid && styles.disabledButton
            ]}
            onPress={handlePayLater}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.payButtonText}>Book Now</Text>
                <Ionicons name="time-outline" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  routeContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  routeCity: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  routeArrow: {
    marginHorizontal: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  departureTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  busInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  busInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  busInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 4,
  },
  busInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  formSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  ticketCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },
  ticketCountInput: {
    flex: 1,
    height: 48,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6b00',
  },
  paymentSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  payButton: {
    backgroundColor: '#DB2955',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  // Success message styles
  successMessage: {
    position: 'absolute',
    top: 45,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  successContent: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
});

export default Ticket;