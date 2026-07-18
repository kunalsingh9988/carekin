import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger";
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = "primary" }: PrimaryButtonProps) {
  return (
    <Pressable
      style={[styles.button, variant === "danger" && styles.danger, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2f6f4f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  danger: { backgroundColor: "#b3413c" },
  disabled: { opacity: 0.5 },
  label: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
