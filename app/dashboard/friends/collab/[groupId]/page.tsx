import { notFound } from "next/navigation";

import { getCollabGroupDetail } from "@/app/data/collaboration/get-collab-group-detail";
import { CollabGroupClient } from "../../_components/collab-group-client";

interface CollabGroupPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default async function CollabGroupPage({ params }: CollabGroupPageProps) {
  const { groupId } = await params;
  const group = await getCollabGroupDetail(groupId);

  if (!group) {
    return notFound();
  }

  return <CollabGroupClient group={group} />;
}
