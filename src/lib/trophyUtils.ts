export type TrophyKey =
  | "champion" | "gameAddict" | "unlucky" | "undefeated"
  | "sharpshooter" | "teamPlayer" | "socialButterfly" | "dominator"
  | "onFire" | "comebackKid" | "fastStarter" | "collector" | "specialist";

export const TROPHY_META: Record<TrophyKey, { emoji: string; label: string; description: string; criteria: string }> = {
  champion:        { emoji: "🏆", label: "Champion",         description: "The night's top performer — won more games than anyone else at the event.",                          criteria: "Most wins at a single event" },
  gameAddict:      { emoji: "🎲", label: "Game Addict",      description: "Can't stop, won't stop. Played in more games than anyone else.",                                    criteria: "Most games played at a single event" },
  unlucky:         { emoji: "😢", label: "Unlucky",          description: "Played hard but couldn't get a win. Better luck next time!",                                        criteria: "Most games played with zero wins at a single event" },
  undefeated:      { emoji: "🛡️", label: "Undefeated",      description: "Won every single game played at the event — a perfect, unblemished record.",                        criteria: "Won all games played at a single event (minimum 2)" },
  sharpshooter:    { emoji: "🎯", label: "Sharpshooter",     description: "Quality over quantity. The most efficient winner of the night.",                                    criteria: "Best win percentage at a single event (minimum 3 games played)" },
  teamPlayer:      { emoji: "🤝", label: "Team Player",      description: "Victory is sweeter when shared. Most co-op and tied wins of the night.",                           criteria: "Most co-op or tied wins at a single event" },
  socialButterfly: { emoji: "👥", label: "Social Butterfly", description: "The life of the party — played alongside more unique opponents than anyone else.",                  criteria: "Played with the most distinct opponents at a single event" },
  dominator:       { emoji: "💪", label: "Dominator",        description: "Absolutely owned the night — won more than half of all games played at the event.",                criteria: "Won more than 50% of all games played at the event" },
  onFire:          { emoji: "🔥", label: "On Fire",          description: "On an unstoppable hot streak — won 3 or more games back to back.",                                 criteria: "Longest consecutive win streak at a single event (minimum 3 in a row)" },
  comebackKid:     { emoji: "🔄", label: "Comeback Kid",     description: "Started rough but finished strong — lost the first game and came back to win the last.",           criteria: "Lost their first game but won their last game at an event (minimum 2 games)" },
  fastStarter:     { emoji: "⚡", label: "Fast Starter",     description: "First out of the gate — won the very first game logged at the event.",                             criteria: "Won the first game logged at an event" },
  collector:       { emoji: "🎮", label: "Collector",        description: "A true connoisseur — played more different game titles than anyone else at the event.",             criteria: "Played the most distinct game titles at a single event (minimum 2 titles)" },
  specialist:      { emoji: "🏅", label: "Specialist",       description: "The undisputed master of their favourite game — most repeated wins in a single title.",            criteria: "Most wins of the same game title at a single event (minimum 2 wins in one title)" },
};

export type TrophyCounts = Record<TrophyKey, number>;

export function emptyTrophyCounts(): TrophyCounts {
  return {
    champion: 0, gameAddict: 0, unlucky: 0, undefeated: 0,
    sharpshooter: 0, teamPlayer: 0, socialButterfly: 0, dominator: 0,
    onFire: 0, comebackKid: 0, fastStarter: 0, collector: 0, specialist: 0,
  };
}

export type PlayForTrophy = {
  eventId: string;
  winner: string | null;
  players: { name: string }[];
  createdAt: Date;
  gameName: string;
};

function getWinners(play: PlayForTrophy): string[] {
  if (!play.winner) return [];
  if (play.winner === "The Game") return play.players.map((p) => p.name);
  return play.winner.split(" & ").filter((w) => w !== "The Game");
}

