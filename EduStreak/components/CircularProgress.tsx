import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../functions/themeFunctions/themeContext'; // << NIEUW: Pas het pad aan indien nodig

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
      color, // Verwijder de oude default
      backgroundColor,
      textColor,
    }: CircularProgressProps) => {
      const { colors: themeColors } = useTheme(); // << NIEUW: Haal themakleuren op

      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;

      // Bepaal de kleuren die gebruikt worden, met fallback naar themakleuren
      const progressColor = color || themeColors.accent; // Gebruik prop 'color' of thematische accentkleur
      const trackColor = backgroundColor || themeColors.progressBackground || themeColors.borderColor; // Met fallback // Gebruik prop 'backgroundColor' of een thematische track kleur (bijv. borderColor of een nieuw gedefinieerde 'trackColor')
      const percentageTextColor = textColor || themeColors.textDefault; // Gebruik prop 'textColor' of thematische tekstkleur

      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
            <Circle
              stroke={trackColor} // << GEBRUIK THEMATISCHE TRACK KLEUR
              fill="none"
              cx={(radius * 2 + strokeWidth) / 2}
              cy={(radius * 2 + strokeWidth) / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke={progressColor} // << GEBRUIK PROGRESS KLEUR
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
              fontSize="16" // Je kunt dit ook thematisch maken of als prop meegeven
              fill={percentageTextColor} // << GEBRUIK THEMATISCHE TEKSTKLEUR
              fontWeight="bold" // Idem
            >
              {`${Math.round(percentage)}%`}
            </SvgText>
          </Svg>
        </View>
      );
    };