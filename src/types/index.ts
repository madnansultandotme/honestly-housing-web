// Common types for the application

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'client' | 'builder' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  builderId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  read: boolean;
}

export interface Photo {
  id: string;
  projectId: string;
  url: string;
  caption?: string;
  uploadedBy: string;
  createdAt: Date;
}
