export const visualKinds = ['table','bar','line','pie','scatter','flowchart','equation'] as const;
export type VisualKind = typeof visualKinds[number];

type ChartPoint = { label:string; value:number };
type ScatterPoint = { x:number; y:number; label?:string };
type FlowNode = { id:string; label:string };
type FlowEdge = { from:string; to:string };

export type StructuredVisual =
  | { kind:'table'; altText:string; spec:{ headers:string[]; rows:string[][] } }
  | { kind:'bar'|'line'|'pie'; altText:string; spec:{ points:ChartPoint[] } }
  | { kind:'scatter'; altText:string; spec:{ points:ScatterPoint[] } }
  | { kind:'flowchart'; altText:string; spec:{ nodes:FlowNode[]; edges:FlowEdge[] } }
  | { kind:'equation'; altText:string; spec:{ expression:string } };

export type StoredVisual = { visualKind:string|null; visualSpecJson:string|null; visualAltText:string };
export type VisualInputResult = { visual:StructuredVisual|null; stored:StoredVisual; source:string };

const clean=(value:unknown,limit:number)=>String(value??'').trim().slice(0,limit);
const finite=(value:unknown)=>{const number=Number(value);return Number.isFinite(number)&&Math.abs(number)<=1e12?number:null;};
const lines=(source:string)=>source.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
const columns=(line:string)=>line.split(line.includes('\t')?'\t':line.includes('|')?'|':',').map((cell)=>clean(cell,160));
const emptyStored:StoredVisual={visualKind:null,visualSpecJson:null,visualAltText:''};

function nodeId(label:string,index:number){return `${label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)||'step'}-${index}`;}

export function visualFromAuthorInput(kindValue:unknown,sourceValue:unknown,altValue:unknown):VisualInputResult{
  const kind=clean(kindValue,20).toLowerCase();
  const source=clean(sourceValue,16000);
  const altText=clean(altValue,500);
  if(!kind)return {visual:null,stored:emptyStored,source:''};
  if(!visualKinds.includes(kind as VisualKind))throw new Error('Choose a supported visual type.');
  if(!source)throw new Error('Add the visual data before saving.');
  if(!altText)throw new Error('Describe the visual in words so every candidate can understand it.');
  let visual:StructuredVisual;
  if(kind==='table'){
    const parsed=lines(source).map(columns);if(parsed.length<2)throw new Error('A table needs a heading row and at least one data row.');
    const headers=parsed[0].filter(Boolean);if(headers.length<2||headers.length>8)throw new Error('Use 2–8 table columns.');
    const rows=parsed.slice(1,21).map((row)=>headers.map((_,index)=>clean(row[index],160)));
    if(rows.some((row)=>row.every((cell)=>!cell)))throw new Error('Remove empty table rows.');
    visual={kind:'table',altText,spec:{headers,rows}};
  }else if(kind==='bar'||kind==='line'||kind==='pie'){
    const parsed=lines(source).slice(0,24).map(columns);if(parsed.length<2)throw new Error('Add at least two label-and-value rows.');
    const points=parsed.map((row,index)=>{const value=finite(row[1]);if(!row[0]||value===null)throw new Error(`Row ${index+1} needs a label and a valid number.`);if(kind==='pie'&&value<0)throw new Error('Pie chart values cannot be negative.');return {label:clean(row[0],60),value};});
    if(kind==='pie'&&!points.some((point)=>point.value>0))throw new Error('A pie chart needs at least one value above zero.');
    visual={kind,altText,spec:{points}};
  }else if(kind==='scatter'){
    const parsed=lines(source).slice(0,40).map(columns);if(parsed.length<2)throw new Error('Add at least two x-and-y rows.');
    const points=parsed.map((row,index)=>{const x=finite(row[0]),y=finite(row[1]);if(x===null||y===null)throw new Error(`Row ${index+1} needs valid x and y numbers.`);return {x,y,...(row[2]?{label:clean(row[2],60)}:{})};});
    visual={kind:'scatter',altText,spec:{points}};
  }else if(kind==='flowchart'){
    const paths=lines(source).slice(0,12).map((line)=>line.split(/\s*->\s*/).map((item)=>clean(item,80)).filter(Boolean));
    if(!paths.length||paths.some((path)=>path.length<2))throw new Error('Each flow line must connect at least two steps with ->.');
    const labels:string[]=[];for(const path of paths)for(const label of path)if(!labels.includes(label))labels.push(label);
    if(labels.length>12)throw new Error('Use no more than 12 unique flowchart steps.');
    const nodes=labels.map((label,index)=>({id:nodeId(label,index),label}));const byLabel=new Map(nodes.map((node)=>[node.label,node.id]));const edges:FlowEdge[]=[];
    for(const path of paths)for(let index=0;index<path.length-1;index+=1){const edge={from:byLabel.get(path[index])!,to:byLabel.get(path[index+1])!};if(!edges.some((item)=>item.from===edge.from&&item.to===edge.to))edges.push(edge);}
    if(edges.length>20)throw new Error('Use no more than 20 flowchart connections.');
    visual={kind:'flowchart',altText,spec:{nodes,edges}};
  }else{
    if(source.length>500)throw new Error('Keep the equation under 500 characters.');
    visual={kind:'equation',altText,spec:{expression:source}};
  }
  return {visual,stored:{visualKind:visual.kind,visualSpecJson:JSON.stringify(visual.spec),visualAltText:altText},source};
}

