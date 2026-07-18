import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<FamilyStackParamList, "Chat">;

// Chat unlocks only after a CONFIRMED booking (Section 7) — since Booking
// isn't built yet, this is a placeholder rather than a fake chat UI.
export function ChatScreen({}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat isn't available yet</Text>
      <Text style={styles.body}>
        Chat unlocks once a booking is confirmed. The Chat module (Socket.io, masked phone numbers)
        is next on the build order after Booking and Payment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  body: { color: "#666", textAlign: "center" },
});
