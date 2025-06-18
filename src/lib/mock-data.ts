import type { Technician, Job, Location, TechnicianSkill, JobPriority, JobStatus } from '@/types';

const createId = () => Math.random().toString(36).substr(2, 9);

const sampleLocations: Location[] = [
  { latitude: 34.0522, longitude: -118.2437, address: '123 Main St, Los Angeles, CA' },
  { latitude: 34.0550, longitude: -118.2500, address: '456 Oak Ave, Los Angeles, CA' },
  { latitude: 40.7128, longitude: -74.0060, address: '789 Pine Ln, New York, NY' },
  { latitude: 40.7580, longitude: -73.9855, address: '101 Maple Dr, New York, NY' },
  { latitude: 37.7749, longitude: -122.4194, address: '222 Bay St, San Francisco, CA' },
];

const getRandomLocation = (): Location => sampleLocations[Math.floor(Math.random() * sampleLocations.length)];

const skills: TechnicianSkill[] = ['Plumbing', 'Electrical', 'HVAC', 'Appliance Repair', 'General Maintenance'];
const getRandomSkills = (): TechnicianSkill[] => {
  const numSkills = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length: numSkills }, () => skills[Math.floor(Math.random() * skills.length)])
    .filter((value, index, self) => self.indexOf(value) === index); // Unique skills
};

export const mockTechnicians: Technician[] = [
  {
    id: 'tech_001',
    name: 'Alice Smith',
    isAvailable: true,
    skills: getRandomSkills(),
    location: getRandomLocation(),
    avatarUrl: 'https://placehold.co/100x100.png',
    phone: '555-0101',
    email: 'alice@example.com',
  },
  {
    id: 'tech_002',
    name: 'Bob Johnson',
    isAvailable: false,
    skills: getRandomSkills(),
    location: getRandomLocation(),
    avatarUrl: 'https://placehold.co/100x100.png',
    currentJobId: 'job_001',
    phone: '555-0102',
    email: 'bob@example.com',
  },
  {
    id: 'tech_003',
    name: 'Carol Williams',
    isAvailable: true,
    skills: getRandomSkills(),
    location: getRandomLocation(),
    avatarUrl: 'https://placehold.co/100x100.png',
    phone: '555-0103',
    email: 'carol@example.com',
  },
  {
    id: 'tech_004',
    name: 'David Brown',
    isAvailable: true,
    skills: ['Electrical', 'HVAC'],
    location: getRandomLocation(),
    avatarUrl: 'https://placehold.co/100x100.png',
    phone: '555-0104',
    email: 'david@example.com',
  },
  {
    id: 'tech_005',
    name: 'Eve Davis',
    isAvailable: false,
    skills: ['Plumbing'],
    location: getRandomLocation(),
    avatarUrl: 'https://placehold.co/100x100.png',
    currentJobId: 'job_003',
    phone: '555-0105',
    email: 'eve@example.com',
  },
];

const jobPriorities: JobPriority[] = ['High', 'Medium', 'Low'];
const jobStatuses: JobStatus[] = ['Pending', 'Assigned', 'En Route', 'In Progress', 'Completed', 'Cancelled'];

const getRandomPriority = (): JobPriority => jobPriorities[Math.floor(Math.random() * jobPriorities.length)];
const getRandomStatus = (): JobStatus => jobStatuses[Math.floor(Math.random() * jobStatuses.length)];

const generateJobDate = (offsetDays: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

export const mockJobs: Job[] = [
  {
    id: 'job_001',
    title: 'Leaky Faucet Repair',
    description: 'Customer reports a constantly dripping faucet in the main bathroom. Requires immediate attention.',
    priority: 'High',
    status: 'Assigned',
    assignedTechnicianId: 'tech_002',
    location: sampleLocations[0],
    customerName: 'John Doe',
    customerPhone: '555-1234',
    scheduledTime: generateJobDate(1),
    estimatedDurationMinutes: 60,
    createdAt: generateJobDate(-2),
    updatedAt: generateJobDate(-1),
    notes: 'Bring standard plumbing toolkit.',
    photos: ['https://placehold.co/600x400.png?a=1'],
  },
  {
    id: 'job_002',
    title: 'AC Unit Inspection',
    description: 'Routine annual inspection for a central AC unit. Check filters, coolant levels, and overall performance.',
    priority: 'Medium',
    status: 'Pending',
    location: sampleLocations[1],
    customerName: 'Jane Roe',
    customerPhone: '555-5678',
    scheduledTime: generateJobDate(3),
    estimatedDurationMinutes: 90,
    createdAt: generateJobDate(-5),
    updatedAt: generateJobDate(-5),
  },
  {
    id: 'job_003',
    title: 'Electrical Outlet Replacement',
    description: 'Replace a faulty electrical outlet in the kitchen. Outlet is sparking.',
    priority: 'High',
    status: 'In Progress',
    assignedTechnicianId: 'tech_005',
    location: sampleLocations[2],
    customerName: 'Peter Pan',
    customerPhone: '555-8765',
    scheduledTime: generateJobDate(0),
    estimatedDurationMinutes: 45,
    createdAt: generateJobDate(-1),
    updatedAt: generateJobDate(0),
    notes: 'Safety first. Ensure power is off.',
  },
  {
    id: 'job_004',
    title: 'Refrigerator Not Cooling',
    description: 'Customer reports refrigerator is not maintaining cold temperature. Needs diagnosis and repair.',
    priority: 'Medium',
    status: 'Pending',
    location: sampleLocations[3],
    customerName: 'Alice Wonderland',
    customerPhone: '555-4321',
    scheduledTime: generateJobDate(2),
    estimatedDurationMinutes: 120,
    createdAt: generateJobDate(-3),
    updatedAt: generateJobDate(-3),
  },
  {
    id: 'job_005',
    title: 'General Maintenance Check',
    description: 'Quarterly general maintenance check for a commercial property. Includes HVAC, plumbing, and basic electrical.',
    priority: 'Low',
    status: 'Completed',
    assignedTechnicianId: 'tech_001',
    location: sampleLocations[4],
    customerName: 'Bob The Builder',
    customerPhone: '555-1122',
    scheduledTime: generateJobDate(-7),
    estimatedDurationMinutes: 180,
    createdAt: generateJobDate(-10),
    updatedAt: generateJobDate(-7),
    photos: ['https://placehold.co/600x400.png?a=2', 'https://placehold.co/600x400.png?a=3'],
  },
];
