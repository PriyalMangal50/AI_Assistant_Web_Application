import mammoth from 'mammoth';
// @ts-ignore - pdfjs-dist types may not be available
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
  text: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  summary?: string;
  jobTitle?: string;
  company?: string;
  yearsOfExperience?: number;
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Load PDF document
          const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
          const pdf = await loadingTask.promise;
          
          let fullText = '';
          
          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Combine text items with spaces
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            
            fullText += pageText + '\n';
          }
          
          console.log('PDF text extracted successfully:', fullText.length, 'characters');
          resolve(fullText.trim());
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          reject(new Error('Failed to parse PDF file. Please ensure it\'s a valid PDF document.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('PDF file reading error:', error);
      reject(new Error('Invalid PDF file format'));
    }
  });
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Enhanced extraction functions
const extractSkills = (text: string): string[] => {
  const skillPatterns = [
    // Technical skills section
    /(?:technical\s+skills?|skills?|technologies?|programming\s+languages?|tools?)[\s\S]*?(?:\n\s*\n|$)/gi,
    // Common skill patterns
    /(?:javascript|typescript|react|angular|vue|node\.?js|python|java|c\+\+|c#|sql|mongodb|mysql|postgresql|docker|kubernetes|aws|azure|gcp|git|html|css|sass|less|webpack|babel|jest|cypress|mocha|chai|express|fastify|nestjs|graphql|rest|api|microservices|agile|scrum|devops|ci\/cd|jenkins|github\s+actions?|gitlab\s+ci|terraform|ansible|redis|elasticsearch|kafka|rabbitmq|nginx|apache|linux|ubuntu|centos|bash|shell|powershell|flutter|react\s+native|ionic|swift|kotlin|objective-c|xamarin|unity|unreal|3d|machine\s+learning|ml|ai|artificial\s+intelligence|data\s+science|big\s+data|hadoop|spark|tableau|power\s+bi|figma|sketch|adobe|photoshop|illustrator|bootstrap|tailwind|material\s+ui|ant\s+design|styled\s+components)/gi
  ];

  const skills = new Set<string>();
  
  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract individual skills from the match
        const skillMatch = match.toLowerCase();
        const commonSkills = [
          'javascript', 'typescript', 'react', 'angular', 'vue', 'nodejs', 'node.js',
          'python', 'java', 'c++', 'c#', 'sql', 'mongodb', 'mysql', 'postgresql',
          'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'html', 'css',
          'express', 'graphql', 'rest api', 'microservices', 'redux', 'nextjs'
        ];
        
        commonSkills.forEach(skill => {
          if (skillMatch.includes(skill)) {
            skills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
          }
        });
      });
    }
  }

  return Array.from(skills).slice(0, 20); // Limit to top 20 skills
};

const extractExperience = (text: string): string[] => {
  const experiencePatterns = [
    // Work experience section
    /(?:work\s+experience|professional\s+experience|employment\s+history|career\s+summary)[\s\S]*?(?:\n\s*education|\n\s*skills|\n\s*projects|$)/gi,
    // Job entries with dates
    /([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Solutions|Systems|Software|Consulting)?)[\s\S]*?(\d{4}\s*[-–]\s*(?:\d{4}|present|current))/gi,
    // Job titles with companies
    /((?:senior|junior|lead|principal|staff)?\s*(?:software\s+engineer|developer|programmer|architect|analyst|manager|director|consultant|specialist))[\s\S]*?at\s+([A-Z][a-zA-Z\s&]+)/gi
  ];

  const experiences = new Set<string>();
  
  for (const pattern of experiencePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/\s+/g, ' ').trim();
        if (cleanMatch.length > 20 && cleanMatch.length < 200) {
          experiences.add(cleanMatch);
        }
      });
    }
  }

  return Array.from(experiences).slice(0, 5); // Limit to top 5 experiences
};

