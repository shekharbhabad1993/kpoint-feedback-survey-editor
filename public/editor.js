let currentSurvey = {
    title: 'Interactive Feedback Survey',
    questions: [
        {
            type: 'star-rating',
            text: '1. How would you rate the overall quality of the channel content?',
            trackId: 'content_quality_feedback',
            trackName: 'Content Quality Rating'
        },
        {
            type: 'star-rating',
            text: '2. How helpful was the preboarding channel in understanding our company culture and values?',
            trackId: 'culture_understanding_feedback',
            trackName: 'Culture Understanding Rating'
        },
        {
            type: 'text',
            text: '3. How was your Discover Citco channel experience?',
            placeholder: 'Type your comments here',
            trackId: 'custom_feedback',
            trackName: 'Channel Experience'
        }
    ],
    starRating: {
        maxStars: 5
    },
    videoConfig: {
        host: 'ktpl.kpoint.com',
        videoId: 'gcc-b0d436a7-91d7-4719-bef3-44dce93581dc',
        startTime: 6,
        endTime: 7,
        continueTime: 8000,
        params: {
            "add-widgets": "utils,fontloader,markup",
            "disableKeyboardEvents": true
        }
    },
    styling: {
        primaryColor: '#002D72',
        textColor: '#3F3B3C',
        borderColor: '#FFFFFF',
        cardBackground: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Poppins'
    },
    thankYouMessage: 'Thank you for your response!',
    thankYouSubtext: 'Your feedback helps us improve our content and services.',
    thankYouDuration: 3000
};

let isEditing = false;
let editingSurveyId = null;
let currentStep = 1;
const totalSteps = 5;

// Initialize the wizard
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're editing an existing survey
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('id');
    
    if (surveyId) {
        loadExistingSurvey(surveyId);
    } else {
        initializeWizard();
    }
});

async function loadExistingSurvey(surveyId) {
    try {
        const response = await fetch(`/api/surveys/${surveyId}`);
        const data = await response.json();
        
        if (data.success) {
            currentSurvey = data.survey;
            isEditing = true;
            editingSurveyId = surveyId;
            initializeWizard();
            populateFormFromSurvey();
        } else {
            alert('Survey not found');
            window.location.href = '/editor';
        }
    } catch (error) {
        console.error('Error loading survey:', error);
        alert('Error loading survey');
    }
}

function initializeWizard() {
    // Set up event listeners for all form elements
    setupFormListeners();
    
    // Generate initial questions
    generateQuestions();
    
    // Initialize wizard state
    currentStep = 1;
    showStep(currentStep);
    updateProgress();
    updateNavigation();
    
    // Populate form with current survey data
    if (!isEditing) {
        populateFormFromSurvey();
    }
    
    // Setup live previews
    setupLivePreviews();
    
    console.log('Wizard initialized, current survey:', currentSurvey);
}

function populateFormFromSurvey() {
    // Basic configuration
    document.getElementById('survey-title').value = currentSurvey.title || '';
    document.getElementById('max-stars').value = currentSurvey.starRating?.maxStars || 5;
    document.getElementById('question-count').value = currentSurvey.questions?.length || 3;
    
    // Video configuration
    document.getElementById('video-host').value = currentSurvey.videoConfig?.host || '';
    document.getElementById('video-id').value = currentSurvey.videoConfig?.videoId || '';
    document.getElementById('start-time').value = currentSurvey.videoConfig?.startTime || 6;
    document.getElementById('end-time').value = currentSurvey.videoConfig?.endTime || 7;
    document.getElementById('continue-time').value = currentSurvey.videoConfig?.continueTime || 8000;
    
    // Styling
    document.getElementById('primary-color').value = currentSurvey.styling?.primaryColor || '#002D72';
    document.getElementById('text-color').value = currentSurvey.styling?.textColor || '#3F3B3C';
    document.getElementById('border-color').value = currentSurvey.styling?.borderColor || '#FFFFFF';
    document.getElementById('card-background').value = currentSurvey.styling?.cardBackground || 'rgba(255, 255, 255, 0.7)';
    document.getElementById('font-family').value = currentSurvey.styling?.fontFamily || 'Poppins';
    
    // Thank you message
    document.getElementById('thank-you-message').value = currentSurvey.thankYouMessage || '';
    document.getElementById('thank-you-subtext').value = currentSurvey.thankYouSubtext || '';
    document.getElementById('thank-you-duration').value = currentSurvey.thankYouDuration || 3000;
}

