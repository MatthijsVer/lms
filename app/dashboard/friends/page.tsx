import { getFriendsData } from "@/app/data/friends/get-friends-data";
import { FriendsClient } from "./_components/friends-client";

export default async function FriendsPage() {
  const friendsData = await getFriendsData();

  return <FriendsClient friendsData={friendsData} />;
}
