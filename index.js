document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wifi-form');
  const nameInput = document.getElementById('name');
  const deviceInput = document.getElementById('device');
  const termsCheckbox = document.getElementById('terms');
  const connectBtn = document.getElementById('connectBtn');
  const statusBox = document.getElementById('status');
  const termsHint = document.getElementById('terms-hint');

  if (!form || !nameInput || !deviceInput || !termsCheckbox || !connectBtn || !statusBox || !termsHint) {
    return;
  }

  const formStorageKey = 'wifi-auth-form';
  const termsViewedKey = 'wifi-terms-viewed';
  let isSubmitting = false;

  const setStatus = (message, type) => {
    statusBox.textContent = message;
    statusBox.className = `status ${type}`;
  };

  const hasRequiredInformation = () => Boolean(nameInput.value.trim() && deviceInput.value.trim());

  const updateTermsAvailability = () => {
    try {
      const hasViewedTerms = sessionStorage.getItem(termsViewedKey) === 'true';
      const hasRequiredDetails = hasRequiredInformation();
      termsCheckbox.disabled = !hasViewedTerms || !hasRequiredDetails;
      connectBtn.disabled = isSubmitting || !termsCheckbox.checked || !hasRequiredDetails;
      termsHint.textContent = !hasRequiredDetails
        ? 'Enter your name and device before you can agree.'
        : hasViewedTerms
          ? 'Thanks for reviewing the terms. You can now confirm your agreement.'
          : 'Open the terms page before you can agree.';
    } catch (error) {
      termsCheckbox.disabled = true;
      connectBtn.disabled = true;
      termsHint.textContent = 'Your browser prevented checking whether the terms page was opened.';
      setStatus('Please allow session storage in your browser to continue.', 'error');
    }
  };

  const saveForm = () => {
    try {
      sessionStorage.setItem(formStorageKey, JSON.stringify({
        name: nameInput.value,
        device: deviceInput.value,
      }));
    } catch (error) {
      setStatus('Your browser could not save your details between pages. Keep this page open while reviewing the terms.', 'error');
    }
  };
  
  try {
    const savedForm = JSON.parse(sessionStorage.getItem(formStorageKey) || '{}');
    if (typeof savedForm.name === 'string') {
      nameInput.value = savedForm.name;
    }
    if (typeof savedForm.device === 'string') {
      deviceInput.value = savedForm.device;
    }
  } catch (error) {
    setStatus('Your browser could not restore previously entered details.', 'error');
  }

  nameInput.addEventListener('input', () => {
    saveForm();
    updateTermsAvailability();
  });
  deviceInput.addEventListener('input', () => {
    saveForm();
    updateTermsAvailability();
  });
  updateTermsAvailability();
  window.addEventListener('pageshow', updateTermsAvailability);

  termsCheckbox.addEventListener('change', () => {
    connectBtn.disabled = isSubmitting || !termsCheckbox.checked || !hasRequiredInformation();
    if (termsCheckbox.checked) {
      setStatus('', '');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fullName = nameInput.value.trim();
    const deviceId = deviceInput.value.trim();

    if (!fullName || !deviceId) {
      setStatus('Please complete all required fields before connecting.', 'error');
      return;
    }

    if (!termsCheckbox.checked) {
      setStatus('You must agree to the Terms and Conditions to continue.', 'error');
      return;
    }

    isSubmitting = true;
    connectBtn.disabled = true;
    setStatus('Submitting your details...', '');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Your details could not be saved.');
      }

      setStatus(result.message, 'success');
      try {
        sessionStorage.removeItem(formStorageKey);
      } catch (error) {
        // The successful database submission does not depend on browser storage.
      }
    } catch (error) {
      setStatus(error.message || 'Unable to reach the server. Please try again.', 'error');
    } finally {
      isSubmitting = false;
      connectBtn.disabled = !termsCheckbox.checked || !hasRequiredInformation();
    }
  });
});
