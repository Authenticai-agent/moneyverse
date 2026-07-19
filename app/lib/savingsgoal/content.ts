/**
 * Goal Jar - content and copy
 * ----------------------------
 * All game data and kid-facing copy lives here as plain data, so it can be read,
 * tuned, and translated without touching engine logic or component markup.
 *
 * Keys are stable kebab-case and are never renamed - a boost id is its toggle
 * identity, and preset ids appear in the printable plan.
 *
 * **Every amount on this page is illustrative.** The presets are example prices,
 * the chores are example rates, and the spending items are example costs. None
 * of it is advice, a going rate, or an offer. The UI labels them as examples.
 *
 * Copy follows `copy.md`: encouraging, plain-language, non-judgemental. Nothing
 * here frames a choice as a mistake. In particular the "Things you might spend
 * on" group is written flat and factual - the lesson is delivered by the week
 * count moving, not by the tool passing comment on what a child wants.
 */

import type { Boost, GoalPreset } from './types';

/* ------------------------------- goal presets ----------------------------- */

/**
 * Tap-to-start goals. Prices are illustrative and chosen to match the numbers
 * already shown on the `/tools` index card for this tool.
 */
export const GOAL_PRESETS: readonly GoalPreset[] = [
  { id: 'bike', name: 'A bike', targetMinor: 20_000, emoji: '🚲' },
  { id: 'skateboard', name: 'A skateboard', targetMinor: 6_000, emoji: '🛹' },
  { id: 'headphones', name: 'Headphones', targetMinor: 8_000, emoji: '🎧' },
  { id: 'video-game', name: 'A video game', targetMinor: 7_000, emoji: '🎮' },
] as const;

/** The id of the "Something else" tile, which reveals a name + amount field. */
export const CUSTOM_PRESET_ID = 'something-else';

/* -------------------------------- boost cards ----------------------------- */

/** A labelled row of boost cards. Groups keep 26 cards browsable. */
export interface BoostGroup {
  id: string;
  title: string;
  hint: string;
  boosts: readonly Boost[];
}

/**
 * The tradeoff mechanic, grouped.
 *
 * Earning cards are mostly `weekly`, because a chore is a job you do again -
 * that is what makes it change the slope of the plan rather than nudge it once.
 * The genuinely one-off jobs (the garage, the leaves) are `once`.
 *
 * The spending group is the other half of the same lesson: a small weekly habit
 * and a single big purchase cost different things, and the only way to see which
 * is which is to add them and read the number. Every card is reversible.
 */
