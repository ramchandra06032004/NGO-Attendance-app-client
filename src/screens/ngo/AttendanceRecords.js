import React from 'react';
import { View, Text } from 'react-native';

// Use a default empty object {} for 'route'
// AttendanceRecords.js

export default function AttendanceRecords({ route = {} }) {
    
    const { params = {} } = route; 
    
    // 👇 ADD THIS LINE
    console.log("ALL RECEIVED PARAMS:", params);
    
    const { event } = params; 
    
    if (!event) {
        // ... (Error message you are seeing)
    }
    // ...
}