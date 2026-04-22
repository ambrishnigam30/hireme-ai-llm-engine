/**
 * downloader.ts
 * Uses a Python subprocess to download HuggingFace datasets, with a Node HTTP fallback.
 */
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class Downloader {
  public async downloadDataset(datasetId: string, outputDir: string): Promise<string> {
    const safeName = datasetId.replace(/\//g, '_');
    const outputPath = path.join(outputDir, `${safeName}.jsonl`);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
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
      console.log(`Downloading dataset ${datasetId} via Python...`);
      const pythonProcess = spawn('python', [scriptPath, datasetId, outputPath]);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python] ${data.toString().trim()}`);
      });

      let pyError = '';
      pythonProcess.stderr.on('data', (data) => {
        pyError += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
        
        if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          resolve(outputPath);
        } else {
          console.warn(`Python failed (code ${code}). Error: ${pyError.trim()}`);
          console.warn(`Falling back to Node HTTP HF Datasets API for ${datasetId}...`);
          try {
            await this.downloadDatasetHttp(datasetId, outputPath);
            resolve(outputPath);
          } catch (httpErr) {
            reject(new Error(`Both Python and HTTP fallback failed for ${datasetId}: ${httpErr}`));
          }
        }
      });
      
      pythonProcess.on('error', async (err) => {
        if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
        console.warn(`Python executable not found (${err.message}). Falling back to Node HTTP HF Datasets API...`);
        try {
          await this.downloadDatasetHttp(datasetId, outputPath);
          resolve(outputPath);
        } catch (httpErr) {
          reject(new Error(`Both Python and HTTP fallback failed for ${datasetId}: ${httpErr}`));
        }
      });
    });
  }

  /**
   * Fallback using HuggingFace Datasets Server REST API.
   */
  private async downloadDatasetHttp(datasetId: string, outputPath: string): Promise<void> {
    console.log(`[HTTP Fallback] Fetching ${datasetId} via HuggingFace Datasets Server API...`);
    const limit = 500; // Cap at 500 for local testing to avoid massive downloads
    let offset = 0;
    const batchSize = 100;
    
    fs.writeFileSync(outputPath, '', 'utf-8'); // clear file
    
    while (offset < limit) {
      const url = `https://datasets-server.huggingface.co/rows?dataset=${datasetId}&config=default&split=train&offset=${offset}&length=${batchSize}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (offset === 0) throw new Error(`Failed to fetch ${datasetId}: ${res.status} ${res.statusText}`);
        break; // Reached end of dataset before limit
      }
      
      const data = await res.json() as { rows: any[] };
      if (!data.rows || data.rows.length === 0) break;
      
      for (const item of data.rows) {
        fs.appendFileSync(outputPath, JSON.stringify(item.row) + '\n', 'utf-8');
      }
      
      offset += data.rows.length;
      console.log(`[HTTP] Downloaded ${offset} rows for ${datasetId}...`);
      if (data.rows.length < batchSize) break; // End of dataset
    }
  }
}
