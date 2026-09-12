export type ActionStatus = "open" | "in_progress" | "done" | "dismissed";
export type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type Session = {
  token: string;
  user: User;
  expiresAt: string;
};

export type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  status: MeetingStatus;
  attendees: string[];
  agenda?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ActionItem = {
  id: string;
  meetingId?: string;
  title: string;
  description?: string;
  owner?: string;
  dueAt?: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApiSuccess<T> = { data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
  error: { code: string; message: string; details?: Record<string, string> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
