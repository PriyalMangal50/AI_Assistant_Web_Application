import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
  text: string;
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

export const extractInfoFromText = (text: string): ExtractedInfo => {
  if (!text || text.trim().length === 0) {
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      text: '',
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
    /(?:^|\n)\s*(?:name|full\s*name|candidate\s*name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\n|$)/gim,
    // Contact section names
    /(?:contact\s*(?:info|information)?|personal\s*(?:info|information)?)[\s\S]{0,100}?([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2})/gi,
    // Resume/CV headers
    /(?:^|\n)\s*(?:resume|cv|curriculum\s+vitae)\s*(?:of|for|[-:])\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gim,
    // First line names (if properly formatted)
    /^\s*([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2})\s*$/gm,
    // Names in first few lines
    /^([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2})(?:\n|\s)/gm
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
    const lines = text.split('\n').slice(0, 5).map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
      const words = line.toLowerCase().split(/\s+/);
      if (words.length === 2 && 
          line.length >= 4 && line.length <= 30 &&
          !/\d/.test(line) &&
          /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line) &&
          !words.some((word: string) => excludeWords.includes(word))) {
        extractedName = line;
        break;
      }
    }
  }

  return {
    name: extractedName,
    email: extractedEmail,
    phone: extractedPhone,
    text,
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
