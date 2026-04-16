import { createClient } from "@/lib/supabase/client";
import { mapAttachment, toDbAttachment } from "./mappers";
import type { TransactionAttachment } from "@/data/types";

/**
 * Uploads files to Supabase Storage and creates transaction_attachments records.
 * Returns the created attachment records.
 */
export async function uploadAttachments(
  transactionId: string,
  files: File[]
): Promise<TransactionAttachment[]> {
  const supabase = createClient();
  const attachments: TransactionAttachment[] = [];

  for (const file of files) {
    // Upload to storage with a unique path: transactionId/timestamp-filename
    const storagePath = `${transactionId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("transaction-attachments")
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // Create the attachment record
    const record = {
      transactionId,
      fileName: file.name,
      filePath: storagePath,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    };

    const { data, error } = await supabase
      .from("transaction_attachments")
      .insert(toDbAttachment(record))
      .select()
      .single();

    if (error) throw error;
    attachments.push(mapAttachment(data));
  }

  return attachments;
}

/**
 * Gets a temporary signed URL for downloading an attachment.
 */
export async function getAttachmentUrl(
  filePath: string
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from("transaction-attachments")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}
