// aiQuote.js
import axios from 'axios';

const GEMINI_API_KEY = 'AIzaSyBD9xheq6MqgFQljgmVu-WOUEu6ISS8j8c'; // vervang dit met je echte API key

export const fetchQuoteFromGemini = async (daysStreak) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Give a motivational quote for users who completed their goals for ${daysStreak} days.`
              }
            ]
          }
        ]
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('❌ Error when generating quote:', error.response?.data || error.message);
    return 'Keep up the good work!';
  }
};