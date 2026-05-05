export type UserType = 'headmaster' | 'alumni';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  userType: UserType;
  schoolId?: string;
}

export interface School {
  id: string;
  name: string;
  location: string;
  description: string;
  headmasterUid: string;
  coverPhotoUrl?: string;
}

export type NeedStatus = 'open' | 'pledged' | 'completed';
export type NeedCategory = 'infrastructure' | 'supplies' | 'tech' | 'other';

export interface Need {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  costEstimate: number;
  amountCollected: number;
  status: NeedStatus;
  category: NeedCategory;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Pledge {
  id: string;
  needId: string;
  donorUid: string;
  donorName: string;
  amount: number;
  pledgeType: 'item' | 'funds';
  message?: string;
  createdAt: string;
}
