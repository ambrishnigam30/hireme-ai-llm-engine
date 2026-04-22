/**
 * optimizer.ts
 */
import { JobDescription, Resume, Parser } from './parser';
import { Generator, GenerationConfig } from '../inference/generator';

export class Optimizer {
  public static scoreATS(jd: JobDescription, resume: Resume): number {
    if (jd.skills.length === 0) return 0;
    
    const STOP_WORDS = new Set(['a', 'the', 'in', 'with', 'and', 'or', 'for', 'to', 'of', 'this', 'that', 'is', 'are']);
    
    // Normalize resume text for fuzzy matching
    const normalizedResume = resume.rawText.toLowerCase();
    
    let matches = 0;
    let validSkills = 0;

    for (const skill of jd.skills) {
      const lowerSkill = skill.toLowerCase();
      if (STOP_WORDS.has(lowerSkill) || lowerSkill.length <= 2) continue;
      
      validSkills++;
      // Fuzzy match: check if the exact skill word appears in the normalized resume text
      if (normalizedResume.includes(lowerSkill)) {
        matches++;
      }
    }
    
    if (validSkills === 0) return 0;
    return Math.round((matches / validSkills) * 100);
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
