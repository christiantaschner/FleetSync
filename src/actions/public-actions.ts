
"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import type { Job, Technician, PublicTrackingInfo } from "@/types";

const GetTrackingInfoInputSchema = z.object({
    token: z.string().min(1, "A tracking token is required."),
});
export type GetTrackingInfoInput = z.infer<typeof GetTrackingInfoInputSchema>;

export async function getTrackingInfoAction(
    input: GetTrackingInfoInput
): Promise<{ data: PublicTrackingInfo | null; error: string | null }> {
    try {
        const { token } = GetTrackingInfoInputSchema.parse(input);
        if (!db) {
            throw new Error("Firestore not initialized");
        }

        const jobsQuery = query(
            collection(db, "jobs"),
            where("trackingToken", "==", token),
            limit(1)
        );

        const jobSnapshot = await getDocs(jobsQuery);

        if (jobSnapshot.empty) {
            return { data: null, error: "Tracking link is invalid or has expired." };
        }
        
        const job = jobSnapshot.docs[0].data() as Job;

        // Verify the token hasn't expired
        if (!job.trackingTokenExpiresAt || new Date(job.trackingTokenExpiresAt) < new Date()) {
             return { data: null, error: "Tracking link is invalid or has expired." };
        }
        
        // If the job is completed or cancelled, don't show tracking info
        if (job.status === 'Completed' || job.status === 'Cancelled') {
             return { data: null, error: `This job is now ${job.status.toLowerCase()}. Tracking is no longer available.` };
        }
        
        if (!job.assignedTechnicianId) {
             return { data: null, error: "A technician has not yet been assigned to this job. Please check back later." };
        }

        const techQuery = query(
            collection(db, "technicians"),
            where("id", "==", job.assignedTechnicianId),
            limit(1)
        );
        const techSnapshot = await getDocs(techQuery);
        
        // This is a workaround since we can't query by doc ID directly with `where`
        // In a real app, you might just do a getDoc(doc(db, "technicians", job.assignedTechnicianId))
        const allTechnicians = await getDocs(collection(db, "technicians"));
        const technicianDoc = allTechnicians.docs.find(doc => doc.id === job.assignedTechnicianId);

        if (!technicianDoc || !technicianDoc.exists()) {
             return { data: null, error: "Could not retrieve technician details." };
        }
        
        const technician = technicianDoc.data() as Technician;
        
        const trackingInfo: PublicTrackingInfo = {
            jobStatus: job.status,
            jobLocation: job.location,
            technicianName: technician.name,
            technicianLocation: technician.location,
            customerName: job.customerName,
        };

        return { data: trackingInfo, error: null };

    } catch (e) {
        if (e instanceof z.ZodError) {
            return { data: null, error: e.errors.map((err) => err.message).join(', ') };
        }
        console.error("Error in getTrackingInfoAction:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { data: null, error: `An unexpected error occurred. ${errorMessage}` };
    }
}
