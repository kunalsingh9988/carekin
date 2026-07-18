import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { UserRole } from "@carekin/shared-types";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<AuthStackParamList, "PhoneEntry">;

export function PhoneEntryScreen({ navigation }: Props) {
  const { requestOtp } = useAuth();
  const [role, setRole] = useState<UserRole>("FAMILY");
  const [phone, setPhone] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone, role);
      navigation.navigate("OtpVerify", { phone, role });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <Text style={styles.title}>CareKin</Text>
      <Text style={styles.subtitle}>Verified care, close to home.</Text>

      <View style={styles.roleRow}>
        <RoleButton label="I need care" active={role === "FAMILY"} onPress={() => setRole("FAMILY")} />
        <RoleButton label="I provide care" active={role === "PROVIDER"} onPress={() => setRole("PROVIDER")} />
      </View>

      <FormField
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+919876543210"
        autoCapitalize="none"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Send OTP" onPress={handleContinue} loading={loading} disabled={phone.length < 8} />
    </KeyboardAvoidingView>
  );
}

function RoleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.roleButton, active && styles.roleButtonActive]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleButton: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#444",
    overflow: "hidden",
  },
  roleButtonActive: {
    backgroundColor: "#2f6f4f",
    borderColor: "#2f6f4f",
    color: "#fff",
    fontWeight: "600",
  },
  error: { color: "#b3413c", textAlign: "center" },
});
