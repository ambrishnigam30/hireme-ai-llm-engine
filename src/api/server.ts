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

app.post('/api/optimize', upload.fields([{ name: 'resumeFile' }, { name: 'jdFile' }]), (req: any, res: any) => {
  try {
    let jobDescription = req.body.jobDescription || '';
    let resume = req.body.resume || '';

    // Handle uploaded files if present
    if (req.files) {
      if (req.files['jdFile'] && req.files['jdFile'][0]) {
        jobDescription = req.files['jdFile'][0].buffer.toString('utf8');
      }
      if (req.files['resumeFile'] && req.files['resumeFile'][0]) {
        resume = req.files['resumeFile'][0].buffer.toString('utf8');
      }
    }

    if (!jobDescription || !resume) {
      return res.status(400).json({ error: "Missing jobDescription or resume in request." });
    }

    const jd = Parser.parseJobDescription(jobDescription);
    const parsedResume = Parser.parseResume(resume);
    
    const atsScore = Optimizer.scoreATS(jd, parsedResume);

    // Mock inference since this is a local build without real 7B weights loaded in RAM
    const fakeOptimizedText = `## [SUMMARY]
Senior ${jd.title} with expertise in ${jd.skills.slice(0, 3).join(', ')}. Proven track record of optimizing architectures and leading technical teams. Adept at driving multi-agent autonomous systems.

## [EXPERIENCE]
**Senior ${jd.title}**
- Architected high-performance, scalable systems utilizing modern tech stacks.
- Spearheaded delivery of 40% performance gains by strictly adhering to coding standards.
- Orchestrated cross-functional teams to launch innovative AI products.

## [SKILLS]
- **Technical:** ${jd.skills.join(', ')}
- **Leadership:** Team Management, Agile Methodologies
- **Tools:** Git, Docker, Kubernetes`;

    const finalResult = Formatter.formatOutput(fakeOptimizedText, atsScore);

    res.json({
      score: atsScore,
      skills: jd.skills,
      optimizedText: finalResult
    });

  } catch (error: any) {
    console.error("Inference Error:", error);
    require('fs').writeFileSync('api_error.log', String(error.stack || error));
    res.status(500).json({ error: "Inference engine failed or context window exceeded." });
  }
});

export default app;
