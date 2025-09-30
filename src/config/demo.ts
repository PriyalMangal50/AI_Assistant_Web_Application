// Demo mode configuration
export const DEMO_MODE = process.env.NODE_ENV === 'development' && 
                        (window.location.search.includes('demo=true') || 
                         localStorage.getItem('demoMode') === 'true');

export const DEMO_RESUME_SCENARIOS = [
  // Complete resume with all info
  {
    name: 'Complete Resume',
    content: `John Smith
Software Engineer
john.smith@email.com
(555) 123-4567

EXPERIENCE
Senior Full Stack Developer
Tech Corp Inc. | 2020 - Present
• Developed React applications with TypeScript
• Built RESTful APIs using Node.js and Express
• Implemented database solutions with MongoDB and PostgreSQL

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2016 - 2020`
  },
  // Missing phone number
  {
    name: 'Missing Phone',
    content: `Sarah Johnson
Full Stack Developer
sarah.johnson@email.com

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5+ years of experience.

EXPERIENCE
Lead Developer
StartupXYZ | 2019 - Present
• Built scalable web applications using React and Node.js
• Implemented CI/CD pipelines and automated testing`
  },
  // Missing email
  {
    name: 'Missing Email',
    content: `Michael Brown
Frontend Developer
(555) 456-7890

SUMMARY
Passionate frontend developer specializing in React and modern web technologies.

EXPERIENCE
Frontend Developer
Web Solutions Ltd | 2021 - Present
• Developed responsive web applications
• Collaborated with design teams to implement UI/UX`
  },
  // Missing name
  {
    name: 'Missing Name',
    content: `Frontend Developer
developer@email.com
(555) 789-0123

EXPERIENCE
• Developed web applications using React and Node.js
• Worked with modern technologies and frameworks
• Collaborated with cross-functional teams`
  }
];

export const enableDemoMode = () => {
  localStorage.setItem('demoMode', 'true');
  window.location.reload();
};

export const disableDemoMode = () => {
  localStorage.removeItem('demoMode');
  window.location.reload();
};