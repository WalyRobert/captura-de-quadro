import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = (Array.from(e.dataTransfer.files) as File[]).filter((file) =>
        file.type.startsWith('video/')
      );

      if (files.length > 0) {
        onFilesAdded(files);
      }
    },
    [onFilesAdded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = (Array.from(e.target.files) as File[]).filter((file) =>
            file.type.startsWith('video/')
        );
        onFilesAdded(files);
      }
    },
    [onFilesAdded]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
        flex flex-col items-center justify-center p-8 sm:p-12 text-center cursor-pointer group
        ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-400'
        }
      `}
    >
      <input
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload video"
      />
      
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
        <UploadIcon className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-semibold text-slate-100 mb-2">
        Arraste vídeos ou clique para carregar
      </h3>
      <p className="text-sm text-slate-400 max-w-sm">
        Suporta MP4, WebM, AVI, MOV. Processamento local, seus arquivos não saem do dispositivo.
      </p>
    </div>
  );
};

export default DropZone;
