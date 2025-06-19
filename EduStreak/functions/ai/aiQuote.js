import axios from 'axios';
import Config from 'react-native-config';
import React from 'react';
import { View } from 'react-native';

const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const fetchDailyQuoteFromGemini = async () => {
  console.log("Fetching daily quote...");
  try {
    const response = await axios.post(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Config.API_KEY}`,
      {
        contents: [
          {
            parts: [
              { // this is the prompt
                text: `Generate exactly one short, creative and motivational quote. It should be unique and different each time. Do not include any bullet points, numbering, or lists. Just output the quote only, without any explanation or introduction.`
              }
            ]
          }
        ]
      }
    );
// Verify the presence of the quote text within the API response structure.
    if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
    // Verify the presence of the quote text within the API response structure.
      console.error('❌ Unexpected response structure from Gemini API:', response.data);
      throw new Error('Failed to parse quote from API response.');
    }
  } catch (error) {
  // Catch and log errors related to fetching or processing the daily quote.
    console.error('❌ Error when generating daily quote:', error.response?.data || error.message);
    throw error;
  }
};