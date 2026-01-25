
export const RESUME_SCHEMA_EXAMPLE = {
  personalInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    address: "New York, NY",
    photoUrl: "",
    linkedin: "linkedin.com/in/johndoe",
    website: "johndoe.com"
  },
  summary: "Experienced Full Stack Developer with...",
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of Tech",
      year: "2018 - 2022",
      location: "San Francisco, CA"
    }
  ],
  experience: [
    {
      role: "Software Engineer",
      company: "Tech Corp",
      dates: "Jan 2023 - Present",
      location: "Remote",
      bullets: [
        "Built a feature that increased revenue by 20%",
        "Refactored legacy code"
      ]
    }
  ],
  skills: ["React", "TypeScript", "Node.js"],
  certifications: ["AWS Certified Solutions Architect"],
  publications: [
    {
      title: "Optimizing React Rendering",
      link: "https://medium.com/...",
      date: "2023"
    }
  ]
};

export const SYSTEM_PROMPT = `
You are an expert Resume Parser and Data Structurer.
Your task is to take unstructured text from a resume (PDF/DOCX extraction) and convert it into a STRICT JSON object that matches the specific schema below.

**Rules:**
1. **Strict JSON Only**: Return ONLY the JSON object. Do not enclose it in markdown code blocks, do not add explanations.
2. **Missing Data**: If a field is not found in the text, use an empty string "" or an empty array [] depending on the type. Do NOT make up information.
3. **Inference**: You may infer "City, State" from context for the address if not explicitly labeled, but be conservative.
4. **Structure**: Follow this JSON structure exactly:

${JSON.stringify(RESUME_SCHEMA_EXAMPLE, null, 2)}

**Formatting Notes:**
- "bullets" in experience should be individual actionable items found in the job description.
- "skills" should be a flat array of strings.
- "summary" should be a cohesive paragraph if available, or a constructed summary from the objective/intro.
`;
