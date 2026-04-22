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
    
    const STOP_WORDS = new Set(['a', 'an', 'the', 'in', 'with', 'and', 'or', 'for', 'to', 'of', 'this', 'that', 'is', 'are', 'on', 'at', 'by', 'from', 'as']);
    
    const words = text.match(/\b[a-zA-Z0-9#\+]+\b/g) || [];
    const skills = [...new Set(words)]
      .filter(w => !STOP_WORDS.has(w.toLowerCase()) && w.length > 1);
      
    return { title, skills };
  }

  public static parseResume(text: string): Resume {
    const skills = [...new Set(text.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || [])]
      .filter(w => w.length > 2);
    return { rawText: text, skills };
  }

  public static buildPrompt(jd: JobDescription, resume: Resume): string {
    return `SYSTEM: You are a Professional Resume Transformer.
DATA_INPUT: ${resume.rawText}
TARGET_JD: ${jd.title} ${jd.skills.join(', ')}

INSTRUCTION:
1. Extract every Job Title, Company, and Date from DATA_INPUT.
2. For each role, rewrite the bullet points to align with keywords found in TARGET_JD.
3. Maintain the 1:1 structure of DATA_INPUT.
4. DO NOT use pre-defined templates or examples. Every word must be derived from the relationship between the DATA_INPUT and TARGET_JD.`;
  }
}
