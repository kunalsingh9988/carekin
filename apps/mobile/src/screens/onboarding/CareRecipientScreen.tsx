import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CareRecipientType } from "@carekin/shared-types";
import type { FamilyOnboardingStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { apiRequest } from "../../api/client";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<FamilyOnboardingStackParamList, "CareRecipient">;

export function CareRecipientScreen({}: Props) {
  const { token, markOnboardingComplete } = useAuth();
  const [type, setType] = useState<CareRecipientType>("ELDER");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/users/care-recipients", {
        method: "POST",
        token,
        body: { type, name, notes: notes || undefined },
      });
      await markOnboardingComplete();
      // RootNavigator switches to the Family app stack automatically once
      // onboardingComplete flips to true.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Who needs care?</Text>

      <PrimaryButtonRow type={type} onChange={setType} />

      <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Dadi, or child's name" />
      <FormField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything a caregiver should know"
        multiline
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Finish setup" onPress={handleSubmit} loading={loading} disabled={!name} />
    </ScrollView>
  );
}

function PrimaryButtonRow({ type, onChange }: { type: CareRecipientType; onChange: (t: CareRecipientType) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
      <Text
        onPress={() => onChange("ELDER")}
        style={[styles.typeChip, type === "ELDER" && styles.typeChipActive]}
      >
        Elder
      </Text>
      <Text
        onPress={() => onChange("CHILD")}
        style={[styles.typeChip, type === "CHILD" && styles.typeChipActive]}
      >
        Child
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
});
