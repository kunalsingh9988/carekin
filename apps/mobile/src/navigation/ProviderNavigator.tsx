import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { ProviderStackParamList } from "./types";
import { ProviderHomeScreen } from "../screens/provider/ProviderHomeScreen";
import { ProviderBookingsScreen } from "../screens/provider/ProviderBookingsScreen";
import { ProviderPayoutsScreen } from "../screens/provider/ProviderPayoutsScreen";

const Tab = createBottomTabNavigator<ProviderStackParamList>();

export function ProviderNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: "#2f6f4f" }}>
      <Tab.Screen name="ProviderHome" component={ProviderHomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="ProviderBookings" component={ProviderBookingsScreen} options={{ title: "Bookings" }} />
      <Tab.Screen name="ProviderPayouts" component={ProviderPayoutsScreen} options={{ title: "Payouts" }} />
    </Tab.Navigator>
  );
}
