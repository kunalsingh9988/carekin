import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DocumentType } from "@carekin/shared-types";
import { useAuth } from "../../auth/AuthContext";
import { PrimaryButton } from "../../components/PrimaryButton";

const REQUIRED_DOCS: { type: DocumentType; label: string }[] = [
  { type: "ID_PROOF", label: "Government ID (Aadhaar, PAN, etc.)" },
  { type: "ADDRESS_PROOF", label: "Address proof" },
  { type: "CERTIFICATE", label: "Any relevant certificates (optional)" },
];

// Upload is a stub: there's no S3 bucket or presigned-URL endpoint yet
// (Section 12 checklist — AWS S3/R2 credentials aren't provisioned). Rather
// than fake an upload, this screen names what's required and lets you
// continue past onboarding so the rest of the app is testable.
export function DocumentUploadScreen() {
  const { markOnboardingComplete } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload your documents</Text>
      <Text style={styles.subtitle}>
        Our team reviews these before you go live — this can't be skipped in production.
      </Text>

      {REQUIRED_DOCS.map((doc) => (
        <View key={doc.type} style={styles.docRow}>
          <Text style={styles.docLabel}>{doc.label}</Text>
          <Text style={styles.docStatus}>Upload not yet available</Text>
        </View>
      ))}

      <Text style={styles.notice}>
        Document upload is pending S3/R2 storage setup. Once that's wired up, this screen will let
        you attach photos of each document, which our verification team reviews before approving you.
      </Text>

      <PrimaryButton label="Continue to app (dev only)" onPress={markOnboardingComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#666" },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
  },
  docLabel: { fontSize: 15, flex: 1 },
  docStatus: { color: "#b58a00", fontSize: 12, fontWeight: "600" },
  notice: { color: "#888", fontSize: 13 },
});
