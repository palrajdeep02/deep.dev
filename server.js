// server.js

// =================================================================
// 1. IMPORT DEPENDENCIES
// =================================================================
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const flash = require('connect-flash');
require('dotenv').config();

// =================================================================
// 2. IMPORT MODELS
// =================================================================
const User = require('./models/User');
const Blog = require('./models/Blog');
const Project = require('./models/Project');
const Skill = require('./models/Skill');
const Comment = require('./models/Comment');

// =================================================================
// 3. APP & DATABASE CONFIGURATION
// =================================================================
const app = express();
const PORT = process.env.PORT || 3000;
const dbURI = process.env.MONGODB_URI;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database Connection
mongoose.connect(dbURI)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// =================================================================
// 4. SESSION & PASSPORT.JS CONFIGURATION
// =================================================================
app.use(session({
  secret: 'your-very-secret-key-that-is-long-and-random',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: dbURI })
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// --- Local Strategy (Username or Email) ---
passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
  try {
    const loginIdentifier = username.toLowerCase();
    const user = await User.findOne({ 
        $or: [{ email: loginIdentifier }, { username: loginIdentifier }] 
    });

    if (!user) {
        return done(null, false, { message: 'No user found with that email or username.' });
    }
    if (!user.password) {
        return done(null, false, { message: 'Please log in with Google.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return done(null, false, { message: 'Password incorrect.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// --- Google OAuth Strategy ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        let newUsername = profile.emails[0].value.split('@')[0];
        let userExists = await User.findOne({ username: newUsername });
        while (userExists) {
            newUsername = `${newUsername}${Math.floor(Math.random() * 1000)}`;
            userExists = await User.findOne({ username: newUsername });
        }

        const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName || 'Google',
            lastName: profile.name.familyName || 'User',
            username: newUsername,
        });
        await newUser.save();
        return done(null, newUser);
    } catch (err) {
        return done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// =================================================================
// 5. CUSTOM MIDDLEWARE
// =================================================================
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).send('Forbidden');
}

// =================================================================
// 6. ROUTES
// =================================================================

// --- Public Routes ---
app.get('/', async (req, res) => {
    const projects = await Project.find({}).sort({ _id: -1 }).limit(3);
    const skills = await Skill.find({});
    const blogs = await Blog.find({}).sort({ createdAt: -1 }).limit(3);
    res.render('home', { projects, skills, blogs, user: req.user, activePage: 'home' });
});

app.get('/blog', async (req, res) => {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.render('blog', { blogs, user: req.user, activePage: 'blog' });
});

app.get('/blog/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send('Blog post not found.');
    const blog = await Blog.findById(req.params.id).populate({
        path: 'comments',
        populate: { path: 'author', select: 'email' }
    });
    if (!blog) return res.status(404).send('Blog post not found.');
    res.render('blog_post', { blog, user: req.user, activePage: 'blog' });
});

// --- Like and Comment Routes ---
app.post('/blog/:id/like', isAuthenticated, async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    blog.likes.includes(req.user._id) ? blog.likes.pull(req.user._id) : blog.likes.push(req.user._id);
    await blog.save();
    res.redirect(`/blog/${req.params.id}`);
});
app.post('/blog/:id/comment', isAuthenticated, async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    const comment = new Comment({ text: req.body.text, author: req.user._id, post: req.params.id });
    await comment.save();
    blog.comments.push(comment);
    await blog.save();
    res.redirect(`/blog/${req.params.id}`);
});

// --- Authentication & Account Routes ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => res.redirect('/blog'));

app.get('/register', (req, res) => res.render('register', { user: req.user, activePage: 'register' }));
app.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    const userByEmail = await User.findOne({ email: email.toLowerCase() });
    if (userByEmail) return res.status(400).send('User with that email already exists.');
    
    const userByUsername = await User.findOne({ username: username.toLowerCase() });
    if (userByUsername) return res.status(400).send('User with that username already exists.');

    const newUser = new User({ firstName, lastName, username, email, password });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    res.status(500).send('Error registering new user.');
  }
});

