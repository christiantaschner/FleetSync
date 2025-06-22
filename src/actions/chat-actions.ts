
"use server";

import { z } from "zod";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const SendChatMessageInputSchema = z.object({
    jobId: z.string(),
    companyId: z.string(),
    senderId: z.string(),
    senderName: z.string(),
    receiverId: z.string(),
    text: z.string(),
    attachment: z.instanceof(File).optional(),
});

type SendChatMessageInput = {
    jobId: string;
    companyId: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    text: string;
    attachment?: File;
};

export async function sendChatMessageAction(
  input: SendChatMessageInput
): Promise<{ error: string | null }> {
    try {
        if (!db || !storage) throw new Error("Firebase not initialized");

        let imageUrl: string | null = null;

        if (input.attachment) {
            const attachmentRef = ref(storage, `chat-attachments/${input.jobId}/${Date.now()}-${input.attachment.name}`);
            await uploadBytes(attachmentRef, input.attachment);
            imageUrl = await getDownloadURL(attachmentRef);
        }

        const messageData = {
            jobId: input.jobId,
            companyId: input.companyId,
            senderId: input.senderId,
            senderName: input.senderName,
            receiverId: input.receiverId,
            text: input.text,
            imageUrl: imageUrl,
            timestamp: serverTimestamp(),
            isRead: false,
        };

        await addDoc(collection(db, "chatMessages"), messageData);
        
        return { error: null };
    } catch (e) {
        console.error("Error sending chat message:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { error: `Failed to send message. ${errorMessage}` };
    }
}
