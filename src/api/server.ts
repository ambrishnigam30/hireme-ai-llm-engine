/**
 * server.ts
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Parser } from '../product/parser';
import { Optimizer } from '../product/optimizer';
import { Formatter } from '../product/formatter';

import { Generator, GenerationConfig } from '../inference/generator';
import { LLM, MODEL_CONFIG } from '../model/llm';
import { Tokenizer } from '../tokenizer/tokenizer';

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../public')));

app.post('/api/optimize', (req, res) => {
  try {
    const { jobDescription, resume } = req.body;

    if (!jobDescription || !resume) {
      return res.status(400).json({ error: "Missing jobDescription or resume in request body." });
    }

    const jd = Parser.parseJobDescription(jobDescription);
    const parsedResume = Parser.parseResume(resume);
    
    const atsScore = Optimizer.scoreATS(jd, parsedResume);

    // Mock inference output since this is a local build without real 7B weights loaded in RAM
    const fakeOptimizedText = `Senior ${jd.title} with expertise in ${jd.skills.join(', ')}. 
Proven track record of optimizing architectures and leading technical teams.
- Architected high-performance, scalable systems utilizing modern tech stacks.
- Delivered 40% performance gains by strictly adhering to coding standards.`;

    const finalResult = Formatter.formatOutput(fakeOptimizedText, atsScore);

    res.json({
      score: atsScore,
      optimizedText: finalResult
    });

  } catch (error: any) {
    console.error("Inference Error:", error);
    res.status(500).json({ error: "Inference engine failed or context window exceeded." });
  }
});

export default app;
