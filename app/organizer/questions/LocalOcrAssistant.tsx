'use client';

import { ChangeEvent,ClipboardEvent,DragEvent,useEffect,useRef,useState } from 'react';
import type { Worker } from 'tesseract.js';
import type { VisualKind } from '../../../lib/structured-visual';
import { ocrTextToVisualDraft,ocrTsvToLayoutText } from '../../../lib/ocr-visual-draft';

type Props={
  visualKind:VisualKind;
  onUseDraft:(source:string)=>void;
  onBusyChange:(busy:boolean)=>void;
};

const MAX_IMAGE_BYTES=10*1024*1024;
const acceptedTypes=new Set(['image/png','image/jpeg','image/webp','image/bmp']);

function progressLabel(status:string){
  if(status.includes('loading tesseract core'))return 'Loading the local OCR engine';
  if(status.includes('loading language traineddata'))return 'Loading the English reading model';
  if(status.includes('initializing'))return 'Preparing OCR';
  if(status.includes('recognizing text'))return 'Reading the image';
  return 'Preparing local OCR';
}

export function LocalOcrAssistant({visualKind,onUseDraft,onBusyChange}:Props){
  const workerRef=useRef<Worker|null>(null);
  const mountedRef=useRef(true);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [status,setStatus]=useState('');
  const [fileName,setFileName]=useState('');
  const [rawText,setRawText]=useState('');
  const [draft,setDraft]=useState('');
  const [note,setNote]=useState('');
  const [confidence,setConfidence]=useState<number|null>(null);

  useEffect(()=>{mountedRef.current=true;return ()=>{mountedRef.current=false;onBusyChange(false);void workerRef.current?.terminate();};},[onBusyChange]);

  function setWorking(value:boolean){setBusy(value);onBusyChange(value);}

  async function readImage(file:File){
    if(!acceptedTypes.has(file.type)){setNote('Use a PNG, JPG, WEBP or BMP image.');return;}
    if(file.size>MAX_IMAGE_BYTES){setNote('Keep the local source image under 10 MB.');return;}
    if(busy)return;
    setWorking(true);setProgress(0);setStatus('Preparing local OCR');setFileName(file.name||'Pasted image');setRawText('');setDraft('');setConfidence(null);setNote('');
    let worker:Worker|null=null;
    try{
      const {createWorker}=await import('tesseract.js');
      worker=await createWorker('eng',undefined,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',logger:(message)=>{
        if(!mountedRef.current)return;
        const fraction=typeof message.progress==='number'?message.progress:0;
        setProgress(Math.max(0,Math.min(100,Math.round(fraction*100))));
        setStatus(progressLabel(String(message.status||'')));
      }});
      workerRef.current=worker;
      if(!mountedRef.current){await worker.terminate();return;}
      const result=await worker.recognize(file,{}, {text:true,tsv:true});
      const text=result.data.text.trim();
      const layoutText=result.data.tsv?ocrTsvToLayoutText(result.data.tsv):'';
      const suggestion=ocrTextToVisualDraft(layoutText||text,visualKind);
      if(!mountedRef.current)return;
      setRawText(text);setDraft(suggestion.source);setNote(suggestion.note);setConfidence(Math.round(result.data.confidence));setProgress(100);setStatus('Local OCR complete');
    }catch(reason){
      if(mountedRef.current){setNote(reason instanceof Error?`OCR could not read this image: ${reason.message}`:'OCR could not read this image. Try a clearer crop.');setStatus('');}
    }finally{
      if(worker){await worker.terminate();if(workerRef.current===worker)workerRef.current=null;}
      if(mountedRef.current)setWorking(false);else onBusyChange(false);
    }
  }

  function selectFile(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(file)void readImage(file);event.target.value='';}
  function pasteImage(event:ClipboardEvent<HTMLDivElement>){const file=Array.from(event.clipboardData.files).find((item)=>item.type.startsWith('image/'));if(!file){setNote('The clipboard does not contain an image. Copy the image itself, then paste here.');return;}event.preventDefault();void readImage(file);}
  function dropImage(event:DragEvent<HTMLDivElement>){event.preventDefault();const file=Array.from(event.dataTransfer.files).find((item)=>item.type.startsWith('image/'));if(file)void readImage(file);else setNote('Drop a PNG, JPG, WEBP or BMP image.');}

  return <section className={`local-ocr ${busy?'is-busy':''}`} aria-labelledby="local-ocr-title">
    <div className="local-ocr-head"><div><strong id="local-ocr-title">Extract from an existing image</strong><small>Free local OCR assistant · the image stays in this browser and is never uploaded or saved.</small></div><span>Optional</span></div>
    <div className="local-ocr-drop" tabIndex={0} onPaste={pasteImage} onDrop={dropImage} onDragOver={(event)=>event.preventDefault()}>
      <strong>{busy?'Reading image…':'Paste or drop a chart/table image here'}</strong><small>Or choose a PNG, JPG, WEBP or BMP · maximum 10 MB</small>
      <label className="local-ocr-file">Choose image<input type="file" accept="image/png,image/jpeg,image/webp,image/bmp" disabled={busy} onChange={selectFile}/></label>
    </div>
    {fileName&&<p className="local-ocr-file-name"><strong>Local source:</strong> {fileName}</p>}
    {busy&&<div className="local-ocr-progress" role="status" aria-live="polite"><div><span>{status}</span><b>{progress}%</b></div><progress max="100" value={progress}/><small>The first use may take longer while the free OCR engine is downloaded and cached.</small></div>}
    {!busy&&(rawText||note)&&<div className="local-ocr-result" role="status">
      <div><strong>OCR draft</strong>{confidence!==null&&<span>Recognition confidence: {confidence}% · not a correctness score</span>}</div>
      {note&&<p>{note}</p>}
      {draft&&<><textarea aria-label="Editable OCR visual-data draft" value={draft} onChange={(event)=>setDraft(event.target.value)}/><button type="button" onClick={()=>onUseDraft(draft)}>Use this editable draft</button></>}
      {rawText&&<details><summary>See original extracted text</summary><pre>{rawText}</pre></details>}
      <small className="local-ocr-warning">OCR can change digits, decimal points, signs, labels and connections. It never publishes automatically; compare the candidate preview with the original image and tick the verification box yourself.</small>
    </div>}
  </section>;
}
