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
    return `[BOS] ACT AS: Senior Executive Resume Architect.
MISSION: You are NOT a summarizer. You are a transformer.
STRICT RULES:
1. PRESERVE all Work History, Titles, and Dates from the original resume.
2. REWRITE only the bullet points for each role. 
3. INJECT keywords from the Job Description into your descriptions naturally.
4. TONE: Use data-driven metrics (e.g., 'Improved X by Y%').
5. LENGTH: The output must be roughly the same length as the input. Do not omit experience.

JOB: ${jd.title}
REQUIRED SKILLS: ${jd.skills.join(', ')}

[SEP] RESUME:
${resume.rawText}
[SEP]`;
  }
}
