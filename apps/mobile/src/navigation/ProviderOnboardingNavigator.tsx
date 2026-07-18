import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProviderOnboardingStackParamList } from "./types";
import { ProviderProfileScreen } from "../screens/onboarding/ProviderProfileScreen";
import { DocumentUploadScreen } from "../screens/onboarding/DocumentUploadScreen";

const Stack = createNativeStackNavigator<ProviderOnboardingStackParamList>();

export function ProviderOnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackVisible: false }}>
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ title: "Your profile" }} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: "Documents" }} />
    </Stack.Navigator>
  );
}
