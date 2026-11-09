import React, { useRef, useState, useEffect, useCallback } from 'react';
import { convertFrame, safeFilename } from '../utils/frames';
import { VideoFile, ExportFormat } from '../types';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, CameraIcon, DownloadIcon, ShareIcon } from './Icons';

interface VideoEditorProps {
  video: VideoFile;
  onUpdate: (updatedVideo: VideoFile) => void;
  onExport: (video: VideoFile, format: ExportFormat, filename: string) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const VideoEditor: React.FC<VideoEditorProps> = ({ video, onUpdate, onExport }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [error,setError]=useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [exportName, setExportName] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [isAutoSeeking, setIsAutoSeeking] = useState(false);

  // Initialize export name based on video filename
  useEffect(() => {
    const nameWithoutExt = video.name.substring(0, video.name.lastIndexOf('.')) || video.name;
    setExportName(`${nameWithoutExt}_frame`);
  }, [video.name]);

  // Handle video processing
  const captureFrame = useCallback(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    
    if (!videoEl || !canvasEl) return;

    if (videoEl.readyState<2 || !videoEl.videoWidth || videoEl.videoWidth*videoEl.videoHeight>24000000) { setError('Vídeo indisponível ou maior que 24 milhões de pixels.'); return; }
    setError('');
    // Set canvas dimensions to match original video resolution
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
    
    try {
      // Export as high quality PNG
      const dataUrl = canvasEl.toDataURL('image/png', 1.0);
      
      onUpdate({
        ...video,
        capturedFrame: dataUrl,
        isProcessed: true,
        timestamp: videoEl.currentTime,
        duration: videoEl.duration // Ensure duration is accurate
      });
    } catch (err) {
      console.error("Error capturing frame", err);
    }
  }, [video, onUpdate]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().then(()=>setIsPlaying(true)).catch(()=>setError('O navegador não iniciou o vídeo. Verifique formato e permissões.'));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    
    const vidDuration = el.duration;
    if(!Number.isFinite(vidDuration)||vidDuration<=0){setError('Duração do vídeo inválida.');return;}
    setDuration(vidDuration);
    setIsMetadataLoaded(true);

    // Auto-seek logic for "Last Frame" if not already processed or explicitly requested
    if (!video.isProcessed) {
        setIsAutoSeeking(true);
        // Seek to end minus a tiny buffer to avoid black frames or loops
        // Some browsers struggle with exact duration
        el.currentTime = Math.max(0, vidDuration - 0.1); 
    } else if (video.timestamp > 0) {
        el.currentTime = video.timestamp;
    }
  };

  const handleSeeked = () => {
      // If this seek was triggered by our auto-logic, capture the frame now
      if (isAutoSeeking) {
          captureFrame();
          setIsAutoSeeking(false);
      }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      seekTo(videoRef.current.currentTime+seconds);
    }
  };

  const handleShare = async () => {
    if (!video.capturedFrame) return;
    
    try {
        const blob = await convertFrame(video.capturedFrame,exportFormat);
        const file = new File([blob], `${safeFilename(exportName)}.${exportFormat==='jpeg'?'jpg':'png'}`, { type: `image/${exportFormat}` });
        
        if (navigator.share && typeof navigator.canShare==='function' && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Frame Capturado',
                text: 'Confira este frame que capturei do vídeo.'
            });
        } else {
            alert('Compartilhamento não suportado neste navegador.');
        }
    } catch (error) {
        console.error('Error sharing:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {/* Main Grid: Player and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">
        
        {/* Video Player Column */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Fonte de Vídeo
            </h3>
            <span className="text-xs text-slate-400 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          
          <div className="relative group bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-700/50 aspect-video">
            <video
              ref={videoRef}
              src={video.objectUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onSeeked={handleSeeked}
              onEnded={() => setIsPlaying(false)}
              onError={()=>setError('Vídeo não suportado ou arquivo inválido.')}
              playsInline
              crossOrigin="anonymous" 
            />
            {/* Overlay Play Button */}
            {!isPlaying && (
                <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full hover:bg-white/20 transition-all hover:scale-110">
                        <PlayIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-4">
            {/* Timeline */}
            <input
              type="range"
              min="0"
              max={duration}
              step="0.01"
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button onClick={() => seekTo(0)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="Primeiro Quadro">
                        <SkipBackIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => skip(-0.04)} className="hidden sm:block p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="-1 Frame (aprox)">
                        <span className="text-xs font-bold">-1f</span>
                    </button>
                    <button 
                        onClick={togglePlay}
                        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={() => skip(0.04)} className="hidden sm:block p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="+1 Frame (aprox)">
                        <span className="text-xs font-bold">+1f</span>
                    </button>
                    <button onClick={() => seekTo(duration - 0.05)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="Último Quadro">
                        <SkipForwardIcon className="w-5 h-5" />
                    </button>
                </div>

                <button 
                    onClick={captureFrame}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
                >
                    <CameraIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Capturar</span>
                </button>
            </div>
          </div>
        </div>

        {/* Result Preview Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
             Captura
          </h3>
          
          <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-700/50 aspect-video flex items-center justify-center group">
            <canvas ref={canvasRef} className="hidden" />
            {video.capturedFrame ? (
              <img 
                src={video.capturedFrame} 
                alt="Captured Frame" 
                className="w-full h-full object-contain"
              />
            ) : (
                <div className="text-slate-500 flex flex-col items-center">
                    <CameraIcon className="w-12 h-12 opacity-50 mb-2" />
                    <span className="text-sm">Aguardando captura...</span>
                </div>
            )}
             {video.capturedFrame && (
                 <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded border border-white/10">
                     Resolução Original
                 </div>
             )}
          </div>

          {/* Export Options */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 uppercase font-semibold">Nome do Arquivo</label>
                  <input 
                    type="text" 
                    value={exportName}
                    onChange={(e) => setExportName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="nome-do-arquivo"
                  />
              </div>

              <div className="flex gap-2">
                 <button 
                    onClick={() => setExportFormat('png')}
                    className={`flex-1 py-2 text-sm rounded-lg border ${exportFormat === 'png' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                 >
                     PNG
                 </button>
                 <button 
                    onClick={() => setExportFormat('jpeg')}
                    className={`flex-1 py-2 text-sm rounded-lg border ${exportFormat === 'jpeg' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                 >
                     JPG
                 </button>
              </div>

              <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => onExport(video, exportFormat, exportName)}
                    disabled={!video.capturedFrame}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                  >
                      <DownloadIcon className="w-5 h-5" />
                      Baixar Imagem
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={!video.capturedFrame}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl border border-slate-600 transition-colors"
                    title="Compartilhar"
                  >
                      <ShareIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
