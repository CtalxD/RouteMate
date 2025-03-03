import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { WebView } from "react-native-webview";

const ContactMap = () => {
  const location = {
    name: "Kathmandu",
    lat: 27.7172,
    lng: 85.3240,
    addr: {
      city: "Kathmandu",
      country: "Nepal",
      housenumber: "",
      postcode: "",
      street: "Central Kathmandu",
    },
    building: "city center",
    buildingLevels: 0,
  };

  // HTML template for Leaflet map
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Leaflet Map</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <style>
          #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script>
          var map = L.map('map').setView([${location.lat}, ${location.lng}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          var marker = L.marker([${location.lat}, ${location.lng}]).addTo(map);
          marker.bindPopup("<b>${location.name}</b><br>${location.addr.street}, ${location.addr.city}").openPopup();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* WebView for Leaflet Map */}
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={styles.map}
      />

      {/* Overlay Details */}
      <Card style={styles.overlay}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            {location.name}
          </Text>
          <Text variant="bodyMedium" style={styles.address}>
            {location.addr.street}, {location.addr.city}
          </Text>
          <Text variant="bodySmall" style={styles.subtext}>
            Building: {location.building}
          </Text>
          <Button
            mode="text"
            onPress={() => {
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
              );
            }}
            textColor="blue"
          >
            Open in Maps
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  overlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "white",
    opacity: 0.9,
    padding: 8,
    borderRadius: 8,
    elevation: 5,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  address: {
    marginBottom: 4,
    color: "gray",
  },
  subtext: {
    marginBottom: 8,
    color: "darkgray",
  },
});

export default ContactMap;
