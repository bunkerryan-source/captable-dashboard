import { createClient } from "@/lib/supabase/client";
import {
  mapEntity,
  mapEquityClass,
  toDbEntity,
  toDbEquityClass,
} from "./mappers";
import type { EntityWithClasses, EquityClass } from "@/data/types";

export async function fetchEntitiesWithClasses(): Promise<EntityWithClasses[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*, equity_classes(*)")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...mapEntity(row),
    equityClasses: (row.equity_classes ?? [])
      .map(mapEquityClass)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  }));
}

export async function addEntity(
  entity: Omit<EntityWithClasses, "id" | "createdAt" | "updatedAt">
): Promise<EntityWithClasses> {
  const supabase = createClient();

  // Insert entity
  const { data: dbEntity, error: entityError } = await supabase
    .from("entities")
    .insert(toDbEntity(entity))
    .select()
    .single();

  if (entityError) throw entityError;

  // Insert equity classes
  const classInserts = entity.equityClasses.map((ec, idx) =>
    toDbEquityClass({
      entityId: dbEntity.id,
      name: ec.name,
      displayOrder: idx + 1,
      unitType: ec.unitType,
      isActive: ec.isActive,
    })
  );

  const { data: dbClasses, error: classError } = await supabase
    .from("equity_classes")
    .insert(classInserts)
    .select();

  if (classError) throw classError;

  return {
    ...mapEntity(dbEntity),
    equityClasses: (dbClasses ?? []).map(mapEquityClass),
  };
}

export async function updateEntity(
  entityId: string,
  entity: Omit<EntityWithClasses, "id" | "createdAt" | "updatedAt">
): Promise<EntityWithClasses> {
  const supabase = createClient();

  // Update entity fields
  const { data: dbEntity, error: entityError } = await supabase
    .from("entities")
    .update({
      name: entity.name,
      entity_type: entity.entityType,
      equity_model: entity.equityModel,
      state_of_formation: entity.stateOfFormation,
      date_of_formation: entity.dateOfFormation,
      show_committed_capital: entity.showCommittedCapital,
      notes: entity.notes,
    })
    .eq("id", entityId)
    .select()
    .single();

  if (entityError) throw entityError;

  // Sync equity classes: delete removed, update existing, insert new
  const { data: existingClasses } = await supabase
    .from("equity_classes")
    .select("id")
    .eq("entity_id", entityId);

  const existingIds = new Set((existingClasses ?? []).map((c) => c.id));
  const incomingIds = new Set(
    entity.equityClasses.filter((ec) => existingIds.has(ec.id)).map((ec) => ec.id)
  );

  // Delete classes that were removed
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("equity_classes").delete().in("id", toDelete);
  }

  // Upsert all classes (insert new, update existing)
  const classUpserts = entity.equityClasses.map((ec, idx) => {
    const base = toDbEquityClass({
      entityId,
      name: ec.name,
      displayOrder: idx + 1,
      unitType: ec.unitType,
      isActive: ec.isActive,
    });
    // Include id for existing classes so upsert updates them
    if (existingIds.has(ec.id)) {
      return { ...base, id: ec.id };
    }
    return base;
  });

  const { data: dbClasses, error: classError } = await supabase
    .from("equity_classes")
    .upsert(classUpserts)
    .select();

  if (classError) throw classError;

  return {
    ...mapEntity(dbEntity),
    equityClasses: (dbClasses ?? [])
      .map(mapEquityClass)
      .sort((a: EquityClass, b: EquityClass) => a.displayOrder - b.displayOrder),
  };
}
