/**
 * optimizer.ts
 */
import { JobDescription, Resume, Parser } from './parser';
import { Generator, GenerationConfig } from '../inference/generator';

export class Optimizer {
  private static tokenize(text: string, stopWords: Set<string>): string[] {
    const words = text.toLowerCase().match(/\b[a-z0-9+#]+\b/g) || [];
    return words.filter(w => !stopWords.has(w));
  }

  public static scoreATS(jd: JobDescription, generatedText: string): number {
    if (jd.skills.length === 0) return 0;
    
    const stopWords = new Set(['of', 'and', 'to', 'for', 'with', 'on', 'at', 'a', 'an', 'the', 'in', 'or', 'this', 'that', 'is', 'are', 'by', 'from', 'as']);
    
    // 1. Create a Set of all unique tokens in the Resume.
    const resumeTokens = new Set(this.tokenize(generatedText, stopWords));
    
    // 2. Create a Set of all unique tokens in the JD.
    const jdTokens = new Set(jd.skills.flatMap(skill => this.tokenize(skill, stopWords)));
    
    if (jdTokens.size === 0) return 0;

    // 3. Score = (Intersection of Sets) / (JD Set Size).
    let intersection = 0;
    for (const token of jdTokens) {
      if (resumeTokens.has(token)) {
        intersection++;
      }
    }
    
    return Math.round((intersection / jdTokens.size) * 100);
  }

  public static optimizeResume(jd: JobDescription, resume: Resume, generator: Generator): string {
    const prompt = Parser.buildPrompt(jd, resume);
    
    const config: GenerationConfig = {
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9
    };
    
    const output = generator.generate(prompt, config);
    return output;
  }
}
