import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Payout module isn't built yet — needs Razorpay Route/Cashfree Payouts
// credentials (Section 12) before it's more than scaffolding.
export function ProviderPayoutsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No payouts yet</Text>
      <Text style={styles.body}>
        Payouts appear here once the Payment module is wired up to Razorpay/Cashfree.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  body: { color: "#666", textAlign: "center" },
});
