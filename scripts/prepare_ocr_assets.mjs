import { copyFile,mkdir } from 'node:fs/promises';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'public','ocr');
const assets=[
  ['node_modules/tesseract.js/dist/worker.min.js','worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js','core/tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js','core/tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js','core/tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz','lang/eng.traineddata.gz'],
];

for(const [source,target] of assets){
  const destination=join(output,target);await mkdir(dirname(destination),{recursive:true});await copyFile(join(root,source),destination);
}
console.log('Prepared self-hosted browser OCR assets.');
