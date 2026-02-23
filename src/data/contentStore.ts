import type { ContentItem } from '../types';

// Empty - add real content items via the Content Pipeline UI
export const contentItems: ContentItem[] = [];

// Helper functions for content management
export function getContentByStage(items: ContentItem[], stage: string) {
  return items.filter(item => item.stage === stage);
}
