import React, { useState, useEffect, useRef } from 'react';
import { VideoFile, ExportFormat } from './types';
import { convertFrame, safeFilename } from './utils/frames';
import DropZone from './components/DropZone';
import VideoEditor from './components/VideoEditor';
import { FilmIcon, TrashIcon, CheckCircleIcon } from './components/Icons';

function App() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const videosRef = useRef(videos);
  videosRef.current = videos;
  const [error,setError] = useState('');

  // Clean up ObjectURLs to avoid memory leaks
  useEffect(() => {
    return () => {
      videosRef.current.forEach(v => URL.revokeObjectURL(v.objectUrl));
    };
  }, []);

  const handleFilesAdded = (files: File[]) => {
    setError('');
    if (files.some(f=>f.size>300*1024*1024) || files.length+videos.length>10) { setError('Use até 10 vídeos com no máximo 300 MB cada.'); return; }
    const newVideos: VideoFile[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      objectUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      duration: 0,
      capturedFrame: null,
      isProcessed: false,
      timestamp: 0
    }));

    setVideos(prev => [...prev, ...newVideos]);
    
    // Automatically select the first new video if none selected
    if (!activeVideoId && newVideos.length > 0) {
      setActiveVideoId(newVideos[0].id);
    }
  };

  const updateVideo = (updatedVideo: VideoFile) => {
    setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
  };

  const removeVideo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const videoToRemove = videos.find(v => v.id === id);
    if (videoToRemove) {
      URL.revokeObjectURL(videoToRemove.objectUrl);
    }
    
    const newVideos = videos.filter(v => v.id !== id);
    setVideos(newVideos);
    
    if (activeVideoId === id) {
      setActiveVideoId(newVideos.length > 0 ? newVideos[0].id : null);
    }
  };

  const handleExport = async (video: VideoFile, format: ExportFormat, filename: string) => {
    if (!video.capturedFrame) return;
    try {
      const blob=await convertFrame(video.capturedFrame,format);
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=`${safeFilename(filename)}.${format==='jpeg'?'jpg':'png'}`;
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(e) { setError(e instanceof Error?e.message:'Erro ao exportar.'); }
  };

  const activeVideo = videos.find(v => v.id === activeVideoId);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Captura de Quadro
          </h1>
          <p className="text-slate-400 mt-1">Extraia o último frame ou qualquer momento dos seus vídeos instantaneamente.</p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1 rounded border border-slate-800">
          v1.0.0 &bull; Processamento Local
        </div>
      </header>

      {error && <p role="alert" className="text-red-300">{error}</p>}
      {/* Main Content Area */}
      <main className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar / File List */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0 order-2 lg:order-1">
          <DropZone onFilesAdded={handleFilesAdded} />
          
          <div className="flex flex-col gap-3">
             <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                Lista de Vídeos
                <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full text-xs">{videos.length}</span>
             </h2>
             
             {videos.length === 0 ? (
                 <div className="text-center py-8 text-slate-600 text-sm border border-slate-800/50 rounded-xl bg-slate-900/30">
                     Nenhum vídeo adicionado
                 </div>
             ) : (
                 <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {videos.map(video => (
                         <div 
                            key={video.id}
                            onClick={() => setActiveVideoId(video.id)}
                            className={`
                                group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border
                                ${activeVideoId === video.id 
                                    ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-900/20' 
                                    : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-800 hover:border-slate-600'}
                            `}
                         >
                             {/* Status Indicator */}
                             <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                ${video.isProcessed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'}
                             `}>
                                 {video.isProcessed ? <CheckCircleIcon className="w-5 h-5" /> : <FilmIcon className="w-5 h-5" />}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                 <p className={`text-sm font-medium truncate ${activeVideoId === video.id ? 'text-indigo-200' : 'text-slate-200'}`}>
                                     {video.name}
                                 </p>
                                 <p className="text-xs text-slate-500 flex gap-2">
                                     <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                                     {video.isProcessed && <span>&bull; Capturado</span>}
                                 </p>
                             </div>

                             <button 
                                onClick={(e) => removeVideo(e, video.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Remover vídeo"
                             >
                                 <TrashIcon className="w-4 h-4" />
                             </button>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        </aside>

        {/* Editor Area */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
            {activeVideo ? (
                <VideoEditor 
                    key={activeVideo.id} // Force re-mount on video change for clean state
                    video={activeVideo}
                    onUpdate={updateVideo}
                    onExport={handleExport}
                />
            ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 p-8 text-center">
                    <div className="bg-slate-800 p-6 rounded-full mb-6">
                        <FilmIcon className="w-12 h-12 opacity-50" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-300 mb-2">Selecione ou carregue um vídeo</h3>
                    <p className="max-w-md">
                        Use a barra lateral para adicionar arquivos. O editor aparecerá aqui para você ajustar o frame exato.
                    </p>
                </div>
            )}
        </div>

      </main>
    </div>
  );
}

export default App;
