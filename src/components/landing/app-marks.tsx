import Image from "next/image";

export type AppMark = {
  name: string;
  file: string;
};

/** Where OmniSync listens. */
export const MEETING_APPS: AppMark[] = [
  { name: "Zoom", file: "zoom.svg" },
  { name: "Google Meet", file: "google-meet.svg" },
  { name: "Microsoft Teams", file: "ms-teams.svg" },
];

/** Where the approved work lands. */
export const DESTINATION_APPS: AppMark[] = [
  { name: "Slack", file: "slack.svg" },
  { name: "Jira", file: "jira.svg" },
  { name: "GitHub", file: "github.svg" },
  { name: "Gmail", file: "gmail.svg" },
];

/**
 * The marks are real product logos of differing aspect ratio, so each sits in a
 * fixed square box with object-contain rather than being sized directly — that
 * keeps the row on one optical rhythm. alt is empty because the product name is
 * rendered next to it; announcing both would repeat.
 */
export function AppMarkRow({
  apps,
  label,
}: {
  apps: AppMark[];
  label: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <ul className="mt-5 flex flex-wrap items-center gap-x-9 gap-y-5">
        {apps.map((app) => (
          <li key={app.name} className="flex items-center gap-2.5">
            <span className="relative size-7 shrink-0">
              <Image
                src={`/logos/${app.file}`}
                alt=""
                fill
                sizes="28px"
                unoptimized
                className="object-contain"
              />
            </span>
            <span className="text-[15px] font-medium text-zinc-700">
              {app.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
