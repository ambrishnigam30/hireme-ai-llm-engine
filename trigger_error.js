const { spawn } = require('child_process');
const server = spawn('npx.cmd', ['ts-node', 'scripts/start_app.ts']);

setTimeout(() => {
  const formData = new FormData();
  formData.append('jobDescription', 'Looking for a Senior Backend Developer');
  formData.append('resume', 'I am a developer');
  
  fetch('http://localhost:3000/api/optimize', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => { console.log('FETCH RESULT:', data); server.kill(); })
    .catch(err => { console.error('FETCH ERR:', err); server.kill(); });
}, 3000);
