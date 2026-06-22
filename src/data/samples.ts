export const sampleMinimal = {
  name: "Thiago Gazaroli",
  basicInfo: {
    title: "Senior Software Engineer",
    location: "Sao Paulo, BR",
    email: "thiago@email.com",
    phone: "+55 11 99999-0000",
    links: [
      { label: "LinkedIn", url: "https://linkedin.com/in/thiago" },
      { label: "GitHub", url: "https://github.com/thiago" },
    ],
  },
  experience: [
    {
      role: "Senior Software Engineer",
      company: "Acme Labs",
      location: "Remote",
      startDate: "2022",
      endDate: "Present",
      responsibilities: [
        "Lead CV data mapping and template inventory.",
        "Coordinate schema updates with the UI flow.",
      ],
      keyResults: [
        "Reduced manual formatting time by 60%.",
        "Improved DOCX consistency across templates.",
      ],
      skills: ["DOCX templating", "JSON schema", "React"],
      highlights: [
        "Led a small team to deliver a CV generator MVP in 6 weeks.",
        "Improved template rendering fidelity by tightening placeholder rules.",
      ],
    },
  ],
  education: [
    {
      degree: "BSc Computer Science",
      school: "USP",
      location: "Sao Paulo, BR",
      startDate: "2014",
      endDate: "2018",
    },
  ],
};

export const sampleFull = {
  name: "Thiago Gazaroli",
  basicInfo: {
    title: "Senior Software Engineer",
    location: "Sao Paulo, BR",
    email: "thiago@email.com",
    phone: "+55 11 99999-0000",
    links: [
      { label: "LinkedIn", url: "https://linkedin.com/in/thiago" },
      { label: "GitHub", url: "https://github.com/thiago" },
      { label: "Portfolio", url: "https://thiago.dev" },
    ],
  },
  summary:
    "Product-focused engineer with experience in web platforms, document generation, and UX-first tooling.",
  experience: [
    {
      role: "Senior Software Engineer",
      company: "Acme Labs",
      location: "Remote",
      startDate: "2022",
      endDate: "Present",
      summary: "Owns the CV generation experience from schema to DOCX export.",
      responsibilities: [
        "Define the CV schema and data mapping rules.",
        "Maintain template fidelity across PT and EN versions.",
      ],
      keyResults: [
        "Shipped a DOCX workflow in 6 weeks.",
        "Lowered template rework by 40%.",
      ],
      skills: ["DOCX templating", "TypeScript", "React"],
      highlights: [
        "Built a schema-driven template pipeline for multi-language CVs.",
        "Reduced manual formatting time with automated validation and previews.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Blue Horizon",
      location: "Sao Paulo, BR",
      startDate: "2019",
      endDate: "2022",
      summary: "Shipped internal tools used by recruiting and HR teams.",
      responsibilities: [
        "Developed internal tooling for recruiter workflows.",
        "Collaborated on structured data standards for CVs.",
      ],
      keyResults: [
        "Reduced manual data entry by 30%.",
        "Improved CV consistency across teams.",
      ],
      skills: ["React", "Node.js", "UX delivery"],
      highlights: [
        "Delivered React apps focused on speed and clarity for non-technical users.",
        "Standardized JSON outputs to improve CV consistency.",
      ],
    },
  ],
  education: [
    {
      degree: "BSc Computer Science",
      school: "USP",
      location: "Sao Paulo, BR",
      startDate: "2014",
      endDate: "2018",
      details: "Focus on software engineering and data structures.",
    },
  ],
  languages: [
    { name: "Portuguese", level: "Native" },
    { name: "English", level: "Fluent" },
  ],
  certifications: [
    { name: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
  ],
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "Document generation",
    "Design systems",
  ],
};
