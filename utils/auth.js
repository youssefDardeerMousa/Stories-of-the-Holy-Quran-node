import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { connection } from '../db/connection.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id,name:user.name, email: user.email, role: user.role,picture:user.picture },
    process.env.JWT_SECRET
  );
};

const storeToken = async (userId, token) => {
  const conn = await connection();
  await conn.execute('INSERT INTO user_tokens (user_id, token) VALUES (?, ?)', [userId, token]);
};

// Google Login Strategy
passport.use('google-login', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://stories-of-the-holy-quran-node.vercel.app/auth/google/login/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const conn = await connection();
      const [users] = await conn.execute('SELECT * FROM users WHERE email = ?', [profile.emails[0].value]);

      if (users.length > 0) {
        const user = users[0];

        // Retrieve the existing token from the database
        const [userTokens] = await conn.execute('SELECT token FROM user_tokens WHERE user_id = ?', [user.id]);

        let token;
        if (userTokens.length > 0) {
          token = userTokens[0].token; // Use the existing token
        } else {
          token = generateToken(user); // Generate a new token if not found
          await storeToken(user.id, token); // Store the new token in the database
        }

        return done(null, { id: user.id, token }); // Pass the ID and token for login
      } else {
        return done(null, false, { message: 'Email not registered' });
      }
    } catch (error) {
      return done(error);
    }
  }
));

// Google Signup Strategy
passport.use('google-signup', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://stories-of-the-holy-quran-node.vercel.app/auth/google/signup/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const conn = await connection();
      const [users] = await conn.execute('SELECT * FROM users WHERE email = ?', [profile.emails[0].value]);

      if (users.length > 0) {
        return done(null, false, { message: 'Email already registered' });
      } else {
        const [result] = await conn.execute('INSERT INTO users (name, email, picture) VALUES (?, ?, ?)', 
          [profile.displayName, profile.emails[0].value, profile.photos[0].value]);

        const newUser = {
          id: result.insertId,
          name: profile.displayName,
          email: profile.emails[0].value,
          picture: profile.photos[0].value,
          role: 'user' // or other default role
        };

        const token = generateToken(newUser);
        await storeToken(newUser.id, token); // Store the generated token in the database
        return done(null, { id: newUser.id, token }); // Pass the ID and token for signup
      }
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  // Serialize only the user ID
  console.log("Serializing user:", user); // Debug log
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id); // Debug log
    const conn = await connection();
    const [users] = await conn.execute('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length > 0) {
      console.log("User found:", users[0]); // Debug log
      done(null, users[0]);
    } else {
      done(new Error("User not found"));
    }
  } catch (error) {
    console.error("Error in deserializeUser:", error); // Debug log
    done(error);
  }
});
