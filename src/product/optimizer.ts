/**
 * optimizer.ts
 */
import { JobDescription, Resume, Parser } from './parser';
import { Generator, GenerationConfig } from '../inference/generator';

export class Optimizer {
  public static scoreATS(jd: JobDescription, resume: Resume): number {
    if (jd.skills.length === 0) return 0;
    
    const jdSkills = new Set(jd.skills.map(s => s.toLowerCase()));
    const resumeSkills = new Set(resume.skills.map(s => s.toLowerCase()));
    
    let matches = 0;
    for (const skill of jdSkills) {
      if (resumeSkills.has(skill)) matches++;
    }
    
    return Math.round((matches / jdSkills.size) * 100);
  }

  public static optimizeResume(jd: JobDescription, resume: Resume, generator: Generator): string {
    const prompt = Parser.buildPrompt(jd, resume);
    
    const config: GenerationConfig = {
      maxNewTokens: 256,
      temperature: 0.7,
      topK: 40
    };
    
    const output = generator.generate(prompt, config);
    return output;
  }
}
