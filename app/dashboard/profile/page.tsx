import { getUserGamificationProfile } from "@/app/data/gamification/get-user-gamification-profile";
import { GamificationProfileClient } from "../_components/gamification-profile-client";

export default async function GamificationProfilePage() {
  const profile = await getUserGamificationProfile();

  return <GamificationProfileClient profile={profile} />;
}
