import type { MiniGame } from '../types';

// IDs are stable across releases so saved game-state references (in the log)
// stay meaningful if a user imports/exports their list later.
export const starterMiniGames: MiniGame[] = [
  {
    id: 'starter-coin-flip-elbow',
    name: 'Elbow Coin Flip',
    instructions:
      'Stack 5 coins on your elbow (palm up, arm bent). On "go", swing your arm down and catch as many coins as you can in the same hand. Most coins caught wins.',
    category: 'physical',
    durationMinutes: 2,
    active: true,
  },
  {
    id: 'starter-hum-that-tune',
    name: 'Hum That Tune',
    instructions:
      'One player picks a song secretly and hums it (no words, no lyrics). The other players have 30 seconds to guess. First correct guess wins.',
    category: 'mental',
    durationMinutes: 2,
    active: true,
  },
  {
    id: 'starter-celebrity-charades',
    name: 'Celebrity Charades',
    instructions:
      'One player gets a celebrity name whispered to them. They have 60 seconds to act it out (no talking, no spelling). Whoever guesses correctly wins.',
    category: 'silly',
    durationMinutes: 2,
    active: true,
  },
  {
    id: 'starter-draw-blind',
    name: 'Blind Portrait',
    instructions:
      'Everyone closes their eyes (or covers them). On "go", draw a portrait of the player to your left in 45 seconds — no peeking. The player being drawn picks their favorite portrait. Artist of that portrait wins.',
    category: 'creative',
    durationMinutes: 2,
    active: true,
  },
  {
    id: 'starter-balance-book',
    name: 'Book Balance',
    instructions:
      'Place a book flat on your head. Walk from one wall to the other and back without it falling. Fastest clean lap wins. Drops disqualify the run.',
    category: 'physical',
    durationMinutes: 3,
    active: true,
  },
  {
    id: 'starter-name-five',
    name: 'Name Five',
    instructions:
      'The host names a category (e.g. "breakfast foods", "Disney movies", "things in a kitchen"). The current roller names five items in 10 seconds. Make it, you win. Miss it, the player to their left can steal by naming five in 8 seconds.',
    category: 'mental',
    durationMinutes: 1,
    active: true,
  },
  {
    id: 'starter-staring-contest',
    name: 'Stare-off',
    instructions:
      'Two players, head-to-head. No blinking, no looking away, no laughing. Last unblinking face wins. Tournament bracket if more than 2 players.',
    category: 'silly',
    durationMinutes: 2,
    active: true,
  },
  {
    id: 'starter-rock-paper-scissors',
    name: 'Best of 5: RPS',
    instructions:
      'Everyone plays rock-paper-scissors in a knockout bracket, best of 5 per matchup. Last player standing wins.',
    category: 'silly',
    durationMinutes: 3,
    active: true,
  },
  {
    id: 'starter-impressions',
    name: 'Do an Impression',
    instructions:
      'Each player has 20 seconds to do their best impression of a famous person, animal, or character. The host (or audience vote) picks the winner.',
    category: 'creative',
    durationMinutes: 3,
    active: true,
  },
  {
    id: 'starter-trivia-shootout',
    name: 'Trivia Shootout',
    instructions:
      'Host opens a trivia question (use a quiz app or just shout one). First player to shout the correct answer wins. Wrong answer = sit out the next question.',
    category: 'mental',
    durationMinutes: 3,
    active: true,
  },
  {
    id: 'starter-paper-plane',
    name: 'Paper Plane Toss',
    instructions:
      'Each player gets 60 seconds to fold a paper airplane, then one throw across the room. Longest distance wins. Crash landings count for distance only if the plane stayed intact.',
    category: 'physical',
    durationMinutes: 3,
    active: true,
  },
  {
    id: 'starter-tongue-twister',
    name: 'Tongue Twister Tournament',
    instructions:
      'Host picks a tongue twister (e.g. "She sells seashells by the seashore"). Each player says it three times fast. Cleanest delivery wins. Audience judges.',
    category: 'silly',
    durationMinutes: 2,
    active: true,
  },
  {
    id: 'starter-categories-clap',
    name: 'Clap-the-Beat Categories',
    instructions:
      'Clap a steady beat together (clap-clap-snap-snap). On each snap, players take turns naming an item in a category (e.g. "ice cream flavors"). Miss the beat or repeat = out. Last one in wins.',
    category: 'mental',
    durationMinutes: 3,
    active: true,
  },
  {
    id: 'starter-no-laughing',
    name: 'Try Not To Laugh',
    instructions:
      'All players sit in a circle. Going around, each player has 20 seconds to make the player to their right laugh — no touching. Anyone who laughs is out. Last straight-face wins.',
    category: 'silly',
    durationMinutes: 4,
    active: true,
  },
];
