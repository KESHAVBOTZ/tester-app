import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  credits: number;
  photoURL?: string;
  role: 'user' | 'admin';
  lastActiveAt?: Timestamp;
  joinedGroup?: boolean;
  testingDays?: number;
  lastTestedAt?: Timestamp;
}

export interface AppModel {
  id: string;
  name: string;
  developerId: string;
  developerName: string;
  iconUrl?: string;
  playStoreLink: string;
  credits: number;
  testersRequired: number;
  testersJoined: number;
  createdAt: Timestamp;
  description?: string;
  testingTime?: number;
  developerLastActiveAt?: Timestamp;
}

export interface TestRecord {
  id: string;
  userId: string;
  appId: string;
  startDate: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
  feedback?: string;
  dailyOpens?: Timestamp[]; // Track each day the user opened the app
}