function generateQuestions() {
    const questionCount = parseInt(document.getElementById('question-count').value);
    const container = document.getElementById('questions-container');
    
    console.log('Generating questions, count:', questionCount, 'container:', container);
    
    if (!container) {
        console.error('Questions container not found!');
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-questions">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Generating questions...</p>
        </div>
    `;
    
    // Small delay to show loading state
    setTimeout(() => {
        // Preserve existing questions up to the new count
        const existingQuestions = currentSurvey.questions || [];
        const newQuestions = [];
        
        for (let i = 0; i < questionCount; i++) {
            if (i < existingQuestions.length) {
                newQuestions.push(existingQuestions[i]);
            } else {
                newQuestions.push({
                    type: 'star-rating',
                    text: `${i + 1}. Enter your question here`,
                    trackId: `question_${i + 1}_feedback`,
                    trackName: `Question ${i + 1} Rating`,
                    placeholder: 'Type your comments here'
                });
            }
        }
        
        currentSurvey.questions = newQuestions;
        console.log('Updated questions:', newQuestions);
        
        // Generate question builder UI
        const questionsHTML = newQuestions.map((question, index) => createQuestionBuilder(question, index)).join('');
        
        if (questionsHTML) {
            container.innerHTML = questionsHTML;
            console.log('Questions HTML generated successfully');
            
            // Add event listeners to all question inputs
            addQuestionEventListeners();
        } else {
            container.innerHTML = `
                <div class="error-questions">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error generating questions. Please try again.</p>
                    <button onclick="generateQuestions()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    }, 200);
}

function createQuestionBuilder(question, index) {
    return `
        <div class="question-item" data-question-index="${index}">
            <div class="question-header">
                <span class="question-number">Question ${index + 1}</span>
                <div class="question-type-selector">
                    <div class="type-option">
                        <input type="radio" id="star-${index}" name="type-${index}" value="star-rating" ${question.type === 'star-rating' ? 'checked' : ''}>
                        <label for="star-${index}"><i class="fas fa-star"></i> Star Rating</label>
                    </div>
                    <div class="type-option">
                        <input type="radio" id="text-${index}" name="type-${index}" value="text" ${question.type === 'text' ? 'checked' : ''}>
                        <label for="text-${index}"><i class="fas fa-edit"></i> Text Input</label>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="question-text-${index}">Question Text</label>
                <textarea id="question-text-${index}" rows="2" placeholder="Enter your question...">${question.text}</textarea>
                <small>Make your question clear and engaging</small>
            </div>
            
            ${question.type === 'text' ? `
                <div class="form-group">
                    <label for="question-placeholder-${index}">Placeholder Text</label>
                    <input type="text" id="question-placeholder-${index}" placeholder="Enter placeholder text..." value="${question.placeholder || ''}">
                    <small>This text appears in the empty text field</small>
                </div>
            ` : `
                <div class="star-rating-preview">
                    <label>Star Rating Preview</label>
                    <div class="preview-stars">${'⭐'.repeat(currentSurvey.starRating?.maxStars || 5)}</div>
                    <small>Users will rate using ${currentSurvey.starRating?.maxStars || 5} stars</small>
                </div>
            `}
            
            <div class="form-row">
                <div class="form-group">
                    <label for="question-track-id-${index}">Track ID</label>
                    <input type="text" id="question-track-id-${index}" placeholder="tracking_id" value="${question.trackId || ''}">
                    <small>Unique identifier for analytics</small>
                </div>
                <div class="form-group">
                    <label for="question-track-name-${index}">Track Name</label>
                    <input type="text" id="question-track-name-${index}" placeholder="Display Name" value="${question.trackName || ''}">
                    <small>Human-readable name for reporting</small>
                </div>
            </div>
        </div>
    `;
}

function addQuestionEventListeners() {
    const questionItems = document.querySelectorAll('.question-item');
    
    questionItems.forEach((item, index) => {
        // Question type change
        const typeRadios = item.querySelectorAll(`input[name="type-${index}"]`);
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentSurvey.questions[index].type = e.target.value;
                generateQuestions(); // Regenerate to show/hide fields
            });
        });
        
        // Question text change
        const textArea = item.querySelector(`#question-text-${index}`);
        textArea.addEventListener('input', (e) => {
            currentSurvey.questions[index].text = e.target.value;
        });
        
        // Placeholder text change (for text questions)
        const placeholderInput = item.querySelector(`#question-placeholder-${index}`);
        if (placeholderInput) {
            placeholderInput.addEventListener('input', (e) => {
                currentSurvey.questions[index].placeholder = e.target.value;
            });
        }
        
        // Track ID change
        const trackIdInput = item.querySelector(`#question-track-id-${index}`);
        trackIdInput.addEventListener('input', (e) => {
            currentSurvey.questions[index].trackId = e.target.value;
        });
        
        // Track name change
        const trackNameInput = item.querySelector(`#question-track-name-${index}`);
        trackNameInput.addEventListener('input', (e) => {
            currentSurvey.questions[index].trackName = e.target.value;
        });
    });
}

