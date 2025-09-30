import { extractInfoFromText } from '../services/resumeParser';

// Test the resume parser with sample data
export const testResumeParser = () => {
  const sampleResumeText = `
John Doe
Software Developer
john.doe@email.com
(555) 123-4567

EXPERIENCE
Senior Full Stack Developer
Tech Company Inc. | 2020 - Present
• Developed React applications with TypeScript
• Built RESTful APIs using Node.js and Express
• Implemented database solutions with MongoDB and PostgreSQL
• Led team of 5 developers on multiple projects

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2016 - 2020

SKILLS
• React, Node.js, TypeScript
• JavaScript, Python, Java
• MongoDB, PostgreSQL, MySQL
• AWS, Docker, Kubernetes
• Git, Agile, Scrum
`;

  const result = extractInfoFromText(sampleResumeText);
  
  console.log('Resume Parser Test Results:');
  console.log('Name:', result.name);
  console.log('Email:', result.email);
  console.log('Phone:', result.phone);
  console.log('Text length:', result.text.length);
  
  return result;
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  (window as any).testResumeParser = testResumeParser;
}
