"use client";

import { Bell, CheckCircle2, ChevronDown, CircleHelp, ExternalLink, FileText, LayoutDashboard, ListTodo, MoreHorizontal, Plus, RotateCcw, Send, Settings, Sparkles, UserPlus, Users, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { WorkspaceCopilotShell } from "@/components/copilot/WorkspaceCopilotShell";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { ActionItemsPanel } from "@/components/workspace/ActionItemsPanel";
import { OverviewPanel } from "@/components/workspace/OverviewPanel";
import { WorkspaceActionsProvider, useWorkspaceActions } from "@/contexts/workspace-actions";

type WorkspaceProfile = { name: string; workspace: string; email: string; meetUrl?: string };
type Dialog = "meeting" | "notes" | "settings" | "help" | "copilot" | "notifications" | "invite" | null;

function Avatar({ initials, className = "" }: { initials: string; className?: string }) { return <span className={`inline-flex items-center justify-center rounded-full font-semibold ${className}`}>{initials}</span>; }

function WorkspaceInner({ showToast }: { showToast: (message: string) => void }) {
  const { cards, createManualAction } = useWorkspaceActions();
  const pendingCount = cards.filter((card) => card.status === "pending").length;
  const [activeNav, setActiveNav] = useState("Meetings");
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [form, setForm] = useState({ name: "", workspace: "", email: "", meetUrl: "" });
  const [formError, setFormError] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newMeeting, setNewMeeting] = useState({ title: "", meetUrl: "" });
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  // localStorage is unavailable during the server render, so this state is
  // deliberately populated after mount rather than in a useState initialiser —
  // seeding it eagerly would desync the server and client markup. That makes
  // setState-in-effect the correct pattern here, not an oversight.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = window.localStorage.getItem("omnisync-workspace");
    if (saved) setProfile(JSON.parse(saved) as WorkspaceProfile);
    else setIsOnboarding(true);
    if (new URLSearchParams(window.location.search).get("google") === "connected") {
      window.localStorage.setItem("omnisync-google-connected", "true");
      setGoogleConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else setGoogleConnected(window.localStorage.getItem("omnisync-google-connected") === "true");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const registerWorkspace = () => {
    if (!form.name.trim() || !form.workspace.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) { setFormError("Enter your name, workspace, and a valid work email."); return; }
    setFormError(""); setOnboardingStep(2);
  };
  const finishOnboarding = () => {
    const nextProfile = { name: form.name.trim(), workspace: form.workspace.trim(), email: form.email.trim(), meetUrl: form.meetUrl.trim() || undefined };
    window.localStorage.setItem("omnisync-workspace", JSON.stringify(nextProfile));
    setProfile(nextProfile); setIsOnboarding(false);
  };
  const connectGoogle = () => {
    const nextProfile = { name: form.name.trim(), workspace: form.workspace.trim(), email: form.email.trim(), meetUrl: form.meetUrl.trim() || undefined };
    window.localStorage.setItem("omnisync-workspace", JSON.stringify(nextProfile));
    window.location.assign("/api/auth/google");
  };
  const startRegistration = () => {
    window.localStorage.removeItem("omnisync-workspace");
    window.localStorage.removeItem("omnisync-google-connected");
    setProfile(null); setGoogleConnected(false); setForm({ name: "", workspace: "", email: "", meetUrl: "" }); setOnboardingStep(1); setDialog(null); setIsOnboarding(true);
  };
  const createMeeting = () => {
    if (!newMeeting.title.trim()) { showToast("Give the meeting a title first."); return; }
    if (newMeeting.meetUrl.trim()) {
      const nextProfile = profile ? { ...profile, meetUrl: newMeeting.meetUrl.trim() } : null;
      if (nextProfile) { setProfile(nextProfile); window.localStorage.setItem("omnisync-workspace", JSON.stringify(nextProfile)); }
    }
    setNewMeeting({ title: "", meetUrl: "" }); setDialog(null); setActiveNav("Meetings"); showToast("Meeting created. Your team can now follow the action stream.");
  };
  const createCopilotAction = async () => {
    if (!copilotPrompt.trim()) { showToast("Tell Copilot what action to create."); return; }
    const ok = await createManualAction({
      title: copilotPrompt.trim(),
      assignee: profile?.name,
    });
    if (ok) {
      setCopilotPrompt("");
      setDialog(null);
      setActiveNav("Action items");
    }
  };
  const sendInvite = () => { if (!/^\S+@\S+\.\S+$/.test(inviteEmail)) { showToast("Enter a valid team email."); return; } setInviteEmail(""); setDialog(null); showToast(`Invitation prepared for ${inviteEmail}.`); };
  return <main className="min-h-screen bg-[#f7f7fb] text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-[236px] flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
      <div className="mb-9 flex items-center gap-2.5 px-2"><div className="grid size-8 place-items-center rounded-[10px] bg-[#6658e9] shadow-[0_5px_14px_rgba(102,88,233,.26)]"><Sparkles className="size-4 text-white" /></div><span className="text-xl font-bold tracking-[-0.04em]">omnisync</span></div>
      <button onClick={() => setDialog("meeting")} className="mb-7 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6658e9] text-sm font-semibold text-white shadow-[0_6px_14px_rgba(102,88,233,.22)] hover:bg-[#5849d7]"><Plus className="size-4" />New meeting</button>
      <nav className="space-y-1">{[{ name: "Overview", icon: LayoutDashboard }, { name: "Meetings", icon: Video }, { name: "Action items", icon: ListTodo }, { name: "Team", icon: Users }].map(({ name, icon: Icon }) => <button key={name} onClick={() => setActiveNav(name)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${activeNav === name ? "bg-violet-50 text-[#5c4ddd]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon className="size-[18px]" />{name}{name === "Action items" && pendingCount > 0 && <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">{pendingCount}</span>}</button>)}</nav>
      <div className="mt-auto space-y-1 border-t border-slate-100 pt-4"><button onClick={() => setDialog("settings")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"><Settings className="size-[18px]" />Settings</button><button onClick={() => setDialog("help")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"><CircleHelp className="size-[18px]" />Help & support</button><div className="mt-3 flex items-center gap-2 px-3 pt-3"><Avatar initials={(profile?.name || "JD").split(" ").map((part) => part[0]).join("").slice(0, 2)} className="size-8 bg-gradient-to-br from-fuchsia-400 to-violet-600 text-[10px] text-white" /><div className="min-w-0"><p className="truncate text-xs font-semibold">{profile?.name || "Jordan Davis"}</p><p className="truncate text-[11px] text-slate-400">Workspace owner</p></div><MoreHorizontal className="ml-auto size-4 text-slate-400" /></div></div>
    </aside>
    <div className="lg:pl-[236px]"><header className="flex h-[72px] items-center justify-between border-b border-slate-200/70 bg-white px-5 sm:px-8"><div className="flex items-center gap-4"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 text-[#6658e9] lg:hidden"><Sparkles className="size-4" /></div><div><p className="text-sm font-semibold">Good morning, Jordan <span aria-hidden="true">✦</span></p><p className="hidden text-xs text-slate-400 sm:block">Here&apos;s what&apos;s happening with your team.</p></div></div><div className="flex items-center gap-3"><button className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-violet-500 ring-2 ring-white" /></button><Avatar initials="JD" className="size-8 bg-gradient-to-br from-fuchsia-400 to-violet-600 text-[10px] text-white lg:hidden" /></div></header>
      <section className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs text-slate-400"><span>{profile?.workspace || "Your workspace"}</span><span>/</span><span className="text-slate-500">{activeNav}</span></div><h1 className="text-2xl font-bold tracking-[-0.035em] sm:text-[28px]">{activeNav === "Meetings" ? "Product sync" : activeNav}</h1></div><div className="flex items-center gap-2"><button onClick={() => setDialog("notes")} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"><FileText className="size-4" />Meeting notes</button><button onClick={() => { setOnboardingStep(1); setForm(profile ? { ...profile, meetUrl: profile.meetUrl || "" } : form); setIsOnboarding(true); }} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm"><MoreHorizontal className="size-4" /></button></div></div>
        {activeNav === "Meetings" ? <MeetingRoom meetUrl={profile?.meetUrl} googleConnected={googleConnected} showToast={showToast} onAskCopilot={() => setDialog("copilot")} /> : <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_5px_rgba(15,23,42,.025)] sm:p-8">{activeNav === "Overview" && <OverviewPanel workspaceName={profile?.workspace} googleConnected={googleConnected} onCreateMeeting={() => setDialog("meeting")} onReviewActions={() => setActiveNav("Action items")} />}{activeNav === "Action items" && <ActionItemsPanel onNewCopilotAction={() => setDialog("copilot")} onToast={showToast} />}{activeNav === "Team" && <div><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Your team</h2><p className="mt-1 text-sm text-slate-500">Keep the people in the room connected to follow-through.</p></div><button onClick={() => setDialog("invite")} className="rounded-lg bg-[#6658e9] px-3 py-2 text-xs font-bold text-white hover:bg-[#5849d7]"><UserPlus className="mr-1 inline size-3.5" />Invite teammate</button></div><div className="space-y-3">{[{ name: profile?.name || "Workspace owner", role: "Workspace owner", initials: (profile?.name || "WO").split(" ").map((part) => part[0]).join("").slice(0, 2), color: "bg-violet-500" }, { name: "Maya Chen", role: "Product", initials: "MC", color: "bg-sky-500" }, { name: "Owen Williams", role: "Engineering", initials: "OW", color: "bg-emerald-500" }].map((member) => <div key={member.name} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><Avatar initials={member.initials} className={`size-10 ${member.color} text-xs text-white`} /><div><p className="font-bold text-slate-800">{member.name}</p><p className="text-sm text-slate-500">{member.role}</p></div><span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="size-2 rounded-full bg-emerald-500" />Active</span></div>)}</div></div>}</div>}</section>
    </div>
    {isOnboarding && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="border-b border-slate-100 px-6 py-5"><div className="mb-3 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-[#6658e9]"><Sparkles className="size-4" /></span><span className="text-sm font-bold text-[#6658e9]">OMNISYNC SETUP</span></div><h2 id="onboarding-title" className="text-xl font-bold tracking-tight">{onboardingStep === 1 ? "Create your team workspace" : "Bring in your Google Meet"}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{onboardingStep === 1 ? "Start with the people who will turn meetings into action." : "Authorize Google to connect your Meet workspace."}</p></div><div className="px-6 py-5"><div className="mb-6 flex gap-2">{[1, 2].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${step <= onboardingStep ? "bg-[#6658e9]" : "bg-slate-100"}`} />)}</div>{onboardingStep === 1 ? <div className="space-y-4"><label className="block text-xs font-bold text-slate-600">Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jordan Davis" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label><label className="block text-xs font-bold text-slate-600">Workspace name<input value={form.workspace} onChange={(e) => setForm({ ...form, workspace: e.target.value })} placeholder="Acme product team" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label><label className="block text-xs font-bold text-slate-600">Work email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>{formError && <p className="text-xs font-medium text-rose-600">{formError}</p>}<button onClick={registerWorkspace} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#6658e9] text-sm font-bold text-white hover:bg-[#5849d7]">Continue <ChevronDown className="size-4 -rotate-90" /></button></div> : <div className="space-y-4"><div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs leading-5 text-violet-800"><strong>What you&apos;ll approve:</strong> OmniSync will read Google Meet space metadata. Your secret stays on the server and is never sent to the browser.</div>{googleConnected && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-4" />Google account authorized</div>}<label className="block text-xs font-bold text-slate-600">Google Meet link <span className="font-normal text-slate-400">(optional)</span><input type="url" value={form.meetUrl} onChange={(e) => setForm({ ...form, meetUrl: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label><button onClick={connectGoogle} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#6658e9] text-sm font-bold text-white hover:bg-[#5849d7]"><Sparkles className="size-4" />{googleConnected ? "Reconnect Google account" : "Connect Google account"}</button><button onClick={finishOnboarding} className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800">{googleConnected ? "Save & enter workspace" : "Skip for now"}</button><button onClick={() => setOnboardingStep(1)} className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800">Back</button></div>}</div></section></div>}
    {dialog && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{dialog === "meeting" ? "Create a meeting" : dialog === "notes" ? "Meeting notes" : dialog === "settings" ? "Workspace settings" : dialog === "help" ? "Help & support" : dialog === "copilot" ? "Ask Copilot" : dialog === "invite" ? "Invite a teammate" : "Notifications"}</h2><p className="mt-1 text-sm text-slate-500">{dialog === "meeting" ? "Add a Meet link and let OmniSync track its outcomes." : dialog === "copilot" ? "Create a reviewable action for your team." : ""}</p></div><button onClick={() => setDialog(null)} aria-label="Close dialog" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-5" /></button></div>{dialog === "meeting" && <div className="space-y-4"><label className="block text-xs font-bold text-slate-600">Meeting title<input value={newMeeting.title} onChange={(event) => setNewMeeting({ ...newMeeting, title: event.target.value })} placeholder="Weekly product sync" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400" /></label><label className="block text-xs font-bold text-slate-600">Google Meet link <span className="font-normal text-slate-400">(optional)</span><input value={newMeeting.meetUrl} onChange={(event) => setNewMeeting({ ...newMeeting, meetUrl: event.target.value })} placeholder="https://meet.google.com/abc-defg-hij" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400" /></label><button onClick={createMeeting} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#6658e9] text-sm font-bold text-white hover:bg-[#5849d7]"><Video className="size-4" />Create meeting</button></div>}{dialog === "notes" && <div className="space-y-4 text-sm leading-6 text-slate-600"><p><strong className="text-slate-800">Decision:</strong> Validate the analytics taxonomy before engineering handoff.</p><p><strong className="text-slate-800">Next:</strong> Approve the action items to queue follow-through.</p>{profile?.meetUrl && <a href={profile.meetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-[#6658e9] hover:text-violet-800"><ExternalLink className="size-4" />Open connected Google Meet</a>}</div>}{dialog === "settings" && <div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-bold text-slate-800">{profile?.workspace || "No workspace yet"}</p><p className="mt-1 text-slate-500">Google connection: {googleConnected ? "authorized" : "not connected"}</p></div><button onClick={startRegistration} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 hover:bg-rose-100"><RotateCcw className="size-4" />Start registration over</button></div>}{dialog === "help" && <div className="space-y-3 text-sm text-slate-600"><p><strong className="text-slate-800">1.</strong> Register a workspace.</p><p><strong className="text-slate-800">2.</strong> Connect the workspace Google account.</p><p><strong className="text-slate-800">3.</strong> Create a meeting, approve actions, and use the Team view to invite collaborators.</p></div>}{dialog === "copilot" && <div className="space-y-4"><label className="block text-xs font-bold text-slate-600">What should the team follow through on?<textarea value={copilotPrompt} onChange={(event) => setCopilotPrompt(event.target.value)} placeholder="e.g. Ask Maya to share the revised onboarding flow by Friday" className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-violet-400" /></label><button onClick={createCopilotAction} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#6658e9] text-sm font-bold text-white hover:bg-[#5849d7]"><Sparkles className="size-4" />Create action</button></div>}{dialog === "invite" && <div className="space-y-4"><label className="block text-xs font-bold text-slate-600">Teammate email<input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400" /></label><button onClick={sendInvite} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#6658e9] text-sm font-bold text-white hover:bg-[#5849d7]"><Send className="size-4" />Send invitation</button></div>}{dialog === "notifications" && <div className="space-y-3"><div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-800">Your Google Meet connection is {googleConnected ? "ready for this workspace." : "waiting for authorization."}</div><button onClick={() => { setDialog(null); setActiveNav("Action items"); }} className="text-sm font-bold text-[#6658e9] hover:text-violet-800">Review pending action items</button></div>}</section></div>}
  </main>;
}

export default function Home() {
  const [toast, setToast] = useState("");
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

  return (
    <WorkspaceActionsProvider onToast={showToast}>
      <WorkspaceCopilotShell>
        <WorkspaceInner showToast={showToast} />
      </WorkspaceCopilotShell>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </WorkspaceActionsProvider>
  );
}
