import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/Colors'; // Corrected path

// Helper for Circular Progress
export const CircularProgress = ({ percentage, radius = 40, strokeWidth = 8, color = colors.accent }: { percentage: number; radius?: number; strokeWidth?: number; color?: string }) => {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
        <Circle
          stroke={colors.lightGray}
          fill="none"
          cx={(radius * 2 + strokeWidth)/2}
          cy={(radius * 2 + strokeWidth)/2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={(radius * 2 + strokeWidth)/2}
          cy={(radius * 2 + strokeWidth)/2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${ (radius * 2 + strokeWidth)/2} ${(radius * 2 + strokeWidth)/2})`}
        />
        <SvgText
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            fontSize="16"
            fill={colors.black}
            fontWeight="bold"
        >
            {`${Math.round(percentage)}%`}
        </SvgText>
      </Svg>
    </View>
  );
}; 