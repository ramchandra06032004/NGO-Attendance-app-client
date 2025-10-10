import React, { createContext, useState } from "react";
import NavigationProvider from "./NavigationContext";

export const AttendanceContext = createContext();

const sampleStudents = [
  { id: "s1", name: "Aarav Kumar", college: "ABC College", class: "FY" },
  { id: "s2", name: "Neha Sharma", college: "XYZ College", class: "SY" },
  { id: "s3", name: "Riya Patel", college: "ABC College", class: "TY" },
];

export function AttendanceProvider({ children }) {
  const [events, setEvents] = useState([
    {
      id: "e1",
      title: "Tree Plantation",
      students: sampleStudents.map((s) => ({ ...s, status: null })),
    },
    {
      id: "e2",
      title: "Food Drive",
      students: sampleStudents.map((s) => ({ ...s, status: null })),
    },
  ]);

  // dynamic colleges and ngos (admin can add)
  const initialColleges = Array.from(new Set(sampleStudents.map((s) => s.college)));
  const [colleges, setColleges] = useState(initialColleges);
  const [ngos, setNgos] = useState([]);

  // Add an event. If `college` is provided, only students from that college are added. If omitted, all students are added.
  function addEvent(title, college) {
    const id = "e" + (events.length + 1);
    let students = sampleStudents.map((s) => ({ ...s, status: null }));
    if (college) {
      students = students.filter((s) => s.college === college);
    }
    setEvents((prev) => [...prev, { id, title, students }]);
  }

  function getColleges() {
    return colleges;
  }

  function addCollege(name) {
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setColleges(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  }

  function addNgo(name) {
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setNgos(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  }

  function markAttendance(eventId, studentId, status) {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          students: ev.students.map((st) =>
            st.id === studentId ? { ...st, status } : st
          ),
        };
      })
    );
  }

  function getCollegeRecords(collegeName) {
    // returns attendance records grouped by event for given college
    return events.map((ev) => ({
      eventId: ev.id,
      title: ev.title,
      students: ev.students
        .filter((s) => s.college === collegeName)
        .map((s) => ({
          id: s.id,
          name: s.name,
          class: s.class,
          status: s.status,
        })),
    }));
  }

  const value = {
    events,
    addEvent,
    markAttendance,
    getCollegeRecords,
    getColleges,
    addCollege,
    addNgo,
    colleges,
    ngos,
  };

  return (
    <AttendanceContext.Provider value={value}>
      <NavigationProvider>{children}</NavigationProvider>
    </AttendanceContext.Provider>
  );
}
