import { ocrTextToVisualDraft,ocrTsvToLayoutText } from '../lib/ocr-visual-draft.ts';

const chart=ocrTextToVisualDraft('North    18\nSouth    21\nEast    15','bar');
if(chart.source!=='North\t18\nSouth\t21\nEast\t15')throw new Error(`Chart OCR draft failed: ${chart.source}`);

const paired=ocrTextToVisualDraft('Product A\n60%\nProduct B\n40%','pie');
if(paired.source!=='Product A\t60\nProduct B\t40')throw new Error(`Paired OCR draft failed: ${paired.source}`);

const table=ocrTextToVisualDraft('Region    2025    2026\nNorth    18    24\nSouth    21    19','table');
if(table.rowsFound!==3||!table.source.includes('Region\t2025\t2026'))throw new Error(`Table OCR draft failed: ${table.source}`);

const flow=ocrTextToVisualDraft('Apply → Review\nReview → Interview','flowchart');
if(flow.source!=='Apply -> Review\nReview -> Interview')throw new Error(`Flow OCR draft failed: ${flow.source}`);

const unsafe=ocrTextToVisualDraft('North\nSouth','bar');
if(unsafe.source)throw new Error('Ambiguous OCR output should not become chart data.');

const tsv='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t10\t10\t50\t14\t95\tNorth\n5\t1\t2\t1\t1\t1\t150\t11\t18\t14\t96\t18\n5\t1\t1\t1\t2\t1\t10\t40\t50\t14\t95\tSouth\n5\t1\t2\t1\t2\t1\t150\t40\t18\t14\t96\t21';
if(ocrTsvToLayoutText(tsv)!=='North\t18\nSouth\t21')throw new Error('TSV layout reconstruction failed.');

console.log('ocr-visual-drafts-ok');
