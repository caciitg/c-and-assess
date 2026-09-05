import type { StructuredVisual as Visual } from '../../lib/structured-visual';

const palette=['#6d28d9','#0f766e','#c2410c','#1d4ed8','#a21caf','#15803d','#b45309','#be123c'];
type SeriesVisual={kind:'bar'|'line'|'pie';altText:string;spec:{points:Array<{label:string;value:number}>}};
type ScatterVisual={kind:'scatter';altText:string;spec:{points:Array<{x:number;y:number;label?:string}>}};
type FlowVisual={kind:'flowchart';altText:string;spec:{nodes:Array<{id:string;label:string}>;edges:Array<{from:string;to:string}>}};
const extent=(values:number[])=>{const min=Math.min(...values,0),max=Math.max(...values,0);return min===max?{min:min-1,max:max+1}:{min,max};};
const scale=(value:number,min:number,max:number,start:number,end:number)=>start+((value-min)/(max-min))*(end-start);

function BarChart({visual}:{visual:SeriesVisual}){
  const {points}=visual.spec,{min,max}=extent(points.map((point)=>point.value));const zero=scale(0,min,max,270,28),barWidth=Math.max(12,Math.min(54,440/points.length));
  return <svg viewBox="0 0 620 330" role="img" aria-label={visual.altText}>{points.map((point,index)=>{const x=70+index*(500/points.length)+(500/points.length-barWidth)/2,y=scale(point.value,min,max,270,28),height=Math.abs(zero-y);return <g key={`${point.label}-${index}`}><rect x={x} y={Math.min(y,zero)} width={barWidth} height={Math.max(2,height)} fill={palette[index%palette.length]}/><text x={x+barWidth/2} y="294" textAnchor="middle">{point.label.slice(0,12)}</text><text x={x+barWidth/2} y={Math.min(y,zero)-7} textAnchor="middle">{point.value}</text></g>})}<line x1="52" y1={zero} x2="585" y2={zero} stroke="currentColor"/></svg>;
}

function LineOrScatter({visual}:{visual:SeriesVisual|ScatterVisual}){
  const points:Array<{x:number;y:number;label?:string}>=visual.kind==='line'?visual.spec.points.map((point,index)=>({x:index,y:point.value,label:point.label})):(visual as ScatterVisual).spec.points;
  const xRange=extent(points.map((point)=>point.x)),yRange=extent(points.map((point)=>point.y));const plotted=points.map((point)=>({...point,px:scale(point.x,xRange.min,xRange.max,60,574),py:scale(point.y,yRange.min,yRange.max,270,28)}));
  return <svg viewBox="0 0 620 330" role="img" aria-label={visual.altText}><line x1="55" y1="275" x2="585" y2="275" stroke="currentColor"/><line x1="55" y1="20" x2="55" y2="275" stroke="currentColor"/>{visual.kind==='line'&&<polyline points={plotted.map((point)=>`${point.px},${point.py}`).join(' ')} fill="none" stroke="#6d28d9" strokeWidth="4"/>}{plotted.map((point,index)=><g key={`${point.x}-${point.y}-${index}`}><circle cx={point.px} cy={point.py} r="6" fill={palette[index%palette.length]}/><text x={point.px} y="298" textAnchor="middle">{String(point.label||point.x).slice(0,12)}</text><text x={point.px} y={point.py-10} textAnchor="middle">{point.y}</text></g>)}</svg>;
}

function PieChart({visual}:{visual:SeriesVisual}){
  const total=visual.spec.points.reduce((sum,point)=>sum+Math.max(0,point.value),0),radius=105,cx=180,cy=145;
  const sectors=visual.spec.points.map((point,index)=>{const previous=visual.spec.points.slice(0,index).reduce((sum,item)=>sum+Math.max(0,item.value),0),start=-Math.PI/2+(previous/total)*Math.PI*2,end=start+(Math.max(0,point.value)/total)*Math.PI*2;return {point,index,start,end};});
  return <svg viewBox="0 0 620 300" role="img" aria-label={visual.altText}>{sectors.map(({point,index,start,end})=>{const x1=cx+radius*Math.cos(start),y1=cy+radius*Math.sin(start),x2=cx+radius*Math.cos(end),y2=cy+radius*Math.sin(end),large=end-start>Math.PI?1:0;const path=end-start>=Math.PI*2-0.0001?`M ${cx-radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx+radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx-radius} ${cy}`:`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;return <g key={`${point.label}-${index}`}><path d={path} fill={palette[index%palette.length]}/><rect x="350" y={42+index*28} width="14" height="14" fill={palette[index%palette.length]}/><text x="374" y={54+index*28}>{point.label.slice(0,25)} · {point.value}</text></g>})}</svg>;
}

function FlowChart({visual}:{visual:FlowVisual}){
  const labels=new Map(visual.spec.nodes.map((node)=>[node.id,node.label]));return <div className="structured-flow">{visual.spec.edges.map((edge,index)=><div className="structured-flow-edge" key={`${edge.from}-${edge.to}-${index}`}><span>{labels.get(edge.from)}</span><b aria-hidden="true">→</b><span>{labels.get(edge.to)}</span></div>)}</div>;
}

export function StructuredVisual({visual,className='' }:{visual:Visual|null|undefined;className?:string}){
  if(!visual)return null;
  return <figure className={`structured-visual ${className}`} data-kind={visual.kind}><div className="structured-visual-canvas">
    {visual.kind==='table'&&<div className="structured-table-wrap"><table><thead><tr>{visual.spec.headers.map((header,index)=><th key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>{visual.spec.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((cell,index)=><td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>}
    {visual.kind==='bar'&&<BarChart visual={visual}/>} {visual.kind==='line'&&<LineOrScatter visual={visual}/>} {visual.kind==='scatter'&&<LineOrScatter visual={visual}/>} {visual.kind==='pie'&&<PieChart visual={visual}/>} {visual.kind==='flowchart'&&<FlowChart visual={visual}/>} {visual.kind==='equation'&&<div className="structured-equation">{visual.spec.expression}</div>}
  </div><figcaption><strong>Visual description</strong>{visual.altText}</figcaption></figure>;
}