function updateStarRating() {
    const maxStars = parseInt(document.getElementById('max-stars').value);
    currentSurvey.starRating.maxStars = maxStars;
}

function collectFormData() {
    // Basic configuration
    currentSurvey.title = document.getElementById('survey-title').value;
    currentSurvey.starRating.maxStars = parseInt(document.getElementById('max-stars').value);
    
    // Video configuration
    currentSurvey.videoConfig = {
        host: document.getElementById('video-host').value,
        videoId: document.getElementById('video-id').value,
        startTime: parseInt(document.getElementById('start-time').value),
        endTime: parseInt(document.getElementById('end-time').value),
        continueTime: parseInt(document.getElementById('continue-time').value),
        params: {
            "add-widgets": "utils,fontloader,markup",
            "disableKeyboardEvents": true
        }
    };
    
    // Styling
    currentSurvey.styling = {
        primaryColor: document.getElementById('primary-color').value,
        textColor: document.getElementById('text-color').value,
        borderColor: document.getElementById('border-color').value,
        cardBackground: document.getElementById('card-background').value,
        fontFamily: document.getElementById('font-family').value
    };
    
    // Thank you message
    currentSurvey.thankYouMessage = document.getElementById('thank-you-message').value;
    currentSurvey.thankYouSubtext = document.getElementById('thank-you-subtext').value;
    currentSurvey.thankYouDuration = parseInt(document.getElementById('thank-you-duration').value);
    
    return currentSurvey;
}

