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
    return `ACT AS: Senior Executive Resume Architect.
SOURCE_DATA: ${resume.rawText}
TARGET_ALIGNMENT: ${jd.title} ${jd.skills.join(', ')}

STRICT CONSTRAINTS (CRITICAL):
- IDENTITY LOCK: Use the Job Titles from SOURCE_DATA exactly as written. Never prepend 'Senior' or JD titles to existing roles. 
- 1:1 MAPPING: For every job entry in SOURCE_DATA, there must be a corresponding entry in the output. No omissions. No additions.
- GENERATIVE BOUNDARY: Only optimize the internal bullet points to align with TARGET_ALIGNMENT. 
- STRUCTURE: Strictly use [SUMMARY], [EXPERIENCE], and [SKILLS] headers.
- FALLBACK: If you cannot optimize or generation fails, return the SOURCE_DATA as is. Do NOT return an empty string.`;
  }
}
