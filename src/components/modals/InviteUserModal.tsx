"use client";

import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { inviteUser } from "@/lib/dal";
import type { UserRole } from "@/data/types";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteUserModal({ open, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      await inviteUser(email.trim(), role, displayName.trim() || undefined);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setEmail("");
    setRole("editor");
    setDisplayName("");
    setError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Invite user"
      footer={
        success ? (
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!email.trim() || submitting}
            >
              {submitting ? "Sending\u2026" : "Send Invite"}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M5 10l3.5 3.5L15 7" />
            </svg>
          </div>
          <p className="text-[14px] text-text-primary font-medium mb-1">Invite sent</p>
          <p className="text-[13px] text-text-secondary">
            {email} will receive an email to set up their account.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@abpcapital.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Display Name"
            placeholder="Optional"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Select
            label="Role"
            options={[
              { value: "editor", label: "Editor \u2014 can view and edit data" },
              { value: "admin", label: "Admin \u2014 can also invite users" },
            ]}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />
          {error && (
            <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
