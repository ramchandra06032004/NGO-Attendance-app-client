//export const host = "http://localhost:3000"; //Development
export const host = "https://ngo-attendance-app-server.onrender.com"; //Production

//login auth apis
export const auth_host = `${host}/api/v1/auth`;
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

//College features apis
export const college_host = `${host}/api/v1/college`;
export const addClassAPI = `${college_host}/classes`; //add new class
export const addStudentAPI = `${college_host}/students`; //add new students under particular class ID
export const getAllCollegeAPI = `${college_host}/get-all-colleges`; //get list of all registered colleges
export const updateStudentAPI = `${college_host}/students`; //update existing student data api
export const updateClassAPI = `${college_host}/classes`; //update existing class data api
