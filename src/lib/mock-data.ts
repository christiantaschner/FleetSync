
import type { Technician, Job, Location, JobPriority, JobStatus, Contract, Equipment, ProfileChangeRequest, CustomerData, ChecklistResult } from '@/types';
import { addDays, subDays, subMinutes, addMinutes } from 'date-fns';

const MOCK_COMPANY_ID = 'fleetsync_ai_dev';

export const mockTechnicians: Technician[] = [
  {
    id: 'tech_001',
    companyId: MOCK_COMPANY_ID,
    name: 'Alice Smith',
    email: 'alice@fleetsync.app',
    phone: '555-0101',
    isAvailable: true,
    skills: ['Plumbing', 'Leak Detection', 'Water Heater Repair'],
    location: { latitude: 34.0522, longitude: -118.2437, address: '123 Main St, Los Angeles, CA' },
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'tech_002',
    companyId: MOCK_COMPANY_ID,
    name: 'Bob Johnson',
    email: 'bob@fleetsync.app',
    phone: '555-0102',
    isAvailable: false,
    currentJobId: 'job_001',
    skills: ['HVAC', 'AC Repair', 'Furnace Maintenance'],
    location: { latitude: 40.7128, longitude: -74.0060, address: '789 Pine Ln, New York, NY' },
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'tech_003',
    companyId: MOCK_COMPANY_ID,
    name: 'Carol Williams',
    email: 'carol@fleetsync.app',
    phone: '555-0103',
    isAvailable: true,
    skills: ['Electrical', 'Circuit Breaker Repair', 'Wiring and Rewiring'],
    location: { latitude: 37.7749, longitude: -122.4194, address: '222 Bay St, San Francisco, CA' },
    avatarUrl: 'https://placehold.co/100x100.png',
  },
    {
    id: 'tech_004',
    companyId: MOCK_COMPANY_ID,
    name: 'David Brown',
    email: 'david@fleetsync.app',
    phone: '555-0104',
    isAvailable: false,
    currentJobId: 'job_003',
    skills: ['Appliance Repair', 'Refrigerator Repair', 'Dishwasher Repair'],
    location: { latitude: 41.8781, longitude: -87.6298, address: '555 Lake Shore Dr, Chicago, IL' },
    avatarUrl: 'https://placehold.co/100x100.png',
  },
];

