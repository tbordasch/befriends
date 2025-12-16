"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Upload a proof image for a bet
 */
export async function uploadProof(
  betId: string,
  userId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user is a participant
  const { data: participant } = await supabase
    .from("bet_participants")
    .select("id")
    .eq("bet_id", betId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .single();

  if (!participant) {
    return { success: false, error: "You are not a participant in this bet" };
  }

  // Upsert proof (insert or update if exists)
  const { error } = await supabase
    .from("proofs")
    .upsert(
      {
        bet_id: betId,
        user_id: userId,
        image_url: imageUrl,
      },
      {
        onConflict: "bet_id,user_id",
      }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get proofs for a bet
 */
export async function getProofs(betId: string) {
  const supabase = await createClient();

  const { data: proofs, error } = await supabase
    .from("proofs")
    .select(
      `
      *,
      user:profiles!proofs_user_id_fkey(
        id,
        name,
        username
      )
    `
    )
    .eq("bet_id", betId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message, proofs: [] };
  }

  return { success: true, proofs: proofs || [] };
}

/**
 * Delete a proof
 */
export async function deleteProof(
  proofId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user owns the proof
  const { data: proof, error: fetchError } = await supabase
    .from("proofs")
    .select("user_id")
    .eq("id", proofId)
    .single();

  if (fetchError || !proof || proof.user_id !== userId) {
    return { success: false, error: "Proof not found or you don't have permission" };
  }

  const { error } = await supabase.from("proofs").delete().eq("id", proofId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

