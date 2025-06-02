// AIConsoleTest.js
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { fetchQuoteFromGemini } from './aiQuote';

export default function App() {
  useEffect(() => {
    const testQuote = async () => {
      const quote = await fetchQuoteFromGemini(5);
      console.log('🎯 AI Quote:', quote);
    };

    testQuote();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>AI Quote test draait... check je console!</Text>
    </View>
  );
}