
import type { Job, Technician, Contract, Equipment, CustomerData, ProfileChangeRequest, JobStatus } from '@/types';
import { addDays, subDays } from 'date-fns';

const MOCK_COMPANY_ID = 'mock_company_123';

export const mockTechnicians: Technician[] = [
  {
    id: 'tech_1',
    companyId: MOCK_COMPANY_ID,
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    phone: '555-0101',
    isAvailable: true,
    skills: ['HVAC', 'AC Repair', 'Furnace Maintenance', 'Refrigerant Handling'],
    location: { latitude: 34.0522, longitude: -118.2437, address: 'Los Angeles, CA' },
    avatarUrl: 'https://placehold.co/100x100.png',
    isOnCall: true,
    currentJobId: null,
  },
  {
    id: 'tech_2',
    companyId: MOCK_COMPANY_ID,
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    phone: '555-0102',
    isAvailable: false,
    skills: ['Plumbing', 'Pipe Fitting', 'Leak Detection', 'Water Heater Repair'],
    location: { latitude: 34.0582, longitude: -118.2517, address: 'Glendale, CA' },
    avatarUrl: 'https://placehold.co/100x100.png',
    currentJobId: 'job_2',
  },
  {
    id: 'tech_3',
    companyId: MOCK_COMPANY_ID,
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    phone: '555-0103',
    isAvailable: true,
    skills: ['Electrical', 'Wiring and Rewiring', 'Circuit Breaker Repair'],
    location: { latitude: 34.1522, longitude: -118.2637, address: 'Burbank, CA' },
    avatarUrl: 'https://placehold.co/100x100.png',
    currentJobId: null,
  },
];

export const mockJobs: Job[] = [
  {
    id: 'job_1',
    companyId: MOCK_COMPANY_ID,
    title: 'Urgent: No Hot Water',
    description: 'Customer reports no hot water. Suspect faulty water heater element.',
    priority: 'High',
    status: 'Pending',
    location: { latitude: 34.0622, longitude: -118.2537, address: '123 Maple St, Los Angeles, CA' },
    customerName: 'Eve Davis',
    customerPhone: '555-0201',
    requiredSkills: ['Water Heater Repair', 'Plumbing'],
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'job_2',
    companyId: MOCK_COMPANY_ID,
    title: 'AC Unit Not Cooling',
    description: 'The main AC unit is running but not blowing cold air. It might be a refrigerant leak or a capacitor issue.',
    priority: 'Medium',
    status: 'In Progress',
    assignedTechnicianId: 'tech_2',
    location: { latitude: 34.0422, longitude: -118.2337, address: '456 Oak Ave, Los Angeles, CA' },
    customerName: 'Frank Miller',
    customerPhone: '555-0202',
    requiredSkills: ['HVAC', 'AC Repair'],
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: new Date().toISOString(),
    inProgressAt: new Date().toISOString(),
    scheduledTime: new Date().toISOString(),
    estimatedDurationMinutes: 120,
    routeOrder: 0,
  },
  {
    id: 'job_3',
    companyId: MOCK_COMPANY_ID,
    title: 'Outlet Sparking',
    description: 'Kitchen outlet is sparking when a plug is inserted. Potentially dangerous.',
    priority: 'High',
    status: 'Assigned',
    assignedTechnicianId: 'tech_3',
    location: { latitude: 34.0722, longitude: -118.2637, address: '789 Pine Ln, Los Angeles, CA' },
    customerName: 'Grace Wilson',
    customerPhone: '555-0203',
    requiredSkills: ['Electrical', 'Outlet Installation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledTime: addDays(new Date(), 1).toISOString(),
    estimatedDurationMinutes: 60,
    routeOrder: 1,
  },
  {
    id: 'job_4',
    companyId: MOCK_COMPANY_ID,
    title: 'Quarterly HVAC Inspection',
    description: 'Routine maintenance and filter change for the commercial HVAC system.',
    priority: 'Low',
    status: 'Completed',
    assignedTechnicianId: 'tech_1',
    location: { latitude: 34.0322, longitude: -118.2237, address: '101 Business Blvd, Los Angeles, CA' },
    customerName: 'Heidi Inc.',
    customerPhone: '555-0204',
    createdAt: subDays(new Date(), 10).toISOString(),
    updatedAt: subDays(new Date(), 8).toISOString(),
    completedAt: subDays(new Date(), 8).toISOString(),
    isFirstTimeFix: true,
    customerSatisfactionScore: 5,
  },
];

export const mockContracts: Contract[] = [
    {
        id: 'contract_1',
        companyId: MOCK_COMPANY_ID,
        customerName: 'Downtown Office Complex',
        customerAddress: '200 Financial Dr, Los Angeles, CA',
        frequency: 'Quarterly',
        startDate: subDays(new Date(), 90).toISOString(),
        isActive: true,
        jobTemplate: {
            title: 'Quarterly HVAC Maintenance',
            description: 'Perform standard quarterly HVAC system check, clean filters, and inspect for wear and tear.',
            priority: 'Low',
            estimatedDurationMinutes: 180,
        },
        lastGeneratedUntil: subDays(new Date(), 1).toISOString(),
    },
];

export const mockCustomers: CustomerData[] = [
    { id: 'cust_1', companyId: MOCK_COMPANY_ID, name: 'Eve Davis', phone: '555-0201', email: 'eve.d@example.com', address: '123 Maple St, Los Angeles, CA', createdAt: subDays(new Date(), 2).toISOString() },
    { id: 'cust_2', companyId: MOCK_COMPANY_ID, name: 'Frank Miller', phone: '555-0202', email: 'frank.m@example.com', address: '456 Oak Ave, Los Angeles, CA', createdAt: subDays(new Date(), 1).toISOString() },
];

export const mockEquipment: Equipment[] = [
    { id: 'equip_1', companyId: MOCK_COMPANY_ID, customerId: 'cust_1', customerName: 'Eve Davis', name: 'Rheem Water Heater', model: 'XE50M06ST45U1', installDate: '2022-05-10', createdAt: '2022-05-10' },
];

export const mockProfileChangeRequests: ProfileChangeRequest[] = [
    {
        id: 'pcr_1',
        companyId: MOCK_COMPANY_ID,
        technicianId: 'tech_1',
        technicianName: 'Alice Johnson',
        requestedChanges: {
            phone: '555-0105',
            skills: ['HVAC', 'AC Repair', 'Furnace Maintenance', 'Refrigerant Handling', 'Boiler Repair'],
        },
        notes: 'Updated my phone number and added a new skill certification for boilers.',
        status: 'pending',
        createdAt: new Date().toISOString(),
    }
];
