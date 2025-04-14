import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Khalti from './Khalti';

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

// Type guard for error handling
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
  const [fullPassengerName, setFullPassengerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleNumberOfTicketsChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num)) {
      setNumberOfTickets(Math.max(1, num));
    } else if (text === '') {
      setNumberOfTickets(1);
    }
  };

  const createTicketInDatabase = async (paymentSuccessful: boolean = false) => {
    try {
      if (!fullPassengerName.trim()) {
        throw new Error('Passenger name is required');
      }

      const passengerNames = Array(numberOfTickets).fill(fullPassengerName);
      const priceNumber = parseFloat(bus.price.replace('Rs', '').trim());
      const totalPrice = priceNumber * numberOfTickets;

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
          paymentStatus: paymentSuccessful ? 'PAID' : 'PENDING'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      return data;
    } catch (error) {
      console.error('Ticket creation error:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = async () => {
    setIsLoading(true);
    try {
      await createTicketInDatabase(true);
      Alert.alert('Success', 'Your payment and ticket booking were successful!');
    } catch (error) {
      let errorMessage = 'Payment succeeded but ticket booking failed. Please contact support.';
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Payment Error', error);
  };

  const handlePay = async () => {
    if (!fullPassengerName.trim()) {
      Alert.alert('Validation Error', 'Please enter passenger name');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await createTicketInDatabase(false);
      Alert.alert(
        'Success',
        'Your tickets have been reserved. Please pay at the bus counter before boarding.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Pay later confirmed for tickets');
            }
          }
        ]
      );
    } catch (error) {
      let errorMessage = 'Failed to book ticket';
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={30} color="black" />
      </TouchableOpacity>

      <View style={styles.ticketContainer}>
        <Text style={styles.ticketTitle}>Your Ticket</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Full Passenger Name</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Enter full passenger name"
            value={fullPassengerName}
            onChangeText={setFullPassengerName}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Number of Tickets</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Enter number of tickets"
            keyboardType="numeric"
            value={numberOfTickets.toString()}
            onChangeText={handleNumberOfTicketsChange}
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Bus Number:</Text>
          <Text style={styles.detailValue}>{bus.numberPlate}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>From:</Text>
          <Text style={styles.detailValue}>{bus.from}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>To:</Text>
          <Text style={styles.detailValue}>{bus.to}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Departure Time:</Text>
          <Text style={styles.detailValue}>{bus.departureTime}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Estimated Time:</Text>
          <Text style={styles.detailValue}>{bus.estimatedTime}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>{bus.price}</Text>
        </View>
        
        <View style={styles.paymentButtonsContainer}>
          <Khalti 
            payment={parseFloat(bus.price.replace('Rs', '').trim()) * numberOfTickets} 
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            style={styles.paymentButton}
            disabled={isLoading || !fullPassengerName.trim()}
          />
          
          <TouchableOpacity
            style={[
              styles.paymentButton, 
              styles.PayButton,
              (isLoading || !fullPassengerName.trim()) && styles.disabledButton
            ]}
            onPress={handlePay}
            disabled={isLoading || !fullPassengerName.trim()}
          >
            <Text style={styles.PayButtonText}>
              {isLoading ? 'Processing...' : 'Pay Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 20,
  },
  ticketContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  fieldInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentButtonsContainer: {
    marginTop: 20,
  },
  paymentButton: {
    marginBottom: 10,
  },
  PayButton: {
    backgroundColor: '#ffa500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  PayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
});

export default Ticket;