export type User = {
  id: string;
  name: string;
  relationshipName: string | null;
  createdAt: Date;
};

export type Session = {
  id: string;
  userAId: string | null; // Made optional for anonymous sessions
  userBId: string | null; // Made optional for anonymous sessions
  createdAt: Date;
  // Anonymous session fields
  isAnonymous: boolean;
  inviteToken: string | null;
  userAName: string | null;
  userBName: string | null;
  userAJoined: boolean;
  userBJoined: boolean;
  expiresAt: Date | null;
};

export type Message = {
  id: string;
  sessionId: string;
  sender: "A" | "B";
  content: string;
  createdAt: Date;
};

export type Resolution = {
  id: string;
  sessionId: string;
  verdict: string;
  compromise: string;
  createdAt: Date;
};

export type SessionWithUsers = Session & {
  userA: User | null; // Made optional for anonymous sessions
  userB: User | null; // Made optional for anonymous sessions
  messages: Message[];
  resolutions: Resolution[];
};

export type MessageWithSession = Message & {
  session: Session;
};

// New types for AI therapy analysis
export type ToneAnalysis = {
  tone:
    | "aggressive"
    | "defensive"
    | "hurt"
    | "calm"
    | "understanding"
    | "confused";
  emotion: string;
  intensity: number; // 1-10 scale
};

export type TherapyAnalysis = {
  verdict: string;
  explanation: string;
  compromise: string;
  userATone: ToneAnalysis;
  userBTone: ToneAnalysis;
  reasonableness: {
    userA: number; // 1-10 scale (10 = most reasonable)
    userB: number;
    analysis: string;
  };
};

export type ResolutionWithAnalysis = Resolution & {
  analysis?: TherapyAnalysis;
};
