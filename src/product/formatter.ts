/**
 * formatter.ts
 */
export class Formatter {
  public static formatOutput(optimizedText: string, atsScore: number): string {
    let cleaned = optimizedText.replace(/\[EOS\]/g, '').trim();
    cleaned = cleaned.replace(/\[BOS\]/g, '').replace(/\[SEP\]/g, '').trim();

    return `========================================
HIRING PIPELINE: ATS MATCH SCORE: ${atsScore}%
========================================

OPTIMIZED RESUME:
${cleaned}
========================================`;
  }
}
