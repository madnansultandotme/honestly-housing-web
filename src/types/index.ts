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

export interface PaintSelection {
  id: string;
  projectId: string;
  image?: string;
  colorName: string;
  paintCode?: string;
  sheen?: string;
  notes?: string;
  assignmentType: 'wholeHome' | 'specificRooms';
  // For whole home assignments
  areas?: string[]; // e.g., ['walls', 'trim', 'ceiling', 'cabinets']
  // For specific room assignments
  roomIds?: string[];
  roomNames?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
