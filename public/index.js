async function createNewSurvey() {
    const defaultSurvey = {
        title: 'New Survey',
        questions: [],
        starRating: { maxStars: 5 },
        videoConfig: {},
        styling: {},
        thankYouMessage: 'Thank you for your response!',
        thankYouSubtext: '',
        thankYouDuration: 3000
    };
    try {
        const response = await fetch('/api/surveys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultSurvey)
        });
        const data = await response.json();
        if (data.success && data.surveyId) {
            window.location.href = `/editor?id=${data.surveyId}`;
        } else {
            alert('Error creating survey: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error creating survey: ' + error.message);
    }
}
