import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);

  const calculateTotalPrice = () => {
    const pricePerTicket = parseFloat(bus.price.replace('$', ''));
    return `$${(pricePerTicket * numberOfTickets).toFixed(2)}`;
  };

  const handleNumberOfTicketsChange = (newCount: number) => {
    setNumberOfTickets(newCount);
    // Adjust the passengerNames array based on the new count
    if (newCount > passengerNames.length) {
      // Add empty strings for new passengers
      setPassengerNames([...passengerNames, ...Array(newCount - passengerNames.length).fill('')]);
    } else {
      // Remove extra passenger names
      setPassengerNames(passengerNames.slice(0, newCount));
    }
  };

  const handlePassengerNameChange = (index: number, value: string) => {
    const newPassengerNames = [...passengerNames];
    newPassengerNames[index] = value;
    setPassengerNames(newPassengerNames);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={30} color="black" />
      </TouchableOpacity>

      <View style={styles.ticketContainer}>
        <Text style={styles.ticketTitle}>Your Ticket</Text>

        {/* Passenger Name Inputs */}
        {Array.from({ length: numberOfTickets }).map((_, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Passenger ${index + 1} Full Name`}
            value={passengerNames[index]}
            onChangeText={(value) => handlePassengerNameChange(index, value)}
          />
        ))}

        {/* Ticket Details */}
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

        {/* Number of Tickets Counter */}
        <View style={styles.ticketCounter}>
          <Text style={styles.detailLabel}>Number of Tickets:</Text>
          <View style={styles.counterButtons}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => handleNumberOfTicketsChange(Math.max(1, numberOfTickets - 1))}
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

        {/* Total Price */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Total Price:</Text>
          <Text style={styles.detailValue}>{calculateTotalPrice()}</Text>
        </View>

        {/* Pay Now Button */}
        <TouchableOpacity style={styles.payNowButton}>
          <Text style={styles.payNowButtonText}>Pay Now</Text>
        </TouchableOpacity>
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
  payNowButton: {
    backgroundColor: '#0f4b5c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  payNowButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Ticket;