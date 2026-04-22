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
    const jdText = document.getElementById("job-description").value;
    const resumeText = document.getElementById("current-resume").value;

    if (!jdText || !resumeText) {
      alert("Please paste both JD and Resume");
      showError("Please provide both a Job Description and a Current Resume.");
      return;
    }

    setLoadingState(true);
    hideError();

    try {
      const response = await fetch('http://localhost:3000/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          jobDescription: document.getElementById("job-description").value, 
          resume: document.getElementById("current-resume").value 
        })
      });

      const data = await response.json();
      console.log("RAW_DATA_RECEIVED:", data);
      
      const staticOutputElement = document.getElementById("optimized-output");
      if (staticOutputElement) {
        staticOutputElement.innerText = data.output || "Mapping Error - Check Console";
      }

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed due to internal server error.');
      }

      const finalScore = Number(data.score || 0);
      
      // Update UI explicitly just in case animation is delayed
      document.getElementById("ats-score").innerText = finalScore + "%";
      
      // Note: We trigger animateScore AFTER the text generation inside displayResults
      const outputText = data.output || data.text || "";
      if (!outputText || outputText.trim().length === 0) {
        console.error("No output received");
        showError("Generation failed: No output received from the engine.");
        setLoadingState(false);
        return;
      }
      displayResults(finalScore, outputText);

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
      emptyState.classList.add('hidden'); // Hide the placeholder immediately
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

  function animateScore(score) {
    let currentScore = 0;
    atsScoreEl.textContent = '0';
    const ring = document.querySelector('.score-ring');
    ring.style.borderColor = ring.style.color = '#4d4d4d'; // initial grey
    
    scoreContainer.classList.remove('hidden');

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
  }

  function displayResults(finalScore, text) {
    const outputText = text || "";
    if (!outputText) {
      console.error("No output received");
      showError("Generation failed: No output received from the engine.");
      return;
    }

    emptyState.classList.add('hidden');
    outputGroup.classList.remove('hidden');

    const textWithoutScoreHeader = outputText.split('OPTIMIZED RESUME:')[1]?.trim() || outputText;

    // Disabled typewriter effect to prove text renders statically
    optimizedOutput.innerHTML = '';
    if (typeof marked !== 'undefined') {
      optimizedOutput.innerHTML = marked.parse(textWithoutScoreHeader);
    } else {
      optimizedOutput.innerText = textWithoutScoreHeader;
    }
    animateScore(finalScore);
  }
});
