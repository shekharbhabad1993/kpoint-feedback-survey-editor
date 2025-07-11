# Feedback Survey Editor

A powerful Node.js application for creating interactive video feedback surveys with a visual editor interface.

## Features

- **Visual Editor**: Drag-and-drop interface for creating surveys
- **Customizable Questions**: Support for star ratings and text input questions
- **Flexible Star Ratings**: Configure 1-10 star rating scales
- **Brand Styling**: Customize colors, fonts, and appearance
- **Live Preview**: See how your survey looks before publishing
- **Export Functionality**: Generate complete HTML/CSS/JavaScript code
- **Video Integration**: Seamless integration with video players

## Installation

1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

2. Open your browser and go to `http://localhost:3000`

3. Click "Create New Survey" to start building your feedback survey

4. Configure your survey:
   - Set the number of questions and star rating scale
   - Edit question text and types
   - Customize styling and colors
   - Configure video integration settings
   - Set thank you message

5. Preview your survey to see how it looks

6. Download the generated HTML code for use in your projects

## API Endpoints

- `GET /` - Home page
- `GET /editor` - Survey editor interface
- `GET /preview/:id` - Preview survey
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:id` - Get survey by ID
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `GET /api/surveys/:id/generate` - Generate survey code

## Project Structure

```
feedback-survey-editor/
├── server.js           # Express server
├── package.json        # Dependencies
├── public/            # Frontend files
│   ├── index.html     # Home page
│   ├── editor.html    # Survey editor
│   ├── preview.html   # Survey preview
│   ├── style.css      # Styles
│   └── editor.js      # Editor functionality
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **Icons**: Font Awesome
- **Video Integration**: Custom video player widgets

## License

MIT License
