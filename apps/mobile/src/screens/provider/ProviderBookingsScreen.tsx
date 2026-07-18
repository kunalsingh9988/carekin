import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Booking module isn't built yet — see apps/api/src/modules/README.md.
export function ProviderBookingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No bookings yet</Text>
      <Text style={styles.body}>
        Once the Booking module ships, confirmed and upcoming bookings will show here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  body: { color: "#666", textAlign: "center" },
});
