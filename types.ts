export interface VideoFile {
  id: string;
  file: File;
  objectUrl: string;
  name: string;
  size: number;
  type: string;
  duration: number;
  capturedFrame: string | null; // Data URL of the captured image
  isProcessed: boolean;
  timestamp: number; // The timestamp where the frame was captured
}

export type ExportFormat = 'png' | 'jpeg';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
