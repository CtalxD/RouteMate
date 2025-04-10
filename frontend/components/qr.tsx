import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Modal } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import CameraKitCameraScreen from 'react-native-camera-kit';

const QRScreen = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  const ticket = {
    id: 'TICKET123',
    passengerName: 'John Doe',
    route: 'Ratnapark → Koteshwor',
    date: '2025-04-09',
    time: '10:30 AM',
    seat: 'A3',
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

      <QRCode value={ticketString} size={200} />

      <Button title="Scan QR Code" onPress={() => setShowScanner(true)} />

      {ticketData && (
        <View style={styles.ticketCard}>
          <Text style={styles.ticketTitle}>🎟 Ticket Details</Text>
          <Text>ID: {ticketData.id}</Text>
          <Text>Name: {ticketData.passengerName}</Text>
          <Text>Route: {ticketData.route}</Text>
          <Text>Date: {ticketData.date}</Text>
          <Text>Time: {ticketData.time}</Text>
          <Text>Seat: {ticketData.seat}</Text>
        </View>
      )}

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
  title: { fontSize: 24, marginBottom: 20 },
  ticketCard: {
    marginTop: 30,
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  ticketTitle: { fontSize: 20, marginBottom: 10 },
});

export default QRScreen;
