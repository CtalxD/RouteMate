import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Modal, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import CameraKitCameraScreen from 'react-native-camera-kit';
import { RouteProp } from '@react-navigation/native';

interface Ticket {
  id: string;
  passengerName: string;
  route: string;
  date: string;
  time: string;
  seat: string;
}

type RootStackParamList = {
  QRScreen: {
    passengerName?: string;
    route?: string;
    seat?: string;
    paymentSuccess?: boolean;
  };
};

type QRScreenRouteProp = RouteProp<RootStackParamList, 'QRScreen'>;

interface QRScreenProps {
  route: QRScreenRouteProp;
}

const QRScreen: React.FC<QRScreenProps> = ({ route }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [ticketData, setTicketData] = useState<Ticket | null>(null);

  useEffect(() => {
    if (route.params?.paymentSuccess) {
      Alert.alert('Payment Successful', 'Your ticket has been booked successfully!');
    }
  }, [route.params]);

  const ticket: Ticket = {
    id: 'TICKET' + Math.floor(1000 + Math.random() * 9000),
    passengerName: route.params?.passengerName || 'John Doe',
    route: route.params?.route || 'Ratnapark → Koteshwor',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    seat: route.params?.seat || 'A' + Math.floor(1 + Math.random() * 10),
  };

  const ticketString = JSON.stringify(ticket);

  const handleQRCodeScan = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.codeStringValue);
      setTicketData(data);
      setShowScanner(false);
    } catch (e) {
      alert('Invalid QR code');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎫 RouteMate Ticket QR</Text>

      {ticketData ? (
        <>
          <QRCode value={JSON.stringify(ticketData)} size={200} />
          <View style={styles.ticketCard}>
            <Text style={styles.ticketTitle}>🎟 Ticket Details</Text>
            <Text>ID: {ticketData.id}</Text>
            <Text>Name: {ticketData.passengerName}</Text>
            <Text>Route: {ticketData.route}</Text>
            <Text>Date: {ticketData.date}</Text>
            <Text>Time: {ticketData.time}</Text>
            <Text>Seat: {ticketData.seat}</Text>
          </View>
        </>
      ) : (
        <>
          <QRCode value={ticketString} size={200} />
          <Text style={styles.subtitle}>Your ticket will appear here after payment</Text>
        </>
      )}

      <Button title="Scan QR Code" onPress={() => setShowScanner(true)} />

      <Modal visible={showScanner} animationType="slide">
        <CameraKitCameraScreen
          scanBarcode={true}
          onReadCode={handleQRCodeScan}
          hideControls={true}
          showFrame={true}
          laserColor="blue"
          frameColor="yellow"
        />
        <Button title="Close Scanner" onPress={() => setShowScanner(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    color: '#666',
  },
  ticketCard: {
    marginTop: 30,
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ticketTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

export default QRScreen;