export const BOOST_GROUPS: readonly BoostGroup[] = [
  {
    id: 'quick',
    title: 'Quick jobs',
    hint: 'A few minutes each.',
    boosts: [
      { id: 'take-out-trash', label: 'Empty the trash cans and take the bins out', amountMinor: 100, cadence: 'weekly', emoji: '🗑️' },
      { id: 'unload-dishwasher', label: 'Unload the dishwasher', amountMinor: 100, cadence: 'weekly', emoji: '🍽️' },
      { id: 'feed-pets', label: 'Feed the pets and refill their water', amountMinor: 200, cadence: 'weekly', emoji: '🐾' },
      { id: 'match-socks', label: 'Sort and match the sock pile', amountMinor: 100, cadence: 'weekly', emoji: '🧦' },
      { id: 'water-plants', label: 'Water the plants', amountMinor: 100, cadence: 'weekly', emoji: '🪴' },
    ],
  },
  {
    id: 'bigger',
    title: 'Bigger jobs',
    hint: 'These take real time.',
    boosts: [
      { id: 'walk-dog', label: 'Walk the dog', amountMinor: 500, cadence: 'weekly', emoji: '🐕' },
      { id: 'vacuum-main-floor', label: 'Vacuum the whole main floor', amountMinor: 300, cadence: 'weekly', emoji: '🧹' },
      { id: 'fold-laundry', label: 'Fold and put away a load of laundry', amountMinor: 300, cadence: 'weekly', emoji: '🧺' },
      { id: 'clean-windows', label: 'Clean the inside windows and mirrors', amountMinor: 400, cadence: 'weekly', emoji: '🪟' },
      { id: 'weed-garden', label: 'Weed a garden bed', amountMinor: 400, cadence: 'weekly', emoji: '🌱' },
      { id: 'wash-car-outside', label: 'Wash the car, outside only', amountMinor: 500, cadence: 'weekly', emoji: '🚗' },
      { id: 'deep-clean-room', label: 'Deep-clean your room, under the bed too', amountMinor: 500, cadence: 'weekly', emoji: '🛏️' },
    ],
  },
  {
    id: 'weekend',
    title: 'Weekend jobs',
    hint: 'Big ones. Check with a grown-up first.',
    boosts: [
      { id: 'mow-lawn', label: 'Mow the lawn', amountMinor: 1_000, cadence: 'weekly', emoji: '🌿' },
      { id: 'scrub-bathrooms', label: 'Scrub the bathroom: toilet, tub, sink, floor', amountMinor: 700, cadence: 'weekly', emoji: '🚿' },
      { id: 'organize-pantry', label: 'Organise the pantry and check the dates', amountMinor: 600, cadence: 'once', emoji: '🥫' },
      { id: 'rake-leaves', label: 'Rake and bag the leaves', amountMinor: 800, cadence: 'once', emoji: '🍂' },
      { id: 'clean-garage', label: 'Clean out the garage, or part of it', amountMinor: 1_000, cadence: 'once', emoji: '📦' },
      { id: 'wash-car-full', label: 'Wash the car inside and out, vacuum too', amountMinor: 800, cadence: 'once', emoji: '✨' },
    ],
  },
  {
    id: 'windfall',
    title: 'Money that turns up',
    hint: 'One-off money, not a job.',
    boosts: [
      { id: 'sell-toys', label: 'Sell some old toys', amountMinor: 1_500, cadence: 'once', emoji: '🧸' },
      { id: 'birthday-money', label: 'Birthday money', amountMinor: 2_000, cadence: 'once', emoji: '🎂' },
    ],
  },
  {
    id: 'spend',
    title: 'Things you might spend on',
    hint: 'Add one to see what it costs in weeks. Take it back off any time.',
    boosts: [
      { id: 'candy-snacks', label: 'Candy and snacks at the shop', amountMinor: -200, cadence: 'weekly', emoji: '🍬' },
      { id: 'arcade-claw', label: 'Claw machines and arcade games', amountMinor: -300, cadence: 'weekly', emoji: '🕹️' },
      { id: 'blind-box', label: 'Blind boxes and mystery packs', amountMinor: -700, cadence: 'once', emoji: '🎁' },
      { id: 'cheap-toy', label: 'A toy that breaks fast', amountMinor: -1_000, cadence: 'once', emoji: '🪀' },
      { id: 'in-game', label: 'In-game skins or coins', amountMinor: -1_500, cadence: 'once', emoji: '💎' },
      { id: 'save-half', label: 'Save half your allowance instead of all of it', amountMinor: -300, cadence: 'weekly', emoji: '🪙' },
    ],
  },
] as const;

/**
 * Flat list, in group order. The engine and the hook resolve active ids against
 * this, so `activeBoosts` returns cards in content order rather than tap order.
 */
export const BOOSTS: readonly Boost[] = BOOST_GROUPS.flatMap((g) => g.boosts);

/* -------------------------------- tuning ---------------------------------- */

/** Default weekly contribution when the jar first opens, in minor units. */
export const DEFAULT_WEEKLY_MINOR = 1_000;

/** Range and step of the contribution dial, in minor units. */
export const WEEKLY_MIN_MINOR = 0;
export const WEEKLY_MAX_MINOR = 5_000;
export const WEEKLY_STEP_MINOR = 100;

/** Step of the "I already have" stepper, in minor units. */
export const CURRENT_STEP_MINOR = 500;

/** Upper bound on how far the week scrubber can travel. */
export const MAX_SCRUB_WEEKS = 104;

/* ---------------------------------- copy ---------------------------------- */

/**
 * All user-facing strings for this tool, keyed for later localisation.
 * Components read from here; nothing critical is hard-coded in markup.
 */
