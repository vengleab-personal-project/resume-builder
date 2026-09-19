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
            username: "Username",
            usernamePlaceholder: "yourname",
            password: "Password",
            passwordPlaceholder: "••••••••",
            signIn: "Sign In",
            signingIn: "Signing in...",
            noAccount: "Don't have an account?",
            signUp: "Sign up"
        },
        signup: {
            title: "Create an account",
            subtitle: "Start building your professional resume today",
            displayName: "Display Name",
            displayNamePlaceholder: "John Doe",
            username: "Username",
            usernamePlaceholder: "yourname",
            usernameHint: "3-20 characters. Lowercase letters, digits and underscores; must start with a letter.",
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
        telegram: {
            or: "or",
            continueWith: "Continue with Telegram",
            signingIn: "Signing in with Telegram...",
            linking: "Linking your Telegram account...",
            linked: "Telegram linked",
            notLinked: "No Telegram account linked",
            link: "Link Telegram",
            unlink: "Unlink Telegram",
            unlinking: "Unlinking...",
            unlinkConfirm: "Unlink your Telegram account? You will only be able to sign in with your username and password."
        },
        validation: {
            usernameRequired: "Please enter a username.",
            usernameTooShort: "Username must be at least 3 characters.",
            usernameTooLong: "Username must be 20 characters or fewer.",
            usernamePattern: "Use lowercase letters, digits and underscores, starting with a letter.",
            usernameReserved: "That username is reserved. Please choose another.",
            passwordTooShort: "Password must be at least 8 characters.",
            passwordTooLong: "Password must be 128 characters or fewer.",
            passwordNeedsLetterAndDigit: "Password must contain at least one letter and one digit.",
            passwordSameAsUsername: "Password must not contain your username.",
            displayNameTooLong: "Display name must be 80 characters or fewer."
        },
        errors: {
            UNAUTHENTICATED: "Please sign in to continue.",
            FORBIDDEN: "You do not have access to this.",
            INVALID_CREDENTIALS: "Incorrect username or password.",
            INVALID_INPUT: "Please check the details you entered.",
            USERNAME_TAKEN: "That username is already taken.",
            RATE_LIMITED: "Too many attempts. Please try again in a few minutes.",
            ACCOUNT_DISABLED: "This account has been disabled.",
            PASSWORD_ALREADY_SET: "A password is already set for this account.",
            TELEGRAM_NOT_CONFIGURED: "Telegram sign-in is not available right now.",
            TELEGRAM_INVALID_SIGNATURE: "We could not verify that Telegram login. Please try again.",
            TELEGRAM_EXPIRED: "That Telegram login expired. Please try again.",
            TELEGRAM_ALREADY_LINKED: "That Telegram account is already linked to another user.",
            TELEGRAM_NOT_LINKED: "No Telegram account is linked.",
            LAST_CREDENTIAL: "Set a password before unlinking Telegram, or you will not be able to sign in.",
            CROSS_ORIGIN: "Request blocked for security reasons. Please reload the page.",
            NOT_FOUND: "We could not find what you were looking for.",
            INTERNAL_ERROR: "Something went wrong. Please try again.",
            NETWORK: "We could not reach the server. Check your connection and try again."
        },
        backToHome: "← Back to home"
    },
    account: {
        title: "Account",
        subtitle: "Manage how you sign in",
        signedInAs: "Signed in as",
        username: "Username",
        role: "Role",
        memberSince: "Member since",
        signOut: "Sign out",
        signOutEverywhere: "Sign out on all devices",
        telegramSection: "Telegram",
        passwordSection: "Password",
        setPassword: "Set a password",
        changePassword: "Change password",
        currentPassword: "Current password",
        newPassword: "New password",
        confirmNewPassword: "Confirm new password",
        savePassword: "Save password",
        savingPassword: "Saving...",
        passwordSaved: "Password updated. Other devices have been signed out.",
        noPasswordNotice: "This account signs in with Telegram only. Set a password to add a second way in.",
        backToApp: "← Back to the builder"
    },
    sync: {
        saved: "Saved",
        savedAt: "Saved · {time}",
        saving: "Saving...",
        offline: "Offline — changes are kept on this device",
        error: "Could not save",
        conflict: "Updated in another tab",
        justNow: "just now",
        minutesAgo: "{count} min ago",
        hoursAgo: "{count} h ago"
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
        copyQuestions: "Copy Questions",
        copied: "Copied!",
        evaluationFailed: "Failed to evaluate resume. Please try again.",
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
        },
        history: {
            title: "Recent evaluations",
            loading: "Loading history...",
            empty: "No evaluations yet. Your results will be saved here.",
            loadMore: "Load more",
            open: "Open",
            delete: "Delete",
            deleteConfirm: "Delete this evaluation from your history?",
            fallbackBadge: "Offline estimate",
            failed: "Could not load your evaluation history."
        }
    },
    admin: {
        title: "Administration",
        subtitle: "Chat model registry and coin pricing",
        backToApp: "Back to app",
        loading: "Loading...",
        nav: {
            chatModels: "Chat Models",
            actionCosts: "Coin Config"
        },
        providers: {
            GOOGLE: "Google",
            OPENAI: "OpenAI"
        },
        actions: {
            PARSE_RESUME: "Parse resume",
            REFINE_RESUME: "Refine content",
            EVALUATE_RESUME: "Evaluate resume",
            VOICE_INTERVIEW: "Voice interview"
        },
        chatModels: {
            title: "Chat Models",
            description: "Models offered in the AI selector. Deactivating one removes it from every user's list within a minute.",
            addModel: "Add model",
            empty: "No chat models configured yet.",
            confirmDelete: "Delete this model? Its coin overrides are deleted with it.",
            makeDefault: "Make default",
            defaultBadge: "Default",
            columns: {
                displayName: "Name",
                provider: "Provider",
                modelId: "Model ID",
                sortOrder: "Order",
                active: "Active",
                default: "Default",
                actions: ""
            }
        },
        actionCosts: {
            title: "Coin Config",
            description: "Coins deducted per AI action. A blank cell inherits the Default column.",
            action: "Action",
            defaultColumn: "Default",
            inherited: "Inherited",
            clearOverride: "Clear override",
            noModels: "Add an active chat model to configure per-model overrides."
        },
        form: {
            provider: "Provider",
            modelId: "Model ID",
            displayName: "Display name",
            sortOrder: "Sort order",
            active: "Active",
            default: "Default",
            save: "Save",
            cancel: "Cancel",
            edit: "Edit",
            delete: "Delete"
        },
        errors: {
            loadFailed: "Could not load configuration.",
            saveFailed: "Could not save changes."
        },
        validation: {
            modelIdRequired: "A model ID is required",
            modelIdPattern: "Use only letters, digits, dots, dashes, colons and underscores",
            displayNameRequired: "A display name is required",
            defaultMustBeActive: "The default model must stay active",
            coinCostInvalid: "Enter a whole number of coins, zero or more"
        }
    },
    coins: {
        unit: "coins",
        badgeTooltip: "Coins and billing",
        insufficient: "You don't have enough coins for this action. Top up to continue.",
        signInRequired: "Please sign in again to continue."
    },
    billing: {
        title: "Buy coins",
        subtitle: "Coins pay for AI parsing, refinement and evaluation.",
        closeLabel: "Close",
        pageTitle: "Billing",
        pageSubtitle: "Your coin balance, purchases and usage.",
        currentBalance: "Current balance",
        coinsLabel: "coins",
        topUp: "Buy coins",
        bonus: "+{count} bonus",
        requiredNotice: "This action needs {count} coins.",
        noPackages: "No coin packages are available right now.",
        scanToPay: "Scan with any Cambodian banking app",
        forCoins: "for {count} coins",
        waitingForPayment: "Waiting for payment",
        reference: "Reference",
        openInBankApp: "Open in banking app",
        openCheckout: "Open checkout",
        cancelOrder: "Cancel",
        simulatePayment: "Simulate payment",
        successTitle: "Payment received",
        successBody: "{count} coins have been added to your balance.",
        done: "Done",
        errorTitle: "Something went wrong",
        tryAgain: "Try again",
        ordersTitle: "Recent orders",
        noOrders: "You haven't bought any coins yet.",
        historyTitle: "Coin history",
        noTransactions: "No coin activity yet.",
        balanceAfter: "Balance",
        loadMore: "Load more",
        loadingMore: "Loading...",
        orderStatus: {
            PENDING: "Pending",
            PAID: "Paid",
            FAILED: "Failed",
            EXPIRED: "Expired",
            CANCELED: "Canceled"
        },
        transactionType: {
            PURCHASE: "Purchase",
            DEDUCTION: "Usage",
            REFUND: "Refund",
            ADMIN_ADJUSTMENT: "Adjustment"
        },
        action: {
            PARSE_RESUME: "Resume parsing",
            REFINE_RESUME: "AI refinement",
            EVALUATE_RESUME: "AI evaluation",
            VOICE_INTERVIEW: "Voice interview"
        },
        errors: {
            loadFailed: "Could not load billing information. Please try again.",
            createFailed: "Could not start the payment. Please try again.",
            noProvider: "No payment method is available right now.",
            orderStatus: {
                PENDING: "This order is still pending.",
                PAID: "This order has already been paid.",
                FAILED: "The payment failed. No coins were charged.",
                EXPIRED: "This payment request expired. Please start a new one.",
                CANCELED: "This payment request was canceled."
            }
        }
    },
    sidebar: {
        appTitle: "ResumeBuilder",
        navLabel: "Main navigation",
        groupCreate: "Create",
        groupManage: "Manage",
        myResumes: "My resumes",
        resumeBuilder: "Professional resume",
        resumeBuilderHint: "Full CV, two columns",
        basicResume: "Basic CV",
        basicResumeHint: "Short form, by voice",
        aiEvaluation: "AI evaluation",
        settings: "Settings",
        admin: "Administration",
        account: "Account",
        signOut: "Sign out",
        backToHome: "Back to home",
        language: "Language",
        coins: "coins",
        topUp: "Top up",
        collapse: "Collapse menu",
        expand: "Expand menu",
        openMenu: "Open menu",
        closeMenu: "Close menu"
    },
    resumeList: {
        title: "My Resumes",
        newResume: "New Resume",
        loading: "Loading your resumes...",
        loadFailed: "Couldn't load your resumes. Please refresh the page.",
        emptyTitle: "No resumes yet",
        emptyDesc: "Create your first resume to get started.",
        updated: "Updated",
        open: "Open in Builder",
        previewUnavailable: "Preview unavailable",
        rename: "Rename",
        duplicate: "Duplicate",
        setDefault: "Set as default",
        defaultBadge: "Default",
        delete: "Delete",
        renamePrompt: "Rename resume",
        deleteConfirm: "Delete this resume? This action cannot be undone."
    },
    // Printed on the CV itself, not shown in the app chrome. These are the
    // section headings a Cambodian employer expects to see on a short-form CV;
    // the English set is the same document, labelled for an English reader.
    basicResume: {
        documentTitle: "Curriculum Vitae",
        nameLabel: "Name:",
        phoneLabel: "Phone:",
        photoAlt: "Photograph",
        sections: {
            personal: "Personal data",
            positionSought: "Position applied for",
            education: "Education",
            experience: "Work experience",
            languages: "Languages",
            interests: "Interests",
            personalStatement: "Personal qualities"
        },
        personal: {
            nationality: "Nationality",
            gender: "Gender",
            dateOfBirth: "Date of birth",
            placeOfBirth: "Place of birth",
            maritalStatus: "Marital status",
            health: "Health"
        },
        // App chrome for the basic CV screen — never printed on the document.
        editor: {
            loading: "Loading your basic CV...",
            editTab: "Type",
            voiceTab: "Answer out loud",
            voice: {
                title: "Answer out loud",
                intro: "I'll ask you about 15 short questions. Answer out loud, or type — whichever is easier. You can skip anything you'd rather not say.",
                startEn: "Start in English",
                startKm: "Start in Khmer",
                cost: "Costs 5 coins for the whole interview, however many questions you answer.",
                step: "Question {n} of {total}",
                finished: "All done",
                finishedNote: "Your CV is on the right. Check it over and fix anything I misheard — you can edit every field by typing.",
                close: "Close",
                press: "Press to answer",
                stop: "Stop recording",
                statusAsking: "Ready when you are",
                statusListening: "Listening...",
                statusThinking: "Thinking...",
                statusSpeaking: "Speaking...",
                followUpNote: "Let me ask that another way",
                optionalNote: "You can skip this one.",
                transcriptLabel: "I heard",
                typedLabel: "Or type your answer",
                typedPlaceholder: "Type here instead",
                send: "Send",
                skip: "Skip this question",
                textOnlyNote: "Speaking isn't available right now, so type your answers below. Everything else works the same.",
                problems: {
                    "insufficient-coins": "You don't have enough coins for an interview. Top up and try again.",
                    "session-expired": "This interview timed out. Start a new one — nothing you already answered is lost.",
                    "session-exhausted": "We've used all the turns for this interview. Your CV is saved with everything you answered.",
                    network: "Couldn't reach the server. Check your connection and try that answer again.",
                    "no-speech": "I didn't hear anything. Check your microphone isn't muted, or type your answer instead.",
                    degraded: "I saved your answer exactly as you gave it, but couldn't tidy it up just now. Check that section of your CV before you send it.",
                    "start-failed": "Couldn't start the interview. Please try again."
                },
                micProblems: {
                    unsupported: "This browser can't record audio. You can still type every answer.",
                    "permission-denied": "Microphone access was blocked. Allow it in your browser settings, or type your answers instead.",
                    "permission-dismissed": "The microphone request was dismissed. Press the button again to allow it, or type your answers.",
                    "no-microphone": "No microphone found. Plug one in, or type your answers instead.",
                    "capture-failed": "The microphone stopped working. Try again, or type your answer."
                }
            },
            identity: "About you",
            fullName: "Full name",
            positionSought: "Position applied for",
            address: "Address",
            phone: "Phone number",
            email: "Email (optional)",
            year: "Year",
            detail: "Detail",
            languageName: "Language",
            languageSkills: "What you can do",
            interestsHint: "Separate with commas",
            statementHint: "How would you describe yourself as a worker?",
            add: "Add",
            remove: "Remove",
            toolbar: {
                heading: "Basic CV",
                titlePlaceholder: "CV name",
                newCv: "New",
                exportPdf: "Print / PDF",
                exportDocx: "Export DOCX",
                exporting: "Exporting...",
                status: {
                    idle: "",
                    saving: "Saving...",
                    saved: "Saved",
                    error: "Couldn't save",
                    conflict: "Updated from another tab"
                }
            }
        }
    },
    // Spoken aloud, not read. Every prompt is written to be said in one breath
    // and understood by someone who has never written a CV: short sentences,
    // no jargon, an example where the answer shape is not obvious.
    // `followUp` exists only on questions that are allowed one (§5.3) — the
    // optional personal questions have none, because the app must never push a
    // user to answer them.
    basicInterview: {
        questions: {
            fullName: {
                prompt: "Let's start with your name. What is your full name?",
                followUp: "Sorry, I didn't catch that. Could you say your full name again, slowly?"
            },
            positionSought: {
                prompt: "What job are you applying for?",
                followUp: "What kind of work are you looking for? For example, waiter, security guard, or factory worker."
            },
            phone: {
                prompt: "What is your phone number?",
                followUp: "Could you say your phone number again, one number at a time?"
            },
            address: {
                prompt: "Where do you live? You can tell me your village, commune, district and province.",
                followUp: "Which province do you live in, and which district?"
            },
            dateOfBirth: {
                prompt: "When were you born? Tell me the day, the month and the year.",
                followUp: "Which year were you born? If you remember the day and month, tell me those too."
            },
            gender: {
                prompt: "What is your gender? You can skip this question if you prefer."
            },
            nationality: {
                prompt: "What is your nationality?"
            },
            placeOfBirth: {
                prompt: "Where were you born?"
            },
            maritalStatus: {
                prompt: "Are you single or married? You can skip this question if you prefer."
            },
            health: {
                prompt: "How is your general health? You can skip this question if you prefer."
            },
            education: {
                prompt: "Now let's talk about school. Tell me each school or course you have done, and the year. Take your time.",
                followUp: "What was the last school or course you finished, and roughly what year was that?"
            },
            experience: {
                prompt: "Have you worked before? Tell me each job you have had, and the year."
            },
            languages: {
                prompt: "What languages do you speak? For each one, tell me what you can do — speak, listen, read, or translate."
            },
            interests: {
                prompt: "What do you like to do in your free time?"
            },
            personalStatement: {
                prompt: "Last question. How would you describe yourself as a worker?"
            }
        }
    },
    language: {
        en: "English",
        km: "ភាសាខ្មែរ"
    }
};

export default en;
