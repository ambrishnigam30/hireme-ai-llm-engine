/**
 * generate.ts
 */
import * as fs from 'fs';
import { Parser } from '../src/product/parser';
import { Optimizer } from '../src/product/optimizer';
import { Formatter } from '../src/product/formatter';

export function main() {
  const args = process.argv.slice(2);
  let jobPath = '';
  let resumePath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--job' && args[i+1]) {
      jobPath = args[i+1];
    }
    if (args[i] === '--resume' && args[i+1]) {
      resumePath = args[i+1];
    }
  }

  if (!jobPath || !resumePath) {
    console.error("ERROR: Missing arguments. Usage: npx ts-node scripts/generate.ts --job <path> --resume <path>");
    process.exit(1);
  }

  try {
    const jdText = fs.readFileSync(jobPath, 'utf8');
    const resumeText = fs.readFileSync(resumePath, 'utf8');

    const jd = Parser.parseJobDescription(jdText);
    const resume = Parser.parseResume(resumeText);
    
    const score = Optimizer.scoreATS(jd, resume);
    
    const finalDoc = Formatter.formatOutput(resume.rawText, score);
    
    console.log(finalDoc);

  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.error(`ERROR: File not found - ${err.path}`);
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  main();
}
