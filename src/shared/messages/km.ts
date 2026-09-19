import type en from "./en";

const km: typeof en = {
    common: {
        appTitle: "ResumeBuilder",
        resumeEditor: "កម្មវិធីកែសម្រួលប្រវត្តិរូប",
        exportPrint: "ទាញយក / បោះពុម្ព",
        loading: "កំពុងដំណើរការ...",
        error: "កំហុស",
        cancel: "បោះបង់",
        replace: "ជំនួស",
        amend: "បន្ថែមលើទិន្នន័យចាស់",
        errors: {
            duplicateSkill: "ជំនាញនេះត្រូវបានបញ្ចូលរួចហើយ"
        },
        exporting: "កំពុងទាញយក...",
        exportDocx: "ទាញយកជា DOCX",
        exportingDocx: "កំពុងទាញយក DOCX...",
        clear: "សម្អាត",
        clearData: "សម្អាតទិន្នន័យទាំងអស់",
        confirmClearData: "តើអ្នកប្រាកដជាចង់លុបទិន្នន័យទាំងអស់មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
        apply: "អនុវត្តការផ្លាស់ប្តូរ",
        generate: "បង្កើត",
        view: "មើល",
        backToHome: "ត្រឡប់ទៅទំព័រដើម",
        save: "រក្សាទុក",
        delete: "លុប",
        close: "បិទ"
    },
    ai: {
        assistant: "ជំនួយការ AI",
        currentContent: "ខ្លឹមសារបច្ចុប្បន្ន",
        noContent: "មិនទាន់មានខ្លឹមសារនៅឡើយទេ",
        question: "តើអ្នកចង់ឱ្យ AI ធ្វើអ្វីខ្លះ?",
        placeholder: "ឧ. ធ្វើឱ្យកាន់តែមានលក្ខណៈវិជ្ជាជីវៈ, បន្ថែមចំណុចសំខាន់ៗ, កែលម្អភាពច្បាស់លាស់...",
        generating: "កំពុងបង្កើត...",
        generate: "បង្កើតជាមួយ AI",
        result: "លទ្ធផលបង្កើតដោយ AI",
        regenerate: "បង្កើតឡើងវិញ",
        briefInfo: "ប្រាប់យើងអំពីព័ត៌មានរបស់អ្នក",
        briefInfoPlaceholder: "រៀបរាប់សង្ខេបអំពីប្រវត្តិ បទពិសោធន៍ និងចំណុចសំខាន់ៗដែលអ្នកចង់បង្ហាញសម្រាប់ផ្នែកនេះ...",
        generateSection: "បង្កើតផ្នែក {section}",
        items: "ធាតុ",
        resultReady: "លទ្ធផលរួចរាល់ហើយ",
        reviewOnLeft: "ពិនិត្យមើលការផ្លាស់ប្តូរដែលបានស្នើឡើងនៅខាងឆ្វេង។"
    },
    viewMode: {
        editor: "កែសម្រួល",
        preview: "មើលគំរូ"
    },
    preview: {
        noExportedPdf: {
            title: "មិនទាន់មាន PDF ដែលបានទាញយកនៅឡើយទេ",
            description: "ចុចប៊ូតុង \"ទាញយក / បោះពុម្ព\" ដើម្បីបង្កើត និងទាញយកប្រវត្តិរូបជា PDF របស់អ្នក។"
        },
        noPdfUploaded: {
            title: "មិនទាន់មានឯកសារ PDF បានផ្ទុកឡើងទេ",
            description: "ផ្ទុកឡើងប្រវត្តិរូបរបស់អ្នកនៅក្នុងរបារចំហៀងដើម្បីមើលឯកសារដើមនៅទីនេះ។"
        },
        profile: "សេចក្តីសង្ខេប",
        experience: "បទពិសោធន៍ការងារ",
        education: "ការអប់រំ",
        contact: "ទំនាក់ទំនង",
        skills: "ជំនាញ",
        certifications: "វិញ្ញាបនបត្រវិជ្ជាជីវៈ",
        publications: "ស្នាដៃ / អត្ថបទបោះពុម្ព",
        volunteering: "ការងារស្ម័គ្រចិត្ត",
        languages: "ភាសា",
        otherTraining: "វគ្គបណ្តុះបណ្តាលផ្សេងៗ",
        references: "បុគ្គលយោង",
        view: "មើល",
        yourName: "ឈ្មោះរបស់អ្នក"
    },
    home: {
        title: {
            ai: "AI",
            resume: "ប្រវត្តិរូប",
            builder: "បង្កើត"
        },
        actions: {
            ingest: "បញ្ចូលប្រវត្តិរូប",
            buildWithAi: "បង្កើតជាមួយ AI",
            customize: "កែប្រែទម្រង់"
        },
        sections: {
            ingest: "១. បញ្ចូលប្រវត្តិរូប",
            customize: "២. កែប្រែទម្រង់",
            edit: "៣. កែសម្រួលខ្លឹមសារ"
        }
    },
    ingest: {
        title: "បញ្ចូលប្រវត្តិរូប",
        description: "ផ្ទុកឡើងឯកសារ ឬចម្លងខ្លឹមសារប្រវត្តិរូបរបស់អ្នកដើម្បីចាប់ផ្តើម"
    },
    upload: {
        title: "ផ្ទុកឡើងប្រវត្តិរូប",
        aiProvider: "អ្នកផ្តល់សេវា AI",
        model: "ម៉ូដែល AI",
        analyzing: "កំពុងវិភាគជាមួយ AI...",
        clickToUpload: "ចុចដើម្បីផ្ទុកឡើង",
        supportedFormats: "PDF, DOCX ឬ TXT",
        pasteText: "ចម្លងខ្លឹមសារប្រវត្តិរូបជំនួសវិញ",
        or: "ឬ",
        parseText: "វិភាគអត្ថបទ",
        placeholderText: "បិទភ្ជាប់ខ្លឹមសារប្រវត្តិរូបរបស់អ្នកនៅទីនេះ...",
        providers: {
            openai: "OpenAI",
            google: "Google Gemini"
        },
        cancel: "បោះបង់",
        errors: {
            noFile: "មិនបានជ្រើសរើសឯកសារទេ",
            unsupportedFormat: "ទម្រង់ឯកសារមិនគាំទ្រ",
            parseError: "មិនអាចវិភាគប្រវត្តិរូបបានទេ។ សូមព្យាយាមម្តងទៀត។"
        }
    },
    editor: {
        personalInfo: "ព័ត៌មានផ្ទាល់ខ្លួន",
        summary: "សេចក្តីសង្ខេបវិជ្ជាជីវៈ",
        experience: "បទពិសោធន៍ការងារ",
        education: "ការអប់រំ",
        skills: "ជំនាញ",
        certifications: "វិញ្ញាបនបត្រវិជ្ជាជីវៈ",
        publications: "ស្នាដៃ / អត្ថបទបោះពុម្ព",
        volunteering: "ការងារស្ម័គ្រចិត្ត",
        languages: "ភាសា",
        otherTraining: "វគ្គបណ្តុះបណ្តាលផ្សេងៗ",
        references: "បុគ្គលយោង",
        theme: {
            options: "ជម្រើសទម្រង់",
            accentColor: "ពណ៌ចម្បង",
            typography: "ពុម្ពអក្សរ",
            customColor: "ពណ៌ផ្ទាល់ខ្លួន"
        },
        drag: {
            reorder: "អូសដើម្បីតម្រៀបឡើងវិញ"
        },
        placeholders: {
            bullets: "មួយចំណុចក្នុងមួយបន្ទាត់",
            newRole: "មុខតំណែងថ្មី",
            newCompany: "ស្ថាប័ន / ក្រុមហ៊ុនថ្មី",
            newSchool: "គ្រឹះស្ថានសិក្សាថ្មី",
            newPublication: "ស្នាដៃបោះពុម្ពថ្មី",
            newVolunteering: "តួនាទីស្ម័គ្រចិត្តថ្មី",
            newOrganization: "អង្គភាព / ស្ថាប័ន",
            newTopic: "ប្រធានបទ",
            newLanguage: "ភាសាថ្មី",
            newProficiency: "កម្រិតជំនាញ",
            newTraining: "វគ្គបណ្តុះបណ្តាលថ្មី",
            newReferenceName: "ឈ្មោះបុគ្គលយោង",
            newReferenceTitle: "មុខតំណែង",
            newReferenceCompany: "ក្រុមហ៊ុន / ស្ថាប័ន",
            dates: "ឧ. មករា ២០២២ - បច្ចុប្បន្ន",
            location: "ឧ. រាជធានីភ្នំពេញ",
            degree: "ឧ. បរិញ្ញាបត្រវិទ្យាសាស្ត្រកុំព្យូទ័រ",
            year: "ឧ. ២០១៨ - ២០២២",
            gpa: "ឧ. និទ្ទេសល្អប្រសើរ, GPA 3.8/4.0",
            publicationTitle: "ឧ. ឥទ្ធិពលនៃ AI លើការថែទាំសុខភាពទំនើប",
            publicationLink: "ឧ. https://doi.org/...",
            certExpire: "ខែ/ថ្ងៃ/ឆ្នាំ",
            certYear: "ឆ្នាំ",
            langName: "ឧ. ភាសាអង់គ្លេស",
            langProficiency: "ឧ. ស្ទាត់ជំនាញ, ភាសាកំណើត",
            trainingName: "ឧ. ស្ថាបត្យករប្រព័ន្ធ AWS Certified",
            refPhone: "ឧ. +855 12 345 678",
            refEmail: "ឧ. sokha.chan@example.com"
        },
        labels: {
            photo: "រូបថតផ្ទាល់ខ្លួន",
            fullName: "ឈ្មោះពេញ",
            jobTitle: "មុខតំណែង / ជំនាញវិជ្ជាជីវៈ",
            email: "អ៊ីមែល",
            phone: "លេខទូរស័ព្ទ",
            address: "ទីកន្លែងរស់នៅ (ក្រុង, ប្រទេស)",
            linkedin: "LinkedIn",
            website: "គេហទំព័រ",
            summary: "សេចក្តីសង្ខេបវិជ្ជាជីវៈ",
            role: "មុខតំណែង",
            company: "ក្រុមហ៊ុន / ស្ថាប័ន",
            dates: "កាលបរិច្ឆេទ",
            location: "ទីតាំង",
            achievements: "សមិទ្ធផលការងារ",
            school: "គ្រឹះស្ថានសិក្សា",
            degree: "កម្រិតសញ្ញាបត្រ",
            year: "ឆ្នាំសិក្សា",
            description: "ការពិពណ៌នា",
            skills: "ជំនាញ (ចុច Enter ដើម្បីបន្ថែម)",
            certifications: "វិញ្ញាបនបត្រ (មួយបន្ទាត់ក្នុងមួយវិញ្ញាបនបត្រ)",
            certName: "ឈ្មោះវិញ្ញាបនបត្រ",
            certIssuer: "ស្ថាប័នចេញ",
            certExpire: "កាលបរិច្ឆេទផុតកំណត់",
            certYear: "ឆ្នាំទទួលបាន",
            publications: "ស្នាដៃ / អត្ថបទបោះពុម្ព",
            title: "ចំណងជើង",
            link: "តំណភ្ជាប់",
            volRole: "តួនាទី / ព្រឹត្តិការណ៍",
            volOrganization: "អង្គភាព / ស្ថាប័ន",
            volTopic: "ប្រធានបទ",
            langName: "ភាសា",
            langProficiency: "កម្រិតជំនាញ (ឧ. ស្ទាត់ជំនាញ, ភាសាកំណើត)",
            trainingName: "ឈ្មោះវគ្គបណ្តុះបណ្តាល",
            refName: "ឈ្មោះពេញ",
            refTitle: "មុខតំណែង",
            refCompany: "ក្រុមហ៊ុន / ស្ថាប័ន",
            refPhone: "លេខទូរស័ព្ទ",
            refEmail: "អ៊ីមែល"
        },
        actions: {
            addExperience: "បន្ថែមបទពិសោធន៍",
            addEducation: "បន្ថែមការអប់រំ",
            addPublication: "បន្ថែមស្នាដៃបោះពុម្ព",
            addCertification: "បន្ថែមវិញ្ញាបនបត្រ",
            addVolunteering: "បន្ថែមការងារស្ម័គ្រចិត្ត",
            addLanguage: "បន្ថែមភាសា",
            addTraining: "បន្ថែមវគ្គបណ្តុះបណ្តាល",
            addReference: "បន្ថែមបុគ្គលយោង",
            addSkill: "បន្ថែមជំនាញ...",
            remove: "លុបចេញ",
            clean: "សម្អាត",
            upload: "ផ្ទុកឡើង",
            change: "ផ្លាស់ប្តូរ",
            removePageBreak: "ដកការកាត់ទំព័រចេញ",
            addPageBreak: "បន្ថែមការកាត់ទំព័របន្ទាប់ពីធាតុនេះ"
        },
        instructions: {
            formatEmail: "រៀបចំទម្រង់អ៊ីមែលនេះឱ្យបានត្រឹមត្រូវ",
            generateSummary: "សរសេរសេចក្តីសង្ខេបប្រវត្តិរូបវិជ្ជាជីវៈ ២-៣ ប្រយោគ សម្រាប់បេក្ខជនដែលមានជំនាញទាំងនេះ៖ {skills}",
            improveSummary: "កែលម្អសេចក្តីសង្ខេបនេះឱ្យកាន់តែទាក់ទាញ និងមានលក្ខណៈវិជ្ជាជីវៈ",
            seniorJobTitle: "ស្នើមុខតំណែងដែលមានកម្រិតខ្ពស់ជាងនេះសម្រាប់៖ {title}",
            improveBullets: "បំប្លែងចំណុចទាំងនេះទៅជាចំណុចផ្តោតលើសមិទ្ធផលជាក់ស្តែងដោយចាប់ផ្តើមដោយកិរិយាស័ព្ទសកម្មភាព",
            suggestSkills: "ផ្អែកលើប្រវត្តិរូបនេះ ស្នើជំនាញបច្ចេកទេសពាក់ព័ន្ធចំនួន ៥ បន្ថែមទៀតសម្រាប់បេក្ខជននេះ។",
            cleanSkills: "រៀបចំទម្រង់ជំនាញទាំងនេះឱ្យបានស្អាត លុបជំនាញស្ទួន និងកំណត់អក្សរឱ្យត្រឹមត្រូវ។ ត្រឡប់មកវិញដោយញែកដោយសញ្ញាក្បៀស។",
            generateSection: "បង្កើតធាតុជំនាញវិជ្ជាជីវៈ និងពាក់ព័ន្ធសម្រាប់ផ្នែកប្រវត្តិរូប៖ {section} ជាទម្រង់ JSON។"
        },
        preview: {
            profile: "សេចក្តីសង្ខេប",
            experience: "បទពិសោធន៍ការងារ",
            education: "ការអប់រំ",
            contact: "ទំនាក់ទំនង",
            skills: "ជំនាញ",
            certifications: "វិញ្ញាបនបត្រវិជ្ជាជីវៈ",
            publications: "ស្នាដៃ / អត្ថបទបោះពុម្ព",
            volunteering: "ការងារស្ម័គ្រចិត្ត",
            languages: "ភាសា",
            otherTraining: "វគ្គបណ្តុះបណ្តាលផ្សេងៗ",
            references: "បុគ្គលយោង",
            view: "មើល",
            yourName: "ឈ្មោះរបស់អ្នក"
        }
    },
    landing: {
        nav: {
            features: "មុខងារពិសេស",
            templates: "គំរូប្រវត្តិរូប",
            pricing: "តម្លៃ",
            login: "ចូលគណនី",
            buildResume: "បង្កើតប្រវត្តិរូប"
        },
        hero: {
            badge: "✨ កម្មវិធីបង្កើតប្រវត្តិរូបវៃឆ្លាតជាមួយ AI • ឥតគិតថ្លៃ ១០០%",
            titlePrefix: "បង្កើត",
            titleHighlight: "ប្រវត្តិរូបវិជ្ជាជីវៈ",
            titleSuffix: " ត្រឹមតែប៉ុន្មាននាទីជាមួយ AI",
            description: "បង្កើតប្រវត្តិរូបដ៏លេចធ្លោជាមួយនឹងឧបករណ៍វៃឆ្លាត គំរូប្រកបដោយវិជ្ជាជីវៈ និងការផ្ដល់យោបល់សមស្របតាមតម្រូវការរបស់អ្នក។",
            ctaButton: "ចាប់ផ្តើមដោយឥតគិតថ្លៃ",
            noCreditCard: "មិនត្រូវការកាតធនាគារ • ទាញយកជា PDF & Word ភ្លាមៗ",
            aiBadge: "AI"
        },
        templates: {
            title: "ជ្រើសរើសគំរូប្រវត្តិរូបដ៏ល្អឥតខ្ចោះ",
            subtitle: "លេចធ្លោដាច់គេជាមួយនឹងទម្រង់គំរូរចនាឡើងដោយអ្នកជំនាញ សមស្របសម្រាប់គ្រប់វិស័យការងារ។",
            preview: "មើលគំរូ",
            modernProfessional: "បែបវិជ្ជាជីវៈទំនើប",
            creativePortfolio: "បែបច្នៃប្រឌិត",
            classicExecutive: "បែបអ្នកដឹកនាំបុរាណ",
            simpleClean: "បែបសាមញ្ញទាក់ទាញ"
        },
        howItWorks: {
            title: "របៀបដំណើរការ",
            subtitle: "បង្កើតប្រវត្តិរូបជោគជ័យត្រឹមតែ ៣ ជំហានងាយៗ។",
            step1Title: "១. បញ្ចូលទិន្នន័យ",
            step1Desc: "ផ្ទុកឡើងប្រវត្តិរូបចាស់របស់អ្នក ឬទាញយកទិន្នន័យពី LinkedIn។",
            step2Title: "២. កែប្រែតាមចិត្ត",
            step2Desc: "ប្រើ AI ដើម្បីសម្រួលខ្លឹមសារ និងជ្រើសរើសការរចនាដែលអ្នកពេញចិត្ត។",
            step3Title: "៣. ទាញយកឯកសារ",
            step3Desc: "ទាញយកជា PDF, Word ឬចែករំលែកប្រវត្តិរូបរបស់អ្នកលើអ៊ីនធឺណិត។"
        },
        cta: {
            title: "ត្រៀមខ្លួនរួចរាល់ដើម្បីទទួលបានការងារក្នុងក្តីស្រមៃហើយឬនៅ?",
            button: "ចាប់ផ្តើមឥឡូវនេះ"
        },
        footer: {
            resources: "ធនធាន",
            company: "ក្រុមហ៊ុន",
            support: "ជំនួយ",
            newsletter: "ព្រឹត្តិបត្រព័ត៌មាន",
            newsletterPlaceholder: "បញ្ចូលអ៊ីមែលរបស់អ្នក",
            subscribe: "ជាវព័ត៌មាន",
            blog: "ប្លុក",
            guides: "សៀវភៅណែនាំ",
            examples: "ឧទាហរណ៍",
            about: "អំពីយើង",
            careers: "ឱកាសការងារ",
            contact: "ទំនាក់ទំនង",
            helpCenter: "មជ្ឈមណ្ឌលជំនួយ",
            faqs: "សំណួរញឹកញាប់",
            privacyPolicy: "គោលការណ៍ឯកជនភាព",
            aboutUs: "អំពីយើង",
            allRightsReserved: "រក្សាសិទ្ធិគ្រប់យ៉ាង។"
        }
    },
    auth: {
        login: {
            title: "សូមស្វាគមន៍ការត្រឡប់មកវិញ",
            subtitle: "សូមបញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីចូលប្រើប្រាស់",
            username: "ឈ្មោះអ្នកប្រើ",
            usernamePlaceholder: "yourname",
            password: "ពាក្យសម្ងាត់",
            passwordPlaceholder: "••••••••",
            signIn: "ចូលគណនី",
            signingIn: "កំពុងចូល...",
            noAccount: "មិនទាន់មានគណនី?",
            signUp: "ចុះឈ្មោះ"
        },
        signup: {
            title: "បង្កើតគណនីថ្មី",
            subtitle: "ចាប់ផ្តើមបង្កើតប្រវត្តិរូបវិជ្ជាជីវៈរបស់អ្នកនៅថ្ងៃនេះ",
            displayName: "ឈ្មោះបង្ហាញ",
            displayNamePlaceholder: "ចាន់ សុខា",
            username: "ឈ្មោះអ្នកប្រើ",
            usernamePlaceholder: "yourname",
            usernameHint: "៣-២០ តួអក្សរ។ អក្សរតូច លេខ និងសញ្ញាគូសក្រោម ហើយត្រូវចាប់ផ្តើមដោយអក្សរ។",
            password: "ពាក្យសម្ងាត់",
            passwordPlaceholder: "••••••••",
            confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់",
            confirmPasswordPlaceholder: "••••••••",
            createAccount: "បង្កើតគណនី",
            creatingAccount: "កំពុងបង្កើតគណនី...",
            haveAccount: "មានគណនីរួចហើយ?",
            signIn: "ចូលគណនី",
            passwordMismatch: "ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ"
        },
        telegram: {
            or: "ឬ",
            continueWith: "បន្តដោយប្រើ Telegram",
            signingIn: "កំពុងចូលដោយប្រើ Telegram...",
            linking: "កំពុងភ្ជាប់គណនី Telegram របស់អ្នក...",
            linked: "បានភ្ជាប់ Telegram",
            notLinked: "មិនទាន់បានភ្ជាប់គណនី Telegram",
            link: "ភ្ជាប់ Telegram",
            unlink: "ផ្តាច់ Telegram",
            unlinking: "កំពុងផ្តាច់...",
            unlinkConfirm: "ផ្តាច់គណនី Telegram របស់អ្នក? អ្នកនឹងអាចចូលបានតែដោយឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ប៉ុណ្ណោះ។"
        },
        validation: {
            usernameRequired: "សូមបញ្ចូលឈ្មោះអ្នកប្រើ។",
            usernameTooShort: "ឈ្មោះអ្នកប្រើត្រូវមានយ៉ាងតិច ៣ តួអក្សរ។",
            usernameTooLong: "ឈ្មោះអ្នកប្រើត្រូវមានមិនលើសពី ២០ តួអក្សរ។",
            usernamePattern: "សូមប្រើអក្សរតូច លេខ និងសញ្ញាគូសក្រោម ដោយចាប់ផ្តើមដោយអក្សរ។",
            usernameReserved: "ឈ្មោះអ្នកប្រើនេះត្រូវបានរក្សាទុក។ សូមជ្រើសរើសមួយផ្សេងទៀត។",
            passwordTooShort: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ។",
            passwordTooLong: "ពាក្យសម្ងាត់ត្រូវមានមិនលើសពី ១២៨ តួអក្សរ។",
            passwordNeedsLetterAndDigit: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិចអក្សរមួយ និងលេខមួយ។",
            passwordSameAsUsername: "ពាក្យសម្ងាត់មិនត្រូវមានឈ្មោះអ្នកប្រើរបស់អ្នកទេ។",
            displayNameTooLong: "ឈ្មោះបង្ហាញត្រូវមានមិនលើសពី ៨០ តួអក្សរ។"
        },
        errors: {
            UNAUTHENTICATED: "សូមចូលគណនីដើម្បីបន្ត។",
            FORBIDDEN: "អ្នកមិនមានសិទ្ធិចូលប្រើផ្នែកនេះទេ។",
            INVALID_CREDENTIALS: "ឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។",
            INVALID_INPUT: "សូមពិនិត្យព័ត៌មានដែលអ្នកបានបញ្ចូល។",
            USERNAME_TAKEN: "ឈ្មោះអ្នកប្រើនេះមានគេប្រើរួចហើយ។",
            RATE_LIMITED: "ព្យាយាមច្រើនដងពេក។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀត។",
            ACCOUNT_DISABLED: "គណនីនេះត្រូវបានផ្អាក។",
            PASSWORD_ALREADY_SET: "គណនីនេះមានពាក្យសម្ងាត់រួចហើយ។",
            TELEGRAM_NOT_CONFIGURED: "ការចូលដោយ Telegram មិនអាចប្រើបានឥឡូវនេះទេ។",
            TELEGRAM_INVALID_SIGNATURE: "យើងមិនអាចផ្ទៀងផ្ទាត់ការចូល Telegram នោះបានទេ។ សូមព្យាយាមម្តងទៀត។",
            TELEGRAM_EXPIRED: "ការចូល Telegram នោះបានផុតកំណត់។ សូមព្យាយាមម្តងទៀត។",
            TELEGRAM_ALREADY_LINKED: "គណនី Telegram នោះត្រូវបានភ្ជាប់ជាមួយអ្នកប្រើផ្សេងរួចហើយ។",
            TELEGRAM_NOT_LINKED: "មិនមានគណនី Telegram ត្រូវបានភ្ជាប់ទេ។",
            LAST_CREDENTIAL: "សូមកំណត់ពាក្យសម្ងាត់មុននឹងផ្តាច់ Telegram បើមិនដូច្នេះទេអ្នកនឹងមិនអាចចូលបានទេ។",
            CROSS_ORIGIN: "សំណើត្រូវបានបិទដោយហេតុផលសុវត្ថិភាព។ សូមផ្ទុកទំព័រឡើងវិញ។",
            NOT_FOUND: "យើងរកមិនឃើញអ្វីដែលអ្នកកំពុងស្វែងរកទេ។",
            INTERNAL_ERROR: "មានបញ្ហាបានកើតឡើង។ សូមព្យាយាមម្តងទៀត។",
            NETWORK: "យើងមិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យការតភ្ជាប់របស់អ្នក។"
        },
        backToHome: "← ត្រឡប់ទៅទំព័រដើម"
    },
    account: {
        title: "គណនី",
        subtitle: "គ្រប់គ្រងវិធីចូលគណនីរបស់អ្នក",
        signedInAs: "បានចូលជា",
        username: "ឈ្មោះអ្នកប្រើ",
        role: "តួនាទី",
        memberSince: "ជាសមាជិកតាំងពី",
        signOut: "ចាកចេញ",
        signOutEverywhere: "ចាកចេញពីគ្រប់ឧបករណ៍",
        telegramSection: "Telegram",
        passwordSection: "ពាក្យសម្ងាត់",
        setPassword: "កំណត់ពាក្យសម្ងាត់",
        changePassword: "ប្តូរពាក្យសម្ងាត់",
        currentPassword: "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
        newPassword: "ពាក្យសម្ងាត់ថ្មី",
        confirmNewPassword: "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី",
        savePassword: "រក្សាទុកពាក្យសម្ងាត់",
        savingPassword: "កំពុងរក្សាទុក...",
        passwordSaved: "បានធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់។ ឧបករណ៍ផ្សេងទៀតត្រូវបានចាកចេញ។",
        noPasswordNotice: "គណនីនេះចូលបានតែដោយ Telegram ប៉ុណ្ណោះ។ កំណត់ពាក្យសម្ងាត់ដើម្បីបន្ថែមវិធីចូលមួយទៀត។",
        backToApp: "← ត្រឡប់ទៅកម្មវិធីបង្កើតប្រវត្តិរូប"
    },
    sync: {
        saved: "បានរក្សាទុក",
        savedAt: "បានរក្សាទុក · {time}",
        saving: "កំពុងរក្សាទុក...",
        offline: "គ្មានអ៊ីនធឺណិត — ការផ្លាស់ប្តូរត្រូវបានរក្សាទុកក្នុងឧបករណ៍នេះ",
        error: "មិនអាចរក្សាទុកបាន",
        conflict: "មានការកែប្រែនៅផ្ទាំងផ្សេង",
        justNow: "ទើបតែឥឡូវ",
        minutesAgo: "{count} នាទីមុន",
        hoursAgo: "{count} ម៉ោងមុន"
    },
    evaluation: {
        title: "ការវាយតម្លៃជាមួយ AI",
        subtitle: "ការវិភាគសមត្ថភាពបេក្ខជន",
        unknownCandidate: "បេក្ខជនមិនស្គាល់អត្តសញ្ញាណ",
        noTitle: "មិនបានបញ្ជាក់មុខតំណែង",
        metricsLegend: "ការពន្យល់ពិន្ទុ",
        legendDesc: "កម្រិតពិន្ទុភាពត្រូវគ្នា",
        scoreRanges: {
            strong: "ខ្លាំងពូកែ",
            good: "ល្អប្រសើរ",
            moderate: "មធ្យម",
            weak: "ខ្សោយ",
            strongDesc: "ត្រូវគ្នាយ៉ាងល្អឥតខ្ចោះជាមួយគ្រប់លក្ខខណ្ឌតម្រូវ",
            goodDesc: "បំពេញបាននូវលក្ខខណ្ឌស្នូលដោយមានចន្លោះប្រហោងបន្តិចបន្តួច",
            moderateDesc: "ត្រូវគ្នាខ្លះ ប៉ុន្តែមានចំណុចខ្វះខាតគួរឱ្យកត់សម្គាល់",
            weakDesc: "មិនសមស្របច្រើនជាមួយតម្រូវការនៃមុខតំណែង"
        },
        provideJdTitle: "ផ្តល់ការពិពណ៌នាការងារ (JD)",
        provideJdDesc: "ចម្លង ឬផ្ទុកឡើងការពិពណ៌នាការងារដើម្បីវាយតម្លៃប្រវត្តិរូបរបស់អ្នកធៀបនឹងតម្រូវការ។ ទិន្នន័យរបស់អ្នកត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។",
        tabPasteText: "ចម្លងអត្ថបទ",
        tabUploadPdf: "ផ្ទុកឡើង PDF ការងារ",
        targetJdLabel: "ការពិពណ៌នាការងារគោលដៅ",
        jdPlaceholder: "បិទភ្ជាប់ខ្លឹមសារពិពណ៌នាការងារពេញលេញនៅទីនេះ — រួមបញ្ចូលជំនាញតម្រូវ លក្ខណៈសម្បត្តិ ការទទួលខុសត្រូវ និងកម្រិតបទពិសោធន៍...",
        charactersCount: "តួអក្សរ",
        minRecommended: "ណែនាំយ៉ាងតិច ៥០ តួអក្សរ",
        uploadJdTitle: "ផ្ទុកឡើងការពិពណ៌នាការងារ (PDF)",
        dropPdfPrompt: "ទម្លាក់ឯកសារ PDF ការងារនៅទីនេះ ឬចុចរុករក",
        pdfConstraint: "គាំទ្រតែ PDF, ទំហំអតិបរមា 10MB",
        evaluatingButton: "កំពុងវាយតម្លៃបេក្ខជន...",
        evaluateButton: "វាយតម្លៃភាពត្រូវគ្នា",
        minCharactersNotice: "សូមបញ្ចូលការពិពណ៌នាការងារយ៉ាងហោចណាស់ ៥០ តួអក្សរដើម្បីវាយតម្លៃ។",
        sessionLoaded: "ការពិពណ៌នាការងារត្រូវបានផ្ទុកឡើងពីវគ្គមុនរបស់អ្នក។",
        clearReset: "សម្អាត និងកំណត់ឡើងវិញ",
        overallScore: "ពិន្ទុភាពត្រូវគ្នាសរុប",
        executiveSummary: "សេចក្តីសង្ខេបប្រតិបត្តិ",
        competencyBreakdown: "ការបែងចែកសមត្ថភាពលម្អិត",
        radarScore: "ពិន្ទុ",
        keyStrengths: "ចំណុចខ្លាំងសំខាន់ៗ",
        gapsToImprove: "ចន្លោះប្រហោង និងចំណុចត្រូវកែលម្អ",
        interviewTalkingPoints: "ចំណុចគន្លឹះសម្រាប់ការសម្ភាសន៍",
        copyQuestions: "ចម្លងសំណួរ",
        copied: "បានចម្លង!",
        evaluationFailed: "ការវាយតម្លៃប្រវត្តិរូបបរាជ័យ។ សូមព្យាយាមម្តងទៀត។",
        evaluatedAt: "បានវាយតម្លៃ {time}",
        reevaluateButton: "វាយតម្លៃឡើងវិញជាមួយ JD ថ្មី",
        verdicts: {
            verified: "បានផ្ទៀងផ្ទាត់",
            limited: "មានកម្រិត",
            missing: "ខ្វះខាត"
        },
        recommendations: {
            highlyRecommended: "ណែនាំយ៉ាងខ្លាំង",
            recommended: "ណែនាំ",
            consider: "គួរពិចារណា",
            notRecommended: "មិនណែនាំទេ"
        },
        history: {
            title: "ការវាយតម្លៃថ្មីៗ",
            loading: "កំពុងផ្ទុកប្រវត្តិ...",
            empty: "មិនទាន់មានការវាយតម្លៃទេ។ លទ្ធផលរបស់អ្នកនឹងត្រូវរក្សាទុកនៅទីនេះ។",
            loadMore: "ផ្ទុកបន្ថែម",
            open: "បើក",
            delete: "លុប",
            deleteConfirm: "លុបការវាយតម្លៃនេះចេញពីប្រវត្តិរបស់អ្នក?",
            fallbackBadge: "ការប៉ាន់ស្មានក្រៅបណ្តាញ",
            failed: "មិនអាចផ្ទុកប្រវត្តិការវាយតម្លៃរបស់អ្នកបានទេ។"
        }
    },
    admin: {
        title: "ការគ្រប់គ្រងប្រព័ន្ធ",
        subtitle: "បញ្ជីម៉ូដែល AI និងការកំណត់តម្លៃកាក់",
        backToApp: "ត្រឡប់ទៅកម្មវិធី",
        loading: "កំពុងដំណើរការ...",
        nav: {
            chatModels: "ម៉ូដែល AI",
            actionCosts: "កំណត់តម្លៃកាក់"
        },
        providers: {
            GOOGLE: "Google",
            OPENAI: "OpenAI"
        },
        actions: {
            PARSE_RESUME: "ញែកប្រវត្តិរូប",
            REFINE_RESUME: "កែលម្អខ្លឹមសារ",
            EVALUATE_RESUME: "វាយតម្លៃប្រវត្តិរូប",
            VOICE_INTERVIEW: "សម្ភាសន៍ដោយសំឡេង"
        },
        chatModels: {
            title: "ម៉ូដែល AI",
            description: "ម៉ូដែលដែលបង្ហាញក្នុងបញ្ជីជ្រើសរើស AI។ ការបិទម៉ូដែលណាមួយនឹងដកវាចេញពីបញ្ជីអ្នកប្រើទាំងអស់ក្នុងរយៈពេលមួយនាទី។",
            addModel: "បន្ថែមម៉ូដែល",
            empty: "មិនទាន់មានម៉ូដែល AI ត្រូវបានកំណត់ទេ។",
            confirmDelete: "លុបម៉ូដែលនេះមែនទេ? តម្លៃកាក់ជាក់លាក់របស់វានឹងត្រូវលុបជាមួយផង។",
            makeDefault: "កំណត់ជាលំនាំដើម",
            defaultBadge: "លំនាំដើម",
            columns: {
                displayName: "ឈ្មោះ",
                provider: "អ្នកផ្តល់សេវា",
                modelId: "លេខសម្គាល់ម៉ូដែល",
                sortOrder: "លំដាប់",
                active: "ដំណើរការ",
                default: "លំនាំដើម",
                actions: ""
            }
        },
        actionCosts: {
            title: "កំណត់តម្លៃកាក់",
            description: "ចំនួនកាក់ដែលកាត់ក្នុងមួយសកម្មភាព AI។ ប្រអប់ទទេនឹងប្រើតម្លៃពីជួរឈរលំនាំដើម។",
            action: "សកម្មភាព",
            defaultColumn: "លំនាំដើម",
            inherited: "ប្រើតម្លៃលំនាំដើម",
            clearOverride: "លុបតម្លៃជាក់លាក់",
            noModels: "សូមបន្ថែមម៉ូដែលដែលកំពុងដំណើរការ ដើម្បីកំណត់តម្លៃជាក់លាក់តាមម៉ូដែល។"
        },
        form: {
            provider: "អ្នកផ្តល់សេវា",
            modelId: "លេខសម្គាល់ម៉ូដែល",
            displayName: "ឈ្មោះបង្ហាញ",
            sortOrder: "លំដាប់តម្រៀប",
            active: "ដំណើរការ",
            default: "លំនាំដើម",
            save: "រក្សាទុក",
            cancel: "បោះបង់",
            edit: "កែសម្រួល",
            delete: "លុប"
        },
        errors: {
            loadFailed: "មិនអាចទាញយកការកំណត់បានទេ។",
            saveFailed: "មិនអាចរក្សាទុកការផ្លាស់ប្តូរបានទេ។"
        },
        validation: {
            modelIdRequired: "ត្រូវការលេខសម្គាល់ម៉ូដែល",
            modelIdPattern: "ប្រើបានតែអក្សរ លេខ សញ្ញាចុច ដាច់ សញ្ញាចុចពីរ និងសញ្ញាគូសក្រោម",
            displayNameRequired: "ត្រូវការឈ្មោះបង្ហាញ",
            defaultMustBeActive: "ម៉ូដែលលំនាំដើមត្រូវតែនៅដំណើរការ",
            coinCostInvalid: "សូមបញ្ចូលចំនួនកាក់ជាចំនួនគត់ ស្មើ ឬធំជាងសូន្យ"
        }
    },
    coins: {
        unit: "កាក់",
        badgeTooltip: "កាក់ និងការទូទាត់",
        insufficient: "កាក់របស់អ្នកមិនគ្រប់គ្រាន់សម្រាប់សកម្មភាពនេះទេ។ សូមបញ្ចូលកាក់បន្ថែម។",
        signInRequired: "សូមចូលគណនីម្តងទៀតដើម្បីបន្ត។"
    },
    billing: {
        title: "ទិញកាក់",
        subtitle: "កាក់ត្រូវប្រើសម្រាប់ការញែក ការកែសម្រួល និងការវាយតម្លៃដោយ AI។",
        closeLabel: "បិទ",
        pageTitle: "ការទូទាត់",
        pageSubtitle: "សមតុល្យកាក់ ការទិញ និងការប្រើប្រាស់របស់អ្នក។",
        currentBalance: "សមតុល្យបច្ចុប្បន្ន",
        coinsLabel: "កាក់",
        topUp: "ទិញកាក់",
        bonus: "+{count} ប្រាក់រង្វាន់",
        requiredNotice: "សកម្មភាពនេះត្រូវការកាក់ចំនួន {count}។",
        noPackages: "មិនមានកញ្ចប់កាក់សម្រាប់ពេលនេះទេ។",
        scanToPay: "ស្កេនដោយកម្មវិធីធនាគារកម្ពុជាណាមួយ",
        forCoins: "សម្រាប់កាក់ចំនួន {count}",
        waitingForPayment: "កំពុងរង់ចាំការទូទាត់",
        reference: "លេខយោង",
        openInBankApp: "បើកក្នុងកម្មវិធីធនាគារ",
        openCheckout: "បើកទំព័រទូទាត់",
        cancelOrder: "បោះបង់",
        simulatePayment: "សាកល្បងការទូទាត់",
        successTitle: "បានទទួលការទូទាត់",
        successBody: "កាក់ចំនួន {count} ត្រូវបានបញ្ចូលទៅក្នុងសមតុល្យរបស់អ្នក។",
        done: "រួចរាល់",
        errorTitle: "មានបញ្ហាកើតឡើង",
        tryAgain: "ព្យាយាមម្តងទៀត",
        ordersTitle: "ការបញ្ជាទិញថ្មីៗ",
        noOrders: "អ្នកមិនទាន់បានទិញកាក់នៅឡើយទេ។",
        historyTitle: "ប្រវត្តិកាក់",
        noTransactions: "មិនទាន់មានសកម្មភាពកាក់នៅឡើយទេ។",
        balanceAfter: "សមតុល្យ",
        loadMore: "មើលបន្ថែម",
        loadingMore: "កំពុងដំណើរការ...",
        orderStatus: {
            PENDING: "កំពុងរង់ចាំ",
            PAID: "បានទូទាត់",
            FAILED: "បរាជ័យ",
            EXPIRED: "ផុតកំណត់",
            CANCELED: "បានបោះបង់"
        },
        transactionType: {
            PURCHASE: "ការទិញ",
            DEDUCTION: "ការប្រើប្រាស់",
            REFUND: "ការសងប្រាក់វិញ",
            ADMIN_ADJUSTMENT: "ការកែតម្រូវ"
        },
        action: {
            PARSE_RESUME: "ការញែកប្រវត្តិរូប",
            REFINE_RESUME: "ការកែសម្រួលដោយ AI",
            EVALUATE_RESUME: "ការវាយតម្លៃដោយ AI",
            VOICE_INTERVIEW: "សម្ភាសន៍ដោយសំឡេង"
        },
        errors: {
            loadFailed: "មិនអាចផ្ទុកព័ត៌មានទូទាត់បានទេ។ សូមព្យាយាមម្តងទៀត។",
            createFailed: "មិនអាចចាប់ផ្តើមការទូទាត់បានទេ។ សូមព្យាយាមម្តងទៀត។",
            noProvider: "មិនមានវិធីទូទាត់សម្រាប់ពេលនេះទេ។",
            orderStatus: {
                PENDING: "ការបញ្ជាទិញនេះកំពុងរង់ចាំ។",
                PAID: "ការបញ្ជាទិញនេះត្រូវបានទូទាត់រួចហើយ។",
                FAILED: "ការទូទាត់បានបរាជ័យ។ មិនមានការកាត់កាក់ទេ។",
                EXPIRED: "សំណើទូទាត់នេះបានផុតកំណត់។ សូមបង្កើតថ្មី។",
                CANCELED: "សំណើទូទាត់នេះត្រូវបានបោះបង់។"
            }
        }
    },
    sidebar: {
        myResumes: "ប្រវត្តិរូបរបស់ខ្ញុំ",
        resumeBuilder: "បង្កើតប្រវត្តិរូប",
        aiEvaluation: "វាយតម្លៃជាមួយ AI",
        settings: "ការកំណត់",
        admin: "ការគ្រប់គ្រងប្រព័ន្ធ",
        account: "គណនី",
        signOut: "ចាកចេញ",
        backToHome: "ត្រឡប់ទៅទំព័រដើម",
        language: "ភាសា"
    },
    resumeList: {
        title: "ប្រវត្តិរូបរបស់ខ្ញុំ",
        newResume: "ប្រវត្តិរូបថ្មី",
        loading: "កំពុងផ្ទុកប្រវត្តិរូបរបស់អ្នក...",
        loadFailed: "មិនអាចផ្ទុកប្រវត្តិរូបរបស់អ្នកបានទេ។ សូមផ្ទុកទំព័រឡើងវិញ។",
        emptyTitle: "មិនទាន់មានប្រវត្តិរូបនៅឡើយទេ",
        emptyDesc: "បង្កើតប្រវត្តិរូបដំបូងរបស់អ្នកដើម្បីចាប់ផ្តើម។",
        updated: "កែប្រែចុងក្រោយ",
        open: "បើកក្នុងកម្មវិធីបង្កើត",
        previewUnavailable: "មិនអាចមើលឧទាហរណ៍បានទេ",
        rename: "ប្តូរឈ្មោះ",
        duplicate: "ថតចម្លង",
        setDefault: "កំណត់ជាលំនាំដើម",
        defaultBadge: "លំនាំដើម",
        delete: "លុប",
        renamePrompt: "ប្តូរឈ្មោះប្រវត្តិរូប",
        deleteConfirm: "លុបប្រវត្តិរូបនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
    },
    language: {
        en: "English",
        km: "ភាសាខ្មែរ"
    }
};

export default km;
