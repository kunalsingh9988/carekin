import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<AuthStackParamList, "OtpVerify">;

export function OtpVerifyScreen({ route }: Props) {
  const { phone, role } = route.params;
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, otp, role);
      // Navigation switches automatically once AuthContext has a token —
      // see RootNavigator.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Incorrect OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>Sent to {phone}</Text>

      <FormField
        label="6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Verify" onPress={handleVerify} loading={loading} disabled={otp.length !== 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 8 },
  error: { color: "#b3413c", textAlign: "center" },
});
