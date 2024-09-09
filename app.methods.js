// app.methods.js

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import { connection } from './db/connection.js';
import "./utils/auth.js"
import { Isauthenticate } from './middlewares/authMiddleware.js';
import { Isauthorize } from './middlewares/authorizeMiddleware.js';

dotenv.config();

export const appMethods = async (app, express) => {
    app.use(express.json());

    // Start the server
    app.listen(4000, () => {
        console.log("Server running on port 4000");
    });

    // Enable CORS
    app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

    // Use session middleware
    app.use(session({
        secret: process.env.GOOGLE_CLIENT_SECRET, 
        resave: false, 
        saveUninitialized: true
    }));

    // Initialize Passport for authentication
    app.use(passport.initialize());
    app.use(passport.session());

    // Google Login Route
    app.get('/auth/google/login', passport.authenticate('google-login', { scope: ['profile', 'email'] }));

    app.get('/auth/google/login/callback',
      passport.authenticate('google-login', { failureRedirect: '/auth/failLogin' }),
      (req, res) => {
        if (req.user) {
          const token = req.user.token; // Assuming req.user.token contains the token
          res.redirect(`http://localhost:3000/dashboard?token=${token}`);
        }
      }
    );

    // Google Signup Route
    app.get('/auth/google/signup', passport.authenticate('google-signup', { scope: ['profile', 'email'] }));

    app.get('/auth/google/signup/callback',
      passport.authenticate('google-signup', { failureRedirect: '/auth/failSignup' }),
      (req, res) => {
        if (req.user) {
          // Include the token in the redirect URL
          const token = req.user.token; // Assuming req.user.token contains the token
          res.redirect(`http://localhost:3000/dashboard?token=${token}`);
        }
      }
    );
    

    app.get('/auth/failLogin', (req, res) => {
        res.redirect('http://localhost:3000/login?error=' + encodeURIComponent('Authentication failed'));
    });
    app.get('/auth/failSignup', (req, res) => {
        res.redirect('http://localhost:3000/signup?error=' + encodeURIComponent('this Email is already registered'));
    });
    app.get('/protected-route', Isauthenticate, (req, res) => {
      res.json({ message: 'This is a protected route', user: req.user });
    });
    app.get('/admin-route', Isauthenticate, Isauthorize(['admin']), (req, res) => {
      res.json({ message: 'Welcome Admin!' });
    });
    
    app.get("/", (req, res) => {
        res.json({ success: true, message: "مرحبا بكم في برنامج قصص القرآن الكريم" });
    });

    // Catch-all route for 404 errors
    app.get("*", (req, res, next) => {
        res.status(404).json({ success: false, message: "Page not found" });
    });
};
