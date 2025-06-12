// aiQuote.js
import axios from 'axios';
import Config from 'react-native-config';

const key = Config.API_KEY;

export const fetchDailyQuoteFromGemini = async () => {
  console.log("Fetching daily quote...");
  try {
    const response = await axios.post(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Config.API_KEY}`
      {
        contents: [
          {
            parts: [
              {
                text: `Generate exactly one short, creative and motivational quote. It should be unique and different each time. Do not include any bullet points, numbering, or lists. Just output the quote only, without any explanation or introduction.`
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