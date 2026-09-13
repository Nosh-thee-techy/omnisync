"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cardFromAction, initialsFor } from "@/lib/action-intent";
import type { ApiFailure, ApiSuccess, ActionItem } from "@/lib/api/types";
import type { CopilotCard } from "@/types/copilot-card";
import type { IntentPayload } from "@/types/pipeline";

export type { CopilotCard, CopilotCardStatus } from "@/types/copilot-card";

type DashboardData = {
  counts: { meetings: number; openActions: number; completedActions: number };
  upcomingMeetings: Array<{ id: string; title: string; status: string }>;
  openActions: ActionItem[];
};

type WorkspaceActionsContextValue = {
  meetingId?: string;
  cards: CopilotCard[];
  meetingCards: CopilotCard[];
  dashboard: DashboardData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  handleIntent: (intent: IntentPayload) => Promise<void>;
  createManualAction: (input: {
    title: string;
    assignee?: string;
    description?: string;
  }) => Promise<boolean>;
  approve: (card: CopilotCard) => Promise<void>;
  dismiss: (cardId: string) => Promise<void>;
  initialsFor: (name?: string) => string;
};

const WorkspaceActionsContext =
  createContext<WorkspaceActionsContextValue | null>(null);

export function WorkspaceActionsProvider({
  children,
  onToast,
}: {
  children: ReactNode;
  onToast?: (message: string) => void;
}) {
  const [cards, setCards] = useState<CopilotCard[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [meetingId, setMeetingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const ensureMeeting = useCallback(async () => {
    const response = await fetch("/api/meetings");
    const payload = (await response.json()) as
      | ApiSuccess<Array<{ id: string; status: string }>>
      | ApiFailure;

    if (!response.ok || !("data" in payload)) return undefined;

    const live =
      payload.data.find((meeting) => meeting.status === "live") ??
      payload.data[0];

    if (live) return live.id;

    const createResponse = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Live meeting",
        startsAt: new Date().toISOString(),
        status: "live",
      }),
    });

    const created = (await createResponse.json()) as
      | ApiSuccess<{ id: string }>
      | ApiFailure;

    if (createResponse.ok && "data" in created) {
      return created.data.id;
    }

    return undefined;
  }, []);

  const refresh = useCallback(async (options?: { initial?: boolean }) => {
    if (!options?.initial) {
      setLoading(true);
    }
    try {
      const [actionsResponse, dashboardResponse, activeMeetingId] =
        await Promise.all([
          fetch("/api/actions"),
          fetch("/api/dashboard"),
          meetingId ? Promise.resolve(meetingId) : ensureMeeting(),
        ]);

      if (!meetingId && activeMeetingId) {
        setMeetingId(activeMeetingId);
      }

      const actionsPayload = (await actionsResponse.json()) as
        | ApiSuccess<ActionItem[]>
        | ApiFailure;
      const dashboardPayload = (await dashboardResponse.json()) as
        | ApiSuccess<DashboardData>
        | ApiFailure;

      if (actionsResponse.ok && "data" in actionsPayload) {
        setCards(actionsPayload.data.map(cardFromAction));
      }

      if (dashboardResponse.ok && "data" in dashboardPayload) {
        setDashboard(dashboardPayload.data);
      }
    } finally {
      setLoading(false);
    }
  }, [ensureMeeting, meetingId]);

  useEffect(() => {
    void refresh({ initial: true });
  }, [refresh]);

  const handleIntent = useCallback(
    async (intent: IntentPayload) => {
      if (intent.intent === "NONE") return;

      const title = intent.task ?? intent.query;
      if (!title) return;

      const activeMeetingId = meetingId ?? (await ensureMeeting());
      if (activeMeetingId && !meetingId) setMeetingId(activeMeetingId);

      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: activeMeetingId,
          title,
          description:
            intent.intent === "RESEARCH_QUERY" && intent.query
              ? `Research query: ${intent.query}`
              : intent.task,
          owner: intent.assignee,
          status: "open",
        }),
      });

      const payload = (await response.json()) as
        | ApiSuccess<ActionItem>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        onToast?.(
          "error" in payload
            ? payload.error.message
            : "Could not save the detected action.",
        );
        return;
      }

      const card: CopilotCard = {
        ...cardFromAction(payload.data),
        priority: intent.priority,
        query: intent.query,
        status: "pending",
      };

      setCards((current) => [card, ...current.filter((c) => c.id !== card.id)]);
      onToast?.("Copilot detected a new action from the conversation.");
      void refresh();
    },
    [ensureMeeting, meetingId, onToast, refresh],
  );

  const createManualAction = useCallback(
    async (input: {
      title: string;
      assignee?: string;
      description?: string;
    }) => {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          title: input.title,
          description:
            input.description ??
            "Created from your Copilot request. Review and approve for dispatch.",
          owner: input.assignee,
          status: "open",
        }),
      });

      const payload = (await response.json()) as
        | ApiSuccess<ActionItem>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        onToast?.(
          "error" in payload
            ? payload.error.message
            : "Could not create that action.",
        );
        return false;
      }

      const card = cardFromAction(payload.data);
      setCards((current) => [card, ...current.filter((c) => c.id !== card.id)]);
      onToast?.("Action created.");
      void refresh();
      return true;
    },
    [meetingId, onToast, refresh],
  );

  const dismiss = useCallback(
    async (cardId: string) => {
      const response = await fetch(`/api/actions/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });

      if (!response.ok) {
        onToast?.("Could not dismiss that action.");
        return;
      }

      setCards((current) =>
        current.map((card) =>
          card.id === cardId ? { ...card, status: "dismissed" } : card,
        ),
      );
      void refresh();
    },
    [onToast, refresh],
  );

  const approve = useCallback(
    async (card: CopilotCard) => {
      setCards((current) =>
        current.map((item) =>
          item.id === card.id ? { ...item, status: "dispatching" } : item,
        ),
      );

      const response = await fetch("/api/trigger-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: card.id,
          taskType: card.intent,
          task: card.title,
          assignee: card.assignee,
          priority: card.priority ?? "MEDIUM",
          query: card.query ?? card.title,
        }),
      });

      const payload = (await response.json()) as
        | ApiSuccess<{
            jobId: string;
            runId: string;
            status: string;
            output?: { results?: CopilotCard["researchResults"] };
          }>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        setCards((current) =>
          current.map((item) =>
            item.id === card.id ? { ...item, status: "pending" } : item,
          ),
        );
        onToast?.(
          "error" in payload
            ? payload.error.message
            : "Dispatch failed. Try again.",
        );
        return;
      }

      const isQueued = payload.data.status === "processing";

      setCards((current) =>
        current.map((item) =>
          item.id === card.id
            ? {
                ...item,
                status: isQueued ? "approved" : "approved",
                runId: payload.data.runId,
                researchResults: payload.data.output?.results,
              }
            : item,
        ),
      );
      onToast?.(
        isQueued
          ? "Action queued on Trigger.dev."
          : "Action approved and dispatched.",
      );
      void refresh();
    },
    [onToast, refresh],
  );

  const visibleCards = useMemo(
    () => cards.filter((card) => card.status !== "dismissed"),
    [cards],
  );

  const meetingCards = useMemo(
    () =>
      meetingId
        ? visibleCards.filter((card) => card.meetingId === meetingId)
        : visibleCards,
    [meetingId, visibleCards],
  );

  const value = useMemo(
    () => ({
      meetingId,
      cards: visibleCards,
      meetingCards,
      dashboard,
      loading,
      refresh,
      handleIntent,
      createManualAction,
      approve,
      dismiss,
      initialsFor,
    }),
    [
      meetingId,
      visibleCards,
      meetingCards,
      dashboard,
      loading,
      refresh,
      handleIntent,
      createManualAction,
      approve,
      dismiss,
    ],
  );

  return (
    <WorkspaceActionsContext.Provider value={value}>
      {children}
    </WorkspaceActionsContext.Provider>
  );
}

export function useWorkspaceActions() {
  const context = useContext(WorkspaceActionsContext);
  if (!context) {
    throw new Error(
      "useWorkspaceActions must be used within WorkspaceActionsProvider",
    );
  }
  return context;
}
