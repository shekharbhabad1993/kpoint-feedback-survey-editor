const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory storage for surveys (in production, use a database)
let surveys = {};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.get('/preview/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'preview.html'));
});

// API Routes
app.post('/api/surveys', (req, res) => {
  try {
    const surveyId = uuidv4();
    const survey = {
      id: surveyId,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    surveys[surveyId] = survey;
    res.json({ success: true, surveyId, survey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/surveys/:id', (req, res) => {
  try {
    const survey = surveys[req.params.id];
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    res.json({ success: true, survey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/surveys', (req, res) => {
  try {
    res.json({ success: true, surveys: Object.values(surveys) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/surveys/:id', (req, res) => {
  try {
    const surveyId = req.params.id;
    if (!surveys[surveyId]) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    surveys[surveyId] = {
      ...surveys[surveyId],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, survey: surveys[surveyId] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/surveys/:id', (req, res) => {
  try {
    const surveyId = req.params.id;
    if (!surveys[surveyId]) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    delete surveys[surveyId];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate survey HTML/JS code
app.get('/api/surveys/:id/generate', (req, res) => {
  try {
    const survey = surveys[req.params.id];
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    
    const generatedCode = generateSurveyCode(survey);
    res.json({ success: true, code: generatedCode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function generateSurveyCode(survey) {
  // Generate the complete HTML/CSS/JS code based on survey configuration
  const { questions, starRating, styling, videoConfig } = survey;
  
  let questionSteps = '';
  let questionHandlers = '';
  
  questions.forEach((question, index) => {
    const isLast = index === questions.length - 1;
    const stepId = `question-${index + 1}`;
    const nextStep = isLast ? 'thank-you' : `question-${index + 2}`;
    
    if (question.type === 'star-rating') {
      questionSteps += generateStarRatingStep(question, index + 1, questions.length, stepId, nextStep, starRating.maxStars);
      questionHandlers += generateStarRatingHandler(stepId, index + 1, nextStep, isLast);
    } else if (question.type === 'text') {
      questionSteps += generateTextStep(question, index + 1, questions.length, stepId);
      questionHandlers += generateTextHandler(stepId, index + 1);
    }
  });
  
  return generateCompleteHTML(questionSteps, questionHandlers, styling, videoConfig, survey);
}

function generateStarRatingStep(question, questionNum, totalQuestions, stepId, nextStep, maxStars) {
  const stars = Array.from({length: maxStars}, (_, i) => 
    `<div class="feedback-star-icon starBtn${i + 1}">
      <i class="far fa-star star-icons feedback-clickable" style="color: #002D72"></i>
    </div>`
  ).join('');
  
  return `
    <div id="${stepId}" class="survey-feedback-step ${questionNum === 1 ? 'active' : ''}">
      <div class="survey-card">
        <span class="question-number">Question: ${questionNum}/${totalQuestions}</span>
        <div class="survey-card-header">
          <span class="subtitle survey-sm">${question.text}</span>
        </div>
        <div class="survey-star-rating-container">
          <div class="feedback-icons">
            ${stars}
          </div>
        </div>
        <div
          id="survey-submit-${questionNum}"
          class="submit-btn survey-lg kpw-action-button kpw-track"
          data-track-id="${question.trackId || `question_${questionNum}_feedback`}"
          data-track-name="${question.trackName || `Question ${questionNum} Rating`}"
          data-track-group="feedback"
          data-track-widgetname="feedback"
          data-next-step="${nextStep}"
        >
          ${questionNum === totalQuestions ? 'SUBMIT FEEDBACK' : 'NEXT'}
        </div>
      </div>
    </div>`;
}

function generateTextStep(question, questionNum, totalQuestions, stepId) {
  return `
    <div id="${stepId}" class="survey-feedback-step">
      <div class="template-3-container">
        <div class="custom-text-area">
          <span class="question-number">Question: ${questionNum}/${totalQuestions}</span>
          <div class="header-survey">
            ${question.text}
          </div>
          <div class="content">
            <textarea placeholder="${question.placeholder || 'Type your comments here'}"></textarea>
          </div>
          <div class="footer">
            <div
              class="submit-primary-btn kpw-action-button"
              data-track-widgetname="feedback"
              data-track-group="feedback"
              data-track-name="${question.trackName || `Question ${questionNum}`}"
              data-track-id="${question.trackId || `question_${questionNum}_feedback`}"
              id="text-submit-${questionNum}"
            >
              ${questionNum === totalQuestions ? 'SUBMIT FEEDBACK' : 'NEXT'}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function generateStarRatingHandler(stepId, questionNum, nextStep, isLast) {
  return `
        $("#survey-submit-${questionNum}", self.container).on("click", function() {
          if ($(this).hasClass("feedback-submit-clickable") && !$(this).data('submitted')) {
            $(this).data('submitted', true);
            $(this).addClass('disabled').css('pointer-events', 'none');
            trackStarRating(this);
            ${isLast ? 'showThankYouMessage();' : `showNextStep("${nextStep}");`}
          }
        });`;
}

function generateTextHandler(stepId, questionNum) {
  return `
        $("#text-submit-${questionNum}", self.container).on("click", function() {
          if (!$(this).data('submitted')) {
            $(this).data('submitted', true);
            $(this).addClass('disabled').css('pointer-events', 'none');
            
            const textValue = $("#${stepId} textarea", self.container).val();
            const data = {
              text: textValue,
              id: $(this).attr("data-track-id"),
              name: $(this).attr("data-track-name"),
              group: "Feedback",
              type: "BW",
              event: "submitted",
              offset: parseInt(self.controller.player.getCurrentTime())
            };
            const track_data = {
              type: "customform",
              data: JSON.stringify(data)
            };
            self.controller.tracker.track({ track_data: track_data });
            
            ${questionNum === 'last' ? 'showThankYouMessage();' : 'showNextStep($(this).attr("data-next-step"));'}
          }
        });`;
}

function generateCompleteHTML(questionSteps, questionHandlers, styling, videoConfig, survey) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${survey.title || 'Interactive Feedback Survey'}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    ${generateCSS(styling)}
  </style>
</head>
<body>
  <div
    data-video-host="${videoConfig.host}"
    data-kvideo-id="${videoConfig.videoId}"
    style="height: 100%; width: 100%"
    data-video-params='${JSON.stringify(videoConfig.params)}'
    data-widgets-config='${JSON.stringify(generateWidgetConfig(survey))}'
  ></div>

  <div id="survey-feedback-container" style="display: none">
    <div class="survey-feedback-container">
      ${questionSteps}
    </div>
  </div>

  <script>
    ${generateJavaScript(questionHandlers, survey)}
  </script>

  <script
    type="text/javascript"
    src="https://assets.kpoint.com/orca/media/embed/videofront-vega.js"
  ></script>
</body>
</html>`;
}

function generateCSS(styling) {
  return `
    :root {
      --pw: 1px;
    }
    
    .survey-sm { font-size: calc(2.2 * var(--pw)); font-family: '${styling.fontFamily}', sans-serif; }
    .survey-md { font-size: calc(3.2 * var(--pw)); font-family: '${styling.fontFamily}', sans-serif; }
    .survey-lg { font-size: calc(4.2 * var(--pw)); font-family: '${styling.fontFamily}', sans-serif; }
    
    .survey-card {
      pointer-events: visible;
      position: absolute;
      bottom: calc(15 * var(--pw));
      left: 50%;
      transform: translate(-50%);
      background-color: ${styling.cardBackground};
      backdrop-filter: blur(calc(1.8 * var(--pw)));
      border-radius: calc(1.5 * var(--pw));
      border: 2px solid ${styling.borderColor};
      height: calc(32 * var(--pw));
      width: calc(65 * var(--pw));
      display: flex;
      flex-direction: column;
      padding: calc(2 * var(--pw));
      row-gap: calc(1 * var(--pw));
      font-family: '${styling.fontFamily}', sans-serif;
    }
    
    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: center;
      width: calc(30 * var(--pw));
      height: calc(5 * var(--pw));
      font-size: calc(2 * var(--pw));
      background-color: ${styling.primaryColor};
      opacity: 0.4;
      color: white;
      border: none;
      border-radius: calc(4 * var(--pw));
      font-weight: 700;
      cursor: not-allowed;
      text-align: center;
    }
    
    .feedback-submit-clickable {
      background-color: ${styling.primaryColor};
      opacity: 1;
      cursor: pointer;
    }
    
    .feedback-star-icon {
      cursor: pointer;
      font-size: calc(3.5 * var(--pw)) !important;
      padding: calc(1.6 * var(--pw)) !important;
    }
    
    .survey-feedback-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      pointer-events: visible;
    }
    
    .survey-feedback-step {
      display: none;
    }
    
    .survey-feedback-step.active {
      display: block;
    }
    
    .custom-text-area {
      display: flex;
      flex-direction: column;
      height: calc(32 * var(--pw));
      width: calc(70 * var(--pw));
      background-color: ${styling.cardBackground};
      border-radius: calc(1.5 * var(--pw));
      padding: calc(2 * var(--pw));
      border: 2px solid ${styling.borderColor};
      row-gap: calc(1 * var(--pw));
      font-family: '${styling.fontFamily}', sans-serif;
    }
    
    .custom-text-area textarea {
      padding: calc(1.5 * var(--pw));
      width: 90%;
      height: calc(12 * var(--pw));
      font-size: calc(3.5 * var(--pw));
      border-radius: calc(1.2 * var(--pw));
      border: 1px solid #ddd;
      resize: none;
    }
    
    .submit-primary-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: calc(30 * var(--pw));
      height: calc(5 * var(--pw));
      font-size: calc(2 * var(--pw));
      background-color: ${styling.primaryColor};
      color: white;
      border: none;
      border-radius: calc(4 * var(--pw));
      font-weight: 700;
      cursor: pointer;
    }
    
    .question-number {
      display: flex;
      justify-content: flex-end;
      font-size: calc(1.8 * var(--pw));
      color: ${styling.textColor};
    }
    
    .survey-card-header {
      text-align: center;
      color: ${styling.textColor};
    }
    
    .subtitle {
      font-weight: 500;
    }
  `;
}

function generateWidgetConfig(survey) {
  return {
    markup: {
      list: [
        {
          start_time: survey.videoConfig.startTime || 6,
          end_time: survey.videoConfig.endTime || 7,
          template: "#survey-feedback-container",
          "z-index": "1000",
          callback: "survey-feedback-callback",
          action: "pause"
        }
      ]
    },
    fontloader: {
      list: [
        {
          name: survey.styling.fontFamily,
          url: "",
          google: {
            styles: ["300", "400", "500", "700"]
          }
        }
      ]
    }
  };
}

function generateJavaScript(questionHandlers, survey) {
  return `
    window["survey-feedback-callback"] = {
      onRender: (self) => {
        var $ = $kPointQuery;
        
        function initFeedbackForms() {
          $(".submit-btn, .submit-primary-btn", self.container).off("click");
          
          ${survey.questions.map((q, i) => q.type === 'star-rating' ? `setupStarRating("#question-${i + 1}", ${survey.starRating.maxStars});` : '').join('\n          ')}
          
          ${questionHandlers}
        }
        
        function setupStarRating(containerId, maxStars) {
          let clickedStarNumber = 0;
          
          for (let star = 1; star <= maxStars; star++) {
            $(containerId + " .starBtn" + star, self.container).on("click", function() {
              clickedStarNumber = star;
              
              $(containerId + " .feedback-star-icon", self.container).each(function(index) {
                const starIcon = $(this).find("i");
                if (index < star) {
                  starIcon.removeClass("far").addClass("fas");
                } else {
                  starIcon.removeClass("fas").addClass("far");
                }
              });
              
              const submitBtn = $(containerId + " .submit-btn", self.container);
              submitBtn.addClass("feedback-submit-clickable");
              submitBtn.attr("data-track-feedback", star);
              
              $(containerId + " .star-icons", self.container).removeClass("feedback-clickable");
            });
          }
        }
        
        function showNextStep(nextStepId) {
          $(".survey-feedback-step.active", self.container).removeClass("active");
          $("#" + nextStepId, self.container).addClass("active");
          
          $(".submit-btn, .submit-primary-btn", self.container)
            .data('submitted', false)
            .removeClass('disabled')
            .css('pointer-events', '');
        }
        
        function showThankYouMessage() {
          $(".survey-feedback-step.active", self.container).removeClass("active");
          
          const thankYouHtml = \`
            <div id="thank-you-step" class="survey-feedback-step active">
              <div class="survey-card" style="text-align: center; justify-content: center;">
                <div class="survey-card-header">
                  <span class="subtitle survey-md" style="color: ${survey.styling.primaryColor}; font-weight: 600;">${survey.thankYouMessage || 'Thank you for your response!'}</span>
                </div>
                <div style="margin: calc(2 * var(--pw)) 0;">
                  <span class="survey-sm" style="color: ${survey.styling.textColor};">${survey.thankYouSubtext || 'Your feedback helps us improve our content and services.'}</span>
                </div>
              </div>
            </div>
          \`;
          $(".survey-feedback-container", self.container).append(thankYouHtml);
          
          setTimeout(() => {
            $(".survey-feedback-container", self.container).remove();
            setTimeout(() => {
              self.controller.player.seekTo(${survey.videoConfig.continueTime || 8000});
              self.hide();
            }, 300);
          }, ${survey.thankYouDuration || 3000});
        }
        
        function trackStarRating(buttonElement) {
          const starRating = $(buttonElement).attr("data-track-feedback");
          const trackId = $(buttonElement).attr("data-track-id");
          const trackName = $(buttonElement).attr("data-track-name");
          const formattedRating = starRating === "1" ? "1 Star" : starRating + " Stars";
          
          const data = {
            id: trackId,
            name: trackName,
            group: "Feedback",
            feedback: formattedRating,
            type: "BW",
            event: "submitted",
            offset: parseInt(self.controller.player.getCurrentTime())
          };
          
          const track_data = {
            type: "feedback",
            data: JSON.stringify(data)
          };
          
          self.controller.tracker.track({ track_data: track_data });
        }
        
        initFeedbackForms();
      }
    };
  `;
}

app.listen(PORT, () => {
  console.log(`Feedback Survey Editor running on http://localhost:${PORT}`);
});
