
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
    appId: z.string().min(1, 'App ID is required.'),
});

type SendChatMessageInput = {
    jobId: string;
    companyId: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    text: string;
    attachment?: File;
    appId: string;
};

export async function sendChatMessageAction(
  input: SendChatMessageInput
): Promise<{ error: string | null }> {
    try {
        const { appId, ...messageInput } = SendChatMessageInputSchema.parse(input);
        if (!db || !storage) throw new Error("Firebase not initialized");

        let imageUrl: string | null = null;

        if (input.attachment) {
            const attachmentRef = ref(storage, `chat-attachments/${messageInput.jobId}/${Date.now()}-${messageInput.attachment.name}`);
            await uploadBytes(attachmentRef, input.attachment);
            imageUrl = await getDownloadURL(attachmentRef);
        }

        const messageData = {
            jobId: messageInput.jobId,
            companyId: messageInput.companyId,
            senderId: messageInput.senderId,
            senderName: messageInput.senderName,
            receiverId: input.receiverId,
            text: input.text,
            imageUrl: imageUrl,
            timestamp: serverTimestamp(),
            isRead: false,
        };

        await addDoc(collection(db, `artifacts/${appId}/public/data/chatMessages`), messageData);
        
        return { error: null };
    } catch (e) {
        if (e instanceof z.ZodError) {
          return { error: e.errors.map((err) => err.message).join(', ') };
        }
        console.error("Error sending chat message:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        return { error: `Failed to send message. ${errorMessage}` };
    }
}
