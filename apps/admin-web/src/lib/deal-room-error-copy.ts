import { ApiError } from "@/lib/api";

type DealRoomErrorCopy = {
  title: string;
  description?: string;
};

export function dealRoomErrorCopy(error: unknown): DealRoomErrorCopy {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return {
        title: "Deal room not found",
        description: "This deal room was not found or has been removed.",
      };
    }

    if (error.status === 403) {
      return {
        title: "You do not have access to this deal room",
        description: "Ask an admin to add you as a participant or verify your organization access.",
      };
    }

    if (error.status === 0) {
      return {
        title: "Could not load deal room. Try again.",
        description: "The API request could not be reached from this browser session.",
      };
    }
  }

  return {
    title: "Could not load deal room. Try again.",
    description: error instanceof Error ? error.message : undefined,
  };
}
