import type { ProviderType } from "./storage/types";

// Explicit development fixtures, never inserted into approved provider records.
// Disable this gallery before a public service launch.
export const SHOW_DEVELOPMENT_PROVIDERS = true;
export const DEMO_PROFILE_NOTICE = "Demo profile—not a verified real provider";
export interface DevelopmentProvider {
  id: string;
  name: string;
  type: ProviderType;
  bio: string;
  scene: string;
  focus: string;
  bookable: false;
}
const caregivers = ["Asha Mehta", "Ravi Menon", "Meera Nair", "Arjun Rao", "Kavya Shah", "Dev Kapoor", "Anita Das", "Rohan Iyer", "Leela Verma", "Sanjay Sen"];
const babysitters = ["Nisha Patel", "Priya Anand", "Tara Joshi", "Neha Sethi", "Riya Bose", "Maya Thomas", "Ananya Roy", "Isha Kumar", "Diya Malhotra", "Sana Ali"];
const elderFocus = ["Companionship and conversation", "Daily routines and gentle activity", "Reading and recreational activities", "Meal-time companionship", "Family communication and visit planning"];
const childFocus = ["Story time and creative play", "Arts, crafts and imaginative play", "Age-appropriate games", "Homework and reading routines", "Calm playtime and daily routines"];
export const DEVELOPMENT_PROVIDERS: readonly DevelopmentProvider[] = [
  ...caregivers.map((name,index): DevelopmentProvider => ({
    id:`demo-carekin-caregiver-${String(index+1).padStart(2,"0")}`, name, type:"caregiver",
    bio:"Fictional elder-care profile for exploring CareKin’s search and profile experience. No real care services are offered.",
    scene:["elder-care-checkin","caregiver-arrival","hero-family-care","caregiver-walk"][index%4],
    focus:elderFocus[index%elderFocus.length], bookable:false,
  })),
  ...babysitters.map((name,index): DevelopmentProvider => ({
    id:`demo-carekin-babysitter-${String(index+1).padStart(2,"0")}`, name, type:"babysitter",
    bio:"Fictional childcare profile for exploring CareKin’s search and profile experience. No real childcare services are offered.",
    scene:index%2 ? "babysitting-playtime" : "babysitting-storytime",
    focus:childFocus[index%childFocus.length], bookable:false,
  })),
];
export function isDevelopmentProviderId(id: string): boolean { return id.startsWith("demo-carekin-"); }
export function getDevelopmentProvider(id: string) { return SHOW_DEVELOPMENT_PROVIDERS ? DEVELOPMENT_PROVIDERS.find(profile=>profile.id===id) : undefined; }
export function listDevelopmentProviders(type: ProviderType, query="") {
  if (!SHOW_DEVELOPMENT_PROVIDERS) return [];
  const search=query.trim().toLowerCase();
  return DEVELOPMENT_PROVIDERS.filter(profile=>profile.type===type && `${profile.name} ${profile.bio} ${profile.focus} ${profile.id}`.toLowerCase().includes(search)).sort((a,b)=>a.name.localeCompare(b.name));
}
