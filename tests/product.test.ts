import { Parser } from '../src/product/parser';
import { Optimizer } from '../src/product/optimizer';
import { Formatter } from '../src/product/formatter';

describe('Phase 6: Product Pipeline', () => {
  it('1. ATS Scoring mathematical bounds', () => {
    const jd = { title: 'Eng', skills: ['React', 'Node', 'TypeScript'] };
    const resumeFull = { rawText: '', skills: ['React', 'Node', 'TypeScript'] };
    const resumePartial = { rawText: '', skills: ['React'] };
    const resumeEmpty = { rawText: '', skills: [] };

    expect(Optimizer.scoreATS(jd, resumeFull)).toBe(100);
    expect(Optimizer.scoreATS(jd, resumePartial)).toBe(33);
    expect(Optimizer.scoreATS(jd, resumeEmpty)).toBe(0);
  });

  it('2. Prompt Construction strictly follows tokens', () => {
    const jd = { title: 'Engineer', skills: ['Go'] };
    const resume = { rawText: 'I code in Go', skills: ['Go'] };
    
    const prompt = Parser.buildPrompt(jd, resume);
    expect(prompt).toContain('ACT AS: Executive Resume Writer.');
    expect(prompt).toContain('JOB: Engineer');
    expect(prompt).toContain(`[SEP] RESUME:
I code in Go
[SEP]`);
  });

  it('3. Formatter injects score and cleans tags', () => {
    const rawOutput = "[BOS] JOB: [SEP] OPTIMIZED TEXT [EOS]";
    const formatted = Formatter.formatOutput(rawOutput, 95);
    
    expect(formatted).toContain('ATS MATCH SCORE: 95%');
    expect(formatted).toContain('OPTIMIZED TEXT');
    expect(formatted).not.toContain('[EOS]');
    expect(formatted).not.toContain('[BOS]');
  });
});
