document.addEventListener('DOMContentLoaded', () => {
  const jdInput = document.getElementById('job-description');
  const resumeInput = document.getElementById('current-resume');
  const optimizeBtn = document.getElementById('optimize-btn');
  const btnText = optimizeBtn.querySelector('.btn-text');
  const loader = optimizeBtn.querySelector('.loader');
  const errorBanner = document.getElementById('error-message');
  
  const emptyState = document.getElementById('empty-state');
  const scoreContainer = document.getElementById('score-container');
  const atsScoreEl = document.getElementById('ats-score');
  const outputGroup = document.getElementById('output-group');
  const optimizedOutput = document.getElementById('optimized-output');

  optimizeBtn.addEventListener('click', async () => {
    const jd = jdInput.value.trim();
    const resume = resumeInput.value.trim();

    if (!jd || !resume) {
      showError("Please provide both a Job Description and a Current Resume.");
      return;
    }

    setLoadingState(true);
    hideError();

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, resume: resume })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed due to internal server error.');
      }

      displayResults(data.score, data.optimizedText);

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
      emptyState.classList.remove('hidden');
      scoreContainer.classList.add('hidden');
      outputGroup.classList.add('hidden');
    } else {
      btnText.classList.remove('hidden');
      loader.classList.add('hidden');
    }
  }

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  function displayResults(score, text) {
    emptyState.classList.add('hidden');
    scoreContainer.classList.remove('hidden');
    outputGroup.classList.remove('hidden');

    const textWithoutScoreHeader = text.split('OPTIMIZED RESUME:')[1]?.trim() || text;

    atsScoreEl.textContent = score;
    
    const ring = document.querySelector('.score-ring');
    if (score >= 80) ring.style.borderColor = ring.style.color = '#34c759';
    else if (score >= 50) ring.style.borderColor = ring.style.color = '#ff9500';
    else ring.style.borderColor = ring.style.color = '#ff3b30';
    
    optimizedOutput.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      optimizedOutput.textContent += textWithoutScoreHeader.charAt(i);
      i++;
      if (i >= textWithoutScoreHeader.length) clearInterval(interval);
    }, 5);
  }
});
