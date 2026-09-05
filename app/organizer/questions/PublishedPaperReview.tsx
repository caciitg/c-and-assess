'use client';

import { FormEvent,useMemo,useState } from 'react';
import { StructuredVisual } from '../../_components/StructuredVisual';
import { usePendingNavigationGuard } from '../../_components/usePendingNavigationGuard';
import { visualFromAuthorInput,visualFromStorage,visualInputHelp,visualKinds,visualToAuthorSource } from '../../../lib/structured-visual';

export type PublishedQuestion={id:string;position:number;type:string;prompt:string;passage:string;options_json:string;answers_json:string;solution:string;marks:number;negative_marks:number;topic:string;subtopic:string;difficulty:string;image_key:string|null;visual_kind:string|null;visual_spec_json:string|null;visual_alt_text:string};
const json=(value:string)=>{try{return JSON.parse(value||'[]') as string[];}catch{return [];}};

export function PublishedPaperReview({initial,status}:{initial:PublishedQuestion[];status:string}){
  const [questions,setQuestions]=useState(initial);
  const [editing,setEditing]=useState<PublishedQuestion|null>(null);
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const [editorDirty,setEditorDirty]=useState(false);
  const [imageFile,setImageFile]=useState<File|null>(null);
  const [removeImage,setRemoveImage]=useState(false);
  const [visualKind,setVisualKind]=useState('');
  const [visualSource,setVisualSource]=useState('');
  const [visualAltText,setVisualAltText]=useState('');
  const [visualVerified,setVisualVerified]=useState(false);
  const locked=['live','ended','results_processing','results_ready','results_released','archived'].includes(status);
  const imageCount=questions.filter((question)=>Boolean(question.image_key)).length;
  const visualCount=questions.filter((question)=>Boolean(question.visual_kind)).length;
  usePendingNavigationGuard(Boolean(editing)&&(editorDirty||saving),'This question has changes that are not safely saved yet. Leave the organizer workspace anyway?');

  const draft=useMemo(()=>{if(!visualKind)return {visual:null,error:''};try{return {visual:visualFromAuthorInput(visualKind,visualSource,visualAltText).visual,error:''};}catch(reason){return {visual:null,error:reason instanceof Error?reason.message:'Check the visual data.'};}},[visualAltText,visualKind,visualSource]);
  const help=visualInputHelp(visualKind);
  const originalVisual=editing?visualFromStorage(editing.visual_kind,editing.visual_spec_json,editing.visual_alt_text):null;
  const visualChanged=editing?visualKind!==(editing.visual_kind||'')||visualSource!==visualToAuthorSource(originalVisual)||visualAltText!==(editing.visual_alt_text||''):false;

  function edit(question:PublishedQuestion){
    const visual=visualFromStorage(question.visual_kind,question.visual_spec_json,question.visual_alt_text);
    setEditing(question);setEditorDirty(false);setImageFile(null);setRemoveImage(false);setMessage('');
    setVisualKind(visual?.kind||'');setVisualSource(visualToAuthorSource(visual));setVisualAltText(visual?.altText||'');setVisualVerified(false);
  }
  function close(){if((editorDirty||saving)&&!window.confirm('Discard the unsaved changes to this question?'))return;setEditing(null);setEditorDirty(false);setImageFile(null);setRemoveImage(false);}
  function changeVisual(next:()=>void){next();setVisualVerified(false);setEditorDirty(true);}

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editing)return;if(visualChanged&&visualKind&&!visualVerified){setMessage('Please preview the visual and confirm that its data and description are correct.');return;}setSaving(true);setMessage('');
    try{
      const form=new FormData(event.currentTarget);
      const options=String(form.get('options')||'').split('\n').map((item)=>item.trim()).filter(Boolean);
      const answers=String(form.get('answers')||'').split('\n').map((item)=>item.trim()).filter(Boolean);
      const visualPayload=visualChanged?{visualKind,visualSource,visualAltText,visualVerified}: {};
      const response=await fetch('/api/questions/manage',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({questionId:editing.id,prompt:form.get('prompt'),passage:form.get('passage'),options,answers,solution:form.get('solution'),marks:Number(form.get('marks')),negativeMarks:Number(form.get('negativeMarks')),topic:form.get('topic'),subtopic:form.get('subtopic'),difficulty:form.get('difficulty'),...visualPayload})});
      const data=await response.json() as {error?:string;question?:PublishedQuestion};
      if(!response.ok||!data.question)throw new Error(data.error||'Question could not be updated.');
      let updated=data.question;setQuestions((items)=>items.map((item)=>item.id===editing.id?updated:item));
      if(imageFile||removeImage){
        const imageForm=new FormData();imageForm.append('questionId',editing.id);imageForm.append('remove',String(removeImage));if(imageFile)imageForm.append('image',imageFile,imageFile.name);
        const imageResponse=await fetch('/api/questions/manage-image',{method:'POST',body:imageForm});const imageData=await imageResponse.json() as {error?:string;imageKey?:string|null};
        if(!imageResponse.ok)throw new Error(`Question text was saved, but the image was not changed: ${imageData.error||'image update failed.'}`);
        updated={...updated,image_key:imageData.imageKey||null};setQuestions((items)=>items.map((item)=>item.id===editing.id?updated:item));
      }
      setEditing(null);setEditorDirty(false);setImageFile(null);setRemoveImage(false);setMessage(`Question ${editing.position} is saved. Its structured visual is candidate-ready.`);
    }catch(reason){setMessage(reason instanceof Error?reason.message:'Question could not be updated.');}
    finally{setSaving(false);}
  }

  if(!questions.length)return null;
  return <section className="published-paper-review">
    <header><div><p className="page-label">Published paper · used by candidates</p><h3>Preview the complete published paper</h3><p>This is the exact question paper candidates receive. Add a no-cost structured visual after importing the CSV, without uploading an image.</p></div><div className="published-paper-status"><strong>{questions.length} questions</strong><span>{visualCount} structured visual{visualCount===1?'':'s'}</span>{imageCount>0&&<span>{imageCount} stored image{imageCount===1?'':'s'}</span>}</div></header>
    {message&&<p className="paper-review-message" role="status">{message}</p>}
    <div className="published-question-list">{questions.map((question,index)=>{const options=json(question.options_json),answers=json(question.answers_json),visual=visualFromStorage(question.visual_kind,question.visual_spec_json,question.visual_alt_text);return <details open={questions.length<=5||index===0} key={question.id}>
      <summary><span>Q{question.position}</span><strong>{question.prompt}</strong><small>{question.type.toUpperCase()} · {question.topic} · {question.marks} marks</small></summary>
      <div className="published-question-body">{question.passage&&<div className="review-passage">{question.passage}</div>}<h4>{question.prompt}</h4>
        {question.image_key&&<img src={`/api/questions/preview-image?questionId=${encodeURIComponent(question.id)}&v=${encodeURIComponent(question.image_key)}`} alt={question.visual_alt_text||`Reference for question ${question.position}`}/>}<StructuredVisual visual={visual}/>{!question.image_key&&!visual&&<p className="paper-no-image">Text-only question · no supporting visual.</p>}<ol>{options.map((option)=><li className={answers.includes(option)?'correct':''} key={option}>{option}{answers.includes(option)&&<b>Answer</b>}</li>)}</ol>
        {question.type==='tita'&&<p className="published-tita"><strong>Accepted answer:</strong> {answers.join(' · ')}</p>}<div className="published-solution"><strong>Solution</strong><p>{question.solution||'No written solution added.'}</p></div><button type="button" disabled={locked} onClick={()=>edit(question)}>{locked?'Locked after candidate activity':'Edit question & visual'}</button>
      </div></details>;})}</div>
    {editing&&<div className="paper-edit-modal" role="dialog" aria-modal="true" aria-labelledby="question-editor-title"><form onSubmit={save} onChange={()=>setEditorDirty(true)}><header><div><p className="page-label">Edit question {editing.position}</p><h3 id="question-editor-title">Correct this question in place</h3></div><button type="button" onClick={close}>Close</button></header>
      <label>Question<textarea name="prompt" defaultValue={editing.prompt} required/></label><label>Passage / shared context<textarea name="passage" defaultValue={editing.passage}/></label>
      {editing.type!=='tita'&&<label>Options <small>One option per line</small><textarea name="options" defaultValue={json(editing.options_json).join('\n')} required/></label>}
      <label>Correct answer{editing.type==='multi'&&'s'} <small>Exact option text; one answer per line</small><textarea name="answers" defaultValue={json(editing.answers_json).join('\n')} required/></label><label>Solution<textarea name="solution" defaultValue={editing.solution}/></label>
      <section className="visual-builder"><div className="visual-builder-head"><div><span>Supporting visual · no image storage needed</span><small>Choose a format and paste verified data. Nothing is sent to an AI service.</small></div>{visualKind&&<button type="button" onClick={()=>changeVisual(()=>{setVisualKind('');setVisualSource('');setVisualAltText('');})}>Remove visual</button>}</div>
        <label>Visual type<select value={visualKind} onChange={(event)=>changeVisual(()=>setVisualKind(event.target.value))}><option value="">None · text-only question</option>{visualKinds.map((kind)=><option value={kind} key={kind}>{kind==='flowchart'?'Flow diagram':kind[0].toUpperCase()+kind.slice(1)}</option>)}</select></label>
        {visualKind&&<><label>{help.label}<small>{help.help}</small><textarea value={visualSource} placeholder={help.placeholder} onChange={(event)=>changeVisual(()=>setVisualSource(event.target.value))}/></label><label>Describe the visual in words <small>Required for accessibility and as a fallback on very small screens.</small><textarea value={visualAltText} placeholder="State the pattern and all information needed to answer the question." onChange={(event)=>changeVisual(()=>setVisualAltText(event.target.value))}/></label>
          <div className={`visual-preview ${draft.error?'has-error':''}`}><strong>Candidate preview</strong>{draft.error?<p>{draft.error}</p>:<StructuredVisual visual={draft.visual}/>}</div>
          <label className="visual-confirm"><input type="checkbox" checked={visualVerified} onChange={(event)=>{setVisualVerified(event.target.checked);setEditorDirty(true);}}/> I checked the preview, every value and the written description against the original source.</label></>}
      </section>
      <div className="paper-image-editor"><span>Original image storage · optional later</span><small>{editing.image_key?'A protected R2 image is currently attached. You can retain, replace or remove it.':'R2 is postponed. Use the structured visual builder above for tables, charts, flows and equations.'}</small>{editing.image_key&&<><input name="replacementImage" type="file" accept="image/png,image/jpeg" onChange={(event)=>{setImageFile(event.target.files?.[0]||null);setRemoveImage(false);setEditorDirty(true);}}/><label><input type="checkbox" checked={removeImage} onChange={(event)=>{setRemoveImage(event.target.checked);if(event.target.checked)setImageFile(null);setEditorDirty(true);}}/> Remove the current image</label></>}</div>
      <div className="paper-edit-grid"><label>Marks<input name="marks" type="number" min="0.01" step="0.01" defaultValue={editing.marks} required/></label><label>Negative marks<input name="negativeMarks" type="number" min="0" step="0.01" defaultValue={editing.negative_marks}/></label><label>Topic<input name="topic" defaultValue={editing.topic}/></label><label>Subtopic <small>Optional</small><input name="subtopic" defaultValue={editing.subtopic}/></label><label>Difficulty<select name="difficulty" defaultValue={editing.difficulty}><option>easy</option><option>medium</option><option>hard</option></select></label></div><button className="solid-action" disabled={saving||Boolean(visualChanged&&visualKind&&(!visualVerified||draft.error))}>{saving?'Saving question…':'Save question & visual'}</button>
    </form></div>}
  </section>;
}
