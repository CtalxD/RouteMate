// import React from "react";
// import { View, StyleSheet, Linking } from "react-native";
// import { Card, Text, Button } from "react-native-paper";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import 'leaflet/dist/leaflet.css';

// const ContactMap = () => {
//   const location = {
//     name: "Research I",
//     lat: 53.167007,
//     lng: 8.648703,
//     addr: {
//       city: "Bremen",
//       country: "DE",
//       housenumber: "12",
//       postcode: "28759",
//       street: "Campus Ring",
//     },
//     building: "university",
//     buildingLevels: 2,
//   };

//   return (
//     <View style={styles.container}>
//       <MapContainer
//         center={[location.lat, location.lng]}
//         zoom={15}
//         style={styles.map}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <Marker position={[location.lat, location.lng]}>
//           <Popup>
//             <Text>{location.name}</Text>
//             <Text>{`${location.addr.street}, ${location.addr.city}`}</Text>
//           </Popup>
//         </Marker>
//       </MapContainer>

//       {/* Overlay Details */}
//       <Card style={styles.overlay}>
//         <Card.Content>
//           <Text variant="titleMedium" style={styles.title}>
//             {location.name}
//           </Text>
//           <Text variant="bodyMedium" style={styles.address}>
//             {location.addr.street}, {location.addr.city}
//           </Text>
//           <Text variant="bodySmall" style={styles.subtext}>
//             Building: {location.building}
//           </Text>
//           <Button
//             mode="text"
//             onPress={() => {
//               Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`);
//             }}
//             textColor="blue"
//           >
//             Open in Maps
//           </Button>
//         </Card.Content>
//       </Card>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     position: "relative",
//   },
//   map: {
//     height: "100%",
//     width: "100%",
//   },
//   overlay: {
//     position: "absolute",
//     top: 16,
//     left: 16,
//     right: 16,
//     backgroundColor: "white",
//     opacity: 0.9,
//     padding: 8,
//     borderRadius: 8,
//     elevation: 5,
//   },
//   title: {
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   address: {
//     marginBottom: 4,
//     color: "gray",
//   },
//   subtext: {
//     marginBottom: 8,
//     color: "darkgray",
//   },
// });

// export default ContactMap;
