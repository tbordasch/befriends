import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditBetForm } from "@/components/bet/EditBetForm";

async function getBet(betId: string, userId: string) {
  const supabase = await createClient();

  const { data: bet, error } = await supabase
    .from("bets")
    .select("*")
    .eq("id", betId)
    .single();

  if (error || !bet) {
    return null;
  }

  // Only creator can edit
  if (bet.creator_id !== userId) {
    return null;
  }

  // Can only edit if bet is still open
  if (bet.status !== "open") {
    return null;
  }

  return bet;
}

export default async function EditBetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bet = await getBet(id, user.id);

  if (!bet) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Bet</h1>
        <p className="text-muted-foreground mt-1">
          Update the details of your bet
        </p>
      </div>

      <EditBetForm bet={bet} />
    </div>
  );
}

