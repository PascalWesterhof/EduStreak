// aiQuote.js
import axios from 'axios';

const GEMINI_API_KEY = 'AIzaSyBD9xheq6MqgFQljgmVu-WOUEu6ISS8j8c'; // Jouw API sleutel

export const fetchDailyQuoteFromGemini = async () => {
  console.log("Fetching daily quote...");
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Give only one motivational quote that is shown when a user opens the app.`
              }
            ]
          }
        ]
      }
    );

    if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.error('❌ Unexpected response structure from Gemini API:', response.data);
      throw new Error('Failed to parse quote from API response.');
    }
  } catch (error) {
    console.error('❌ Error when generating daily quote:', error.response?.data || error.message);
    throw error;
  }
};