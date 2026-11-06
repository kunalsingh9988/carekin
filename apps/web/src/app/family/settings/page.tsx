"use client";

import { useEffect, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { addElderRecipient, getCareRecipients, getFamilyProfile } from "@/lib/storage/repositories/families";
import type { CareRecipient, FamilyProfile } from "@/lib/storage/types";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/FormField";
import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";

export default function FamilySettingsPage() {
  const user = useRequireRole("family");
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [confirmRecipient, setConfirmRecipient] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function withdrawConsent(recipientId: string) {
    setBusy(true); setMessage("");
    try {
      await remote("families.withdrawConsent", [recipientId]);
      setMessage("Guardian consent withdrawn. Upcoming child visits were cancelled and their care-brief and contact access were restricted.");
      setConfirmRecipient(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to withdraw consent."); }
    finally { setBusy(false); }
  }

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
    setBusy(true); setMessage("");
    try {
      const created = await addElderRecipient(family.id, { name: newRecipientName });
      setRecipients((prev) => [...prev, created]);
      setNewRecipientName("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add recipient."); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
      <LinkButton href="/account" variant="secondary">Your profile, photo &amp; account details</LinkButton>
      {message && <p role="status" className="text-sm text-text-secondary">{message}</p>}

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
                <p className="text-xs text-text-secondary">{r.type === "elder" ? "Elder" : "Child — active guardian consent required for care"}</p>
                {backendEnabled && r.type === "child" && (confirmRecipient === r.id ? <div className="mt-3 flex flex-col gap-2"><p className="text-sm">Withdraw consent and cancel upcoming visits for this child?</p><Button disabled={busy} onClick={() => withdrawConsent(r.id)}>Confirm withdrawal</Button><Button variant="secondary" disabled={busy} onClick={() => setConfirmRecipient(null)}>Keep consent</Button></div> : <button className="mt-3 text-sm text-accent-text" onClick={() => setConfirmRecipient(r.id)}>Withdraw guardian consent</button>)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-primary">Add an elder care recipient</p>
        <p className="text-xs text-text-secondary">Adding a child requires guardian consent — that happens during booking.</p>
        <TextField label="Name" value={newRecipientName} onChange={(e) => setNewRecipientName(e.target.value)} />
        <Button variant="secondary" onClick={handleAddElder} disabled={!newRecipientName || busy} fullWidth>
          Add
        </Button>
      </Card>
    </main>
  );
}
