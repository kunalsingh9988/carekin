import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyOnboardingStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { apiRequest } from "../../api/client";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<FamilyOnboardingStackParamList, "FamilyProfile">;

export function FamilyProfileScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { coords, error: locationError, loading: locating, fetchLocation } = useCurrentLocation();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!coords) {
      setError("Share your location first so we can find nearby providers.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/users/family-profile", {
        method: "POST",
        token,
        body: { name, address, latitude: coords.latitude, longitude: coords.longitude },
      });
      navigation.navigate("CareRecipient");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about your family</Text>

      <FormField label="Your name" value={name} onChangeText={setName} placeholder="Priya Sharma" />
      <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Flat 4B, Green Park" multiline />

      <PrimaryButton
        label={coords ? "Location saved" : locating ? "Locating…" : "Share current location"}
        onPress={fetchLocation}
        loading={locating}
        disabled={!!coords}
      />
      {locationError && <Text style={styles.error}>{locationError}</Text>}

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Continue" onPress={handleSubmit} loading={loading} disabled={!name || !address} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  error: { color: "#b3413c" },
});
