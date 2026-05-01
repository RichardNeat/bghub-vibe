import Link from "next/link";

type Step = {
  number: number;
  emoji: string;
  title: string;
  body: string;
  tip?: string;
};

type Section = {
  heading: string;
  color: string;
  steps: Step[];
};

const sections: Section[] = [
  {
    heading: "Getting started",
    color: "var(--accent)",
    steps: [
      {
        number: 1,
        emoji: "🔑",
        title: "Sign in with Google",
        body: "Hit the Sign in button on the home page and choose your Google account. No password needed — BGHub uses Google for authentication.",
      },
      {
        number: 2,
        emoji: "🏛️",
        title: "Join a club",
        body: "Head to the Clubs page. If your group already has a club, search for it by name and join. If not, create one — just type a name and hit Create.",
        tip: "You can be in multiple clubs. Each club has its own events list.",
      },
      {
        number: 3,
        emoji: "👤",
        title: "Set your BGG username (optional)",
        body: "On the Account page you can link your BoardGameGeek username. This lets other attendees tap your name on the attendee list to browse your BGG collection — handy when deciding what to play.",
      },
    ],
  },
  {
    heading: "Events",
    color: "var(--purple)",
    steps: [
      {
        number: 4,
        emoji: "📅",
        title: "Browse events",
        body: "The Events page shows upcoming events for all your clubs, split into Happening Now, Upcoming, and Past sections. Tap any event to open it.",
      },
      {
        number: 5,
        emoji: "✅",
        title: "RSVP to attend",
        body: "On an event page, tap RSVP — I'll be there to register your attendance. This unlocks the games features — you can now add games, vote, and log plays. To cancel, tap the green attendance button and confirm.",
        tip: "Your attendance and any games you added are removed if you cancel.",
      },
      {
        number: 6,
        emoji: "🗓️",
        title: "Create an event",
        body: "On the Events page, expand the Create new event form. Fill in the name, start date & time, and optionally an end date for multi-day events, a location, and a description. Only club members can see and join events.",
      },
    ],
  },
  {
    heading: "Games",
    color: "#ca8a04",
    steps: [
      {
        number: 7,
        emoji: "🎲",
        title: "Add games you're bringing",
        body: "Once you've RSVP'd, use the Add a game field in the Games section. Start typing and BGG suggestions will appear — select one or type a name manually. Each game is added to the shared list for that event.",
      },
      {
        number: 8,
        emoji: "▲",
        title: "Vote for games",
        body: "Tap the ▲ button on any game to say you're interested in playing it. The vote count is visible to everyone so the group can see which games have the most interest.",
      },
      {
        number: 9,
        emoji: "★",
        title: "Star games you really want to play",
        body: "Tap the ★ button to say you really want to play a game. Starring automatically votes too. Use this to signal strong preference, not just mild interest.",
        tip: "Unvoting a game also removes your star. Unstarring does not remove your vote.",
      },
      {
        number: 10,
        emoji: "🔍",
        title: "Find a game everyone can play",
        body: "The Find a Game button (visible when there are attendees and games listed) opens a tool that matches games to players based on who wants to play what. Tick the people who are available right now and it will show the best matches.",
      },
    ],
  },
  {
    heading: "Logging plays",
    color: "var(--success)",
    steps: [
      {
        number: 11,
        emoji: "📝",
        title: "Log a play",
        body: "After playing a game, tap + log a play next to it. Tick who played, optionally pick the winner (or multiple winners for a tie), add a co-op result with The Game option, and add any notes. Tap Save play.",
        tip: "You can log plays during the event, not just after it's over.",
      },
      {
        number: 12,
        emoji: "✏️",
        title: "Edit or delete a play",
        body: "Tap + log a play (or the ✓ N× badge) to open the play log for a game. Each previous play has an Edit button to correct it, and admins/creators can delete plays.",
      },
      {
        number: 13,
        emoji: "📊",
        title: "View live standings",
        body: "Once any play is logged, a Standings link appears at the top of the event page. It shows a live leaderboard, trophies (Champion, Game Addict, Undefeated, and more), and a full game log. Available during and after the event.",
        tip: "Trophies earned across all events accumulate on your Account page. You can also see each attendee's all-time trophy tally inline on the event's attendees list.",
      },
    ],
  },
  {
    heading: "Managing events",
    color: "var(--text-secondary)",
    steps: [
      {
        number: 14,
        emoji: "✏️",
        title: "Edit an event",
        body: "Event creators can edit the name, dates, location, and description using the Edit button on the event page. Editing is available until the event is over.",
      },
      {
        number: 15,
        emoji: "🗑️",
        title: "Delete an event",
        body: "The Delete button is visible to the event creator and site admins. Deleting an event removes all attendances, games, votes, and plays associated with it.",
      },
      {
        number: 16,
        emoji: "📤",
        title: "Share & add to calendar",
        body: "Use the Share button on any event to copy a direct link. The Add to calendar button opens Google Calendar pre-filled with the event name, dates, location, and description.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          How to use BGHub
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          A step-by-step guide to organising your game nights.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.heading}
            href={`#${s.heading.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-75"
            style={{ backgroundColor: "var(--border-light)", color: "var(--text-secondary)" }}
          >
            {s.heading}
          </a>
        ))}
      </div>

      {sections.map((section) => (
        <section
          key={section.heading}
          id={section.heading.toLowerCase().replace(/\s+/g, "-")}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              {section.heading}
            </h2>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-light)" }} />
          </div>

          <div className="space-y-3">
            {section.steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl px-5 py-4 flex gap-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
              >
                {/* Number + emoji */}
                <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: section.color }}
                  >
                    {step.number}
                  </span>
                  <span className="text-xl leading-none">{step.emoji}</span>
                </div>

                {/* Content */}
                <div className="space-y-1.5 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {step.body}
                  </p>
                  {step.tip && (
                    <p
                      className="text-xs px-3 py-2 rounded-lg"
                      style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}
                    >
                      💡 {step.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div
        className="rounded-xl px-5 py-4 text-sm"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
      >
        Something not covered here?{" "}
        <Link href="/events" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
          Head back to events
        </Link>{" "}
        and explore — or ask your club organiser.
      </div>
    </div>
  );
}
