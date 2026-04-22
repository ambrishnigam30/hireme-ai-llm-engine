const { Parser } = require('./src/product/parser');
const { Optimizer } = require('./src/product/optimizer');

try {
  const jdText = "Looking for a Senior Software Engineer with strong React and Node.js skills.";
  const resumeText = "I am an experienced developer.";
  
  const jd = Parser.parseJobDescription(jdText);
  const resume = Parser.parseResume(resumeText);
  
  const atsScore = Optimizer.scoreATS(jd, resume);
  console.log("Success! Score:", atsScore);
} catch (err) {
  console.error("Crash:", err);
}
