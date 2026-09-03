const en = {
    common: {
        appTitle: "ResumeBuilder",
        resumeEditor: "Resume Editor",
        exportPrint: "Export / Print",
        loading: "Loading...",
        error: "Error",
        cancel: "Cancel",
        replace: "Replace",
        amend: "Amend (Add to existing)",
        errors: {
            duplicateSkill: "This skill has already been added"
        },
        exporting: "Exporting...",
        exportDocx: "Export as DOCX",
        exportingDocx: "Exporting DOCX...",
        clear: "Clear",
        clearData: "Clear all data",
        confirmClearData: "Are you sure you want to clear all data? This action cannot be undone.",
        apply: "Apply Changes",
        generate: "Generate",
        view: "View",
        backToHome: "Back to Home",
        save: "Save",
        delete: "Delete",
        close: "Close"
    },
    ai: {
        assistant: "AI Assistant",
        currentContent: "Current Content",
        noContent: "No content yet",
        question: "What would you like to do?",
        placeholder: "e.g., Make it more professional, add bullet points, improve clarity...",
        generating: "Generating...",
        generate: "Generate with AI",
        result: "AI Generated Result",
        regenerate: "Regenerate",
        briefInfo: "Tell us about yourself",
        briefInfoPlaceholder: "Briefly describe your background, experience, and what you'd like to highlight for this section...",
        generateSection: "Generate {section}",
        items: "items",
        resultReady: "Result Ready",
        reviewOnLeft: "Review the suggested changes on the left."
    },
    viewMode: {
        editor: "Editor",
        preview: "Preview"
    },
    preview: {
        noExportedPdf: {
            title: "No Exported PDF Yet",
            description: "Click the \"Export / Print\" button to generate and download your PDF resume."
        },
        noPdfUploaded: {
            title: "No PDF Uploaded",
            description: "Upload your resume in the sidebar to see the original file here."
        },
        profile: "Profile",
        experience: "Work Experience",
        education: "Education",
        contact: "Contact",
        skills: "Skills",
        certifications: "Professional Certification",
        publications: "Publications",
        volunteering: "Volunteering",
        languages: "Language",
        otherTraining: "Other Training",
        references: "Reference",
        view: "View",
        yourName: "Your Name"
    },
    home: {
        title: {
            ai: "AI",
            resume: "Resume",
            builder: "Builder"
        },
        actions: {
            ingest: "Ingest",
            buildWithAi: "Build with AI",
            customize: "Customize"
        },
        sections: {
            ingest: "1. Ingest",
            customize: "2. Customize",
            edit: "3. Edit Content"
        }
    },
    ingest: {
        title: "Ingest Resume",
        description: "Upload or paste your resume to get started"
    },
    upload: {
        title: "Upload Resume",
        aiProvider: "AI Provider",
        model: "Model",
        analyzing: "Analyzing with AI...",
        clickToUpload: "Click to Upload",
        supportedFormats: "PDF, DOCX, or TXT",
        pasteText: "Paste resume text instead",
        or: "OR",
        parseText: "Parse Text",
        placeholderText: "Paste your resume content here...",
        providers: {
            openai: "OpenAI",
            google: "Google Gemini"
        },
        cancel: "Cancel",
        errors: {
            noFile: "No file uploaded",
            unsupportedFormat: "Unsupported file format",
            parseError: "Failed to parse resume. Please try again."
        }
    },
    editor: {
        personalInfo: "Personal Information",
        summary: "Professional Summary",
        experience: "Work Experience",
        education: "Education",
        skills: "Skills",
        certifications: "Professional Certification",
        publications: "Publications",
        volunteering: "Volunteering",
        languages: "Language",
        otherTraining: "Other Training",
        references: "Reference",
        theme: {
            options: "Theme Options",
            accentColor: "Accent Color",
            typography: "Typography",
            customColor: "Custom Color"
        },
        drag: {
            reorder: "Drag to reorder"
        },
        placeholders: {
            bullets: "One bullet per line",
            newRole: "New Role",
            newCompany: "New Company",
            newSchool: "New School",
            newPublication: "New Publication",
            newVolunteering: "New Volunteering Role",
            newOrganization: "Organization",
            newTopic: "Topic",
            newLanguage: "New Language",
            newProficiency: "Proficiency",
            newTraining: "New Training",
            newReferenceName: "Reference Name",
            newReferenceTitle: "Title",
            newReferenceCompany: "Company",
            dates: "e.g. Jan 2022 - Present",
            location: "e.g. London, UK",
            degree: "e.g. Bachelor of Science",
            year: "e.g. 2018 - 2022",
            gpa: "e.g., 3.8/4.0, First Class Honours",
            publicationTitle: "e.g. Impact of AI on Modern Medicine",
            publicationLink: "e.g. https://doi.org/...",
            certExpire: "MM/DD/YYYY",
            certYear: "YYYY",
            langName: "e.g. English",
            langProficiency: "e.g. Fluent, Native",
            trainingName: "e.g. AWS Certified Solutions Architect",
            refPhone: "e.g. +1 234 567 890",
            refEmail: "e.g. john.doe@example.com"
        },
        labels: {
            photo: "Profile Photo",
            fullName: "Full Name",
            jobTitle: "Job Title / Professional Headline",
            email: "Email",
            phone: "Phone",
            address: "City, Country",
            linkedin: "LinkedIn",
            website: "Website",
            summary: "Professional Summary",
            role: "Job Title",
            company: "Company",
            dates: "Dates",
            location: "Location",
            achievements: "Achievements",
            school: "School",
            degree: "Degree",
            year: "Year",
            description: "Description",
            skills: "Skills (Enter to add)",
            certifications: "Certifications (One per line)",
            certName: "Certification Name",
            certIssuer: "Issuer",
            certExpire: "Expire Date",
            certYear: "Year",
            publications: "Publications",
            title: "Title",
            link: "Link",
            volRole: "Role / Event",
            volOrganization: "Organization",
            volTopic: "Topic",
            langName: "Language",
            langProficiency: "Proficiency (e.g., Fluent, Native)",
            trainingName: "Training / Course Name",
            refName: "Full Name",
            refTitle: "Title",
            refCompany: "Company",
            refPhone: "Phone",
            refEmail: "Email"
        },
        actions: {
            addExperience: "Add Experience",
            addEducation: "Add Education",
            addPublication: "Add Publication",
            addCertification: "Add Certification",
            addVolunteering: "Add Volunteering",
            addLanguage: "Add Language",
            addTraining: "Add Training",
            addReference: "Add Reference",
            addSkill: "Add a skill...",
            remove: "Remove",
            clean: "Clean",
            upload: "Upload",
            change: "Change",
            removePageBreak: "Remove page break",
            addPageBreak: "Add page break after this item"
        },
        instructions: {
            formatEmail: "Format this email address correctly",
            generateSummary: "Write a professional 2-3 sentence resume summary for a candidate with these skills: {skills}",
            improveSummary: "Make this summary more impactful and professional",
            seniorJobTitle: "Suggest a more senior-sounding job title for: {title}",
            improveBullets: "Turn these into strong, achievement-oriented bullet points starting with action verbs",
            suggestSkills: "Based on this resume, suggest 5 more relevant technical skills for this candidate.",
            cleanSkills: "Format these skills nicely, remove duplicates, and capitalize correctly. Return comma separated.",
            generateSection: "Generate professional and relevant entries for the resume section: {section} in JSON format."
        },
        preview: {
            profile: "Profile",
            experience: "Work Experience",
            education: "Education",
            contact: "Contact",
            skills: "Skills",
            certifications: "Professional Certification",
            publications: "Publications",
            volunteering: "Volunteering",
            languages: "Language",
            otherTraining: "Other Training",
            references: "Reference",
            view: "View",
            yourName: "Your Name"
        }
    },
    landing: {
        nav: {
            features: "Features",
            templates: "Templates",
            pricing: "Pricing",
            login: "Login",
            buildResume: "Build Resume"
        },
        hero: {
            badge: "✨ AI-Powered CV Builder • 100% Free",
            titlePrefix: "Build a ",
            titleHighlight: "Professional Resume",
            titleSuffix: " in Minutes with AI",
            description: "Craft a standout resume with our intelligent tools, professional templates, and tailored suggestions.",
            ctaButton: "Get Started for Free",
            noCreditCard: "No credit card required • Instant PDF & Word export",
            aiBadge: "AI"
        },
        templates: {
            title: "Choose a Perfect Template",
            subtitle: "Stand out from the crowd with our professionally designed templates tailored for every industry.",
            preview: "Preview",
            modernProfessional: "Modern Professional",
            creativePortfolio: "Creative Portfolio",
            classicExecutive: "Classic Executive",
            simpleClean: "Simple Clean"
        },
        howItWorks: {
            title: "How It Works",
            subtitle: "Create a winning resume in three simple steps.",
            step1Title: "1. Ingest",
            step1Desc: "Upload your existing resume or import data from LinkedIn.",
            step2Title: "2. Customize",
            step2Desc: "Use AI to tailor content and choose your preferred design.",
            step3Title: "3. Export",
            step3Desc: "Download in PDF, Word format, or share your resume online."
        },
        cta: {
            title: "Ready to land your dream job?",
            button: "Get Started Now"
        },
        footer: {
            resources: "Resources",
            company: "Company",
            support: "Support",
            newsletter: "Newsletter",
            newsletterPlaceholder: "Enter your email",
            subscribe: "Subscribe",
            blog: "Blog",
            guides: "Guides",
            examples: "Examples",
            about: "About",
            careers: "Careers",
            contact: "Contact",
            helpCenter: "Help Center",
            faqs: "FAQs",
            privacyPolicy: "Privacy Policy",
            aboutUs: "About Us",
            allRightsReserved: "All rights reserved."
        }
    },
    auth: {
        login: {
            title: "Welcome back",
            subtitle: "Please enter your details to sign in",
            email: "Email Address",
            emailPlaceholder: "name@company.com",
            password: "Password",
            passwordPlaceholder: "••••••••",
            rememberMe: "Remember me",
            forgotPassword: "Forgot password?",
            signIn: "Sign In",
            signingIn: "Signing in...",
            noAccount: "Don't have an account?",
            signUp: "Sign up"
        },
        signup: {
            title: "Create an account",
            subtitle: "Start building your professional resume today",
            fullName: "Full Name",
            fullNamePlaceholder: "John Doe",
            email: "Email Address",
            emailPlaceholder: "name@company.com",
            password: "Password",
            passwordPlaceholder: "••••••••",
            confirmPassword: "Confirm Password",
            confirmPasswordPlaceholder: "••••••••",
            createAccount: "Create Account",
            creatingAccount: "Creating account...",
            haveAccount: "Already have an account?",
            signIn: "Sign in",
            passwordMismatch: "Passwords do not match"
        },
        backToHome: "← Back to home"
    },
    evaluation: {
        title: "AI Evaluation",
        subtitle: "Candidate Intelligence",
        unknownCandidate: "Unknown Candidate",
        noTitle: "No title provided",
        metricsLegend: "Metrics Legend",
        legendDesc: "Match score range",
        scoreRanges: {
            strong: "Strong",
            good: "Good",
            moderate: "Moderate",
            weak: "Weak",
            strongDesc: "Exceptional alignment with all requirements",
            goodDesc: "Meets core requirements with minor gaps",
            moderateDesc: "Partial alignment, notable gaps exist",
            weakDesc: "Significant misalignment with position"
        },
        provideJdTitle: "Provide Job Description",
        provideJdDesc: "Paste or upload the job description to evaluate your CV against it. Your input is saved locally for future sessions.",
        tabPasteText: "Paste Text",
        tabUploadPdf: "Upload Job PDF",
        targetJdLabel: "Target Job Description",
        jdPlaceholder: "Paste the full job posting here — include required skills, qualifications, responsibilities, and experience level...",
        charactersCount: "characters",
        minRecommended: "min. 50 recommended",
        uploadJdTitle: "Upload Job Description (PDF)",
        dropPdfPrompt: "Drop your job posting PDF here, or browse",
        pdfConstraint: "PDF only, max 10MB",
        evaluatingButton: "Evaluating Candidate...",
        evaluateButton: "Evaluate Match",
        minCharactersNotice: "Please enter at least 50 characters of job description to evaluate.",
        sessionLoaded: "Job description loaded from your last session.",
        clearReset: "Clear & Reset",
        overallScore: "Overall Match Score",
        executiveSummary: "Executive Summary",
        competencyBreakdown: "Competency Breakdown",
        radarScore: "Score",
        keyStrengths: "Key Strengths",
        gapsToImprove: "Gaps & Areas to Improve",
        interviewTalkingPoints: "Interview Talking Points",
        evaluatedAt: "Evaluated {time}",
        reevaluateButton: "Re-evaluate with New JD",
        verdicts: {
            verified: "Verified",
            limited: "Limited",
            missing: "Missing"
        },
        recommendations: {
            highlyRecommended: "Highly Recommended",
            recommended: "Recommended",
            consider: "Consider",
            notRecommended: "Not Recommended"
        }
    },
    sidebar: {
        resumeBuilder: "Resume Builder",
        aiEvaluation: "AI Evaluation",
        settings: "Settings",
        backToHome: "Back to Home",
        language: "Language"
    },
    language: {
        en: "English",
        km: "ភាសាខ្មែរ"
    }
};

export default en;
