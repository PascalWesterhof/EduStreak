import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Calendar() {
      const [currentDate, setCurrentDate] = useState(new Date());

      const daysInMonth = getDaysInMonth(currentDate);
      const startDay = getDay(startOfMonth(currentDate)); // 0 = Sunday
      const offset = (startDay + 6) % 7; // Adjust to start week on Monday

      const totalCells = daysInMonth + offset;
      const dates = Array.from({ length: totalCells }, (_, i) => {
        if (i < offset) return null;
        return i - offset + 1;
      });

      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const goToPreviousMonth = () => {
        setCurrentDate(prev => subMonths(prev, 1));
}
        const goToNextMonth = () => {
             setCurrentDate(prev => addMonths(prev, 1));
           };

    return (
          <View style={styles.screen}>
            <View style={styles.calendarCard}>
               {/* Month Selector */}
               <View style={styles.monthSelector}>
                 <TouchableOpacity onPress={goToPreviousMonth}>
                   <Text style={styles.navButton}>{'<'}</Text>
                 </TouchableOpacity>
                 <Text style={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
                 <TouchableOpacity onPress={goToNextMonth}>
                   <Text style={styles.navButton}>{'>'}</Text>
                 </TouchableOpacity>
               </View>

               {/* Weekday Headers */}
               <View style={styles.row}>
                 {weekdays.map(day => (
                   <Text key={day} style={styles.weekday}>{day}</Text>
                 ))}
               </View>

               {/* Dates Grid */}
               <View style={styles.grid}>
                 {dates.map((date, idx) => (
                   <View key={idx} style={styles.cell}>
                     {date ? (
                       <View style={styles.dotContainer}>
                         <Text style={styles.date}>{date}</Text>
                         <View style={styles.dotFull} />
                       </View>
                     ) : (
                       <Text style={styles.date}></Text>
                     )}
                   </View>
                 ))}
               </View>

               {/* Legend */}
               <View style={styles.legend}>
                 <View style={styles.legendItem}>
                   <View style={styles.dotFull} />
                   <Text style={styles.legendText}>All complete</Text>
                 </View>
                 <View style={styles.legendItem}>
                   <View style={styles.dotPartial} />
                   <Text style={styles.legendText}>Some complete</Text>
                 </View>
               </View>
             </View>
            </View>
        );
    };

const styles = StyleSheet.create({
  screen: {
     flex: 1,
     backgroundColor: '#D1624A',
     padding: 16,
   },
   calendarCard: {
     backgroundColor: 'white',
     borderRadius: 12,
     padding: 16,
     elevation: 4, // for Android shadow
     shadowColor: '#000', // for iOS shadow
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
   },

  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c44',
  },
  navButton: {
    fontSize: 20,
    color: '#c44',
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', color: '#c44', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 50, justifyContent: 'center', alignItems: 'center' },
  date: { color: '#c44', fontWeight: '500' },
  dotContainer: { alignItems: 'center' },
  dotFull: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c44',
    marginTop: 2,
  },
  dotPartial: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f88',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendText: {
    color: '#c44',
    marginLeft: 4,
    fontSize: 12,
  },
});
