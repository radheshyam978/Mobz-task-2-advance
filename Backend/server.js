  const express = require('express');
  const http = require('http');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const path = require('path');
  require("dotenv").config();
const nodemailer = require('nodemailer');

  const User = require('./models/User');

  const app = express();
  const server = http.createServer(app);


  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*' , methods: ['GET','POST'] } });

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

const { createClient } = require('redis');


const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

redisClient.connect()
  .then(() => console.log(" Redis connected"))
  .catch(err => console.error(" Redis connection error:", err));



 
  const MONGO_URI = process.env.MONGO_URI;
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connect error', err));

  
  const liveUsers = new Map();

 

//const otpStore = new Map();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS   
  }
});

// --- send-otp ---
app.post('/send-otp', async (req, res) => {
  try {
     const firstName = (req.body.firstName || '').trim();
      const lastName = (req.body.lastName || '').trim();
      const mobile = (req.body.mobile || '').trim();
      const email = (req.body.email || '').trim().toLowerCase();
      const street = (req.body.street || '').trim();
      const city = (req.body.city || '').trim();
      const state = (req.body.state || '').trim();
      const country = (req.body.country || '').trim();
      const loginId = (req.body.loginId || '').trim();
      const password = (req.body.password || '').trim();


      const nameRegex = /^[A-Za-z]+$/;
      const mobileRegex = /^[0-9]{10}$/;
      const emailRegex = /^\S+@\S+\.\S+$/;
      const loginRegex = /^[A-Za-z0-9]{8}$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
      const streetRegex = /^[A-Za-z0-9\s,.-]+$/;
      const cityStateCountryRegex = /^[A-Za-z\s]+$/;

      
      if (!firstName) return res.status(400).json({ success: false, message: 'First Name is required' });
      if (!lastName) return res.status(400).json({ success: false, message: 'Last Name is required' });
      if (!mobile) return res.status(400).json({ success: false, message: 'Mobile is required' });
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
      if (!street) return res.status(400).json({ success: false, message: 'Street is required' });
      if (!city) return res.status(400).json({ success: false, message: 'City is required' });
      if (!state) return res.status(400).json({ success: false, message: 'State is required' });
      if (!country) return res.status(400).json({ success: false, message: 'Country is required' });
      if (!loginId) return res.status(400).json({ success: false, message: 'Login ID is required' });
      if (!password) return res.status(400).json({ success: false, message: 'Password is required' });


      if (!nameRegex.test(firstName)) return res.status(400).json({ success: false, message: 'First Name must contain only letters' });
      if (!nameRegex.test(lastName)) return res.status(400).json({ success: false, message: 'Last Name must contain only letters' });
      if (!mobileRegex.test(mobile)) return res.status(400).json({ success: false, message: 'Mobile must be 10 digits' });
      if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid Email format' });
      if (!streetRegex.test(street)) return res.status(400).json({ success: false, message: 'Street can only have letters, numbers and common punctuation' });
      if (!cityStateCountryRegex.test(city)) return res.status(400).json({ success: false, message: 'City must contain only letters' });
      if (!cityStateCountryRegex.test(state)) return res.status(400).json({ success: false, message: 'State must contain only letters' });
      if (!cityStateCountryRegex.test(country)) return res.status(400).json({ success: false, message: 'Country must contain only letters' });
      if (!loginRegex.test(loginId)) return res.status(400).json({ success: false, message: 'Login ID must be exactly 8 alphanumeric characters' });
      if (!passwordRegex.test(password)) return res.status(400).json({ success: false, message: 'Password must be 6+ chars with 1 uppercase, 1 lowercase & 1 special char' });

      
      const existsEmail = await User.findOne({ email });
      if (existsEmail) return res.status(400).json({ success: false, message: 'Email already exists!' });

      const existsMobile = await User.findOne({ mobile });
      if (existsMobile) return res.status(400).json({ success: false, message: 'Mobile already exists!' });

      

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const formData = { ...req.body, email, mobile };
    const otpData = { emailOtp, mobileOtp, formData };
    await redisClient.setEx(`otp:${email}`, 120, JSON.stringify(otpData));

    // Send email OTP
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      text: `Your Email OTP is ${emailOtp}. It will expire in 2 minutes.`
    });

    console.log(`Mobile OTP for ${mobile}: ${mobileOtp}`);

    res.json({
      success: true,
      message: "OTP sent (email to inbox, mobile shown here)",
      mobileOtp
    });

  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});