export const mockCustomers: CustomerData[] = [
  { id: 'cust_001', name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234', address: '456 Oak Ave, Los Angeles, CA', companyId: MOCK_COMPANY_ID, createdAt: subDays(new Date(), 5).toISOString() },
  { id: 'cust_002', name: 'Jane Roe', email: 'jane.roe@example.com', phone: '555-5678', address: '101 Maple Dr, New York, NY', companyId: MOCK_COMPANY_ID, createdAt: subDays(new Date(), 10).toISOString() },
  { id: 'cust_003', name: 'Peter Pan', email: 'peter.pan@example.com', phone: '555-8765', address: '222 Bay St, San Francisco, CA', companyId: MOCK_COMPANY_ID, createdAt: subDays(new Date(), 2).toISOString() },
  { id: 'cust_004', name: 'Wonderland Inc.', email: 'contact@wonderland.com', phone: '555-4321', address: '888 Rabbit Hole, Chicago, IL', companyId: MOCK_COMPANY_ID, createdAt: subDays(new Date(), 15).toISOString() },
];

const completedChecklist: ChecklistResult[] = [
    { item: "Confirmed site access and verified customer contact.", checked: true },
    { item: "Assessed work area for immediate hazards (e.g., trip hazards, overhead obstructions).", checked: true },
    { item: "Verified proper Personal Protective Equipment (PPE) is worn (e.g., gloves, safety glasses).", checked: true },
    { item: "Identified and located main power and water shut-offs for the work area.", checked: true },
    { item: "Ensured tools and equipment are in good working order.", checked: true },
];

export const mockJobs: Job[] = [
  // Scenario to trigger risk alert for Bob Johnson (tech_002)
  {
    id: 'job_001',
    companyId: MOCK_COMPANY_ID,
    title: 'AC Unit Not Cooling',
    description: 'Central AC unit is running but not blowing cold air. Customer reports strange noises.',
    priority: 'High',
    status: 'In Progress',
    assignedTechnicianId: 'tech_002',
    location: { latitude: 40.7128, longitude: -74.0060, address: '101 Maple Dr, New York, NY' },
    customerName: 'Jane Roe',
    customerPhone: '555-5678',
    customerEmail: 'jane.roe@example.com',
    scheduledTime: subMinutes(new Date(), 90).toISOString(),
    estimatedDurationMinutes: 180, // Long job to ensure overlap
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: subMinutes(new Date(), 30).toISOString(),
    inProgressAt: subMinutes(new Date(), 30).toISOString(), // Started 30 mins ago
    requiredSkills: ['HVAC', 'AC Repair'],
    checklistResults: completedChecklist,
  },
  {
    id: 'job_006', // Next job for Bob
    companyId: MOCK_COMPANY_ID,
    title: 'Thermostat Replacement',
    description: 'Customer wants to replace an old thermostat with a new smart thermostat they purchased.',
    priority: 'Medium',
    status: 'Assigned',
    assignedTechnicianId: 'tech_002',
    location: { latitude: 40.7295, longitude: -73.9965, address: '50 Cooper Square, New York, NY' }, // Nearby location
    customerName: 'East Village Apartments',
    customerPhone: '555-3344',
    customerEmail: 'eva@example.com',
    scheduledTime: addMinutes(new Date(), 90).toISOString(), // Scheduled in 1.5 hours, which will be tight
    estimatedDurationMinutes: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requiredSkills: ['HVAC', 'Thermostat Installation'],
    routeOrder: 1
  },
  {
    id: 'job_002',
    companyId: MOCK_COMPANY_ID,
    title: 'Leaky Pipe Under Sink',
    description: 'A pipe under the kitchen sink has a steady drip. Needs to be fixed today.',
    priority: 'High',
    status: 'Pending',
    location: { latitude: 34.0550, longitude: -118.2500, address: '456 Oak Ave, Los Angeles, CA' },
    customerName: 'John Doe',
    customerPhone: '555-1234',
    customerEmail: 'john.doe@example.com',
    scheduledTime: addDays(new Date(), 1).toISOString(),
    estimatedDurationMinutes: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requiredSkills: ['Plumbing', 'Leak Detection'],
  },
   {
    id: 'job_003',
    companyId: MOCK_COMPANY_ID,
    title: 'Dishwasher Installation',
    description: 'Install new Bosch dishwasher and haul away the old one.',
    priority: 'Medium',
    status: 'Assigned',
    assignedTechnicianId: 'tech_004',
    location: { latitude: 41.8781, longitude: -87.6298, address: '888 Rabbit Hole, Chicago, IL' },
    customerName: 'Wonderland Inc.',
    customerPhone: '555-4321',
    customerEmail: 'contact@wonderland.com',
    scheduledTime: addDays(new Date(), 2).toISOString(),
    estimatedDurationMinutes: 90,
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
    requiredSkills: ['Appliance Repair', 'Plumbing'],
    routeOrder: 0,
  },
  {
    id: 'job_004',
    companyId: MOCK_COMPANY_ID,
    title: 'Annual Furnace Maintenance',
    description: 'Routine annual maintenance for a gas furnace. Check filters, clean components, test ignition.',
    priority: 'Low',
    status: 'Completed',
    assignedTechnicianId: 'tech_002',
    location: { latitude: 40.7580, longitude: -73.9855, address: '789 Pine Ln, New York, NY' },
    customerName: 'Old Customer',
    customerPhone: '555-9999',
    customerEmail: 'old@example.com',
    scheduledTime: subDays(new Date(), 7).toISOString(),
    estimatedDurationMinutes: 75,
    createdAt: subDays(new Date(), 10).toISOString(),
    updatedAt: subDays(new Date(), 7).toISOString(),
    completedAt: subDays(new Date(), 7).toISOString(),
    isFirstTimeFix: true,
    customerSatisfactionScore: 5,
  },
  {
    id: 'job_005',
    companyId: MOCK_COMPANY_ID,
    title: 'Faulty Outlet',
    description: 'Outlet in the living room is not working. Other outlets on the same circuit are fine.',
    priority: 'Medium',
    status: 'Pending',
    location: { latitude: 37.7749, longitude: -122.4194, address: '222 Bay St, San Francisco, CA' },
    customerName: 'Peter Pan',
    customerPhone: '555-8765',
    customerEmail: 'peter.pan@example.com',
    scheduledTime: addDays(new Date(), 3).toISOString(),
    estimatedDurationMinutes: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requiredSkills: ['Electrical', 'Outlet Installation'],
  },
];

export const mockContracts: Contract[] = [
  {
    id: 'contract_001',
    companyId: MOCK_COMPANY_ID,
    customerName: 'John Doe',
    customerPhone: '555-1234',
    customerAddress: '456 Oak Ave, Los Angeles, CA',
    frequency: 'Quarterly',
    startDate: subDays(new Date(), 100).toISOString(),
    isActive: true,
    jobTemplate: {
      title: 'Quarterly Plumbing Inspection',
      description: 'Perform a full quarterly inspection of all plumbing fixtures and pipes.',
      priority: 'Low',
      estimatedDurationMinutes: 90,
    },
    lastGeneratedUntil: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'contract_002',
    companyId: MOCK_COMPANY_ID,
    customerName: 'Wonderland Inc.',
    customerPhone: '555-4321',
    customerAddress: '888 Rabbit Hole, Chicago, IL',
    frequency: 'Monthly',
    startDate: subDays(new Date(), 60).toISOString(),
    isActive: true,
    jobTemplate: {
      title: 'Monthly HVAC Filter Change',
      description: 'Change all HVAC filters throughout the commercial property.',
      priority: 'Low',
      estimatedDurationMinutes: 120,
    },
    lastGeneratedUntil: subDays(new Date(), 5).toISOString(),
  }
];

export const mockEquipment: Equipment[] = [
  { id: 'equip_001', companyId: MOCK_COMPANY_ID, customerId: 'cust_001', customerName: 'John Doe', name: 'Rheem Water Heater', model: 'XE50M06ST45U1', installDate: '2022-01-15' },
  { id: 'equip_002', companyId: MOCK_COMPANY_ID, customerId: 'cust_002', customerName: 'Jane Roe', name: 'Trane Central AC', model: 'XR16', installDate: '2021-06-20' },
];

export const mockProfileChangeRequests: ProfileChangeRequest[] = [
  {
    id: 'req_001',
    companyId: MOCK_COMPANY_ID,
    technicianId: 'tech_001',
    technicianName: 'Alice Smith',
    requestedChanges: {
      phone: '555-0105',
      skills: ['Plumbing', 'Leak Detection', 'Water Heater Repair', 'Pipe Fitting'],
    },
    notes: 'Updated my phone number and got certified in Pipe Fitting.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];
