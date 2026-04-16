//export const host = "http://localhost:3000"; //Development
import { Platform } from "react-native";

// ✅ Correct Syntax: Use a ternary operator
// export const host = Platform.OS === "android"
//     ? "http://10.0.2.2:3000"
//     : "http://localhost:3000";
export const host = "http://172.16.30.42:3000";
//export const host = "http://10.0.2.2:3000"; //Production
//FOR WEB-VERSION:-
//export const host = "https://ngo-attendance-app-server.onrender.com"; //Production

//FOR MOBILE-VERSION:-
//export const host = "https://ngo-attendance-backend.el.r.appspot.com"; //Production

//login auth apis
export const auth_host = `${host}/api/v1/auth`;
export const registerAdmin = `${auth_host}/register/admin`
export const loginAPI = `${auth_host}/login`;
export const logoutAPI = `${auth_host}/logout`;

//Admin features apis
export const admin_host = `${host}/api/v1/admin`;
export const addCollegeAPI = `${admin_host}/add-college`;
export const addNgoAPI = `${admin_host}/add-ngo`;

//NGO features apis
export const ngo_host = `${host}/api/v1/ngo`;
export const getAllNgoAPI = `${ngo_host}/get-all-ngos`; //get list of all registered ngos
export const eventAllAPI = `${ngo_host}/events`; //get events, add events, update events, delete events
export const attendanceAPI = `${ngo_host}/event/mark-attendance`; //marking attendance -POST req
export const addNgoVolunteerAPI = `${ngo_host}/volunteers`; //add NGO volunteers

//College features apis
export const college_host = `${host}/api/v1/college`;
export const addClassAPI = `${college_host}/classes`; //add new class
export const addStudentAPI = `${college_host}/students`; //add new students under particular class ID
export const getAllCollegeAPI = `${college_host}/get-all-colleges`; //get list of all registered colleges
export const updateStudentAPI = `${college_host}/students`; //update existing student data api
export const updateClassAPI = `${college_host}/classes`; //update existing class data api

//Student features apis
export const student_host = `${host}/api/v1/student`;
export const studentEventsAPI = `${host}/api/v1/student/events`; //get all available events
export const studentRegisterEventAPI = `${host}/api/v1/student/register-event`; //register for an event
export const studentMyEventsAPI = `${host}/api/v1/student/my-events`; //get student's registered events with status

//ngo registered students api
export const ngoRegisteredStudentsAPI = (eventId) => `${ngo_host}/events/${eventId}/registered-students`; //get student's registered events with status
