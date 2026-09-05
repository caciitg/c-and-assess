import { visualFromAuthorInput,visualFromStorage,visualToAuthorSource } from '../lib/structured-visual.ts';

const samples=[
  ['table','Category\t2025\t2026\nNorth\t18\t24\nSouth\t21\t19'],
  ['bar','North\t18\nSouth\t21'],
  ['line','Jan\t10\nFeb\t14\nMar\t12'],
  ['pie','Product A\t60\nProduct B\t40'],
  ['scatter','10\t22\tA\n15\t30\tB'],
  ['flowchart','Application -> Review -> Interview -> Offer\nReview -> Rejected'],
  ['equation','P(A | B) = P(A intersection B) / P(B)'],
];
for(const [kind,source] of samples){
  const parsed=visualFromAuthorInput(kind,source,`Verified description for ${kind}.`);
  if(!parsed.visual||parsed.visual.kind!==kind)throw new Error(`Failed to parse ${kind}`);
  const restored=visualFromStorage(parsed.stored.visualKind,parsed.stored.visualSpecJson,parsed.stored.visualAltText);
  if(!restored||restored.kind!==kind||!visualToAuthorSource(restored))throw new Error(`Failed to restore ${kind}`);
}
for(const invalid of [
  ()=>visualFromAuthorInput('bar','North,not-a-number\nSouth,20','Description'),
  ()=>visualFromAuthorInput('pie','North,-1\nSouth,2','Description'),
  ()=>visualFromAuthorInput('flowchart','Only one step','Description'),
  ()=>visualFromAuthorInput('table','Only one row,1','Description'),
  ()=>visualFromAuthorInput('line','A,1\nB,2',''),
]){
  let rejected=false;try{invalid();}catch{rejected=true;}if(!rejected)throw new Error('Unsafe visual input was accepted.');
}
console.log('structured-visuals-ok',samples.map(([kind])=>kind).join(','));
