import type { ExportFormat } from '../types';
export function convertFrame(dataUrl: string, format: ExportFormat): Promise<Blob> {
 return new Promise((resolve,reject)=>{
  const image=new Image();
  image.onerror=()=>reject(new Error('Não foi possível decodificar a captura.'));
  image.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   if (!canvas.width || !canvas.height) return reject(new Error('Captura sem dimensões.'));
   const context=canvas.getContext('2d');if(!context)return reject(new Error('Canvas indisponível.'));
   context.drawImage(image,0,0);
   canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Falha ao converter a imagem.')),format==='jpeg'?'image/jpeg':'image/png',.95);
  };
  image.src=dataUrl;
 });
}
export function safeFilename(value:string){return value.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').trim().slice(0,100)||'captura';}
