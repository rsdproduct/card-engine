export type RoadmapTiming = "must_have_mvp" | "future_vision";

export interface FeedbackSubmission {
  id: string;
  timestamp: string;
  author: string;
  feedback: string;
  cardIdea?: string;
  timing: RoadmapTiming;
}

export const DEFAULT_FEEDBACK_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzYxI-SqMehTMzC4n6x-Tu8d-F0e-YaCMpkBjcSpkV7vRsLTBXwIYsGn1K1UjBHnQiE/exec";

export const FEEDBACK_SHEET_VIEW_URL =
  "https://docs.google.com/spreadsheets/d/1T9k2LmH3zxeS86Pylox28I8h-eBsyuI-Mx3wGPTKFvs/edit";

export const FEEDBACK_STORAGE_KEY = "bold_card_engine_feedback_log";
