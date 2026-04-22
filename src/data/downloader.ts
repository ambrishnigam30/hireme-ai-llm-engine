/**
 * downloader.ts
 * Uses a Python subprocess to download HuggingFace datasets.
 */
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class Downloader {
  /**
   * Downloads a HuggingFace dataset and saves it as a JSONL file.
   * @param datasetId HuggingFace dataset ID (e.g. 'MikePfunk28/resume-training-dataset')
   * @param outputDir Directory to save the dataset
   * @returns Path to the downloaded JSONL file
   */
  public async downloadDataset(datasetId: string, outputDir: string): Promise<string> {
    const safeName = datasetId.replace(/\//g, '_');
    const outputPath = path.join(outputDir, `${safeName}.jsonl`);

    if (fs.existsSync(outputPath)) {
      console.log(`Dataset ${datasetId} already exists at ${outputPath}`);
      return outputPath;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const pythonScript = `
import json
import sys
try:
    from datasets import load_dataset
except ImportError:
    print("Error: 'datasets' python library is not installed.", file=sys.stderr)
    sys.exit(1)

dataset_id = sys.argv[1]
output_path = sys.argv[2]

try:
    ds = load_dataset(dataset_id, split='train')
    with open(output_path, 'w', encoding='utf-8') as f:
        for row in ds:
            f.write(json.dumps(row) + '\\n')
    print(f"Successfully saved to {output_path}")
except Exception as e:
    print(f"Failed to download {dataset_id}: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

    const scriptPath = path.join(outputDir, 'temp_download.py');
    fs.writeFileSync(scriptPath, pythonScript, 'utf-8');

    return new Promise((resolve, reject) => {
      console.log(`Downloading dataset ${datasetId}... This may take a while.`);
      const pythonProcess = spawn('python', [scriptPath, datasetId, outputPath]);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python] ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Error] ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        if (fs.existsSync(scriptPath)) {
          fs.unlinkSync(scriptPath);
        }
        
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Python subprocess exited with code ${code}`));
        }
      });
    });
  }
}
