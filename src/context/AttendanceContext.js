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
      description: 'Planting trees across community parks',
      students: sampleStudents.map((s) => ({ ...s, status: null })),
    },
    {
      id: "e2",
      title: "Food Drive",
      description: 'Distributing food packets to families in need',
      students: sampleStudents.map((s) => ({ ...s, status: null })),
    },
  ]);

  // dynamic colleges and ngos (admin can add)
  const initialColleges = Array.from(new Set(sampleStudents.map((s) => s.college)));
  const [colleges, setColleges] = useState(initialColleges);
  // Custom classes (admin/college can add). We also derive classes from sampleStudents.
  const [customClasses, setCustomClasses] = useState([]);
  const [ngos, setNgos] = useState([]);
  // store custom students added via UI or upload
  const [customStudents, setCustomStudents] = useState([]);

  // Add an event. If `college` is provided, only students from that college are added. If omitted, all students are added.
  function addEvent(title, college, description) {
    const id = "e" + (events.length + 1);
    let students = sampleStudents.map((s) => ({ ...s, status: null }));
    if (college) {
      students = students.filter((s) => s.college === college);
    }
    setEvents((prev) => [...prev, { id, title, description: description || '', students }]);
  }

  function getColleges() {
    return colleges;
  }

  function getClasses(college) {
    // classes derived from sample students for the provided college plus any custom classes
    const fromStudents = Array.from(new Set(sampleStudents.filter(s => !college || s.college === college).map(s => s.class)));
    const combined = Array.from(new Set([...fromStudents, ...customClasses]));
    return combined;
  }

  function addClass(name) {
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomClasses(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  }

  function getStudentsByCollegeAndClass(collegeName, className) {
    const fromSample = sampleStudents
      .filter(s => s.college === collegeName)
      .filter(s => !className || s.class === className)
      .map(s => ({ ...s, status: null }));
    const fromCustom = customStudents
      .filter(s => s.college === collegeName)
      .filter(s => !className || s.class === className)
      .map(s => ({ ...s, status: null }));
    return [...fromSample, ...fromCustom];
  }

  function getStudentById(id) {
    if (!id) return null;
    // try to find the student in current events (they may have status)
    for (const ev of events) {
      const st = ev.students.find(s => s.id === id);
      if (st) return st;
    }
    // fallback to sample data or custom students
    return sampleStudents.find(s => s.id === id) || customStudents.find(s => s.id === id) || null;
  }

  function addStudent(student) {
    if (!student) return;
    const s = { id: student.id || 'c' + (customStudents.length + 1) + Date.now(), ...student };
    // add to customStudents store
    setCustomStudents(prev => [...prev, s]);

    // Also add this student to any existing events that are relevant to their college
    // We consider an event relevant if it already contains at least one student from the same college.
    setEvents(prevEvents => prevEvents.map(ev => {
      const hasSameCollege = ev.students.some(es => es.college === s.college);
      const alreadyPresent = ev.students.some(es => es.id === s.id);
      if (hasSameCollege && !alreadyPresent) {
        return { ...ev, students: [...ev.students, { ...s, status: null }] };
      }
      return ev;
    }));
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
    getClasses,
    addClass,
    addStudent,
    getStudentsByCollegeAndClass,
    getStudentById,
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