app.get('/login', (req, res) => res.render('login', { user: req.user, messages: req.flash(), activePage: 'login' }));
app.post('/login', passport.authenticate('local', {
  successRedirect: '/blog',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.get('/account', isAuthenticated, (req, res) => {
    res.render('account', { user: req.user, activePage: 'account' });
});
app.post('/account/update-profile', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, username, email, mobileNumber } = req.body;
        const user = await User.findById(req.user.id);
        user.firstName = firstName;
        user.lastName = lastName;
        user.username = username;
        user.email = email;
        user.mobileNumber = mobileNumber;
        await user.save();
        res.redirect('/account');
    } catch (err) {
        console.error(err);
        res.redirect('/account');
    }
});
app.post('/account/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user.password) return res.status(400).send('Cannot change password for Google-authenticated account.');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).send('Current password is incorrect.');
        user.password = newPassword;
        await user.save();
        res.redirect('/account');
    } catch (err) {
        console.error(err);
        res.redirect('/account');
    }
});

// --- Admin Routes ---
app.get('/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    const blogCount = await Blog.countDocuments();
    const projectCount = await Project.countDocuments();
    const skillCount = await Skill.countDocuments();
    res.render('admin_dashboard', { user: req.user, blogCount, projectCount, skillCount, activePage: 'admin' });
});
// Blog Management
app.get('/admin/blogs', isAuthenticated, isAdmin, async (req, res) => {
    const blogs = await Blog.find({});
    res.render('admin_blogs', { blogs, user: req.user, activePage: 'admin' });
});
app.get('/admin/blogs/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin_blogs_new', { user: req.user, activePage: 'admin' });
});
app.post('/admin/blogs', isAuthenticated, isAdmin, async (req, res) => {
    const newBlog = new Blog({
        title: req.body.title,
        imageUrl: req.body.imageUrl,
        content: req.body.content,
        author: req.user.email
    });
    await newBlog.save();
    res.redirect('/admin/blogs');
});
app.get('/admin/blogs/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    res.render('admin_blogs_edit', { blog, user: req.user, activePage: 'admin' });
});
app.put('/admin/blogs/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    await Blog.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        imageUrl: req.body.imageUrl,
        content: req.body.content
    });
    res.redirect('/admin/blogs');
});
app.delete('/admin/blogs/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect('/admin/blogs');
});
// Project Management
app.get('/admin/projects', isAuthenticated, isAdmin, async (req, res) => {
    const projects = await Project.find({});
    res.render('admin_projects', { projects, user: req.user, activePage: 'admin' });
});
app.get('/admin/projects/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin_projects_new', { user: req.user, activePage: 'admin' });
});
app.post('/admin/projects', isAuthenticated, isAdmin, async (req, res) => {
    const technologies = req.body.technologies.split(',').map(tech => tech.trim());
    const newProject = new Project({
        title: req.body.title,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        projectUrl: req.body.projectUrl,
        technologies: technologies
    });
    await newProject.save();
    res.redirect('/admin/projects');
});
app.get('/admin/projects/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    const project = await Project.findById(req.params.id);
    res.render('admin_projects_edit', { project, user: req.user, activePage: 'admin' });
});
app.put('/admin/projects/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    const technologies = req.body.technologies.split(',').map(tech => tech.trim());
    await Project.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        projectUrl: req.body.projectUrl,
        technologies: technologies
    });
    res.redirect('/admin/projects');
});
app.delete('/admin/projects/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    await Project.findByIdAndDelete(req.params.id);
    res.redirect('/admin/projects');
});
// Skill Management
app.get('/admin/skills', isAuthenticated, isAdmin, async (req, res) => {
    const skills = await Skill.find({});
    res.render('admin_skills', { skills, user: req.user, activePage: 'admin' });
});
app.get('/admin/skills/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin_skills_new', { user: req.user, activePage: 'admin' });
});
app.post('/admin/skills', isAuthenticated, isAdmin, async (req, res) => {
    const newSkill = new Skill({ name: req.body.name, level: req.body.level, category: req.body.category });
    await newSkill.save();
    res.redirect('/admin/skills');
});
app.get('/admin/skills/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    const skill = await Skill.findById(req.params.id);
    res.render('admin_skills_edit', { skill, user: req.user, activePage: 'admin' });
});
app.put('/admin/skills/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    await Skill.findByIdAndUpdate(req.params.id, { name: req.body.name, level: req.body.level, category: req.body.category });
    res.redirect('/admin/skills');
});
app.delete('/admin/skills/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    await Skill.findByIdAndDelete(req.params.id);
    res.redirect('/admin/skills');
});

// =================================================================
// 7. START THE SERVER
// =================================================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});