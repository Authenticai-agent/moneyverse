export interface ScamScenario {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tip: string;
}

export const scamScenarios: ScamScenario[] = [
  {
    id: 1,
    question:
      'You get a message that says you won a free gaming console, but you need to send your password to claim it. What should you do?',
    options: [
      'Send your password right away so you do not miss out.',
      'Ask a parent or trusted adult before doing anything.',
      'Reply with your home address instead.',
      'Click the link to see what happens.',
    ],
    correctIndex: 1,
    explanation:
      'Real prizes never ask for your password. Always check with a trusted adult before sharing personal information online.',
    tip: 'Teach kids that passwords are private and prizes should not require them.',
  },
  {
    id: 2,
    question:
      'A friend you have not talked to in years sends a message asking for money through an app. What is the safest first step?',
    options: [
      'Send the money immediately because they are a friend.',
      'Ignore them and block the account.',
      'Call or talk to them in person to confirm it is really them.',
      'Post about it on social media.',
    ],
    correctIndex: 2,
    explanation:
      'Scammers can take over accounts and pretend to be friends. Confirm outside of the message before sending money.',
    tip: 'Help kids understand that accounts can be hacked and a quick check can prevent loss.',
  },
  {
    id: 3,
    question:
      'You see an ad online for a game skin that is normally very expensive, but this site sells it for almost nothing. What should you think?',
    options: [
      'It is a great deal and I should buy it now.',
      'If it looks too good to be true, it is probably a scam.',
      'I should tell all my friends to buy it too.',
      'I can use my parent\'s card without asking.',
    ],
    correctIndex: 1,
    explanation:
      'Very low prices on unofficial sites are often scams. They may steal money or account information.',
    tip: 'Discuss with kids how scammers use tempting deals to trick people.',
  },
  {
    id: 4,
    question:
      'Someone in a game asks you to trade a rare item for one outside the game. They want you to send it first. What should you do?',
    options: [
      'Send the item first to show I am trustworthy.',
      'Use the official trade system in the game and ask a parent.',
      'Give them my account login so they can trade for me.',
      'Ask them to send their item first.',
    ],
    correctIndex: 1,
    explanation:
      'Trades outside official game systems are risky and often scams. Use official features and involve an adult.',
    tip: 'Remind kids that official trading systems exist to protect them.',
  },
  {
    id: 5,
    question:
      'You get an email that looks like it is from a game company, but it asks you to click a link and log in. How do you check if it is real?',
    options: [
      'Click the link and log in to see.',
      'Check the sender address, hover over links, and go to the official site yourself.',
      'Reply to the email with your username.',
      'Forward it to all your friends.',
    ],
    correctIndex: 1,
    explanation:
      'Phishing emails try to look real. Check the sender address, hover over links, and type the official site address yourself.',
    tip: 'Show kids how to look at the sender email address and hover over links without clicking.',
  },
  {
    id: 6,
    question:
      'A stranger messages you and says they will give you free game money if you tell them your favorite teacher\'s name. What is wrong with this?',
    options: [
      'Nothing, it is just a name.',
      'Names can be part of security questions used to steal accounts.',
      'They probably want to send a gift to your teacher.',
      'You should give them your school name too.',
    ],
    correctIndex: 1,
    explanation:
      'Personal details like teacher names, pets, or birth dates can be used to guess passwords or reset accounts.',
    tip: 'Help kids see that small personal details can be used against them.',
  },
  {
    id: 7,
    question:
      'You see a video of a popular gamer giving away free money. They ask you to download an app to get it. What should you do?',
    options: [
      'Download the app right away.',
      'Check the official channel of the gamer and never download unknown apps.',
      'Send a screenshot of your account to prove you are real.',
      'Share the video with everyone.',
    ],
    correctIndex: 1,
    explanation:
      'Scammers fake popular videos and profiles. Verify through official channels and do not download unknown apps.',
    tip: 'Teach kids to look for verified badges and official links.',
  },
  {
    id: 8,
    question:
      'You get a text message with a code that you did not request. Then someone asks for that code. What should you do?',
    options: [
      'Give them the code so they stop texting.',
      'Never share verification codes with anyone; tell a trusted adult.',
      'Type the code into the website they sent.',
      'Delete the message and forget about it.',
    ],
    correctIndex: 1,
    explanation:
      'Verification codes are one-time passwords. Anyone asking for them is trying to access your account.',
    tip: 'Make sure kids know that verification codes are secrets, just like passwords.',
  },
  {
    id: 9,
    question:
      'An app you have never heard of promises to double your money in one day. What should you do?',
    options: [
      'Invest your allowance to see if it works.',
      'Be skeptical; no investment can guarantee quick returns.',
      'Tell your friends to invest too.',
      'Use your parent\'s account to get more money.',
    ],
    correctIndex: 1,
    explanation:
      'Promises of guaranteed fast returns are a common scam. Real growth takes time and carries risk.',
    tip: 'Use this as a chance to talk about realistic saving and investing.',
  },
  {
    id: 10,
    question:
      'You receive a direct message saying your account will be deleted unless you click a link right now. What should you do?',
    options: [
      'Click the link quickly to save your account.',
      'Close the message and log in through the official app or website to check.',
      'Reply to the message and ask them not to delete it.',
      'Give them your password so they can verify you.',
    ],
    correctIndex: 1,
    explanation:
      'Urgent threats are a common trick. Use the official app or website to check your account status.',
    tip: 'Help kids recognize pressure tactics and take a pause before acting.',
  },
];