export const COPY = {
  /*
   * What this tool is, in one line, for a player who has just landed and has
   * no idea. Everything else on the page is an instruction of about ten words
   * attached to the thing it describes - a child should never have to hunt for
   * what a control does or read a paragraph to find out.
   */
  'how.lede': 'Pick something you want. Find out how many weeks until you can buy it.',

  /* Way out of the tool, back to the index of all the games. */
  'nav.allTools': 'All tools',

  /* intro clip */
  'intro.label': 'Welcome video',
  'intro.skip': 'Skip',
  'intro.soundOn': 'Turn sound on',
  'intro.soundOff': 'Turn sound off',
  'intro.tapForSound': 'Tap for sound',
  'intro.caption': 'Starting your savings jar…',
  'how.step1.title': 'Pick it',
  'how.step1.body': 'Choose the thing you are saving for.',
  'how.step2.title': 'Save a bit',
  'how.step2.body': 'Say how much you can put in each week.',
  'how.step3.title': 'See when',
  'how.step3.body': 'Watch the jar fill and the weeks count down.',

  /* setup */
  'setup.title': 'What are you saving for?',
  'setup.subtitle': 'Tap one to start. Your jar opens straight away.',
  'setup.custom': 'Something else',
  'setup.custom.nameLabel': 'What is it?',
  'setup.custom.namePlaceholder': 'A telescope',
  'setup.custom.amountLabel': 'How much does it cost?',
  'setup.custom.hint': 'Type what you want and what it costs, then open your jar.',
  'setup.current.label': 'I already have',
  'setup.current.hint': 'Already saved some? Put it here. If not, leave it at $0.',
  'setup.preset.priceLabel': 'It costs',
  'setup.preset.pick': 'Pick this',
  'setup.illustrative': 'These prices are examples. Change any of them to what yours really costs.',

  /* jar */
  'jar.caption': 'This is your jar. It fills up as you save.',

  'jar.dial.label': 'Each week I add',
  'jar.dial.hint': 'Money you put in every week. Drag the slider, or tap − and +.',

  'jar.answer.hint': 'This is how long until you can buy it.',
  'jar.answer.eyebrow': 'You will get there in',
  'jar.answer.around': 'around',
  'jar.answer.noPlan': 'Add a little each week to see when you will get there.',
  /*
   * The already-reached state gets its own headline rather than falling through
   * to the countdown. "You will get there in 0 weeks" is arithmetically true and
   * reads like a glitch to a child who has in fact already done it.
   */
  'jar.answer.reachedEyebrow': 'Good news',
  'jar.answer.reachedHeadline': 'You have enough',
  'jar.answer.reached': 'Nice saving.',

  /* scrubber - the resting state has to read as an invitation, not a result */
  'jar.scrubber.title': 'Peek ahead',
  'jar.scrubber.restHint': 'Drag to see what any week looks like',
  'jar.scrubber.today': ({ amount }: { amount: string }) => `Today you have ${amount}`,
  'jar.scrubber.at': ({ week, amount }: { week: number; amount: string }) =>
    `Week ${week} — you would have ${amount}`,
  'jar.scrubber.now': 'Back to today',
  'jar.scrubber.aria': 'Peek ahead to a week',

  /* boosts */
  'jar.boosts.title': 'Ways to change your plan',
  'jar.boosts.hint':
    'Tap a job to earn more. Tap something you might buy to see what it costs you. Tap again to undo.',
  'jar.boosts.illustrative': 'All amounts are examples.',
  'jar.boosts.perWeek': 'each week',
  'jar.boosts.once': 'once',
  'jar.boosts.added': 'Added to your plan',
  'jar.boosts.add': 'Tap to add',
  'jar.mute': 'Turn sound on',
  'jar.unmute': 'Turn sound off',

  /*
   * Finishing.
   *
   * The old label was "Done for now", which describes stopping rather than
   * arriving and gives no reason to press it. These name the outcome instead,
   * and the body line says what the plan actually buys.
   *
   * Deliberately conditional - "stick with this and you will have enough" is
   * what the arithmetic says, and it stays true only while the plan is kept.
   * It is never phrased as a promise or a guaranteed result; `copy.md` rules
   * that language out and the tool cannot make that claim anyway.
   */
  'jar.finish.top': 'See my plan',
  'jar.finish.title': 'Your plan is ready',
  'jar.finish.body': ({ goal, weeks, date }: { goal: string; weeks: string; date: string }) =>
    `Stick with this and you will have enough for ${goal} in ${weeks} — around ${date}.`,
  'jar.finish.cta': 'Lock in my plan',

  'jar.finish.reachedTitle': 'You already have enough',
  'jar.finish.reachedBody': ({ goal }: { goal: string }) =>
    `You have saved enough for ${goal}. Open the plan whenever you are ready.`,
  'jar.finish.reachedCta': 'See my plan',

  'jar.finish.emptyTitle': 'Almost a plan',
  'jar.finish.emptyBody':
    'Add a little each week, or tap one of the jobs above, and your plan will appear here.',
  'jar.finish.emptyCta': 'See my plan anyway',

  'jar.finish.print': 'You can print it, or keep planning and come back.',

  /* milestones - short, celebratory, never pressuring */
  'milestone.25': 'A quarter of the way there',
  'milestone.50': 'Halfway there',
  'milestone.75': 'Three quarters of the way there',
  'milestone.100': 'That fills the jar',

  /*
   * The certificate.
   *
   * This is the artefact that leaves the screen and goes on a fridge, so it is
   * written to be read by a child standing in a kitchen, not by someone at a
   * computer. It is a promise between two people rather than a printout: the
   * tracker gives it a job to do all week, and the signatures make it real.
   *
   * The "missed a week" line is not padding. A plan a child breaks once and
   * then abandons has failed; `copy.md` forbids shaming, and the way to honour
   * that on a contract is to say plainly, up front, that falling behind is
   * allowed and recoverable.
   */
  'cert.eyebrow': 'MoneyVerse Savings Plan',
  'cert.title': 'My Money Plan',
  'cert.savingFor': 'I am saving for',
  'cert.statWeekly': 'Every week I save',
  'cert.statWeeks': 'It will take',
  'cert.statDate': 'I should get it by',

  'cert.tracker.title': 'Colour one in every week you save',
  'cert.tracker.hint': 'The number under each circle is what you will have by then.',
  'cert.tracker.every': ({ stride }: { stride: number }) => `Showing every ${stride} weeks.`,
  'cert.tracker.none': 'Add some money each week and your tracker will appear here.',

  'cert.jobs.title': 'My jobs',
  'cert.jobs.none': 'I am keeping my plan simple.',

  'cert.promiseMine': 'I promise',
  'cert.promiseMineItems': [
    'I will put my money in the jar every week.',
    'I will colour in a circle each time I save.',
    'If I miss a week, that is OK. I just start again.',
  ],
  'cert.promiseTheirs': 'My grown-up promises',
  'cert.promiseTheirsItems': [
    'I will help count the money each week.',
    'I will keep this plan somewhere we can both see it.',
    'I will cheer them on, not chase them.',
  ],

  'cert.signKid': 'Signed by me',
  'cert.signAdult': 'Signed by my grown-up',
  'cert.signDate': 'Date',
  'cert.signHint': 'Type your names, or print it out and sign with a pen.',
  'cert.namePlaceholder': 'Your name',
  'cert.adultPlaceholder': 'Grown-up name',
  'cert.datePlaceholder': "Today's date",
  'cert.footer': 'Stick me on the fridge!',

  /* report */
  'report.title': 'Your savings plan',
  'report.boosts': 'Changes you picked',
  'report.noBoosts': 'You kept the plan simple. That works too.',
  'report.back': 'Keep planning',
  'report.print': 'Print plan',
  'report.disclaimer':
    'This is a planning tool, not a bank account. It adds up what you put in - it does not earn interest or grow on its own.',

  /* share - describes the tool, never the child (ADR-007) */
  'share.button': 'Share',
  'share.copied': 'Copied',
  'share.text': ({ weeks }: { weeks: string }) =>
    `I planned a savings goal on MoneyVerse in ${weeks}. Try it.`,

  /* accessibility */
  'a11y.canvasAlt': 'A jar filling up with coins as your savings grow.',
  'a11y.announce': ({ weeks, date, amount }: { weeks: string; date: string; amount: string }) =>
    `${weeks}. Around ${date}. You will have ${amount}.`,
  'a11y.announceNoPlan': 'Add a weekly amount to see when you will reach your goal.',
  'a11y.announceReached': ({ goal, amount }: { goal: string; amount: string }) =>
    `You already have enough for ${goal}. You have ${amount}.`,
} as const;
