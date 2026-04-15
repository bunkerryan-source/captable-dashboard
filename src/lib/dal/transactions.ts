import { createClient } from "@/lib/supabase/client";
import { mapTransaction, mapAttachment, toDbTransaction } from "./mappers";
import type {
  Transaction,
  TransactionWithAttachments,
  Holding,
} from "@/data/types";
import { upsertHoldings } from "./holdings";

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
