// Seed data for Prisma database
// Used by: prisma/seed.ts and as fallback reference data
// Dilemma and DeleteChoice seed data that gets loaded into the DB on first run

export interface SeedDilemma {
  question: string;
  optionA: string;
  optionB: string;
  category: string;
  difficulty: string;
}

export interface SeedDilemma {
  question: string;
  optionA: string;
  optionB: string;
  argumentA: string;
  argumentB: string;
  category: string;
  difficulty: string;
}

export const SEED_DILEMMAS: SeedDilemma[] = [
  // ── Modern life & technology ──────────────────────────────────
  {
    question: "Your elderly parent refuses to stop driving. Last week they drifted into oncoming traffic. They say driving is the last thing that makes them feel independent. Do you secretly disable the car?",
    optionA: "Disable it — safety over feelings",
    optionB: "Let them drive — dignity matters more",
    argumentA: "One accident could kill them or an innocent family. Love sometimes means making the hard call before tragedy forces your hand.",
    argumentB: "Taking away someone's last shred of independence can accelerate decline faster than any accident. Autonomy is not a privilege — it's a right.",
    category: "family",
    difficulty: "hard"
  },
  {
    question: "You built an app that accidentally went viral. You discover it's being used to coordinate bullying at a high school. Shutting it down kills your only income. What do you do?",
    optionA: "Shut it down immediately",
    optionB: "Moderate harder, keep it alive",
    argumentA: "You can't moderate your way out of a culture problem. The tool exists to enable harm — removing it is the only guarantee.",
    argumentB: "Every platform faces misuse. Abandoning it punishes the 95% of good users and guarantees the bullies just move somewhere with zero moderation.",
    category: "technology",
    difficulty: "hard"
  },
  {
    question: "Your company is about to lay off your entire team. You got tipped off a week early. Telling them means you get fired too (NDA breach). Saying nothing means they can't prepare.",
    optionA: "Break the NDA, warn the team",
    optionB: "Stay quiet, protect yourself",
    argumentA: "Loyalty to a corporation that's about to discard your team is misplaced. People deserve time to prepare for the financial blow.",
    argumentB: "Martyrdom helps no one if you end up unemployed too. You can help your team more as an insider than as a fired whistleblower.",
    category: "career",
    difficulty: "hard"
  },
  {
    question: "Your 14-year-old found your old journal and read about your past addiction. They're asking questions. Your partner thinks you should deny it because it'll 'normalize' it.",
    optionA: "Tell the truth about your past",
    optionB: "Deny it, protect their innocence",
    argumentA: "Honesty builds trust. Kids who understand that recovery is real and possible are better equipped than kids shielded from reality.",
    argumentB: "A 14-year-old's brain isn't done developing. Knowing a parent struggled with addiction can create anxiety or make it seem survivable to experiment.",
    category: "family",
    difficulty: "hard"
  },
  {
    question: "A coworker you respect keeps getting credit for your ideas in meetings. Confronting them might destroy the friendship. Staying quiet means you keep getting passed over for promotions.",
    optionA: "Confront them directly",
    optionB: "Stay quiet, find another way up",
    argumentA: "Resentment will destroy the friendship slower and more painfully than an honest conversation. A real friend can handle feedback.",
    argumentB: "Office politics is chess, not boxing. Document your contributions, start speaking up in meetings, and let your work make the case.",
    category: "career",
    difficulty: "medium"
  },
  // ── Relationships & identity ──────────────────────────────────
  {
    question: "You found out your partner of 8 years has been sending money to a secret child from a previous relationship. They say they were afraid you'd leave. Do you?",
    optionA: "Leave — the deception is too deep",
    optionB: "Stay — the lie was born from fear",
    argumentA: "8 years of deception means 8 years of choosing fear over trust. If they hid a child, what else could they hide?",
    argumentB: "They hid it because they loved you too much to lose you. The lie was cowardly, but the motive was love, not malice.",
    category: "relationships",
    difficulty: "hard"
  },
  {
    question: "Your best friend's startup is failing badly. They just asked you to invest your emergency savings. You know it won't save the company, but refusing might end the friendship.",
    optionA: "Invest — friendships are worth the risk",
    optionB: "Refuse — honesty is the better friendship",
    argumentA: "Money comes back. Trust takes decades to build. Standing by someone at their lowest is what separates real friendship from convenience.",
    argumentB: "Enabling a sinking ship isn't friendship — it's codependency. A real friend tells you the truth even when it's brutal.",
    category: "relationships",
    difficulty: "hard"
  },
  {
    question: "You got your dream job offer in another country. Your aging parent is healthy but alone, and they've asked you not to go. They'd never say it, but you can see the fear.",
    optionA: "Take the job — you can't live for others",
    optionB: "Stay — some windows close forever",
    argumentA: "Your parent would never want you to sacrifice your ambition out of guilt. Living a smaller life to ease their worry helps no one long-term.",
    argumentB: "Dream jobs come around more than once. Your parent being healthy and alone won't last forever. You can't FaceTime your way through their final years.",
    category: "family",
    difficulty: "hard"
  },
  {
    question: "You matched with someone incredible online. Three months in, you realize they think you're 5 years younger than you are (your profile was wrong). Things are getting serious.",
    optionA: "Come clean now and risk losing them",
    optionB: "Wait for the 'right moment' (it may never come)",
    argumentA: "Every day you wait makes the lie bigger. If they'd reject you over 5 years, better to know now than after you're in deep.",
    argumentB: "Context matters. A wrong profile detail isn't the same as a character flaw. Let them know you as a person first — correct the record when the bond is real.",
    category: "relationships",
    difficulty: "medium"
  },
  {
    question: "Your sibling came out to you privately. Your parents keep asking you why they've been 'acting different.' Your sibling isn't ready, but your parents are worried sick.",
    optionA: "Keep the secret — it's not yours to tell",
    optionB: "Hint at the truth to ease your parents' worry",
    argumentA: "Coming out is a deeply personal act. Hinting at someone else's truth — even with good intentions — is a betrayal they'll never forget.",
    argumentB: "Your parents are suffering from worry. A gentle nudge toward understanding might actually create a safer environment for when your sibling IS ready.",
    category: "family",
    difficulty: "hard"
  },
  // ── Society & ethics ──────────────────────────────────────────
  {
    question: "You're on a jury. You're 90% sure the defendant did it, but the evidence is only circumstantial. A guilty verdict means 25 years. An acquittal means they walk free today.",
    optionA: "Vote guilty — 90% is enough",
    optionB: "Vote not guilty — doubt means doubt",
    argumentA: "Justice isn't math, but 90% certainty is higher than most real-world decisions we trust. Letting a guilty person walk has consequences for the victim too.",
    argumentB: "'Beyond reasonable doubt' exists for a reason. The system must protect the innocent even at the cost of occasionally failing the wronged.",
    category: "ethics",
    difficulty: "hard"
  },
  {
    question: "You accidentally overheard your therapist talking about another patient — someone you know. What they said changes how you see that person entirely.",
    optionA: "Pretend you never heard it",
    optionB: "Confront the therapist about the breach",
    argumentA: "You were never supposed to hear it. Acting on stolen knowledge is its own violation. Some things are better left where they fell.",
    argumentB: "Your therapist broke a sacred trust — with THEIR patient. If they did it once, they'll do it again. You owe it to the next person.",
    category: "ethics",
    difficulty: "medium"
  },
  {
    question: "Your neighbor's kid is clearly being neglected — thin, dirty clothes, always outside late at night. Calling CPS might put them in foster care, which statistically could be worse.",
    optionA: "Call CPS — the system is better than nothing",
    optionB: "Help directly — food, clothes, check-ins",
    argumentA: "You're not trained for this. CPS can investigate, provide resources, and intervene in ways a neighbor can't. Your comfort isn't the priority — the child's safety is.",
    argumentB: "The foster system is overburdened and often traumatic. A consistent, caring neighbor can be more stabilizing than a system that shuffles kids between strangers.",
    category: "society",
    difficulty: "hard"
  },
  {
    question: "You're a teacher. A student plagiarized their college admission essay, but you also know their home situation is devastating. Reporting them kills their only shot out.",
    optionA: "Report it — rules apply to everyone",
    optionB: "Let it slide — mercy over protocol",
    argumentA: "Letting it slide devalues every student who earned it honestly. Compassion can't mean different rules for different people.",
    argumentB: "Rules were written without this kid's life in mind. Sometimes the most ethical thing you can do is bend a rule to save a life.",
    category: "ethics",
    difficulty: "hard"
  },
  {
    question: "You witnessed a hit-and-run. The driver is a single mother from your community who panicked. The victim has minor injuries. She begs you not to say anything.",
    optionA: "Report it — accountability matters",
    optionB: "Stay silent — her kids need her more",
    argumentA: "The victim deserves justice regardless of the driver's circumstances. If you stay silent, you become complicit.",
    argumentB: "Minor injuries heal. Her kids losing their mother to jail doesn't. Sometimes the rigid 'right thing' causes more total harm.",
    category: "ethics",
    difficulty: "hard"
  },
  // ── Identity & self ───────────────────────────────────────────
  {
    question: "You got into your dream school but only because of a clerical error that inflated your grades. You could graduate and nobody would ever know. Your real grades wouldn't have gotten you in.",
    optionA: "Stay — prove yourself once you're there",
    optionB: "Report the error — earn the real path",
    argumentA: "Grades are a filter, not a measure of potential. If you can do the work, the path you took doesn't matter.",
    argumentB: "You'll spend 4 years knowing you don't belong. That imposter syndrome won't be irrational — it'll be accurate.",
    category: "ethics",
    difficulty: "hard"
  },
  {
    question: "Your DNA test reveals your dad isn't your biological father. Your parents clearly don't know. You're 35. Bringing it up could unravel your entire family.",
    optionA: "Bring it up — truth changes nothing about love",
    optionB: "Bury it — some truths do more harm than good",
    argumentA: "Medical history alone is reason enough. Beyond that, living with a known lie corrodes you from the inside. Truth is always eventually better.",
    argumentB: "Your dad IS your dad — biology is a footnote. Dropping this bomb could destroy your mother, your father, and a marriage that survived 35 years.",
    category: "family",
    difficulty: "hard"
  },
  {
    question: "You ghosted someone 5 years ago during the worst period of your life. You recently found out it deeply affected them. Reaching out might reopen their wounds, but silence feels cowardly.",
    optionA: "Reach out and apologize",
    optionB: "Let them have their peace",
    argumentA: "An apology isn't about making yourself feel better — it's about acknowledging harm. They deserve to know it wasn't about them.",
    argumentB: "They've healed and moved on. Your apology is for YOUR conscience. Reopening a closed wound so you can feel better is selfish disguised as kindness.",
    category: "relationships",
    difficulty: "medium"
  },
  {
    question: "Your friend group is planning a trip you can't afford. They offered to cover you, but you know they quietly resent it when people don't pay their share. Nobody said anything, but you feel it.",
    optionA: "Accept gracefully — real friends don't track debts",
    optionB: "Decline — pride isn't worth the quiet resentment",
    argumentA: "Friendships survive money when both sides are honest. Let them give freely, and repay it when you can — even if it's in other ways.",
    argumentB: "You felt the resentment because it's real. Accepting charity that breeds bitterness doesn't strengthen a friendship — it slowly poisons it.",
    category: "relationships",
    difficulty: "medium"
  },
  {
    question: "You're interviewing two candidates. One is clearly more qualified. The other is from a group severely underrepresented in your company, and they're almost as qualified. Leadership is watching.",
    optionA: "Hire the most qualified — merit is merit",
    optionB: "Hire for representation — almost-as-good is good enough",
    argumentA: "Lowering the bar, even slightly, signals that you don't believe underrepresented people can compete on merit. That's its own kind of prejudice.",
    argumentB: "'Most qualified' was already filtered through a system that favored one group. Representation isn't lowering the bar — it's correcting a tilted playing field.",
    category: "society",
    difficulty: "hard"
  }
];

