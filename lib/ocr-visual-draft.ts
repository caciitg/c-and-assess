import type { VisualKind } from './structured-visual';

export type OcrVisualDraft = {
  source:string;
  note:string;
  rowsFound:number;
};

type PositionedWord={text:string;left:number;top:number;width:number;height:number;centerY:number};

const tidy=(value:string)=>value
  .replace(/[\u2012-\u2015\u2212]/g,'-')
  .replace(/[\u2192\u27f6\u279c\u279d\u27a1]/g,' -> ')
  .replace(/\u00a0/g,' ')
  .replace(/\s*->\s*/g,' -> ')
  .replace(/[ \t]+$/gm,'')
  .trim();

const cleanNumber=(value:string)=>value.replace(/,/g,'').replace(/%$/,'');
const isNumber=(value:string)=>/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(value.replace(/,/g,''));
const splitColumns=(line:string)=>line.split(line.includes('\t')?'\t':line.includes('|')?'|':/\s{2,}/).map((cell)=>cell.trim()).filter(Boolean);

export function ocrTsvToLayoutText(tsv:string){
  const words:PositionedWord[]=[];
  for(const row of tsv.split(/\r?\n/).slice(1)){
    const cells=row.split('\t');if(cells[0]!=='5'||cells.length<12)continue;
    const left=Number(cells[6]),top=Number(cells[7]),width=Number(cells[8]),height=Number(cells[9]),text=cells.slice(11).join('\t').trim();
    if(!text||![left,top,width,height].every(Number.isFinite))continue;
    words.push({text,left,top,width,height,centerY:top+height/2});
  }
  words.sort((a,b)=>a.centerY-b.centerY||a.left-b.left);
  const rows:PositionedWord[][]=[];
  for(const word of words){
    const row=rows.find((items)=>Math.abs(items.reduce((sum,item)=>sum+item.centerY,0)/items.length-word.centerY)<=Math.max(5,word.height*.65));
    if(row)row.push(word);else rows.push([word]);
  }
  return rows.sort((a,b)=>Math.min(...a.map((word)=>word.top))-Math.min(...b.map((word)=>word.top))).map((row)=>{
    row.sort((a,b)=>a.left-b.left);let output='';
    for(let index=0;index<row.length;index+=1){const word=row[index];if(index){const previous=row[index-1],gap=word.left-(previous.left+previous.width);output+=gap>Math.max(18,Math.min(previous.height,word.height)*1.4)?'\t':' ';}output+=word.text;}
    return output;
  }).join('\n');
}

function chartRows(lines:string[]){
  const rows:string[]=[];
  for(let index=0;index<lines.length;index+=1){
    const columns=splitColumns(lines[index]);
    if(columns.length>=2&&isNumber(columns.at(-1)!)){
      rows.push(`${columns.slice(0,-1).join(' ')}\t${cleanNumber(columns.at(-1)!)}`);
      continue;
    }
    const match=lines[index].match(/^(.+?)[\s|,:;=-]+(-?(?:\d[\d,]*(?:\.\d+)?|\.\d+)%?)$/);
    if(match){rows.push(`${match[1].trim()}\t${cleanNumber(match[2])}`);continue;}
    if(index+1<lines.length&&isNumber(lines[index+1].trim())){
      rows.push(`${lines[index]}\t${cleanNumber(lines[index+1].trim())}`);index+=1;
    }
  }
  return rows;
}

function scatterRows(lines:string[]){
  const rows:string[]=[];
  for(const line of lines){
    const columns=splitColumns(line);
    const numbers=columns.filter(isNumber);
    if(numbers.length<2)continue;
    const label=columns.filter((cell)=>!isNumber(cell)).join(' ');
    rows.push(`${cleanNumber(numbers[0])}\t${cleanNumber(numbers[1])}${label?`\t${label}`:''}`);
  }
  return rows;
}

function tableRows(lines:string[]){
  const rows=lines.map(splitColumns).filter((row)=>row.length>=2);
  if(rows.length<2)return [];
  const width=Math.min(8,Math.max(...rows.map((row)=>row.length)));
  return rows.slice(0,21).map((row)=>row.slice(0,width).join('\t'));
}

export function ocrTextToVisualDraft(rawText:string,kind:VisualKind):OcrVisualDraft{
  const text=tidy(rawText).slice(0,16000);
  const lines=text.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
  if(!lines.length)return {source:'',rowsFound:0,note:'No readable text was found. Try a sharper, tightly cropped image.'};

  if(kind==='bar'||kind==='line'||kind==='pie'){
    const rows=chartRows(lines).slice(0,24);
    return {source:rows.join('\n'),rowsFound:rows.length,note:rows.length>=2?'Possible label-and-value rows were found. Check every label, decimal, sign and percentage.':'The OCR text did not contain two clear label-and-value pairs. Edit the extracted text manually.'};
  }
  if(kind==='scatter'){
    const rows=scatterRows(lines).slice(0,40);
    return {source:rows.join('\n'),rowsFound:rows.length,note:rows.length>=2?'Possible x/y pairs were found. Confirm the axis order and every point.':'The OCR text did not contain two clear numeric pairs. Enter the points manually.'};
  }
  if(kind==='table'){
    const rows=tableRows(lines);
    return {source:rows.join('\n'),rowsFound:rows.length,note:rows.length>=2?'Possible table rows were found. Confirm the heading row, column order and every cell.':'The OCR could not reliably recover table columns. Try a tighter crop or paste the table from a spreadsheet.'};
  }
  if(kind==='flowchart'){
    const arrows=lines.filter((line)=>line.includes('->')).slice(0,12);
    return {source:arrows.join('\n'),rowsFound:arrows.length,note:arrows.length?'Possible arrow connections were found. Confirm every step and connection.':'OCR found text, but not reliable connections. Enter each verified path as Step -> Step.'};
  }
  if(kind==='equation'){
    const source=lines.slice(0,6).join(' ').slice(0,500);
    return {source,rowsFound:source?1:0,note:'OCR commonly confuses mathematical symbols. Compare every operator, subscript and bracket with the source.'};
  }
  return {source:'',rowsFound:0,note:'Choose a supported visual type first.'};
}
