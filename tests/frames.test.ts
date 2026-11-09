import {it,expect,vi} from 'vitest';
import {convertFrame,safeFilename} from '../utils/frames';
it('converte bytes para o MIME solicitado antes do download',async()=>{
 const draw=vi.fn();const encode=vi.fn((cb:(b:Blob)=>void,type:string)=>cb(new Blob(['encoded'],{type})));
 vi.stubGlobal('Image',class {naturalWidth=10;naturalHeight=10;onload=()=>{};onerror=()=>{};set src(value:string){queueMicrotask(()=>this.onload());}});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:draw} as any);
 vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(encode as any);
 expect((await convertFrame('data:image/png;base64,eA==','jpeg')).type).toBe('image/jpeg');
 expect((await convertFrame('data:image/png;base64,eA==','png')).type).toBe('image/png');
 expect(draw).toHaveBeenCalledTimes(2);expect(safeFilename('../arquivo:name')).not.toContain('/');vi.unstubAllGlobals();
});
