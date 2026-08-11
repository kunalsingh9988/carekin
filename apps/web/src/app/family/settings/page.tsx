"use client";

import { useEffect, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { addElderRecipient, getCareRecipients, getFamilyProfile } from "@/lib/storage/repositories/families";
import type { CareRecipient, FamilyProfile } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/FormField";

export default function FamilySettingsPage() {
  const user = useRequireRole("family");
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [newRecipientName, setNewRecipientName] = useState("");

  useEffect(() => {
    if (!user) return;
    getFamilyProfile(user.id).then((f) => {
      setFamily(f);
      if (f) getCareRecipients(f.id).then(setRecipients);
    });
  }, [user]);

  if (!user) return null;

  async function handleAddElder() {
    if (!family || !newRecipientName) return;
    const created = await addElderRecipient(family.id, { name: newRecipientName });
    setRecipients((prev) => [...prev, created]);
    setNewRecipientName("");
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>

      {family && (
        <Card className="flex flex-col gap-1">
          <p className="font-medium text-text-primary">{family.name}</p>
          <p className="text-sm text-text-secondary">{family.address}</p>
          <p className="text-sm text-text-secondary">{user.phone}</p>
        </Card>
      )}

      <div>
        <p className="mb-2 font-medium text-text-primary">Care recipients</p>
        <div className="flex flex-col gap-2">
          {recipients.map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{r.name}</p>
                <p className="text-xs text-text-secondary">{r.type === "elder" ? "Elder" : "Child — guardian consent on file"}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-primary">Add an elder care recipient</p>
        <p className="text-xs text-text-secondary">Adding a child requires guardian consent — do that from onboarding.</p>
        <TextField label="Name" value={newRecipientName} onChange={(e) => setNewRecipientName(e.target.value)} />
        <Button variant="secondary" onClick={handleAddElder} disabled={!newRecipientName} fullWidth>
          Add
        </Button>
      </Card>
    </main>
  );
}
