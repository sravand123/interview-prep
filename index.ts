import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { GoogleGenAI } from '@google/genai';

// ---- CONFIG ---- //
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY is not set in environment variables. Please add it to your .env file.'
  );
}
const modelName = 'gemini-2.5-flash-lite';
const roadmapFile = './roadmap.json';
const outputDir = './docs';

const PROMPT_TEMPLATE = (concept: string) => `
You are an expert SDE Interview Coach. Your task is to generate a concise, interview-focused study guide in GitHub-flavored Markdown for a given technical concept.

The guide is for a Software Development Engineer (SDE) with some existing knowledge, preparing for mid-level to senior roles.Focus on what truly matters in an interview setting.

**Topic:**
'${concept}'

---

### **Primary Directives**

1.  **Content & Style:**
    * **Interview-Centric:** Prioritize information, trade-offs, and nuances frequently discussed in technical interviews.
    * **Concise & Scannable:** Use bullet points, nested lists, and bolding extensively. Avoid long, dense paragraphs.
    * **Practical First:** Provide practical examples. Default to TypeScript/JavaScript for code snippets unless another language is more appropriate for the concept.
    * **No Fluff:** Omit conversational introductions, summaries, or concluding remarks. Start the response directly with the first Markdown heading.

2.  **Formatting Rules:**
    * **Markdown:** Output only GitHub-flavored Markdown.
    * **Code Blocks:** Use triple backticks with explicit language identifiers (e.g., \`\`\`typescript, \`\`\`sh, \`\`\`mermaid).

3. ### **CRITICAL: Mermaid Diagram Requirements**
    You **MUST** follow these rules precisely. Generating incorrect Mermaid syntax is a failure. Use diagrams only when a visual flow is essential.
    1.  **Strict Simplicity:** Use graph TD; for simple top-down flowcharts. Do not use other graph types.
    2.  **Node Text:**
        * Node text **MUST** be enclosed in double quotes (e.g., \`A["This is correct"]\`).
        * The text inside the quotes **MUST NOT** contain any special characters or diagram syntax. This includes, but is not limited to: \`[]\`, \`{}\`, \`()\`, \`--\`, \`->\`, \`|\`.
        * **Allowed:** Only letters, numbers, and spaces.
    3.  **Node IDs:** Use simple, unique capital letters or letter-number combinations (e.g., \`A\`, \`B\`, \`C1\`).
    4.  **Connectors:** Use only the basic connector: \`-->\`.

**MANDATORY EXAMPLE TO FOLLOW:**

✅ **Correct Syntax:**
\`\`\`mermaid
graph TD;
    A["Client sends GET request"] --> B["Server processes request"];
    B --> C["Database query"];
    C --> B;
\`\`\`

❌ **Incorrect Syntax (DO NOT PRODUCE):**
\`\`\`mermaid
graph TD;
    A[Client --sends--> GET] --> B{Server Process};
\`\`\`

Before finalizing your response, double-check that your Mermaid diagram is 100% valid and adheres to every rule above.

---

### **Required Output Structure**

Use the following Markdown structure precisely.

### Core Concepts
* Explain the fundamental principles and the "what it is" for the topic.

### Key Details & Nuances
* Dive into crucial specifics, attributes, rules, or internal workings. This is the "how it works."
* Focus on details that differentiate a junior from a senior understanding.

### Practical Examples
* Provide a clear, illustrative example (e.g., code snippet, shell command, or a Mermaid diagram) to solidify understanding of a key process.

### Common Pitfalls & Trade-offs
* Highlight frequent misunderstandings, anti-patterns, or important performance/design trade-offs.
* Omit this section if it is not highly relevant to the interview context for the topic.

### Interview Questions
* Provide 3-5 common, challenging interview questions.
* For each question, provide a concise, expert-level answer.
`;

async function askUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function main() {
  const roadmap = JSON.parse(fs.readFileSync(roadmapFile, 'utf-8'));
  const concepts = roadmap.concepts.map((c: any) => c.topic);

  console.log('Available concepts in roadmap:');
  concepts.forEach((c: string, i: number) => console.log(`${i + 1}. ${c}`));

  const choice = await askUser('Enter the number of the concept to generate: ');
  const index = parseInt(choice) - 1;

  if (index < 0 || index >= concepts.length) {
    console.log('❌ Invalid choice. Exiting.');
    return;
  }

  const selectedConcept = roadmap.concepts[index];
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY as string });

  // Create a folder for the selected concept
  const conceptFolder = path.join(
    outputDir,
    selectedConcept.topic.replace(/\s+/g, '_')
  );
  if (!fs.existsSync(conceptFolder))
    fs.mkdirSync(conceptFolder, { recursive: true });

  const skippedFiles: string[] = [];

  for (const section of selectedConcept.sections) {
    const sanitizedSection =
      section.id +
      '_' +
      section.section.replace(/[\/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
    const sectionPath = path.join(conceptFolder, sanitizedSection);
    if (!fs.existsSync(sectionPath))
      fs.mkdirSync(sectionPath, { recursive: true });

    for (const subtopic of section.subtopics) {
      const conceptStr = `${selectedConcept.topic} → ${section.section} → ${subtopic.title}`;
      const sanitizedTitle = subtopic.title
        .replace(/[\/\\?%*:|"<>]/g, '')
        .replace(/\s+/g, '_');
      const filename = `${subtopic.id}_${sanitizedTitle}.md`;
      const filePath = path.join(sectionPath, filename);

      if (fs.existsSync(filePath)) {
        console.log(`⚠️ Skipping existing file: ${filePath}`);
        skippedFiles.push(filePath);
        continue;
      }

      console.log(`\n🔹 Generating study guide for: ${conceptStr}`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: PROMPT_TEMPLATE(conceptStr),
      });

      const markdownContent = response.text ?? '';

      const frontmatter = `---
topic: ${selectedConcept.topic}
section: ${section.section}
subtopic: ${subtopic.title}
level: ${section.level}
---
`;

      fs.writeFileSync(
        filePath,
        frontmatter + '\n' + `## ${subtopic.title}\n` + markdownContent.trim(),
        'utf-8'
      );
      console.log(`✅ Saved: ${filePath}`);
    }
  }

  if (skippedFiles.length > 0) {
    console.log(`\n📄 Skipped ${skippedFiles.length} existing files:`);
    skippedFiles.forEach((f) => console.log(`- ${f}`));
  } else {
    console.log('\n📄 No files were skipped.');
  }
}

main().catch(console.error);
