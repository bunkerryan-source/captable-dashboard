import { createClient } from "@/lib/supabase/client";
import { mapHolding, toDbHolding } from "./mappers";
import type { Holding } from "@/data/types";

export async function fetchHoldings(): Promise<Holding[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("holdings").select("*");

  if (error) throw error;
  return (data ?? []).map(mapHolding);
}

export async function upsertHoldings(
  holdings: Omit<Holding, "id">[]
): Promise<Holding[]> {
  if (holdings.length === 0) return [];

  const supabase = createClient();
  const inserts = holdings.map(toDbHolding);

  const { data, error } = await supabase
    .from("holdings")
    .upsert(inserts, { onConflict: "entity_id,holder_id,equity_class_id" })
    .select();

  if (error) throw error;
  return (data ?? []).map(mapHolding);
}

export async function rebuildEntityHoldings(
  entityId: string
): Promise<Holding[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("rebuild_entity_holdings", {
    p_entity_id: entityId,
  });
  if (error) throw error;
  return (data ?? []).map(mapHolding);
}

export async function upsertHoldingsDelta(
  deltas: import("@/data/types").HoldingDelta[]
): Promise<Holding[]> {
  if (deltas.length === 0) return [];

  const supabase = createClient();
  const results: Holding[] = [];

  for (const d of deltas) {
    const { data, error } = await supabase.rpc("upsert_holding_delta", {
      p_entity_id: d.entityId,
      p_holder_id: d.holderId,
      p_equity_class_id: d.equityClassId,
      p_amount_delta: d.amountDelta,
      p_committed_capital: d.committedCapital ?? undefined,
      p_holder_role: d.holderRole ?? undefined,
    });
    if (error) throw error;
    if (data) {
      const rows = Array.isArray(data) ? data : [data];
      results.push(...rows.map(mapHolding));
    }
  }

  return results;
}
