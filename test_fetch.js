const jd = "Looking for a Senior Backend Developer";
const resume = "I am a developer";
const formData = new FormData();
formData.append('jobDescription', jd);
formData.append('resume', resume);

fetch('http://localhost:3000/api/optimize', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log).catch(console.error);
