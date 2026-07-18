import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { apiRequest } from "../../api/client";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<FamilyStackParamList, "Booking">;

interface CareRecipient {
  id: string;
  name: string;
  type: "ELDER" | "CHILD";
}

// The Booking module isn't built on the backend yet (Section 10 build
// order — Booking comes after Verification/Search). This screen collects
// what a real booking request would need so the flow is testable end to
// end once POST /bookings exists, rather than faking a success response.
export function BookingScreen({}: Props) {
  const { token } = useAuth();
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [durationHours, setDurationHours] = useState("2");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<CareRecipient[]>("/users/care-recipients", { token })
      .then((data) => {
        setRecipients(data);
        setSelectedRecipient(data[0]?.id ?? null);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load care recipients"));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Request a booking</Text>

      {loadError && <Text style={styles.error}>{loadError}</Text>}

      <Text style={styles.label}>Who is this for?</Text>
      {recipients.map((r) => (
        <Text
          key={r.id}
          onPress={() => setSelectedRecipient(r.id)}
          style={[styles.recipientChip, selectedRecipient === r.id && styles.recipientChipActive]}
        >
          {r.name}
        </Text>
      ))}
      {recipients.length === 0 && !loadError && (
        <Text style={styles.status}>No care recipients yet — add one from onboarding.</Text>
      )}

      <FormField
        label="Duration (hours)"
        value={durationHours}
        onChangeText={setDurationHours}
        keyboardType="number-pad"
      />

      <Text style={styles.notice}>
        Booking + payment aren't wired to a live backend yet — the Booking, Payment, and Chat modules
        are next on the build order (see apps/api/src/modules/README.md). This screen is ready to call
        POST /bookings as soon as that module ships.
      </Text>

      <PrimaryButton label="Submit request" onPress={() => undefined} disabled />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  label: { fontWeight: "600", marginTop: 8 },
  recipientChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    color: "#444",
  },
  recipientChipActive: { backgroundColor: "#2f6f4f", borderColor: "#2f6f4f", color: "#fff", fontWeight: "600" },
  status: { color: "#666" },
  error: { color: "#b3413c" },
  notice: { color: "#888", fontSize: 13, marginTop: 8 },
});