function computeEventTrophies(plays: PlayForTrophy[]): Map<string, TrophyKey[]> {
  const result = new Map<string, TrophyKey[]>();
  if (plays.length === 0) return result;

  function add(name: string, key: TrophyKey) {
    const t = result.get(name) ?? [];
    t.push(key);
    result.set(name, t);
  }

  const sortedPlays = [...plays].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Accumulators
  const stats = new Map<string, { played: number; won: number }>();
  const teamWins = new Map<string, number>();
  const opponents = new Map<string, Set<string>>();
  const gameTitles = new Map<string, Set<string>>();
  const titleWins = new Map<string, Map<string, number>>();
  const currentStreak = new Map<string, number>();
  const bestStreak = new Map<string, number>();
  const firstResult = new Map<string, boolean>();
  const lastResult = new Map<string, boolean>();

  for (const play of sortedPlays) {
    const winners = new Set(getWinners(play));
    const isTeamWin =
      play.winner !== null &&
      (play.winner === "The Game" || play.winner.includes(" & "));

    for (const { name } of play.players) {
      // Basic stats
      const s = stats.get(name) ?? { played: 0, won: 0 };
      s.played++;
      if (winners.has(name)) s.won++;
      stats.set(name, s);

      // Team Player
      if (isTeamWin && winners.has(name)) {
        teamWins.set(name, (teamWins.get(name) ?? 0) + 1);
      }

      // Social Butterfly: unique opponents
      if (!opponents.has(name)) opponents.set(name, new Set());
      for (const { name: other } of play.players) {
        if (other !== name) opponents.get(name)!.add(other);
      }

      // Collector: distinct game titles played
      if (!gameTitles.has(name)) gameTitles.set(name, new Set());
      gameTitles.get(name)!.add(play.gameName);

      // Specialist: wins per title
      if (winners.has(name)) {
        if (!titleWins.has(name)) titleWins.set(name, new Map());
        const tw = titleWins.get(name)!;
        tw.set(play.gameName, (tw.get(play.gameName) ?? 0) + 1);
      }

      // On Fire: consecutive wins
      if (winners.has(name)) {
        const streak = (currentStreak.get(name) ?? 0) + 1;
        currentStreak.set(name, streak);
        bestStreak.set(name, Math.max(bestStreak.get(name) ?? 0, streak));
      } else {
        currentStreak.set(name, 0);
      }

      // Comeback Kid: first and last result
      const won = winners.has(name);
      if (!firstResult.has(name)) firstResult.set(name, won);
      lastResult.set(name, won);
    }
  }

  const players = [...stats.entries()].map(([name, s]) => ({ name, ...s }));
  if (players.length === 0) return result;

  // Champion
  const maxWins = Math.max(...players.map((p) => p.won));
  if (maxWins > 0) players.filter((p) => p.won === maxWins).forEach((p) => add(p.name, "champion"));

  // Game Addict
  const maxPlayed = Math.max(...players.map((p) => p.played));
  players.filter((p) => p.played === maxPlayed).forEach((p) => add(p.name, "gameAddict"));

  // Unlucky
  const zeroWins = players.filter((p) => p.played > 0 && p.won === 0);
  if (zeroWins.length > 0) {
    const maxPlayedNoWin = Math.max(...zeroWins.map((p) => p.played));
    zeroWins.filter((p) => p.played === maxPlayedNoWin).forEach((p) => add(p.name, "unlucky"));
  }

  // Undefeated
  players.filter((p) => p.played >= 2 && p.won === p.played).forEach((p) => add(p.name, "undefeated"));

  // Sharpshooter: best win rate, min 3 games
  const eligible = players.filter((p) => p.played >= 3 && p.won > 0);
  if (eligible.length > 0) {
    const maxRate = Math.max(...eligible.map((p) => p.won / p.played));
    eligible.filter((p) => p.won / p.played === maxRate).forEach((p) => add(p.name, "sharpshooter"));
  }

  // Team Player
  if (teamWins.size > 0) {
    const maxTeam = Math.max(...teamWins.values());
    if (maxTeam > 0) {
      for (const [name, count] of teamWins) {
        if (count === maxTeam) add(name, "teamPlayer");
      }
    }
  }

  // Social Butterfly
  if (opponents.size > 0) {
    const maxOpp = Math.max(...[...opponents.values()].map((s) => s.size));
    if (maxOpp > 1) {
      for (const [name, opp] of opponents) {
        if (opp.size === maxOpp) add(name, "socialButterfly");
      }
    }
  }

  // Dominator: won > half of all plays
  const total = plays.length;
  if (total >= 2) {
    players.filter((p) => p.won > total / 2).forEach((p) => add(p.name, "dominator"));
  }

  // On Fire: longest streak >= 3
  if (bestStreak.size > 0) {
    const maxStreak = Math.max(...bestStreak.values());
    if (maxStreak >= 3) {
      for (const [name, streak] of bestStreak) {
        if (streak === maxStreak) add(name, "onFire");
      }
    }
  }

  // Comeback Kid: lost first game, won last game (min 2 played)
  players
    .filter((p) => p.played >= 2 && firstResult.get(p.name) === false && lastResult.get(p.name) === true)
    .forEach((p) => add(p.name, "comebackKid"));

  // Fast Starter: won the first game
  if (sortedPlays.length > 0) {
    for (const name of getWinners(sortedPlays[0])) add(name, "fastStarter");
  }

  // Collector: most distinct titles, min 2
  if (gameTitles.size > 0) {
    const maxTitles = Math.max(...[...gameTitles.values()].map((s) => s.size));
    if (maxTitles >= 2) {
      for (const [name, titles] of gameTitles) {
        if (titles.size === maxTitles) add(name, "collector");
      }
    }
  }

  // Specialist: most wins in a single title, min 2
  const bestTitleWins = new Map<string, number>();
  for (const [name, titles] of titleWins) {
    bestTitleWins.set(name, Math.max(...titles.values()));
  }
  if (bestTitleWins.size > 0) {
    const overallMax = Math.max(...bestTitleWins.values());
    if (overallMax >= 2) {
      for (const [name, best] of bestTitleWins) {
        if (best === overallMax) add(name, "specialist");
      }
    }
  }

  return result;
}

export function computeAllTimeTrophies(plays: PlayForTrophy[]): Map<string, TrophyCounts> {
  const byEvent = new Map<string, PlayForTrophy[]>();
  for (const play of plays) {
    const list = byEvent.get(play.eventId) ?? [];
    list.push(play);
    byEvent.set(play.eventId, list);
  }

  const result = new Map<string, TrophyCounts>();

  function getOrCreate(name: string): TrophyCounts {
    if (!result.has(name)) result.set(name, emptyTrophyCounts());
    return result.get(name)!;
  }

  for (const eventPlays of byEvent.values()) {
    for (const [name, trophies] of computeEventTrophies(eventPlays)) {
      const counts = getOrCreate(name);
      for (const t of trophies) counts[t]++;
    }
  }

  return result;
}
