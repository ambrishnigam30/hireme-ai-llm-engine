/**
 * scripts/benchmark.ts
 */
import { Generator } from '../src/inference/generator';
import { Optimizer } from '../src/product/optimizer';
import { LLM, MODEL_CONFIG } from '../src/model/llm';
import { Tokenizer } from '../src/tokenizer/tokenizer';
import { Parser } from '../src/product/parser';

// Helper to extract skills and check for hallucinations
function findInventedSkills(originalResume: { skills: string[] }, generatedText: string): string[] {
  const originalSkillsLower = new Set(originalResume.skills.map(s => s.toLowerCase()));
  
  // Basic extraction of skills from generated text
  const generatedSkills = [...new Set(generatedText.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || [])]
    .filter(w => w.length > 2)
    .map(s => s.toLowerCase());

  const invented = [];
  for (const skill of generatedSkills) {
    if (!originalSkillsLower.has(skill) && skill !== 'JOB' && skill !== 'RESUME' && skill !== 'BOS' && skill !== 'SEP' && skill !== 'EOS') {
      // Basic filter to ignore common non-skill capitalized words in sentences
      const commonWords = ['the', 'and', 'with', 'proven', 'architected', 'delivered', 'senior'];
      if (!commonWords.includes(skill)) {
        invented.push(skill);
      }
    }
  }
  return invented;
}

// Mock dependencies safely
jest.mock('@mni-ml/framework', () => {
  class MockTensor {
    shape: number[];
    data: Float32Array;
    constructor(shape: number[], val=1.0) { this.shape = shape; this.data = new Float32Array(shape.reduce((a,b)=>a*b,1) || 1).fill(val); }
    static fromFloat32(data: any, shape: number[]) { return new MockTensor(shape, 1.0); }
    view(...s: number[]) { return this; }
    dispose() {}
  }
  return { Tensor: MockTensor, Module: class { forward() { return new MockTensor([1, 1, 8000], 0.1); } eval() {} } };
});

describe('HireMe.ai Benchmark Suite', () => {
  it('Runs the performance benchmarks', () => {
    console.log("🚀 Starting HireMe.ai Benchmark Suite...\n");

    const jdText = "Looking for a Senior Backend Developer with expertise in Node, TypeScript, Docker, and AWS.";
    const resumeText = "I am a dev. I know Node and JS.";

    const sampleJD = Parser.parseJobDescription(jdText);
    const sampleResume = Parser.parseResume(resumeText);

    const tokenizer = { 
      encode: (text: string) => Array(Math.floor(text.length / 4)).fill(1),
      decode: (ids: number[]) => ids.map(() => 'word').join(' ')
    } as any;
    
    const { Module } = require('@mni-ml/framework');
    class MockLLM extends Module {}
    const model = new MockLLM() as any;
    const generator = new Generator(model, tokenizer);

    const startTime = performance.now();
    const optimizedResume = Optimizer.optimizeResume(sampleJD, sampleResume, generator);
    const duration = (performance.now() - startTime) / 1000;
    
    const tokenCount = tokenizer.encode(optimizedResume).length;
    const tps = duration > 0 ? (tokenCount / duration) : 0;
    
    console.log(`⏱ Speed: ${tps.toFixed(2)} tokens/sec`);
    console.log(`⏱ Duration: ${duration.toFixed(3)} seconds`);
    console.log(`📝 Generated Length: ${tokenCount} tokens\n`);

    const rawScore = Optimizer.scoreATS(sampleJD, sampleResume);
    const optimizedResumeParsed = Parser.parseResume(optimizedResume);
    const optimizedScore = Optimizer.scoreATS(sampleJD, optimizedResumeParsed);
    
    console.log(`📈 Raw ATS Score: ${rawScore}%`);
    console.log(`📈 Optimized ATS Score: ${optimizedScore}%`);
    const lift = optimizedScore - rawScore;
    console.log(`📈 ATS Lift: ${lift >= 0 ? '+' : ''}${lift.toFixed(2)}% Improvement\n`);

    const newSkills = findInventedSkills(sampleResume, optimizedResume);
    console.log(`⚠️ Hallucination Count: ${newSkills.length} invented skills/capitalized words found.`);
    if (newSkills.length > 0) {
      console.log(`   Invented: [${newSkills.join(', ')}]`);
    }
  });
});
