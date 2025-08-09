
'use server';

import { z } from 'zod';
import { storageAdmin } from '@/lib/firebase-admin';

const UploadAvatarInputSchema = z.object({
  technicianId: z.string().min(1, 'Technician ID is required.'),
  file: z.instanceof(File),
  appId: z.string().min(1, 'App ID is required.'),
});

type UploadAvatarInput = z.infer<typeof UploadAvatarInputSchema>;

export async function uploadAvatarAction(
  input: UploadAvatarInput,
): Promise<{ data: { url: string } | null; error: string | null }> {
  try {
    if (!storageAdmin) {
      throw new Error('Firebase Storage Admin SDK has not been initialized.');
    }

    const validatedInput = UploadAvatarInputSchema.parse(input);
    const { technicianId, file, appId } = validatedInput;

    const bucket = storageAdmin.bucket();
    const destination = `avatars/${technicianId}/${Date.now()}-${file.name}`;
    const fileUpload = bucket.file(destination);
    
    const fileBuffer = await file.arrayBuffer();

    await fileUpload.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file publicly readable to get a permanent URL
    await fileUpload.makePublic();
    
    // The public URL is what we store in Firestore
    const publicUrl = fileUpload.publicUrl();

    return { data: { url: publicUrl }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(`Error uploading avatar: ${errorMessage}`);
    return { data: null, error: `Failed to upload avatar. ${errorMessage}` };
  }
}

const UploadCertificateInputSchema = z.object({
  technicianId: z.string().min(1, 'Technician ID is required.'),
  skillName: z.string().min(1, 'Skill name is required.'),
  file: z.instanceof(File),
  appId: z.string().min(1, 'App ID is required.'),
});

type UploadCertificateInput = z.infer<typeof UploadCertificateInputSchema>;

export async function uploadCertificateAction(
  input: UploadCertificateInput,
): Promise<{ data: { url: string, fileName: string } | null; error: string | null }> {
  try {
    if (!storageAdmin) {
      throw new Error('Firebase Storage Admin SDK has not been initialized.');
    }

    const validatedInput = UploadCertificateInputSchema.parse(input);
    const { technicianId, skillName, file, appId } = validatedInput;

    if (file.type !== 'application/pdf') {
        return { data: null, error: "Only PDF files are allowed for certificates." };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { data: null, error: "File size cannot exceed 5MB." };
    }

    const bucket = storageAdmin.bucket();
    const sanitizedSkillName = skillName.replace(/[^a-zA-Z0-9]/g, '_');
    const destination = `certificates/${technicianId}/${sanitizedSkillName}-${Date.now()}.pdf`;
    const fileUpload = bucket.file(destination);
    
    const fileBuffer = await file.arrayBuffer();

    await fileUpload.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type,
      },
    });

    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    return { data: { url: publicUrl, fileName: file.name }, error: null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { data: null, error: e.errors.map((err) => err.message).join(', ') };
    }
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error(`Error uploading certificate: ${errorMessage}`);
    return { data: null, error: `Failed to upload certificate. ${errorMessage}` };
  }
}
