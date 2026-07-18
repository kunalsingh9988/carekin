import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyStackParamList } from "../../navigation/types";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<FamilyStackParamList, "ProviderDetail">;

export function ProviderDetailScreen({ route, navigation }: Props) {
  const { providerId, type, bio, distanceKm } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>✓ Verified by CareKin</Text>
      <Text style={styles.title}>{type === "CAREGIVER" ? "Elder caregiver" : "Babysitter"}</Text>
      <Text style={styles.distance}>{distanceKm.toFixed(1)} km from you</Text>
      {bio && <Text style={styles.bio}>{bio}</Text>}

      <PrimaryButton label="Request a booking" onPress={() => navigation.navigate("Booking", { providerId })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  badge: { color: "#2f6f4f", fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "700" },
  distance: { color: "#666" },
  bio: { fontSize: 15, color: "#333", marginBottom: 12 },
});
