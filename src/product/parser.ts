/**
 * parser.ts
 */
export interface JobDescription {
  title: string;
  skills: string[];
}

export interface Resume {
  skills: string[];
  rawText: string;
}

export class Parser {
  public static parseJobDescription(text: string): JobDescription {
    const lines = text.split('\n');
    const title = lines.length > 0 ? lines[0].trim() : 'Unknown Role';
    
    // Extract capitalized words as potential skills for our simple heuristic
    const skills = [...new Set(text.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || [])]
      .filter(w => w.length > 2);
      
    return { title, skills };
  }

  public static parseResume(text: string): Resume {
    const skills = [...new Set(text.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || [])]
      .filter(w => w.length > 2);
    return { rawText: text, skills };
  }

  public static buildPrompt(jd: JobDescription, resume: Resume): string {
    return `[BOS] JOB: ${jd.title} required skills: ${jd.skills.join(', ')}. [SEP] RESUME: ${resume.rawText} [SEP]`;
  }
}
