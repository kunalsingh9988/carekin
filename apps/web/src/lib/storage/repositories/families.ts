import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { get, newId, set } from "../client";
import type { CareRecipient, CareRecipientType, FamilyProfile, ParentalConsent, ParentalConsentMethod } from "../types";

const FAMILIES_KEY = "families";
const RECIPIENTS_KEY = "careRecipients";
const CONSENTS_KEY = "parentalConsents";

 async function demo_getFamilyProfile(userId: string): Promise<FamilyProfile | null> {
  const all = get<FamilyProfile[]>(FAMILIES_KEY, []);
  return all.find((f) => f.user_id === userId) ?? null;
}

 async function demo_getFamilyProfileById(id: string): Promise<FamilyProfile | null> {
  const all = get<FamilyProfile[]>(FAMILIES_KEY, []);
  return all.find((f) => f.id === id) ?? null;
}

 async function demo_saveFamilyProfile(
  userId: string,
  input: { name: string; address: string; latitude: number; longitude: number },
): Promise<FamilyProfile> {
  const all = get<FamilyProfile[]>(FAMILIES_KEY, []);
  const existing = all.find((f) => f.user_id === userId);
  const now = new Date().toISOString();

  if (existing) {
    const updated: FamilyProfile = { ...existing, ...input, updated_at: now };
    set(
      FAMILIES_KEY,
      all.map((f) => (f.id === existing.id ? updated : f)),
    );
    return updated;
  }

  const created: FamilyProfile = { id: newId(), user_id: userId, ...input, created_at: now, updated_at: now };
  set(FAMILIES_KEY, [...all, created]);
  return created;
}

 async function demo_getCareRecipients(familyId: string): Promise<CareRecipient[]> {
  const all = get<CareRecipient[]>(RECIPIENTS_KEY, []);
  return all.filter((r) => r.family_id === familyId);
}

 async function demo_getCareRecipient(id: string): Promise<CareRecipient | null> {
  const all = get<CareRecipient[]>(RECIPIENTS_KEY, []);
  return all.find((r) => r.id === id) ?? null;
}

 async function demo_addElderRecipient(
  familyId: string,
  input: { name: string; notes?: string },
): Promise<CareRecipient> {
  return addRecipient(familyId, "elder", input.name, input.notes ?? null, null);
}

// The ONLY path that creates a child recipient — requires a logged consent
// record, mirroring the real schema's child_requires_consent CHECK
// constraint and create_child_care_recipient() RPC (DPDP Act Section 9).
 async function demo_addChildRecipientWithConsent(
  familyId: string,
  input: { name: string; notes?: string },
  consent: { consentedBy: string; method: ParentalConsentMethod; consentedByName: string },
): Promise<CareRecipient> {
  const consents = get<ParentalConsent[]>(CONSENTS_KEY, []);
  const consentRecord: ParentalConsent = {
    id: newId(),
    care_recipient_id: "", // filled in below once the recipient id exists
    consented_by: consent.consentedBy,
    method: consent.method,
    consented_by_name: consent.consentedByName,
    consented_at: new Date().toISOString(),
    withdrawn_at: null,
  };

  const recipient = await addRecipient(familyId, "child", input.name, input.notes ?? null, consentRecord.id);
  consentRecord.care_recipient_id = recipient.id;
  set(CONSENTS_KEY, [...consents, consentRecord]);
  return recipient;
}

async function addRecipient(
  familyId: string,
  type: CareRecipientType,
  name: string,
  notes: string | null,
  parentalConsentId: string | null,
): Promise<CareRecipient> {
  const all = get<CareRecipient[]>(RECIPIENTS_KEY, []);
  const now = new Date().toISOString();
  const created: CareRecipient = {
    id: newId(),
    family_id: familyId,
    type,
    name,
    notes,
    parental_consent_id: parentalConsentId,
    created_at: now,
    updated_at: now,
  };
  set(RECIPIENTS_KEY, [...all, created]);
  return created;
}

// Backend adapters
export const getFamilyProfile: typeof demo_getFamilyProfile = (...args) => backendEnabled ? remote("families.getFamilyProfile", args) : demo_getFamilyProfile(...args);
export const getFamilyProfileById: typeof demo_getFamilyProfileById = (...args) => backendEnabled ? remote("families.getFamilyProfileById", args) : demo_getFamilyProfileById(...args);
export const saveFamilyProfile: typeof demo_saveFamilyProfile = (...args) => backendEnabled ? remote("families.saveFamilyProfile", args) : demo_saveFamilyProfile(...args);
export const getCareRecipients: typeof demo_getCareRecipients = (...args) => backendEnabled ? remote("families.getCareRecipients", args) : demo_getCareRecipients(...args);
export const getCareRecipient: typeof demo_getCareRecipient = (...args) => backendEnabled ? remote("families.getCareRecipient", args) : demo_getCareRecipient(...args);
export const addElderRecipient: typeof demo_addElderRecipient = (...args) => backendEnabled ? remote("families.addElderRecipient", args) : demo_addElderRecipient(...args);
export const addChildRecipientWithConsent: typeof demo_addChildRecipientWithConsent = (...args) => backendEnabled ? remote("families.addChildRecipientWithConsent", args) : demo_addChildRecipientWithConsent(...args);
