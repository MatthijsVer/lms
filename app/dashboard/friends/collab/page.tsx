import { getUserCollabOverview } from "@/app/data/collaboration/get-user-collab-overview";
import { CollabClient } from "../_components/collab-client";

export default async function FriendsCollaborationPage() {
  const overview = await getUserCollabOverview();

  return <CollabClient overview={overview} />;
}
