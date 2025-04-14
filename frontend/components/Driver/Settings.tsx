import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const settingsOptions: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "person-outline", label: "Account" },
  { icon: "notifications-outline", label: "Notification" },
  { icon: "desktop-outline", label: "Display" },
  { icon: "lock-closed-outline", label: "Privacy" },
  { icon: "card-outline", label: "Payment" },
  { icon: "globe-outline", label: "Language" },
  { icon: "help-circle-outline", label: "Help" },
  { icon: "log-out-outline", label: "Logout" },
];

const handleOptionPress = (label: string) => {
  console.log(`${label} clicked!`);
};

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}></View> {/* Removed the Text component */}
      <FlatList
        data={settingsOptions}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress(item.label)}
          >
            <Ionicons name={item.icon} size={24} color="#6200EE" style={styles.icon} />
            <Text style={styles.optionText}>{item.label}</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#6200EE" style={styles.icon} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
    height: "100%",
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  optionText: {
    flex: 1,
    fontSize: 18,
    color: "black",
    marginLeft: 20,
  },
  icon: {
    marginRight: 10,
    color: "black",
  },
});

export default SettingsScreen;
