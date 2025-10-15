"use server";

import { requireUser } from "../user/require-user";
import { FriendService } from "./friend-service";
import { revalidatePath } from "next/cache";

export async function sendFriendRequest(friendEmail: string) {
  try {
    const session = await requireUser();
    
    const result = await FriendService.sendFriendRequest(session.id, friendEmail);
    
    if (result.success) {
      revalidatePath("/dashboard/friends");
    }
    
    return result;
  } catch (error) {
    console.error("Error in sendFriendRequest action:", error);
    return {
      success: false,
      message: "An error occurred while sending the friend request",
    };
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  try {
    const session = await requireUser();
    
    console.log("Accept friend request - User ID:", session.id, "Friendship ID:", friendshipId);
    
    const result = await FriendService.acceptFriendRequest(session.id, friendshipId);
    
    console.log("Accept result:", result);
    
    if (result.success) {
      revalidatePath("/dashboard/friends");
    }
    
    return result;
  } catch (error) {
    console.error("Error in acceptFriendRequest action:", error);
    return {
      success: false,
      message: "An error occurred while accepting the friend request",
    };
  }
}

export async function declineFriendRequest(friendshipId: string) {
  try {
    const session = await requireUser();
    
    const result = await FriendService.declineFriendRequest(session.id, friendshipId);
    
    if (result.success) {
      revalidatePath("/dashboard/friends");
    }
    
    return result;
  } catch (error) {
    console.error("Error in declineFriendRequest action:", error);
    return {
      success: false,
      message: "An error occurred while declining the friend request",
    };
  }
}

export async function removeFriend(friendshipId: string) {
  try {
    const session = await requireUser();
    
    const result = await FriendService.removeFriend(session.id, friendshipId);
    
    if (result.success) {
      revalidatePath("/dashboard/friends");
    }
    
    return result;
  } catch (error) {
    console.error("Error in removeFriend action:", error);
    return {
      success: false,
      message: "An error occurred while removing the friend",
    };
  }
}

export async function searchUsers(query: string) {
  try {
    const session = await requireUser();
    
    return FriendService.searchUsers(query, session.id);
  } catch (error) {
    console.error("Error in searchUsers action:", error);
    return [];
  }
}