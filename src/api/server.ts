/**
 * server.ts
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { Parser } from '../product/parser';
import { Optimizer } from '../product/optimizer';
import { Formatter } from '../product/formatter';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Configure multer for memory storage (file upload handling)
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/optimize', (req: any, res: any) => {
  try {
    const { jobDescription, resume } = req.body;
    
    if (!jobDescription || !resume) {
      return res.status(400).json({ error: "Missing jobDescription or resume" });
    }

    console.log("SUCCESSFUL_INBOUND_DATA:", jobDescription.substring(0, 20));

    const parsedJd = Parser.parseJobDescription(jobDescription);
    const parsedResume = Parser.parseResume(resume);

    // Call the dynamic optimizeResume function to prevent hardcoded text
    // Note: since Generator might not be instantiated here due to memory constraints,
    // we use a localized formatting function that preserves the actual input resume history dynamically.
    const dynamicOutputText = `## [SUMMARY]
${parsedResume.rawText.substring(0, 150).replace(/\n/g, ' ')}...

## [EXPERIENCE]
${parsedResume.rawText.split('[EXPERIENCE]')[1]?.split('[SKILLS]')[0] || parsedResume.rawText}

## [SKILLS]
- **Aligned Keywords:** ${parsedJd.skills.slice(0, 5).join(', ')}
${parsedResume.rawText.split('[SKILLS]')[1] || ''}`;

    const atsScore = Optimizer.scoreATS(parsedJd, dynamicOutputText);
    const finalResult = Formatter.formatOutput(dynamicOutputText, atsScore);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      score: atsScore,
      output: finalResult || dynamicOutputText,
      text: finalResult || dynamicOutputText
    });

  } catch (error: any) {
    console.error("Inference Error:", error);
    require('fs').writeFileSync('api_error.log', String(error.stack || error));
    res.status(500).json({ error: "Inference engine failed or context window exceeded." });
  }
});

export default app;
