import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Browser OCR assets are copied from pinned npm packages during prebuild.
  // They are third-party generated artifacts, not application source.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'public/ocr/**', 'next-env.d.ts']),
]);

export default eslintConfig;
