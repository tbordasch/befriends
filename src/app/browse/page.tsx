import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Coins, Users } from "lucide-react";
import { BrowseBetsList } from "@/components/browse/BrowseBetsList";

async function getPublicBets(searchQuery?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("bets")
    .select(
      `
      id,
      title,
      description,
      stake_amount,
      deadline,
      status,
      created_at,
      creator:profiles!bets_creator_id_fkey(
        id,
        name,
        username
      ),
      participants:bet_participants(
        id,
        user_id,
        status
      )
    `
    )
    .eq("is_private", false)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (searchQuery && searchQuery.trim().length > 0) {
    query = query.ilike("title", `%${searchQuery.trim()}%`);
  }

  const { data: bets, error } = await query;

  if (error) {
    console.error("Error fetching public bets:", error);
    return [];
  }

  return bets || [];
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const searchQuery = params.search || "";
  const bets = await getPublicBets(searchQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Bets</h1>
        <p className="text-muted-foreground mt-1">
          Discover and join public bets
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Bets
          </CardTitle>
          <CardDescription>
            Search for bets by title
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/browse" method="get" className="flex gap-2">
            <Input
              type="text"
              name="search"
              placeholder="Search by title..."
              defaultValue={searchQuery}
              className="min-h-[44px]"
            />
            <Button type="submit" className="min-h-[44px]">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bets List */}
      <BrowseBetsList bets={bets} currentUserId={user.id} />
    </div>
  );
}

