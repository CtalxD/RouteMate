import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const Booking = () => {
  const [activeBooking, setActiveBooking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPastBooking, setShowPastBooking] = useState(false);
  const [showCancelledBooking, setShowCancelledBooking] = useState(false);

  const handleActiveBookingClick = () => {
    setActiveBooking(!activeBooking);
    setShowDetails(false);
  };

  const handleDetailsClick = () => {
    setShowDetails(!showDetails);
  };

  const handlePastBookingClick = () => {
    setShowPastBooking(!showPastBooking);
  };

  const handleCancelledBookingClick = () => {
    setShowCancelledBooking(!showCancelledBooking);
  };

  const passengerDetails = [
    { name: 'Sital Aryal', age: 21, seat: '1A', qrCodeData: 'http://example.com/ticket/123456' },
    { name: 'Baz Baz', age: 20, seat: '1B', qrCodeData: 'http://example.com/ticket/654321' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.bookingTitle}>Booking Information</Text>

      <View style={styles.textBoxContainer}>
        {/* Active Booking */}
        <TouchableOpacity style={styles.activeBooking} onPress={handleActiveBookingClick}>
          <Text style={styles.activeBookingTitle}>Active Booking</Text>
        </TouchableOpacity>

        {activeBooking && (
          <View style={styles.activeBookingDetail}>
            <View style={styles.activeCard}>
              <View style={styles.header}></View>
              <View style={styles.infoContainer}>
                <Text style={styles.time}>1:40 PM</Text>
                <View style={styles.durationContainer}>
                  <Text style={styles.duration}>30 mins</Text>
                </View>
                <Text style={styles.time}>2:10 PM</Text>
              </View>
              <View style={styles.locationContainer}>
                <Text style={styles.From}>Balaju</Text>
                <Text style={styles.price}>£55</Text>
                <Text style={styles.To}>Naxal</Text>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.button}>
                  <Ionicons name="person-outline" size={16} color="white" />
                  <Text style={styles.buttonText}> 2</Text>
                </View>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>One-way</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleDetailsClick}>
                  <Text style={styles.buttonText}>Details</Text>
                </TouchableOpacity>
              </View>
              {showDetails && (
                <View style={styles.detailsList}>
                  {passengerDetails.map((passenger, index) => (
                    <View key={index} style={styles.passengerDetail}>
                      <Text style={styles.passengerName}>{passenger.name}</Text>
                      <Text>Age: {passenger.age}</Text>
                      <Text>Seat: {passenger.seat}</Text>
                      <View style={styles.qrCodeContainer}>
                        <QRCode value={passenger.qrCodeData} size={100} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Past Booking */}
        <TouchableOpacity style={styles.previousBooking} onPress={handlePastBookingClick}>
          <Text style={styles.previousBookingTitle}>Past Booking</Text>
        </TouchableOpacity>

        {showPastBooking && (
          <View style={styles.activeBookingDetail}>
            <View style={styles.activeCard}>
              <View style={styles.header}></View>
              <View style={styles.infoContainer}>
                <Text style={styles.time}>10:00 AM</Text>
                <View style={styles.durationContainer}>
                  <Text style={styles.duration}>45 mins</Text>
                </View>
                <Text style={styles.time}>10:45 AM</Text>
              </View>
              <View style={styles.locationContainer}>
                <Text style={styles.From}>Naxal</Text>
                <Text style={styles.price}>£40</Text>
                <Text style={styles.To}>Patan</Text>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.button}>
                  <Ionicons name="person-outline" size={16} color="white" />
                  <Text style={styles.buttonText}> 2</Text>
                </View>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>One-way</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleDetailsClick}>
                  <Text style={styles.buttonText}>Details</Text>
                </TouchableOpacity>
              </View>
              {showDetails && (
                <View style={styles.detailsList}>
                  {passengerDetails.map((passenger, index) => (
                    <View key={index} style={styles.passengerDetail}>
                      <Text style={styles.passengerName}>{passenger.name}</Text>
                      <Text>Age: {passenger.age}</Text>
                      <Text>Seat: {passenger.seat}</Text>
                      <View style={styles.qrCodeContainer}>
                        <QRCode value={passenger.qrCodeData} size={100} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Cancelled Booking */}
        <TouchableOpacity style={styles.cancelledBooking} onPress={handleCancelledBookingClick}>
          <Text style={styles.cancelledBookingTitle}>Cancelled Booking</Text>
        </TouchableOpacity>

        {showCancelledBooking && (
          <View style={styles.activeBookingDetail}>
            <View style={styles.activeCard}>
              <View style={styles.header}></View>
              <View style={styles.infoContainer}>
                <Text style={styles.time}>12:30 PM</Text>
                <View style={styles.durationContainer}>
                  <Text style={styles.duration}>35 mins</Text>
                </View>
                <Text style={styles.time}>1:05 PM</Text>
              </View>
              <View style={styles.locationContainer}>
                <Text style={styles.From}>Thamel</Text>
                <Text style={styles.price}>£50</Text>
                <Text style={styles.To}>Kalimati</Text>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.button}>
                  <Ionicons name="person-outline" size={16} color="white" />
                  <Text style={styles.buttonText}> 2</Text>
                </View>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>One-way</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleDetailsClick}>
                  <Text style={styles.buttonText}>Details</Text>
                </TouchableOpacity>
              </View>
              {showDetails && (
                <View style={styles.detailsList}>
                  {passengerDetails.map((passenger, index) => (
                    <View key={index} style={styles.passengerDetail}>
                      <Text style={styles.passengerName}>{passenger.name}</Text>
                      <Text>Age: {passenger.age}</Text>
                      <Text>Seat: {passenger.seat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',  
    alignItems: 'center',          
    padding: 20,
    backgroundColor: 'white',      
  },
  textBoxContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
  },
  bookingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
    color: '#333',
  },
  activeBooking: {
    marginTop: 20,                
    padding: 15,
    backgroundColor: '#082A3F',
    borderRadius: 8,
    width: '100%',                 
    justifyContent: 'center',
    alignItems: 'center',
  },
  previousBooking: {
    marginTop: 20,                 
    padding: 15,
    backgroundColor: '#e2e3e5',
    borderRadius: 8,
    width: '100%',                 
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelledBooking: {
    marginTop: 20,                 
    padding: 15,
    backgroundColor: '#f44336',
    borderRadius: 8,
    width: '100%',                 
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  previousBookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  cancelledBookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  activeBookingDetail: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1e7ff',
    margin: 10,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationContainer: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  duration: {
    fontSize: 14,
    color: '#555',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 15,
  },
  From: {
    fontSize: 16,
    color: '#333',
  },
  To: {
    fontSize: 16,
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: -10,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f4b5c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  detailsList: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  passengerDetail: {
    marginBottom: 15,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrCodeContainer: {
    marginTop: 10,
  },
});

export default Booking;