async function saveSurvey() {
    try {
        const surveyData = collectFormData();
        
        let response;
        if (isEditing && editingSurveyId) {
            response = await fetch(`/api/surveys/${editingSurveyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(surveyData)
            });
        } else {
            response = await fetch('/api/surveys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(surveyData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            if (!isEditing) {
                // Switch to editing mode
                isEditing = true;
                editingSurveyId = data.surveyId || data.survey.id;
                
                // Update URL without page reload
                window.history.pushState(null, '', `/editor?id=${editingSurveyId}`);
            }
            
            // Show success message
            showNotification('Survey saved successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to save survey');
        }
    } catch (error) {
        console.error('Error saving survey:', error);
        showNotification('Error saving survey: ' + error.message, 'error');
    }
}

async function previewSurvey() {
    if (!isEditing || !editingSurveyId) {
        // Save first, then preview
        await saveSurvey();
        if (!editingSurveyId) {
            showNotification('Please save the survey first', 'error');
            return;
        }
    }
    
    // Open preview in new tab
    window.open(`/preview/${editingSurveyId}`, '_blank');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}"></i>
        ${message}
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Wizard Navigation Functions
function nextStep() {
    if (currentStep < totalSteps) {
        if (validateCurrentStep()) {
            currentStep++;
            showStep(currentStep);
            updateProgress();
            updateNavigation();
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
        updateNavigation();
    }
}

function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
        currentStep = step;
        showStep(currentStep);
        updateProgress();
        updateNavigation();
    }
}

function showStep(step) {
    console.log('Showing step:', step);
    
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
    console.log('Current step element:', currentStepEl);
    
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    } else {
        console.error('Step element not found for step:', step);
    }
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 === step) {
            stepEl.classList.add('active');
        } else if (index + 1 < step) {
            stepEl.classList.add('completed');
        }
    });
    
    // Make step indicators clickable
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.onclick = () => goToStep(index + 1);
    });
    
    // If we're on step 2 (questions), make sure questions are generated
    if (step === 2) {
        setTimeout(() => {
            generateQuestions();
        }, 100);
    }
}

function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = `${progress}%`;
    
    document.getElementById('current-step').textContent = currentStep;
}

function updateNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentStep === 1;
    
    if (currentStep === totalSteps) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> Complete';
        nextBtn.onclick = completeSurvey;
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        nextBtn.onclick = nextStep;
    }
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateBasicInfo();
        case 2:
            return validateQuestions();
        case 3:
            return validateVideoConfig();
        case 4:
            return true; // Styling is optional
        case 5:
            return true; // Final step
        default:
            return true;
    }
}

function validateBasicInfo() {
    const title = document.getElementById('survey-title').value.trim();
    if (!title) {
        showNotification('Please enter a survey title', 'error');
        return false;
    }
    return true;
}

function validateQuestions() {
    const questions = currentSurvey.questions || [];
    if (questions.length === 0) {
        showNotification('Please add at least one question', 'error');
        return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].text.trim()) {
            showNotification(`Please enter text for question ${i + 1}`, 'error');
            return false;
        }
    }
    return true;
}

function validateVideoConfig() {
    const host = document.getElementById('video-host').value.trim();
    const videoId = document.getElementById('video-id').value.trim();
    
    if (!host || !videoId) {
        showNotification('Please enter video host and video ID', 'error');
        return false;
    }
    return true;
}

function completeSurvey() {
    saveSurvey().then(() => {
        showNotification('Survey completed successfully!', 'success');
        // Could redirect to preview or dashboard
    });
}

// Enhanced Form Setup
function setupFormListeners() {
    // Basic info listeners
    const surveyTitleEl = document.getElementById('survey-title');
    const maxStarsEl = document.getElementById('max-stars');
    const questionCountEl = document.getElementById('question-count');
    
    if (surveyTitleEl) {
        surveyTitleEl.addEventListener('input', updateBasicPreviews);
    }
    
    if (maxStarsEl) {
        maxStarsEl.addEventListener('change', () => {
            updateStarRating();
            updateBasicPreviews();
        });
    }
    
    if (questionCountEl) {
        questionCountEl.addEventListener('change', () => {
            generateQuestions();
            updateBasicPreviews();
        });
    }
    
    // Video config listeners
    const startTimeEl = document.getElementById('start-time');
    const endTimeEl = document.getElementById('end-time');
    const continueTimeEl = document.getElementById('continue-time');
    
    if (startTimeEl) startTimeEl.addEventListener('input', updateTimelinePreviews);
    if (endTimeEl) endTimeEl.addEventListener('input', updateTimelinePreviews);
    if (continueTimeEl) continueTimeEl.addEventListener('input', updateTimelinePreviews);
    
    // Styling listeners
    const primaryColorEl = document.getElementById('primary-color');
    const textColorEl = document.getElementById('text-color');
    const borderColorEl = document.getElementById('border-color');
    const fontFamilyEl = document.getElementById('font-family');
    
    if (primaryColorEl) primaryColorEl.addEventListener('change', updateStylePreview);
    if (textColorEl) textColorEl.addEventListener('change', updateStylePreview);
    if (borderColorEl) borderColorEl.addEventListener('change', updateStylePreview);
    if (fontFamilyEl) fontFamilyEl.addEventListener('change', updateStylePreview);
    
    // Thank you message listeners
    const thankYouDurationEl = document.getElementById('thank-you-duration');
    if (thankYouDurationEl) {
        thankYouDurationEl.addEventListener('input', updateDurationDisplay);
    }
    
    // Summary updates
    if (surveyTitleEl) {
        surveyTitleEl.addEventListener('input', updateSummary);
    }
    
    console.log('Form listeners set up');
}

function setupLivePreviews() {
    updateBasicPreviews();
    updateTimelinePreviews();
    updateStylePreview();
    updateDurationDisplay();
    updateSummary();
}

// Question Count Controls
function changeQuestionCount(delta) {
    const input = document.getElementById('question-count');
    const currentValue = parseInt(input.value);
    const newValue = Math.max(1, Math.min(10, currentValue + delta));
    input.value = newValue;
    generateQuestions();
    updateBasicPreviews();
}

// Live Preview Updates
function updateBasicPreviews() {
    const title = document.getElementById('survey-title').value || 'Interactive Feedback Survey';
    const maxStars = parseInt(document.getElementById('max-stars').value);
    const questionCount = parseInt(document.getElementById('question-count').value);
    
    // Update mini preview
    document.getElementById('title-preview').textContent = title;
    document.getElementById('stars-preview').textContent = '⭐'.repeat(maxStars);
    document.getElementById('questions-preview').textContent = `${questionCount} Question${questionCount !== 1 ? 's' : ''}`;
}

function updateTimelinePreviews() {
    const startTime = parseInt(document.getElementById('start-time').value);
    const endTime = parseInt(document.getElementById('end-time').value);
    const continueTime = parseInt(document.getElementById('continue-time').value);
    
    document.getElementById('start-time-label').textContent = `${startTime}s`;
    document.getElementById('end-time-label').textContent = `${endTime}s`;
    document.getElementById('continue-time-label').textContent = `${continueTime/1000}s`;
    
    // Update timeline segment widths
    const surveySegment = document.getElementById('survey-timeline');
    const duration = Math.max(1, endTime - startTime);
    // This is a visual representation - could be enhanced with actual proportional widths
}

function updateStylePreview() {
    const primaryColor = document.getElementById('primary-color').value;
    const textColor = document.getElementById('text-color').value;
    const borderColor = document.getElementById('border-color').value;
    const fontFamily = document.getElementById('font-family').value;
    
    // Update color name displays
    document.getElementById('primary-color-name').textContent = primaryColor;
    document.getElementById('text-color-name').textContent = textColor;
    document.getElementById('border-color-name').textContent = borderColor;
    
    // Update style preview card
    const previewCard = document.getElementById('style-preview-card');
    const previewButton = document.getElementById('preview-button');
    
    previewCard.style.fontFamily = fontFamily;
    previewCard.style.borderColor = borderColor;
    previewCard.style.color = textColor;
    previewButton.style.backgroundColor = primaryColor;
}

function updateCardBackground() {
    const select = document.getElementById('card-background');
    const customInput = document.getElementById('custom-background');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
}

function updateDurationDisplay() {
    const duration = parseInt(document.getElementById('thank-you-duration').value);
    document.getElementById('duration-display').textContent = `${(duration / 1000).toFixed(1)} seconds`;
}

function updateSummary() {
    const title = document.getElementById('survey-title').value || 'Interactive Feedback Survey';
    const questionCount = parseInt(document.getElementById('question-count').value);
    const maxStars = parseInt(document.getElementById('max-stars').value);
    const videoHost = document.getElementById('video-host').value;
    const videoId = document.getElementById('video-id').value;
    
    document.getElementById('summary-title').textContent = title;
    document.getElementById('summary-questions').textContent = `${questionCount} question${questionCount !== 1 ? 's' : ''}`;
    document.getElementById('summary-stars').textContent = `${maxStars} star${maxStars !== 1 ? 's' : ''}`;
    document.getElementById('summary-video').textContent = (videoHost && videoId) ? 'Configured' : 'Not configured';
}
