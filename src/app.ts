import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import productRouter from "./routes/products.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test_db";

// 1. Get the list of websites we trust from our secure secret box (the .env file).
// In our .env file, we wrote: ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
const allowedOrigins = process.env.ALLOWED_ORIGINS
    // Since it's written as a single line of text separated by commas, 
    // we chop it up at each comma to make a clean list: ['http://localhost:5173', 'http://localhost:3000']
    ? process.env.ALLOWED_ORIGINS.split(",") 
    // If our secret box didn't have this list, we fall back to an empty list.
    : [];

// 2. Set up CORS (Cross-Origin Resource Sharing).
// Think of this as putting a security guard at our server's front door.
// Web browsers are very strict and will automatically ask our guard if a website is allowed 
// to talk to our server.
app.use(
    cors({
        // The guard looks at every incoming visitor and decides what to do:
        origin: (origin, callback) => {
            // First, the guard asks: "Where are you coming from?" (This is the 'origin').
            
            // If the visitor is NOT a website (for example, if you are testing your server
            // using tools like Bruno, Postman, or a terminal command), they won't have an origin.
            // Since they aren't a browser website, they pose no browser threat. We say: "Welcome, come on in!"
            if (!origin) {
                // callback(error, allowAccess) -> 'null' means no error, 'true' means let them in!
                return callback(null, true); 
            }

            // If the visitor IS a website, we check if their address is in our trusted list.
            if (allowedOrigins.indexOf(origin) !== -1) {
                // "Yes, you are on our trusted list! Welcome!"
                callback(null, true);
            } else {
                // "Sorry, you are NOT on our list. Access Denied!"
                // The browser will block the visitor and show a red error in your browser console.
                callback(new Error("Not allowed by CORS"));
            }
        },
        // 'credentials: true' allows websites to send secret keycards (like login cookies or keys).
        // WARNING: Because we allow secret keycards, browsers strictly forbid us from saying
        // "allow anyone (*)". We MUST use the explicit list of trusted websites we built above.
        credentials: true,
    })
);
app.use(express.json());

// Routes
app.use("/api/products", productRouter);

// Connect to MongoDB and start the server
const startServer = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Successfully connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1); // Stop the process if the DB fails
    }
};

startServer();

