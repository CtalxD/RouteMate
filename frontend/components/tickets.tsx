import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type BusRecommendation = {
  id: string;
  numberPlate: string;
  from: string;
  to: string;
  departureTime: string;
  estimatedTime: string;
  price: string;
};

type TicketsProps = {
  bus: BusRecommendation;
  onBack: () => void;
};

const Tickets: React.FC<TicketsProps> = ({ bus, onBack }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Ticket Details</Text>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>Number Plate: {bus.numberPlate}</Text>
        <Text style={styles.detailText}>From: {bus.from}</Text>
        <Text style={styles.detailText}>To: {bus.to}</Text>
        <Text style={styles.detailText}>Departure Time: {bus.departureTime}</Text>
        <Text style={styles.detailText}>Estimated Time: {bus.estimatedTime}</Text>
        <Text style={styles.detailText}>Price: {bus.price}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 11,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default Tickets;