export function visualFromStorage(kindValue:unknown,specValue:unknown,altValue:unknown):StructuredVisual|null{
  const kind=clean(kindValue,20);if(!kind||!visualKinds.includes(kind as VisualKind))return null;
  try{
    const parsed=JSON.parse(String(specValue||''));
    return validateStoredVisual({kind,altText:clean(altValue,500),spec:parsed});
  }catch{return null;}
}

function validateStoredVisual(value:{kind:string;altText:string;spec:unknown}):StructuredVisual|null{
  const spec=value.spec as Record<string,unknown>;if(!value.altText||!spec||typeof spec!=='object')return null;
  if(value.kind==='table'){
    const headers=Array.isArray(spec.headers)?spec.headers.map((item)=>clean(item,160)).slice(0,8):[];
    const rows=Array.isArray(spec.rows)?spec.rows.slice(0,20).map((row)=>Array.isArray(row)?headers.map((_,index)=>clean(row[index],160)):[]):[];
    return headers.length>=2&&rows.length?{kind:'table',altText:value.altText,spec:{headers,rows}}:null;
  }
  if(value.kind==='bar'||value.kind==='line'||value.kind==='pie'){
    const points=Array.isArray(spec.points)?spec.points.slice(0,24).map((item)=>{const row=item as Record<string,unknown>,number=finite(row.value);return number===null?null:{label:clean(row.label,60),value:number};}).filter((item):item is ChartPoint=>Boolean(item?.label)):[];
    return points.length>=2?{kind:value.kind,altText:value.altText,spec:{points}}:null;
  }
  if(value.kind==='scatter'){
    const points=Array.isArray(spec.points)?spec.points.slice(0,40).map((item)=>{const row=item as Record<string,unknown>,x=finite(row.x),y=finite(row.y);return x===null||y===null?null:{x,y,...(row.label?{label:clean(row.label,60)}:{})};}).filter((item):item is ScatterPoint=>Boolean(item)):[];
    return points.length>=2?{kind:'scatter',altText:value.altText,spec:{points}}:null;
  }
  if(value.kind==='flowchart'){
    const nodes=Array.isArray(spec.nodes)?spec.nodes.slice(0,12).map((item)=>{const row=item as Record<string,unknown>;return {id:clean(row.id,40),label:clean(row.label,80)};}).filter((item)=>item.id&&item.label):[];
    const ids=new Set(nodes.map((node)=>node.id));const edges=Array.isArray(spec.edges)?spec.edges.slice(0,20).map((item)=>{const row=item as Record<string,unknown>;return {from:clean(row.from,40),to:clean(row.to,40)};}).filter((item)=>ids.has(item.from)&&ids.has(item.to)):[];
    return nodes.length>=2&&edges.length?{kind:'flowchart',altText:value.altText,spec:{nodes,edges}}:null;
  }
  const expression=clean(spec.expression,500);return value.kind==='equation'&&expression?{kind:'equation',altText:value.altText,spec:{expression}}:null;
}

export function visualToAuthorSource(visual:StructuredVisual|null):string{
  if(!visual)return '';
  if(visual.kind==='table')return [visual.spec.headers,...visual.spec.rows].map((row)=>row.join('\t')).join('\n');
  if(visual.kind==='bar'||visual.kind==='line'||visual.kind==='pie')return visual.spec.points.map((point)=>`${point.label}\t${point.value}`).join('\n');
  if(visual.kind==='scatter')return visual.spec.points.map((point)=>`${point.x}\t${point.y}${point.label?`\t${point.label}`:''}`).join('\n');
  if(visual.kind==='flowchart'){
    const labels=new Map(visual.spec.nodes.map((node)=>[node.id,node.label]));return visual.spec.edges.map((edge)=>`${labels.get(edge.from)} -> ${labels.get(edge.to)}`).join('\n');
  }
  return visual.kind==='equation'?visual.spec.expression:'';
}

export function visualInputHelp(kind:string){
  if(kind==='table')return {label:'Table data',help:'Paste from a spreadsheet. The first row is the headings; use tabs, |, or commas.',placeholder:'Category\t2025\t2026\nNorth\t18\t24\nSouth\t21\t19'};
  if(kind==='bar'||kind==='line'||kind==='pie')return {label:'Chart data',help:'One label and number per row, separated by a tab or comma.',placeholder:'North\t18\nSouth\t21\nEast\t15'};
  if(kind==='scatter')return {label:'Plot data',help:'One x value, y value, and optional point label per row.',placeholder:'10\t22\tA\n15\t30\tB\n20\t27\tC'};
  if(kind==='flowchart')return {label:'Flow steps',help:'Connect steps with ->. Add another line for a branch.',placeholder:'Application -> Review -> Interview -> Offer\nReview -> Rejected'};
  if(kind==='equation')return {label:'Equation',help:'Use readable symbols or plain text. Candidates see exactly what you type.',placeholder:'P(A | B) = P(A ∩ B) / P(B)'};
  return {label:'Visual data',help:'Choose a visual type first.',placeholder:''};
}
