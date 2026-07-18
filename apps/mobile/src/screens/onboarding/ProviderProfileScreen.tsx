import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProviderType } from "@carekin/shared-types";
import type { ProviderOnboardingStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { apiRequest } from "../../api/client";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<ProviderOnboardingStackParamList, "ProviderProfile">;

export function ProviderProfileScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { coords, error: locationError, loading: locating, fetchLocation } = useCurrentLocation();
  const [type, setType] = useState<ProviderType>("CAREGIVER");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!coords) {
      setError("Share your location first so families nearby can find you.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/users/provider-profile", {
        method: "POST",
        token,
        body: { type, bio: bio || undefined, serviceRadiusKm: 5, latitude: coords.latitude, longitude: coords.longitude },
      });
      navigation.navigate("DocumentUpload");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your provider profile</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
        <Text onPress={() => setType("CAREGIVER")} style={[styles.typeChip, type === "CAREGIVER" && styles.typeChipActive]}>
          Elder caregiver
        </Text>
        <Text onPress={() => setType("BABYSITTER")} style={[styles.typeChip, type === "BABYSITTER" && styles.typeChipActive]}>
          Babysitter
        </Text>
      </ScrollView>

      <FormField label="Bio" value={bio} onChangeText={setBio} placeholder="Your experience, availability, languages" multiline />

      <PrimaryButton
        label={coords ? "Location saved" : locating ? "Locating…" : "Share current location"}
        onPress={fetchLocation}
        loading={locating}
        disabled={!!coords}
      />
      {locationError && <Text style={styles.error}>{locationError}</Text>}

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Continue" onPress={handleSubmit} loading={loading} />

      <Text style={styles.notice}>
        You won't be visible to families until our team verifies your documents and background checks.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  typeRow: { gap: 10 },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#444",
  },
  typeChipActive: { backgroundColor: "#2f6f4f", borderColor: "#2f6f4f", color: "#fff", fontWeight: "600" },
  error: { color: "#b3413c" },
  notice: { color: "#888", fontSize: 13, textAlign: "center", marginTop: 8 },
});
