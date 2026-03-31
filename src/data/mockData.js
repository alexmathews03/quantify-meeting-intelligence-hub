export const mockMeetings = [
  {
    id: "1",
    title: "Q3 Product Strategy Sync",
    date: "2023-10-14",
    duration: "45m",
    wordCount: 4200,
    actionItemsCount: 5,
    sentimentScore: "positive",
    participants: ["Alice (PM)", "Bob (Eng)", "Charlie (Design)"]
  },
  {
    id: "2",
    title: "Marketing Campaign Kickoff",
    date: "2023-10-15",
    duration: "60m",
    wordCount: 6100,
    actionItemsCount: 8,
    sentimentScore: "neutral",
    participants: ["Diana (Lead)", "Eve (SEO)", "Frank (Content)"]
  },
  {
    id: "3",
    title: "API Incident Post-Mortem",
    date: "2023-10-16",
    duration: "30m",
    wordCount: 2800,
    actionItemsCount: 3,
    sentimentScore: "negative",
    participants: ["Grace (SRE)", "Henry (Backend)"]
  }
];

export const mockActionItems = {
  "1": [
    { id: 1, type: "decision", text: "We will prioritize the new mobile app design for Q4.", owner: "Team", date: "-" },
    { id: 2, type: "action", text: "Create high-fidelity mockups for the onboarding flow.", owner: "Charlie", date: "Oct 20" },
    { id: 3, type: "action", text: "Investigate React Native performance bottlenecks.", owner: "Bob", date: "Oct 22" },
    { id: 4, type: "decision", text: "Postpone the legacy API deprecation until Jan.", owner: "Alice", date: "-" },
    { id: 5, type: "action", text: "Draft update email to beta users.", owner: "Alice", date: "Oct 18" },
  ]
};

export const mockSentimentData = {
  "1": [
    { time: "00:00", value: 60, speaker: "Alice" },
    { time: "05:00", value: 80, speaker: "Charlie" },
    { time: "10:00", value: 70, speaker: "Bob" },
    { time: "15:00", value: 40, speaker: "Alice" },
    { time: "20:00", value: 90, speaker: "Team" },
    { time: "25:00", value: 85, speaker: "Charlie" },
  ]
};

export const mockChatContext = [
  { role: "system", content: "You are the Meeting Intelligence Chatbot." },
  { role: "user", content: "Why did we decide to delay the API launch?" },
  { role: "assistant", content: "According to the transcript from **[03:45]**, Alice noted that the QA team needed an additional two weeks to complete their automated test suite. Bob agreed this was necessary to prevent regressions. Thus, the decision was made to postpone." }
];
