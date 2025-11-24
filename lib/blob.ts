import { put } from '@vercel/blob';

export async function uploadMedia(file: File): Promise<string> {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return blob.url;
}

export function getMediaType(filename: string): 'image' | 'video' {
  const ext = filename.toLowerCase().split('.').pop();
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'];
  return videoExtensions.includes(ext || '') ? 'video' : 'image';
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
