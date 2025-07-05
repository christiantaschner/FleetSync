
// src/lib/skills.ts

export const SKILLS_BY_SPECIALTY: Record<string, string[]> = {
    Plumbing: [
        "Pipe Fitting", 
        "Drain Cleaning", 
        "Water Heater Repair", 
        "Leak Detection",
        "Sump Pump Installation",
        "Faucet Repair",
    ],
    Electrical: [
        "Wiring and Rewiring", 
        "Circuit Breaker Repair", 
        "Outlet Installation", 
        "Lighting Installation",
        "Electrical Panel Upgrade",
        "Generator Installation",
    ],
    HVAC: [
        "AC Repair", 
        "Furnace Maintenance", 
        "Ductwork Installation", 
        "Refrigerant Handling",
        "Thermostat Installation",
        "Boiler Repair",
    ],
    "Appliance Repair": [
        "Refrigerator Repair",
        "Washing Machine Repair",
        "Oven Repair",
        "Dishwasher Repair",
    ],
    "General Maintenance": [
        "Painting",
        "Drywall Repair",
        "Carpentry",
        "Tiling",
    ],
};

// A flat list of all skills for seeding if no specialty is chosen or for general use.
export const PREDEFINED_SKILLS: string[] = Object.values(SKILLS_BY_SPECIALTY)
    .flat()
    .filter((value, index, self) => self.indexOf(value) === index) // Get unique skills
    .sort();