// --- verify-otp ---
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, emailOtp, mobileOtp } = req.body;

    // Fetch OTP data from Redis
    const record = await redisClient.get(`otp:${email}`);
    if (!record) return res.status(400).json({ success: false, message: "OTP expired or not requested" });

    const parsed = JSON.parse(record);

    if (parsed.emailOtp !== emailOtp) {
      return res.status(400).json({ success: false, message: "Invalid Email OTP" });
    }
    if (parsed.mobileOtp !== mobileOtp) {
      return res.status(400).json({ success: false, message: "Invalid Mobile OTP" });
    }

    // Save user to MongoDB
    const user = new User(parsed.formData);
    const saved = await user.save();

    // Remove from Redis
    await redisClient.del(`otp:${email}`);

    const userObj = saved.toObject();
    delete userObj.password;

    res.json({ success: true, message: "User verified & saved", user: userObj });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



  app.post('/users', async (req, res) => {
    try {      
      const user = new User({
        firstName,
        lastName,
        mobile,
        email,
        street,
        city,
        state,
        country,
        loginId,
        password
      });

      const saved = await user.save();
      const userObj = saved.toObject();
      delete userObj.password; 

      
      io.to('live users').emit('user_created_db', {
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        createdAt: userObj.createdAt,
        id: userObj._id
      });

      res.status(201).json({ success: true, message: 'User saved', user: userObj });
    } catch (err) {
      console.error('POST /users error', err);
      
      if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate key error' });
      }
      res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
  });

  app.get('/users', async (req, res) => {
    try {
      const { email, id } = req.query;
      let result;
      if (id) result = await User.findById(id).select('-password').lean();
      else if (email) result = await User.findOne({ email: email.toLowerCase().trim() }).select('-password').lean();
      else result = await User.find().select('-password').lean();

      if (!result || (Array.isArray(result) && result.length === 0)) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.json({ success: true, user: result });
    } catch (err) {
      console.error('GET /users error', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  app.post('/login', async (req, res) => {
    try {
      const email = (req.body.email || '').trim().toLowerCase();
      const password = (req.body.password || '').trim();

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and Password required' });
      }

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ success: false, message: 'User not found' });

      if (user.password !== password) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
      }

      
      const userObj = user.toObject();
      delete userObj.password;

      res.json({ success: true, message: 'Login successful', user: userObj });
    } catch (err) {
      console.error('POST /login error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Real registered user joins
  socket.on('join_live_users', async (data) => {
    const email = data && data.email ? data.email.toLowerCase().trim() : null;
    const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();

    socket.join('live users');

    if (email) {
      onlineUsers.set(email, { socketId: socket.id, email, name });
      await broadcastAllUsers();
    }
  });

  
  socket.on('viewer_join', async () => {
    socket.join('live users');
    await broadcastAllUsers();
  });

  socket.on('leave_live_users', async () => {
    for (let [email, u] of onlineUsers.entries()) {
      if (u.socketId === socket.id) {
        onlineUsers.delete(email);
        break;
      }
    }
    await broadcastAllUsers();
  });

  socket.on('disconnect', async () => {
    console.log('Socket disconnected:', socket.id);
    for (let [email, u] of onlineUsers.entries()) {
      if (u.socketId === socket.id) {
        onlineUsers.delete(email);
        break;
      }
    }
    await broadcastAllUsers();
  });
});

async function broadcastAllUsers() {
  try {
    const allUsers = await User.find().select('-password').lean();
    const merged = allUsers.map((u) => ({
      ...u,
      isOnline: onlineUsers.has(u.email),
      socketId: onlineUsers.get(u.email)?.socketId || null,
    }));
    io.to('live users').emit('live_users_update', merged);
  } catch (err) {
    console.error('broadcastAllUsers error:', err);
  }
}
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

  const PORT = 3500;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
