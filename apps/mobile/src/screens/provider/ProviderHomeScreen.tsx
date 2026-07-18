import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { VerificationStatus } from "@carekin/shared-types";
import type { ProviderStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { apiRequest } from "../../api/client";

type Props = NativeStackScreenProps<ProviderStackParamList, "ProviderHome">;

interface ProviderProfileWithVerification {
  id: string;
  type: "CAREGIVER" | "BABYSITTER";
  bio: string | null;
  verificationRecord: { status: VerificationStatus; notes: string | null } | null;
}

const STATUS_COPY: Record<VerificationStatus, { label: string; color: string; body: string }> = {
  PENDING: {
    label: "Under review",
    color: "#b58a00",
    body: "Our team is reviewing your documents and background check. You'll be visible to families once approved.",
  },
  APPROVED: {
    label: "Verified",
    color: "#2f6f4f",
    body: "You're verified and visible to nearby families.",
  },
  REJECTED: {
    label: "Not approved",
    color: "#b3413c",
    body: "Your verification wasn't approved. Contact support for details.",
  },
};

export function ProviderHomeScreen({}: Props) {
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState<ProviderProfileWithVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<ProviderProfileWithVerification>("/users/provider-profile", { token })
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load profile"));
  }, []);

  const status = profile?.verificationRecord?.status;
  const copy = status ? STATUS_COPY[status] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome{user ? `, ${user.phone}` : ""}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {copy && (
        <View style={[styles.statusCard, { borderColor: copy.color }]}>
          <Text style={[styles.statusLabel, { color: copy.color }]}>{copy.label}</Text>
          <Text style={styles.statusBody}>{copy.body}</Text>
        </View>
      )}

      <Text onPress={logout} style={styles.logout}>
        Log out
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  statusCard: { borderWidth: 1.5, borderRadius: 12, padding: 16, gap: 6 },
  statusLabel: { fontWeight: "700", fontSize: 16 },
  statusBody: { color: "#555" },
  error: { color: "#b3413c" },
  logout: { textAlign: "center", color: "#999", marginTop: "auto" },
});
