import { createClient } from "@/lib/supabase/server";
import { getNewAchievementsCount } from "@/lib/actions/achievements";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getNewAchievementsCount(user.id);
  return NextResponse.json({ count });
}


