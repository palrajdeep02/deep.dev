const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Blog = require('./models/Blog');
const Project = require('./models/Project');
const Skill = require('./models/Skill');

dotenv.config();

// 1. Data from your CV
const seedProjects = [
    {
        title: 'LW-RESSASE-NET: A Lightweight Attention-Based Residual Network',
        description: 'Developed and trained a lightweight deep learning model using chest X-ray images for COVID-19 and pneumonia detection. Implemented a novel architecture with Squeeze-and-Excitation and Spatial Attention mechanisms to enhance performance.',
        imageUrl: 'https://images.unsplash.com/photo-1584033320649-b3a639d6b62d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        projectUrl: '#',
        technologies: ['NumPy', 'OpenCV', 'Matplotlib', 'TensorFlow', 'Keras']
    },
    {
        title: 'Job Hive - Job Portal Website',
        description: 'Developed a job portal for job seekers to apply for positions and employers to post openings. Features administrative oversight for job and user management.',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80',
        projectUrl: '#',
        technologies: ['HTML', 'CSS', 'JavaScript', 'Java Servlets', 'Spring Boot', 'MySQL']
    }
];

const seedSkills = [
    { name: 'Java', level: 'Proficient', category: 'Backend' },
    { name: 'Python', level: 'Proficient', category: 'Backend' },
    { name: 'Machine Learning', level: 'Intermediate', category: 'AI/ML' },
    { name: 'Artificial Intelligence', level: 'Intermediate', category: 'AI/ML' },
    { name: 'Node', level: 'Proficient', category: 'Backend' },
    { name: 'React', level: 'Intermediate', category: 'Frontend' },
    { name: 'Web Development', level: 'Proficient', category: 'Full-Stack' }
];

// 2. New AI/ML Blog Posts
const seedBlogs = [
    {
        title: 'Understanding Natural Language Processing (NLP)',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        content: 'Natural Language Processing is a fascinating field of AI that enables computers to understand, interpret, and generate human language. From chatbots to sentiment analysis, we explore the core concepts and real-world applications of NLP.',
        author: 'Admin'
    },
    {
        title: 'The Rise of Transformer Models in AI',
        imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        content: 'Models like GPT and BERT have revolutionized AI. At their core is the Transformer architecture, which uses a powerful "attention mechanism." We dive into how Transformers work and why they have surpassed older models like LSTMs in so many tasks.',
        author: 'Admin'
    },
    {
        title: 'An Introduction to Computer Vision with OpenCV',
        imageUrl: 'https://images.unsplash.com/photo-1682113158639-0e0d54388e2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        content: 'Computer Vision teaches computers to "see" and interpret the visual world. Using the powerful OpenCV library with Python, we can perform tasks like image recognition, object detection, and face analysis. This post covers the basics to get you started.',
        author: 'Admin'
    },
    {
        title: 'What Are Neural Networks?',
        imageUrl: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
        content: 'Inspired by the human brain, neural networks are the foundation of deep learning. This article breaks down the structure of a neural network, including layers, neurons, and activation functions, to explain how they learn from data.',
        author: 'Admin'
    },
    {
        title: 'The Ethics of Artificial Intelligence',
        imageUrl: 'https://images.unsplash.com/photo-1593349348335-51a881315b81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80',
        content: "As AI becomes more powerful, its ethical implications are more important than ever. We discuss the critical challenges of bias, fairness, transparency, and accountability in AI systems and why they matter for a just future.",
        author: 'Admin'
    },
    {
        title: 'Mastering Modern JavaScript (ES6+)',
        imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        content: 'JavaScript has evolved significantly with ECMAScript 2015 (ES6) and later versions. This post dives deep into essential features like arrow functions, destructuring, promises, and async/await. Understanding these concepts is crucial for writing clean, efficient, and modern JavaScript code for both front-end and back-end development with Node.js. We will explore practical examples that you can apply directly to your projects.',
        author: 'Admin'
    },
    {
        title: 'A Deep Dive into CSS Grid and Flexbox',
        imageUrl: 'https://images.unsplash.com/photo-1504639725590-7ea024644e59?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        content: 'Say goodbye to floats and table-based layouts. CSS Grid and Flexbox are the modern standards for creating responsive and complex web layouts with ease. This tutorial breaks down the core concepts of both systems. We will cover when to use Flexbox for one-dimensional layouts and how to leverage the power of Grid for two-dimensional arrangements. Prepare to take your layout skills to the next level.',
        author: 'Admin'
    },
    {
        title: 'Building a RESTful API with Node.js and Express',
        imageUrl: 'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        content: "A RESTful API is the backbone of many modern web applications. In this post, we'll walk through the entire process of building a robust API using Node.js and the Express framework. You'll learn about structuring your routes, creating controllers, connecting to a MongoDB database with Mongoose, and handling requests and responses in a clean, scalable way. This is a foundational skill for any full-stack developer.",
        author: 'Admin'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        // Clear existing data
        await Project.deleteMany({});
        await Skill.deleteMany({});
        await Blog.deleteMany({});
        console.log('Existing data cleared.');

        // Insert new data
        await Project.insertMany(seedProjects);
        await Skill.insertMany(seedSkills);
        await Blog.insertMany(seedBlogs);
        console.log('New data has been added.');

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

seedDatabase();