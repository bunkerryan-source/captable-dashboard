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
    .upsert(inserts)
    .select();

  if (error) throw error;
  return (data ?? []).map(mapHolding);
}
