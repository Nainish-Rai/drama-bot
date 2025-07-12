export type User = {
  id: string;
  name: string;
  relationshipName: string | null;
  createdAt: Date;
};

export type Session = {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: Date;
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
  userA: User;
  userB: User;
  messages: Message[];
  resolutions: Resolution[];
};

export type MessageWithSession = Message & {
  session: Session;
};
