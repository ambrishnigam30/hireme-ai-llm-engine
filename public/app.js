document.addEventListener('DOMContentLoaded', () => {
  const jdInput = document.getElementById('job-description');
  const resumeInput = document.getElementById('current-resume');
  
  const jdFile = document.getElementById('jd-file');
  const resumeFile = document.getElementById('resume-file');
  const jdDropZone = document.getElementById('jd-drop-zone');
  const resumeDropZone = document.getElementById('resume-drop-zone');

  const optimizeBtn = document.getElementById('optimize-btn');
  const btnText = optimizeBtn.querySelector('.btn-text');
  const loader = optimizeBtn.querySelector('.loader');
  const errorBanner = document.getElementById('error-message');
  
  const emptyState = document.getElementById('empty-state');
  const scoreContainer = document.getElementById('score-container');
  const atsScoreEl = document.getElementById('ats-score');
  const outputGroup = document.getElementById('output-group');
  const optimizedOutput = document.getElementById('optimized-output');

  // File drop & read logic
  function handleFileSelect(file, textareaId, dropZone) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById(textareaId).value = e.target.result;
      dropZone.querySelector('.drop-text').textContent = `Loaded: ${file.name}`;
      dropZone.classList.add('dragover');
    };
    reader.readAsText(file);
  }

  jdFile.addEventListener('change', (e) => handleFileSelect(e.target.files[0], 'job-description', jdDropZone));
  resumeFile.addEventListener('change', (e) => handleFileSelect(e.target.files[0], 'current-resume', resumeDropZone));

  function setupDropZone(dropZone, fileInput, textareaId) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
      if(!fileInput.files.length) dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length) {
        fileInput.files = files;
        handleFileSelect(files[0], textareaId, dropZone);
      }
    });
  }

  setupDropZone(jdDropZone, jdFile, 'job-description');
  setupDropZone(resumeDropZone, resumeFile, 'current-resume');

  optimizeBtn.addEventListener('click', async () => {
    const jd = jdInput.value.trim();
    const resume = resumeInput.value.trim();

    if (!jd || !resume) {
      showError("Please provide both a Job Description and a Current Resume.");
      return;
    }

    setLoadingState(true);
    hideError();

    const formData = new FormData();
    formData.append('jobDescription', jd);
    formData.append('resume', resume);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed due to internal server error.');
      }

      displayResults(data.score, data.skills || [], data.optimizedText);

    } catch (err) {
      showError(err.message);
    } finally {
      setLoadingState(false);
    }
  });

  function setLoadingState(isLoading) {
    optimizeBtn.disabled = isLoading;
    if (isLoading) {
      btnText.classList.add('hidden');
      loader.classList.remove('hidden');
      optimizeBtn.classList.add('loading');
      emptyState.classList.remove('hidden');
      scoreContainer.classList.add('hidden');
      outputGroup.classList.add('hidden');
    } else {
      btnText.classList.remove('hidden');
      loader.classList.add('hidden');
      optimizeBtn.classList.remove('loading');
    }
  }

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  function displayResults(score, skills, text) {
    emptyState.classList.add('hidden');
    scoreContainer.classList.remove('hidden');
    outputGroup.classList.remove('hidden');

    const textWithoutScoreHeader = text.split('OPTIMIZED RESUME:')[1]?.trim() || text;

    // Thinking... status effect
    optimizedOutput.innerHTML = `<em>Thinking... Identifying High Value Keywords: <span style="color:var(--primary-color)">${skills.slice(0, 5).join(', ')}${skills.length > 5 ? '...' : ''}</span></em><br><br>`;
    
    // Animate score from 0 to target
    let currentScore = 0;
    atsScoreEl.textContent = '0';
    const ring = document.querySelector('.score-ring');
    ring.style.borderColor = ring.style.color = '#4d4d4d'; // initial grey
    
    const scoreInterval = setInterval(() => {
      if (currentScore >= score) {
        clearInterval(scoreInterval);
        atsScoreEl.textContent = score;
        if (score >= 80) ring.style.borderColor = ring.style.color = '#1ed760'; // Spotify Green
        else if (score >= 50) ring.style.borderColor = ring.style.color = '#ffa42b'; // Warning Orange
        else ring.style.borderColor = ring.style.color = '#f3727f'; // Negative Red
        return;
      }
      currentScore += Math.max(1, Math.floor(score / 20));
      if (currentScore > score) currentScore = score;
      atsScoreEl.textContent = currentScore;
    }, 30);

    // Typewriter streaming effect after a brief thinking pause
    setTimeout(() => {
      optimizedOutput.textContent = '';
      let i = 0;
      const interval = setInterval(() => {
        optimizedOutput.textContent += textWithoutScoreHeader.charAt(i);
        i++;
        if (i >= textWithoutScoreHeader.length) clearInterval(interval);
      }, 10);
    }, 1500); // 1.5 second "thinking" pause
  }
});
