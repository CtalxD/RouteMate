import type React from "react"
import { TouchableOpacity, Text, StyleSheet } from "react-native"

interface OnlineStatusToggleProps {
  isOnline: boolean
  onToggle: (status: boolean) => void
}

const OnlineStatusToggle: React.FC<OnlineStatusToggleProps> = ({ isOnline, onToggle }) => {
  return (
    <TouchableOpacity
      onPress={() => onToggle(!isOnline)}
      style={[styles.container, { backgroundColor: isOnline ? "rgba(46, 204, 113, 0.8)" : "rgba(231, 76, 60, 0.8)" }]}
    >
      <Text style={styles.text}>{isOnline ? "Online" : "Offline"}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})

export default OnlineStatusToggle