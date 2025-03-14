import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type BusRecommendation = {
  id: string;
  numberPlate: string; // Changed from busName to numberPlate
  from: string;
  to: string;
  departureTime: string;
  estimatedTime: string;
  price: string;
};

type OverlayProps = {
  searchQuery: { from: string; to: string };
  onClose: () => void;
};

const Overlay: React.FC<OverlayProps> = ({ searchQuery, onClose }) => {
  // Dummy data for bus recommendations
  const busRecommendations: BusRecommendation[] = [
    {
      id: '1',
      numberPlate: 'BA 1234', // Example number plate
      from: searchQuery.from,
      to: searchQuery.to,
      departureTime: '10:00 AM',
      estimatedTime: '30 mins',
      price: '30 Rs',
    },
    {
      id: '2',
      numberPlate: 'PA 5678', // Example number plate
      from: searchQuery.from,
      to: searchQuery.to,
      departureTime: '10:30 AM',
      estimatedTime: '35 mins',
      price: '35 Rs',
    },
    {
      id: '3',
      numberPlate: 'KA 9101', // Example number plate
      from: searchQuery.from,
      to: searchQuery.to,
      departureTime: '11:00 AM',
      estimatedTime: '40 mins',
      price: '40 Rs',
    },
  ];

  return (
    <View style={styles.overlayContainer}>
      {/* Close Button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={24} color="black" />
      </TouchableOpacity>

      {/* Overlay Title */}
      <Text style={styles.overlayTitle}>Bus Recommendations</Text>

      {/* Starting Place and Destination */}
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

      {/* Bus Recommendations List */}
      <ScrollView style={styles.recommendationsList}>
        {busRecommendations.map((bus) => (
          <View key={bus.id} style={styles.busCard}>
            {/* Bus Number Plate */}
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    zIndex: 10,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 11,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  routeContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  routeIcon: {
    marginRight: 10,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  recommendationsList: {
    flex: 1,
  },
  busCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  numberPlateContainer: {
    backgroundColor: '#333',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  numberPlateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  busRoute: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  busDetails: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  busPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DB2955',
  },
});

export default Overlay;