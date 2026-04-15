import { createClient } from "@/lib/supabase/client";
import { mapHolder, toDbHolder } from "./mappers";
import type { Holder } from "@/data/types";

export async function fetchHolders(): Promise<Holder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .order("name");

  if (error) throw error;
  return (data ?? []).map(mapHolder);
}

export async function addHolder(
  holder: Omit<Holder, "id">
): Promise<Holder> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("holders")
    .insert(toDbHolder(holder))
    .select()
    .single();

  if (error) throw error;
  return mapHolder(data);
}
