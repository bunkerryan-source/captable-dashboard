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
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await inviteUser(
        email.trim(),
        role,
        displayName.trim() || undefined
      );
      setInviteUrl(result.inviteUrl);
      setIsExisting(result.isExisting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setEmail("");
    setRole("editor");
    setDisplayName("");
    setError(null);
    setInviteUrl(null);
    setIsExisting(false);
    setCopied(false);
    onClose();
  }

  const success = inviteUrl !== null;

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
              {submitting ? "Creating\u2026" : "Create Invite Link"}
            </Button>
          </>
        )
      }
    >
      {success && inviteUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M5 10l3.5 3.5L15 7" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] text-text-primary font-medium">
                {isExisting ? "Sign-in link created" : "Invite link created"}
              </p>
              <p className="text-[12px] text-text-secondary">
                Copy this link and send it to <strong>{email}</strong>
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-2.5 flex items-center gap-2">
            <code className="flex-1 text-[11px] text-text-secondary break-all leading-relaxed">
              {inviteUrl}
            </code>
            <Button variant="primary" onClick={handleCopy}>
              {copied ? "Copied\u2713" : "Copy"}
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-800 leading-relaxed">
            <strong>Note:</strong> This link expires in 24 hours and can only
            be used once. Send it to the user via email, Teams, or however you
            normally communicate.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-lg px-3 py-2 text-[12px] text-text-secondary leading-relaxed">
            Creates a one-time link you can send to the user. They click it to
            set up their account{"\u2014"}no email rate limits to fight with.
          </div>
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
