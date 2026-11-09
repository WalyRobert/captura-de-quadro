import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,fireEvent,screen} from '@testing-library/react';
import App from '../App';
vi.mock('../components/DropZone',()=>({default:({onFilesAdded}:any)=><button onClick={()=>onFilesAdded([new File(['a'],'video.mp4',{type:'video/mp4'})])}>Adicionar teste</button>}));
vi.mock('../components/VideoEditor',()=>({default:()=>null}));
it('revoga a URL de um vídeo adicionado depois da montagem',()=>{
 Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:added')});
 const revoke=vi.fn();Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:revoke});
 const {unmount}=render(<App/>);fireEvent.click(screen.getByText('Adicionar teste'));unmount();expect(revoke).toHaveBeenCalledWith('blob:added');
});
