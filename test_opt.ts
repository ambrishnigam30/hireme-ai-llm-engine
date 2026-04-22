import { Parser } from './src/product/parser';
import { Optimizer } from './src/product/optimizer';

const jdText = "Looking for a SaaS Product Manager with AI experience.";
const resumeText = "Product Manager with 5 years experience in SaaS and AI.";

const jd = Parser.parseJobDescription(jdText);
const resume = Parser.parseResume(resumeText);
console.log(Optimizer.scoreATS(jd, resume));
