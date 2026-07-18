import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { FamilyOnboardingNavigator } from "./FamilyOnboardingNavigator";
import { ProviderOnboardingNavigator } from "./ProviderOnboardingNavigator";
import { FamilyNavigator } from "./FamilyNavigator";
import { ProviderNavigator } from "./ProviderNavigator";

export function RootNavigator() {
  const { token, user, bootstrapping, onboardingComplete } = useAuth();

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!token || !user ? (
        <AuthNavigator />
      ) : !onboardingComplete ? (
        user.role === "FAMILY" ? (
          <FamilyOnboardingNavigator />
        ) : (
          <ProviderOnboardingNavigator />
        )
      ) : user.role === "FAMILY" ? (
        <FamilyNavigator />
      ) : (
        <ProviderNavigator />
      )}
    </NavigationContainer>
  );
}