const extractEducation = (text: string): string[] => {
  const educationPatterns = [
    // Education section
    /(?:education|academic\s+background|qualifications)[\s\S]*?(?:\n\s*experience|\n\s*skills|\n\s*projects|$)/gi,
    // Degree patterns
    /((?:bachelor|master|phd|doctorate|associate|diploma|certificate)[\s\S]*?(?:university|college|institute|school))[\s\S]*?(\d{4})/gi,
    // University names with degrees
    /([A-Z][a-zA-Z\s]+(?:university|college|institute|school))[\s\S]*?((?:bachelor|master|phd|computer\s+science|engineering|mathematics|physics|chemistry|business))/gi
  ];

  const education = new Set<string>();
  
  for (const pattern of educationPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/\s+/g, ' ').trim();
        if (cleanMatch.length > 10 && cleanMatch.length < 150) {
          education.add(cleanMatch);
        }
      });
    }
  }

  return Array.from(education).slice(0, 3); // Limit to top 3 education entries
};

const extractSummary = (text: string): string => {
  const summaryPatterns = [
    /(?:professional\s+summary|career\s+summary|summary|objective|profile)[\s:]*([^]*?)(?:\n\s*(?:experience|education|skills|technical|projects)|$)/gi,
    // First paragraph if it looks like a summary
    /^([^]*?)(?:\n\s*\n)/m
  ];

  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const summary = match[1].replace(/\s+/g, ' ').trim();
      if (summary.length > 50 && summary.length < 500) {
        return summary;
      }
    }
  }

  // Fallback: first paragraph
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const firstParagraph = lines.slice(0, 3).join(' ');
  if (firstParagraph.length > 50 && firstParagraph.length < 300) {
    return firstParagraph;
  }

  return '';
};

const extractJobTitle = (text: string): string => {
  const jobTitlePatterns = [
    // After name, common job title patterns
    /(?:senior|junior|lead|principal|staff)?\s*(?:software\s+engineer|developer|full\s*stack\s+developer|frontend\s+developer|backend\s+developer|web\s+developer|mobile\s+developer|data\s+scientist|data\s+analyst|devops\s+engineer|system\s+administrator|product\s+manager|project\s+manager|ui\/ux\s+designer|qa\s+engineer|test\s+engineer)/gi,
    // Job title in work experience
    /^([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Architect|Consultant|Designer|Specialist))/gm
  ];

  for (const pattern of jobTitlePatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const title = match[0].replace(/\s+/g, ' ').trim();
      if (title.length > 5 && title.length < 50) {
        return title;
      }
    }
  }

  return '';
};

const extractCurrentCompany = (text: string): string => {
  const companyPatterns = [
    // Current position patterns
    /(?:currently\s+at|working\s+at|employed\s+at)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Solutions|Systems|Software|Consulting)?)/gi,
    // Recent company in experience
    /([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Solutions|Systems|Software|Consulting)?)[\s\S]*?(?:present|current|\d{4}\s*[-–]\s*(?:present|current))/gi
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = match[1].replace(/\s+/g, ' ').trim();
      if (company.length > 2 && company.length < 50) {
        return company;
      }
    }
  }

  return '';
};

const calculateYearsOfExperience = (text: string): number => {
  const yearPatterns = [
    // Experience years mentioned explicitly
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/gi,
    // Date ranges in experience
    /(\d{4})\s*[-–]\s*(?:present|current|\d{4})/gi
  ];

  let maxYears = 0;
  const currentYear = new Date().getFullYear();

  for (const pattern of yearPatterns) {
    // Use match() instead of matchAll() for better compatibility
    let match;
    const globalPattern = new RegExp(pattern.source, pattern.flags);
    while ((match = globalPattern.exec(text)) !== null) {
      if (pattern.source.includes('years')) {
        // Explicit years mentioned
        const years = parseInt(match[1]);
        maxYears = Math.max(maxYears, years);
      } else {
        // Calculate from date range
        const startYear = parseInt(match[1]);
        const years = currentYear - startYear;
        if (years > 0 && years < 50) {
          maxYears = Math.max(maxYears, years);
        }
      }
      
      // Prevent infinite loop for non-global patterns
      if (!globalPattern.global) break;
    }
  }

  return maxYears;
};

