/**
 * download_data.ts
 * CLI script to download all required HuggingFace datasets.
 */
import { Downloader } from '../src/data/downloader';
import * as path from 'path';

async function main() {
  const downloader = new Downloader();
  const dataDir = path.join(__dirname, '..', 'data');

  const datasetsToDownload = [
    'MikePfunk28/resume-training-dataset',
    'cnamuangtoun/resume-job-description-fit',
    'jacob-hugging-face/job-descriptions',
    '0xnbk/resume-ats-score-v1-en'
  ];

  console.log('Starting dataset downloads...');
  
  for (const ds of datasetsToDownload) {
    try {
      const filePath = await downloader.downloadDataset(ds, dataDir);
      console.log(`Successfully acquired: ${filePath}`);
    } catch (e) {
      console.error(`Failed to download ${ds}:`, e);
    }
  }

  console.log('All downloads completed.');
}

if (require.main === module) {
  main().catch(console.error);
}
