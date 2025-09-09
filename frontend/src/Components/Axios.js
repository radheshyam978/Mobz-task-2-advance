import axios from 'axios';


const instance = axios.create({
baseURL: 'https://mobz-task-2-advance-1.onrender.com/' || '/',
headers: { 'Content-Type': 'application/json' },
});


export default instance;