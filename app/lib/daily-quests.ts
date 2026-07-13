export type QuestType = 'needs-vs-wants' | 'scam' | 'unit-price' | 'budget' | 'lemonade';

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const dailyQuests: Quest[] = [
  {
    id: 'needs-vs-wants-1',
    type: 'needs-vs-wants',
    title: 'Needs vs Wants',
    question: 'Which of these is a need, not a want?',
    options: ['New video game', 'Healthy lunch', 'Fancy sneakers', 'Movie tickets'],
    correctIndex: 1,
    explanation: 'Healthy food is a need because it helps you stay strong and well.',
  },
  {
    id: 'scam-1',
    type: 'scam',
    title: 'Scam Spotter',
    question: 'A message says you won a prize but must share your password. What should you do?',
    options: ['Share your password', 'Ask a trusted adult', 'Click the link', 'Reply quickly'],
    correctIndex: 1,
    explanation: 'Real prizes never ask for passwords. Ask a trusted adult.',
  },
  {
    id: 'unit-price-1',
    type: 'unit-price',
    title: 'Unit Price Detective',
    question: 'A 10-ounce snack costs $2.00. A 20-ounce snack costs $3.50. Which is the better unit price?',
    options: ['10-ounce bag', '20-ounce bag', 'They are the same', 'Not enough info'],
    correctIndex: 1,
    explanation: 'The 20-ounce bag costs $0.175 per ounce, while the 10-ounce bag costs $0.20 per ounce.',
  },
  {
    id: 'budget-1',
    type: 'budget',
    title: 'Tiny Budget',
    question: 'You have $10. You spend $3 on a snack and $4 on a book. How much is left for saving?',
    options: ['$10', '$7', '$3', '$4'],
    correctIndex: 2,
    explanation: '$10 - $3 - $4 = $3 left to save or spend.',
  },
  {
    id: 'lemonade-1',
    type: 'lemonade',
    title: 'Lemonade Price',
    question: 'Each cup costs you $0.50 to make. Customers are willing to pay $1.50. What is your profit per cup?',
    options: ['$0.50', '$1.00', '$1.50', '$2.00'],
    correctIndex: 1,
    explanation: 'Profit = price - cost. $1.50 - $0.50 = $1.00 profit per cup.',
  },
  {
    id: 'needs-vs-wants-2',
    type: 'needs-vs-wants',
    title: 'Needs vs Wants',
    question: 'You are saving for a bike. Which choice helps you reach your goal?',
    options: ['Buy candy every day', 'Put allowance in savings', 'Skip doing chores', 'Lend all money to a friend'],
    correctIndex: 1,
    explanation: 'Putting money in savings helps you reach your goal.',
  },
  {
    id: 'scam-2',
    type: 'scam',
    title: 'Scam Spotter',
    question: 'A stranger sends a message with a code and asks for it. What is the safest response?',
    options: ['Send the code', 'Never share it', 'Post it online', 'Type it into a website'],
    correctIndex: 1,
    explanation: 'Verification codes are secrets. Never share them.',
  },
];

export function getTodaysQuest(): Quest {
  const index = new Date().getDate() % dailyQuests.length;
  return dailyQuests[index];
}