export const extractInfoFromText = (text: string): ExtractedInfo => {
  if (!text || text.trim().length === 0) {
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      text: '',
      skills: [],
      experience: [],
      education: [],
      summary: '',
      jobTitle: '',
      company: '',
      yearsOfExperience: 0,
    };
  }

  // Enhanced email regex patterns for comprehensive extraction
  const emailPatterns = [
    // Standard email format
    /\b[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}\b/g,
    // Email with labels
    /(?:email|e-mail|mail|contact)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Email in contact sections
    /(?:contact|reach|correspondence)[\s\S]{0,50}([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Email after @ symbol
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  ];

  // Enhanced phone regex patterns for comprehensive extraction
  const phonePatterns = [
    // US format with optional country code
    /\b(?:\+?1[-\s.]?)?\(?([0-9]{3})\)?[-\s.]?([0-9]{3})[-\s.]?([0-9]{4})\b/g,
    // International formats
    /\b(?:\+?[1-9]\d{0,3}[-\s.]?)?\(?([0-9]{2,4})\)?[-\s.]?([0-9]{3,4})[-\s.]?([0-9]{3,4})\b/g,
    // Indian 10-digit format
    /\b(?:\+?91[-\s.]?)?([0-9]{10})\b/g,
    // Phone with labels
  /(?:phone|mobile|cell|tel|contact|number)[:\s]*([+]?[0-9\s().-]{10,15})/gi,
    // Simple digit groups
    /\b([0-9]{3}[-\s.]?[0-9]{3}[-\s.]?[0-9]{4})\b/g,
    /\b([0-9]{10,15})\b/g
  ];

  // Enhanced name extraction patterns with better targeting
  const namePatterns = [
    // Explicit name labels (highest priority)
    /(?:^|\n)\s*(?:name|full\s*name|candidate\s*name)[:\s]*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})(?:\n|$)/gim,
    // Very first line if it looks like a name (most common resume format)
    /^\s*([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,}){1,2})\s*$/m,
    // Name after whitespace/newlines at start of document
    /^\s*\n*\s*([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,}){1,2})\s*(?:\n|$)/m,
    // Contact section names
    /(?:contact\s*(?:info|information)?|personal\s*(?:info|information)?)[\s\S]{0,100}?([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,}){1,2})/gi,
    // Resume/CV headers
    /(?:^|\n)\s*(?:resume|cv|curriculum\s+vitae)\s*(?:of|for|[-:])\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,2})/gim,
    // Names before email/phone (common pattern)
    /([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,}){1,2})\s*(?:\n|\s)*(?:.*(?:@|phone|mobile|cell|tel))/gi,
    // Names in first 3 lines
    /^([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,}){1,2})(?:\s*\n|\s+)/gm
  ];

  // Extract emails with comprehensive validation
  let extractedEmail: string | undefined;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  for (const pattern of emailPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Extract clean email from match
        let cleanEmail = match;
        if (match.includes('(')) {
          // Handle cases where email is in parentheses or has surrounding text
          const emailMatch = match.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) cleanEmail = emailMatch[1];
        }
        
        cleanEmail = cleanEmail.toLowerCase().trim();
        
        // Validate email format and common sense checks
        if (emailRegex.test(cleanEmail) && 
            !cleanEmail.includes('example.com') && 
            !cleanEmail.includes('test.com') &&
            !cleanEmail.includes('sample.com')) {
          extractedEmail = cleanEmail;
          break;
        }
      }
      if (extractedEmail) break;
    }
  }

  // Extract phones with comprehensive validation
  let extractedPhone: string | undefined;
  
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Clean phone number - remove all non-digits except +
        let cleanPhone = match.replace(/[^\d+]/g, '');
        
        // Remove + if it's not at the beginning
        if (cleanPhone.indexOf('+') > 0) {
          cleanPhone = cleanPhone.replace(/\+/g, '');
        }
        
        // Validate phone number length and format
        const digitsOnly = cleanPhone.replace(/\+/g, '');
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
          // Format US numbers nicely
          if (digitsOnly.length === 10 && /^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(digitsOnly)) {
            extractedPhone = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
          } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
            const usNumber = digitsOnly.slice(1);
            extractedPhone = `+1 (${usNumber.slice(0, 3)}) ${usNumber.slice(3, 6)}-${usNumber.slice(6)}`;
          } else {
            extractedPhone = cleanPhone;
          }
          break;
        }
      }
      if (extractedPhone) break;
    }
  }

  // Extract name with robust validation
  let extractedName: string | undefined;
  const excludeWords = [
    'software', 'developer', 'engineer', 'programmer', 'designer', 'manager', 'analyst',
    'senior', 'junior', 'lead', 'principal', 'architect', 'consultant', 'specialist',
    'experience', 'education', 'skills', 'summary', 'objective', 'profile', 'resume',
    'curriculum', 'vitae', 'contact', 'personal', 'professional', 'technical', 'frontend',
    'backend', 'fullstack', 'full-stack', 'web', 'mobile', 'application', 'system',
    'admin', 'administrator', 'coordinator', 'assistant', 'intern', 'trainee', 'candidate',
    'applicant', 'student', 'graduate', 'bachelor', 'master', 'university', 'college'
  ];

  for (const pattern of namePatterns) {
    pattern.lastIndex = 0; // Reset regex state
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        const candidateName = match[1].trim();
        const words = candidateName.toLowerCase().split(/\s+/);
        
        // Comprehensive name validation
        const isValidLength = candidateName.length >= 4 && candidateName.length <= 50;
        const hasCorrectWordCount = words.length >= 2 && words.length <= 4;
        const hasNoNumbers = !/\d/.test(candidateName);
        const hasProperCapitalization = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(candidateName);
        const hasNoExcludedWords = !words.some((word: string) => excludeWords.includes(word));
        const hasMinWordLength = words.every((word: string) => word.length >= 2);
        const hasNoSpecialChars = !/[^a-zA-Z\s]/.test(candidateName);
        
        if (isValidLength && hasCorrectWordCount && hasNoNumbers && 
            hasProperCapitalization && hasNoExcludedWords && 
            hasMinWordLength && hasNoSpecialChars) {
          extractedName = candidateName;
          break;
        }
      }
    }
    if (extractedName) break;
  }

  // If no name found with patterns, check first few lines for standalone names
  if (!extractedName) {
    const lines = text.split('\n').slice(0, 8).map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      const words = line.toLowerCase().split(/\s+/);
      
      // Check for 2-3 word names
      if ((words.length === 2 || words.length === 3) && 
          line.length >= 4 && line.length <= 40 &&
          !/\d/.test(line) &&
          /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,2}$/.test(line) &&
          !words.some((word: string) => excludeWords.includes(word)) &&
          !line.toLowerCase().includes('resume') &&
          !line.toLowerCase().includes('curriculum') &&
          !line.toLowerCase().includes('objective') &&
          !line.toLowerCase().includes('summary') &&
          !line.toLowerCase().includes('experience') &&
          !line.toLowerCase().includes('education') &&
          !line.toLowerCase().includes('skills')) {
        extractedName = line;
        break;
      }
      
      // Special case: single line that starts with a name pattern
      if (line.match(/^[A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?\s*(?:$|\||,|\n)/)) {
        const nameMatch = line.match(/^([A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)/);
        if (nameMatch) {
          const candidateName = nameMatch[1].trim();
          const nameWords = candidateName.toLowerCase().split(/\s+/);
          if (!nameWords.some((word: string) => excludeWords.includes(word))) {
            extractedName = candidateName;
            break;
          }
        }
      }
    }
  }

  // Extract additional information
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const education = extractEducation(text);
  const summary = extractSummary(text);
  const jobTitle = extractJobTitle(text);
  const company = extractCurrentCompany(text);
  const yearsOfExperience = calculateYearsOfExperience(text);

  return {
    name: extractedName,
    email: extractedEmail,
    phone: extractedPhone,
    text,
    skills,
    experience,
    education,
    summary,
    jobTitle,
    company,
    yearsOfExperience,
  };
};

export const parseResume = async (file: File): Promise<ExtractedInfo> => {
  let text = '';
  
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword' // .doc files
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload a PDF or Word document (.pdf, .docx, .doc)');
  }
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size too large. Please upload a file smaller than 10MB.');
  }
  
  try {
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else {
      text = await extractTextFromDocx(file);
    }
    
    // If no text extracted, create empty result (user will need to provide all fields)
    if (!text || text.trim().length === 0) {
      return {
        name: undefined,
        email: undefined,
        phone: undefined,
        text: '',
        skills: [],
        experience: [],
        education: [],
        summary: '',
        jobTitle: '',
        company: '',
        yearsOfExperience: 0,
      };
    }
    
    const extractedInfo = extractInfoFromText(text);
    
    // Return the extraction results - missing fields will be handled by the chatbot
    return extractedInfo;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process the resume file. Please try again or use a different file.');
  }
};
