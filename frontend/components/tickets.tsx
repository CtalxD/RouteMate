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

const Ticket: React.FC<TicketProps> = ({ bus, onBack }) => {
  const [numberOfTickets, setNumberOfTickets] = useState<number>(1);
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);

  const calculateTotalPrice = (): string => {
    const pricePerTicket = parseFloat(bus.price.replace('Rs', '').trim());
    return (pricePerTicket * numberOfTickets).toFixed(2);
  };

  const handleNumberOfTicketsChange = (newCount: number) => {
    if (newCount < 1) return;
    setNumberOfTickets(newCount);
    if (newCount > passengerNames.length) {
      setPassengerNames([...passengerNames, ...Array(newCount - passengerNames.length).fill('')]);
    } else {
      setPassengerNames(passengerNames.slice(0, newCount));
    }
  };

  const handlePassengerNameChange = (index: number, value: string) => {
    const newPassengerNames = [...passengerNames];
    newPassengerNames[index] = value;
    setPassengerNames(newPassengerNames);
  };

  const validatePassengerNames = (): boolean => {
    return passengerNames.every(name => name.trim().length > 0);
  };

  const handlePayment = () => {
    if (!validatePassengerNames()) {
      Alert.alert('Validation Error', 'Please enter names for all passengers');
      return;
    }

    const totalPrice = calculateTotalPrice();
    console.log('Proceeding to payment for amount:', totalPrice);
  };

  const handlePaymentSuccess = () => {
    Alert.alert('Success', 'Your payment was successful!');
    // Add any post-payment success logic here
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Payment Error', error);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={30} color="black" />
      </TouchableOpacity>

      <View style={styles.ticketContainer}>
        <Text style={styles.ticketTitle}>Your Ticket</Text>

        {Array.from({ length: numberOfTickets }).map((_, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Passenger ${index + 1} Full Name`}
            value={passengerNames[index]}
            onChangeText={(value) => handlePassengerNameChange(index, value)}
          />
        ))}

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

        <View style={styles.ticketCounter}>
          <Text style={styles.detailLabel}>Number of Tickets:</Text>
          <View style={styles.counterButtons}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => handleNumberOfTicketsChange(numberOfTickets - 1)}
            >
              <Ionicons name="remove" size={20} color="black" />
            </TouchableOpacity>
            <Text style={styles.counterText}>{numberOfTickets}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => handleNumberOfTicketsChange(numberOfTickets + 1)}
            >
              <Ionicons name="add" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Total Price:</Text>
          <Text style={styles.detailValue}>Rs {calculateTotalPrice()}</Text>
        </View>
        
        <Khalti 
          payment={parseFloat(calculateTotalPrice())} 
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
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
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
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
  ticketCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  counterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
});

export default Ticket;