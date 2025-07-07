
"use server";

import { z } from "zod";
import { dbAdmin, storageAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

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

type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

export async function sendChatMessageAction(
  input: SendChatMessageInput
): Promise<{ error: string | null }> {
    try {
        if (!dbAdmin || !storageAdmin) throw new Error("Firebase Admin SDK has not been initialized.");
        
        const { appId, ...messageInput } = SendChatMessageInputSchema.parse(input);

        let imageUrl: string | null = null;

        if (input.attachment && input.attachment.size > 0) {
            const bucket = storageAdmin.bucket(); // Use the initialized storage admin
            const fileBuffer = await input.attachment.arrayBuffer();
            const destination = `chat-attachments/${messageInput.jobId}/${Date.now()}-${input.attachment.name}`;
            
            const fileUpload = bucket.file(destination);
            
            await fileUpload.save(Buffer.from(fileBuffer), {
                metadata: {
                    contentType: input.attachment.type,
                },
            });
            
            // Make the file publicly readable to get a permanent URL
            await fileUpload.makePublic();
            imageUrl = fileUpload.publicUrl();
        }

        const messageData = {
            jobId: messageInput.jobId,
            companyId: messageInput.companyId,
            senderId: messageInput.senderId,
            senderName: messageInput.senderName,
            receiverId: input.receiverId,
            text: input.text,
            imageUrl: imageUrl,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
        };

        await dbAdmin.collection(`artifacts/${appId}/public/data/chatMessages`).add(messageData);
        
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