export interface SeedDeleteChoice {
  optionA: string;
  optionB: string;
  description: string;
  category: string;
}

export const SEED_DELETE_CHOICES: SeedDeleteChoice[] = [
  { optionA: "All social media platforms", optionB: "All streaming services", description: "Delete one category from existence forever", category: "technology" },
  { optionA: "The concept of money", optionB: "The concept of government", description: "Which fundamental system would you erase?", category: "society" },
  { optionA: "Human ability to lie", optionB: "Human ability to feel physical pain", description: "Remove one human trait permanently", category: "existence" },
  { optionA: "All nuclear weapons", optionB: "All AI technology", description: "Which existential threat would you eliminate?", category: "technology" },
  { optionA: "Personal privacy", optionB: "National secrets", description: "Which form of secrecy would you erase?", category: "society" },
  { optionA: "All religions", optionB: "All countries/borders", description: "Which dividing force would you remove?", category: "society" },
  { optionA: "The aging process", optionB: "The need for sleep", description: "Which biological limit would you eliminate?", category: "existence" },
  { optionA: "All video games", optionB: "All professional sports", description: "Which entertainment industry would you erase?", category: "culture" },
  { optionA: "The internet", optionB: "Air travel", description: "Which global connector would you remove?", category: "technology" },
  { optionA: "Human memory of history", optionB: "All written records of history", description: "How would you erase humanity's past?", category: "existence" },
  { optionA: "Jealousy", optionB: "Greed", description: "Which human vice would you eliminate?", category: "existence" },
  { optionA: "All insects", optionB: "All bacteria", description: "Which kingdom would you erase (with consequences)?", category: "nature" },
  { optionA: "The concept of beauty standards", optionB: "The concept of intelligence testing", description: "Which measure of human worth would you eliminate?", category: "society" },
  { optionA: "Coffee", optionB: "Alcohol", description: "Which universal drug would you erase?", category: "culture" },
  { optionA: "Death", optionB: "Birth (no new humans)", description: "How would you change mortality?", category: "existence" },
  { optionA: "All advertising", optionB: "All surveillance capitalism", description: "Which modern economic force would you eliminate?", category: "society" },
  { optionA: "The ability to fall in love", optionB: "The ability to have children", description: "Which human experience would you remove?", category: "existence" },
  { optionA: "All automobiles", optionB: "All factory farming", description: "Which harmful industry would you eliminate?", category: "technology" },
  { optionA: "Individual ownership of property", optionB: "The concept of intellectual property", description: "Which form of ownership would you erase?", category: "society" },
  { optionA: "Human violence", optionB: "Human sadness", description: "Which negative experience would you eliminate?", category: "existence" },
];
