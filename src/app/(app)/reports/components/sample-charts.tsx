
"use client"

import { BarChart, LineChart, PieChart as RechartsPieChart } from 'recharts'; // Renamed to avoid conflict
import { TrendingUp, Users, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"; // Assuming ChartLegend and ChartLegendContent are exported
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, Line, Pie, Cell, ResponsiveContainer } from 'recharts';


const jobCompletionData = [
  { month: "Jan", completed: 120, pending: 30 },
  { month: "Feb", completed: 150, pending: 25 },
  { month: "Mar", completed: 130, pending: 40 },
  { month: "Apr", completed: 160, pending: 20 },
  { month: "May", completed: 180, pending: 15 },
  { month: "Jun", completed: 170, pending: 35 },
];

const technicianPerformanceData = [
  { name: "Alice S.", jobs: 25, rating: 4.8 },
  { name: "Bob J.", jobs: 22, rating: 4.5 },
  { name: "Carol W.", jobs: 28, rating: 4.9 },
  { name: "David B.", jobs: 20, rating: 4.2 },
  { name: "Eve D.", jobs: 23, rating: 4.6 },
];

const jobPriorityData = [
  { name: 'High', value: 400, color: 'hsl(var(--destructive))' },
  { name: 'Medium', value: 300, color: 'hsl(var(--primary))' },
  { name: 'Low', value: 300, color: 'hsl(var(--secondary-foreground))' },
];

const chartConfigJobCompletion = {
  completed: { label: "Completed", color: "hsl(var(--chart-1))" },
  pending: { label: "Pending", color: "hsl(var(--chart-2))" },
};

const chartConfigTechnicianPerformance = {
  jobs: { label: "Jobs Completed", color: "hsl(var(--chart-1))" },
};

const chartConfigJobPriority = {
    dataKey: "value",
    nameKey: "name",
    // colors are defined in data itself for Pie chart
};


export default function SampleCharts() {
  return (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Job Completion Trends</CardTitle>
          <CardDescription>Monthly completed vs. pending jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigJobCompletion} className="h-[300px] w-full">
            <BarChart data={jobCompletionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <RechartsTooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <RechartsLegend content={<ChartLegendContent />} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
              <Bar dataKey="pending" fill="var(--color-pending)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Technician Performance</CardTitle>
          <CardDescription>Jobs completed by top technicians this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigTechnicianPerformance} className="h-[300px] w-full">
            <LineChart data={technicianPerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <RechartsTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <RechartsLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="jobs" stroke="var(--color-jobs)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-jobs)" }} activeDot={{r:6}} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Job Priority Distribution</CardTitle>
          <CardDescription>Breakdown of jobs by priority level.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
           <ChartContainer config={chartConfigJobPriority} className="h-[250px] w-full max-w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <RechartsTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                    <Pie data={jobPriorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                            {`${(percent * 100).toFixed(0)}%`}
                        </text>
                        );
                    }}>
                    {jobPriorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <RechartsLegend content={<ChartLegendContent />} />
                </RechartsPieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
