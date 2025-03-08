import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { io } from "socket.io-client";

type Location = {
  name: string;
  lat: number;
  lng: number;
};

const ContactMap = () => {
  const [zoomLevel] = useState(0.01);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [otherLocations, setOtherLocations] = useState<Location[]>([]);
  const socket = io("http://localhost:5000"); // Replace with your server URL

  const defaultLocation: Location = {
    name: "Kathmandu",
    lat: 27.7172,
    lng: 85.324,
  };

  useEffect(() => {
    // Request location permission
    const requestLocationPermission = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermissionGranted(true);
          },
          (error) => {
            console.error("Error getting location permission:", error);
            alert("Location permission is required to use this feature.");
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    // Watch user's location
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { name: "User", lat: latitude, lng: longitude };
        setUserLocation(location);

        // Send location to the server
        socket.emit("updateLocation", location);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Listen for location updates from other users
    socket.on("newLocation", (location: Location) => {
      console.log("New location received:", location);
      setOtherLocations((prevLocations) => {
        const existingLocationIndex = prevLocations.findIndex((loc) => loc.name === location.name);
        if (existingLocationIndex !== -1) {
          // Update existing location
          const updatedLocations = [...prevLocations];
          updatedLocations[existingLocationIndex] = location;
          return updatedLocations;
        } else {
          // Add new location
          return [...prevLocations, location];
        }
      });
    });

    // Cleanup on unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [permissionGranted]);

  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    (userLocation?.lng || defaultLocation.lng) - zoomLevel
  },${
    (userLocation?.lat || defaultLocation.lat) - zoomLevel
  },${
    (userLocation?.lng || defaultLocation.lng) + zoomLevel
  },${
    (userLocation?.lat || defaultLocation.lat) + zoomLevel
  }&layer=mapnik&marker=${userLocation?.lat || defaultLocation.lat},${
    userLocation?.lng || defaultLocation.lng
  }&lang=en`;

  return (
    <View style={styles.container}>
      {!permissionGranted ? (
        <p>Please grant location permission to use the map.</p>
      ) : (
        <>
          <iframe
            src={openStreetMapUrl}
            style={styles.map}
            title="OpenStreetMap"
            allow="geolocation"
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
    zIndex: 1,
  },
  markerContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  marker: {
    marginBottom: 5,
  },
});

export default ContactMap;