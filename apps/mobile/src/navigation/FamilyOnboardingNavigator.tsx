import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { FamilyOnboardingStackParamList } from "./types";
import { FamilyProfileScreen } from "../screens/onboarding/FamilyProfileScreen";
import { CareRecipientScreen } from "../screens/onboarding/CareRecipientScreen";

const Stack = createNativeStackNavigator<FamilyOnboardingStackParamList>();

export function FamilyOnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerBackVisible: false }}>
      <Stack.Screen name="FamilyProfile" component={FamilyProfileScreen} options={{ title: "Your family" }} />
      <Stack.Screen name="CareRecipient" component={CareRecipientScreen} options={{ title: "Care recipient" }} />
    </Stack.Navigator>
  );
}
