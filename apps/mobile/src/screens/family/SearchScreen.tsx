import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProviderType } from "@carekin/shared-types";
import type { FamilyStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { apiRequest } from "../../api/client";

type Props = NativeStackScreenProps<FamilyStackParamList, "Search">;

interface ProviderResult {
  id: string;
  type: ProviderType;
  bio: string | null;
  distanceKm: number;
}

export function SearchScreen({ navigation }: Props) {
  const { token, logout } = useAuth();
  const { coords, error: locationError, loading: locating, fetchLocation } = useCurrentLocation();
  const [serviceType, setServiceType] = useState<ProviderType>("CAREGIVER");
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (coords) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, serviceType]);

  async function search() {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        serviceType,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        radiusKm: "10",
      });
      const data = await apiRequest<ProviderResult[]>(`/search/providers?${params.toString()}`, { token });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.typeRow}>
        <TypeChip label="Elder care" active={serviceType === "CAREGIVER"} onPress={() => setServiceType("CAREGIVER")} />
        <TypeChip label="Babysitting" active={serviceType === "BABYSITTER"} onPress={() => setServiceType("BABYSITTER")} />
      </View>

      {locationError && <Text style={styles.error}>{locationError}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {(locating || loading) && <Text style={styles.status}>Finding verified providers nearby…</Text>}

      {!locating && !loading && coords && results.length === 0 && (
        <Text style={styles.status}>No verified providers within 10km yet.</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("ProviderDetail", { providerId: item.id, ...item })}
          >
            <Text style={styles.cardTitle}>{item.type === "CAREGIVER" ? "Elder caregiver" : "Babysitter"}</Text>
            <Text style={styles.cardDistance}>{item.distanceKm.toFixed(1)} km away</Text>
            {item.bio && (
              <Text numberOfLines={2} style={styles.cardBio}>
                {item.bio}
              </Text>
            )}
          </Pressable>
        )}
      />

      <Text onPress={logout} style={styles.logout}>
        Log out
      </Text>
    </View>
  );
}

function TypeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  typeRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#444",
    overflow: "hidden",
  },
  chipActive: { backgroundColor: "#2f6f4f", borderColor: "#2f6f4f", color: "#fff", fontWeight: "600" },
  error: { color: "#b3413c" },
  status: { color: "#666", textAlign: "center", marginTop: 12 },
  list: { gap: 10, paddingBottom: 24 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 14, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardDistance: { color: "#2f6f4f", fontSize: 13, fontWeight: "600" },
  cardBio: { color: "#666", fontSize: 13 },
  logout: { textAlign: "center", color: "#999", marginTop: 8 },
});
