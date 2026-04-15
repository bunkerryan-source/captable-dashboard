import { createClient } from "@/lib/supabase/client";
import { mapTransaction, mapAttachment, toDbTransaction } from "./mappers";
import type {
  Transaction,
  TransactionWithAttachments,
  Holding,
} from "@/data/types";
import { upsertHoldings } from "./holdings";
import type { Json, TablesUpdate } from "@/lib/supabase/types";

export async function fetchTransactionsWithAttachments(): Promise<
  TransactionWithAttachments[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, transaction_attachments(*)")
    .order("effective_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...mapTransaction(row),
    attachments: (row.transaction_attachments ?? []).map(mapAttachment),
  }));
}

export async function recordTransaction(
  tx: Omit<Transaction, "id" | "createdAt">,
  holdingsUpdates: Omit<Holding, "id">[]
): Promise<{
  transaction: TransactionWithAttachments;
  holdings: Holding[];
}> {
  const supabase = createClient();

  // Insert transaction
  const { data: dbTx, error: txError } = await supabase
    .from("transactions")
    .insert(toDbTransaction(tx))
    .select("*, transaction_attachments(*)")
    .single();

  if (txError) throw txError;

  // Upsert any holdings changes
  const updatedHoldings = await upsertHoldings(holdingsUpdates);

  return {
    transaction: {
      ...mapTransaction(dbTx),
      attachments: (dbTx.transaction_attachments ?? []).map(mapAttachment),
    },
    holdings: updatedHoldings,
  };
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "createdAt">>
): Promise<TransactionWithAttachments> {
  const supabase = createClient();

  const dbUpdates: TablesUpdate<"transactions"> = {};
  if (updates.transactionType !== undefined)
    dbUpdates.transaction_type = updates.transactionType;
  if (updates.effectiveDate !== undefined)
    dbUpdates.effective_date = updates.effectiveDate;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.metadata !== undefined)
    dbUpdates.metadata = updates.metadata as unknown as Json;
  if (updates.createdBy !== undefined)
    dbUpdates.created_by = updates.createdBy;

  const { data, error } = await supabase
    .from("transactions")
    .update(dbUpdates)
    .eq("id", id)
    .select("*, transaction_attachments(*)")
    .single();

  if (error) throw error;

  return {
    ...mapTransaction(data),
    attachments: (data.transaction_attachments ?? []).map(mapAttachment),
  };
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
