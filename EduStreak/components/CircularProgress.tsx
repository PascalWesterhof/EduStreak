import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../functions/themeFunctions/themeContext';

interface CircularProgressProps {
  percentage: number;
  radius?: number;
  strokeWidth?: number;
  color?: string; // Kleur voor de actieve progressiecirkel (kan een themakleur of een specifieke kleur zijn)
  backgroundColor?: string; // Kleur voor de achtergrondcirkel (optioneel, anders een themakleur)
  textColor?: string; // Kleur voor de tekst (optioneel, anders een themakleur)
}

// Helper for Circular Progress
    export const CircularProgress = ({
      percentage,
      radius = 40,
      strokeWidth = 8,
      color,
      backgroundColor,
      textColor,
    }: CircularProgressProps) => {
      const { colors: themeColors } = useTheme();

      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;

      const progressColor = color || themeColors.accent;
      const trackColor = backgroundColor || themeColors.progressBackground || themeColors.borderColor;
      const percentageTextColor = textColor || themeColors.textDefault;

      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
            <Circle
              stroke={trackColor}
              fill="none"
              cx={(radius * 2 + strokeWidth) / 2}
              cy={(radius * 2 + strokeWidth) / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke={progressColor}
              fill="none"
              cx={(radius * 2 + strokeWidth) / 2}
              cy={(radius * 2 + strokeWidth) / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${ (radius * 2 + strokeWidth) / 2} ${(radius * 2 + strokeWidth) / 2})`}
            />
            <SvgText
              x="50%"
              y="50%"
              textAnchor="middle"
              dy=".3em"
              fontSize="16"
              fill={percentageTextColor}
              fontWeight="bold"
            >
              {`${Math.round(percentage)}%`}
            </SvgText>
          </Svg>
        </View>
      );
    };