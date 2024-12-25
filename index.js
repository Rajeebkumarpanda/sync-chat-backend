import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/MessagesRoute.js";
import channelRoutes from "./routes/ChannelRoute.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
const database = process.env.DATABASE_URL;


const allowedOrigins = [
  process.env.ORIGIN || "http://localhost:5173",
  "https://sync-chat-frontend-ky772n5xn-rajeeb009gmailcoms-projects.vercel.app"
];

// app.use(
//   cors({
//     origin: process.env.ORIGIN || "http://localhost:5173",
//     methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
//     credentials: true,
//   })
// );


app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,  // Allow credentials (cookies, authorization headers)
  })
);

//server static files
//1.image upload
app.use('/uploads/profiles', express.static("uploads/profiles"))
//2.file upload
app.use('/uploads/files', express.static("uploads/files"))

app.use(cookieParser())
app.use(express.json())

//auth routes
app.use('/api/auth',authRoutes)

//contact routes
app.use('/api/contacts',contactRoutes)

//chat-messages
app.use('/api/messages',messagesRoutes)

//channel routes
app.use('/api/channel',channelRoutes)


app.get('*', (req, res) => {
  res.send('chat app response');
});


const server = app.listen(port, () => {
  console.log(`server is running on the url:http://localhost:${port}`);
});


setupSocket(server)

mongoose
  .connect(database)
  .then(() => {
    console.log("DB connection established");
  })
  .catch((err) => console.log(err.message));
