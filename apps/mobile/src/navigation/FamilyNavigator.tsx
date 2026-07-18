import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { FamilyStackParamList } from "./types";
import { SearchScreen } from "../screens/family/SearchScreen";
import { ProviderDetailScreen } from "../screens/family/ProviderDetailScreen";
import { BookingScreen } from "../screens/family/BookingScreen";
import { ChatScreen } from "../screens/family/ChatScreen";

const Stack = createNativeStackNavigator<FamilyStackParamList>();

export function FamilyNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Find care" }} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} options={{ title: "Provider" }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Book" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
    </Stack.Navigator>
  );
}
