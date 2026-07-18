import type { UserRole } from "@carekin/shared-types";

export type AuthStackParamList = {
  PhoneEntry: undefined;
  OtpVerify: { phone: string; role: UserRole };
};

export type FamilyOnboardingStackParamList = {
  FamilyProfile: undefined;
  CareRecipient: undefined;
};

export type ProviderOnboardingStackParamList = {
  ProviderProfile: undefined;
  DocumentUpload: undefined;
};

export type FamilyStackParamList = {
  Search: undefined;
  ProviderDetail: { providerId: string; type: string; bio: string | null; distanceKm: number };
  Booking: { providerId: string };
  Chat: { bookingId: string };
};

export type ProviderStackParamList = {
  ProviderHome: undefined;
  ProviderBookings: undefined;
  ProviderPayouts: undefined;
};
