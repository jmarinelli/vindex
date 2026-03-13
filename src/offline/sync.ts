"use client";

import { dequeueSyncItems, removeSyncItem } from "./dexie";
import { updateFindingAction } from "@/lib/actions/inspection";

/**
 * Process the sync queue: send pending changes to the server.
 * Called when the app comes back online.
 */
export async function processQueue(): Promise<void> {
  const items = await dequeueSyncItems();

  for (const item of items) {
    try {
      if (item.type === "finding") {
        const result = await updateFindingAction(item.payload);
        if (result.success && item.id !== undefined) {
          await removeSyncItem(item.id);
        } else if (item.retries >= 3 && item.id !== undefined) {
          // Discard after 3 retries
          await removeSyncItem(item.id);
        }
      }
      // Photo sync handled separately by photo-queue
    } catch {
      // Will retry next time
    }
  }
}
