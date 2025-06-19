
export type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type TechnicianSkill = 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliance Repair' | 'General Maintenance';

export type Technician = {
  id: string;
  name: string;
  isAvailable: boolean;
  skills: TechnicianSkill[];
  location: Location;
  avatarUrl?: string;
  currentJobId?: string | null;
  phone?: string;
  email?: string;
};

export type JobPriority = 'High' | 'Medium' | 'Low';
export type JobStatus = 'Pending' | 'Assigned' | 'En Route' | 'In Progress' | 'Completed' | 'Cancelled';

export type Job = {
  id: string;
  title: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  assignedTechnicianId?: string | null;
  location: Location;
  customerName: string;
  customerPhone: string;
  scheduledTime?: string; 
  estimatedDurationMinutes?: number;
  createdAt: string; 
  updatedAt: string; 
  notes?: string;
  photos?: string[]; 
};

export type Task = {
  taskId: string;
  location: Location;
  priority: 'high' | 'medium' | 'low';
  description?: string;
};

// For AI flow inputs specifically
export type AITask = {
  taskId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  priority: 'high' | 'medium' | 'low';
};

export type AITechnician = {
  technicianId: string;
  technicianName: string; // Added technicianName
  isAvailable: boolean;
  skills: string[]; // GenAI flow uses string array
  location: {
    latitude: number;
    longitude: number;
  };
};
