# Interview Prep - AI-Powered Study Guide Generator

An intelligent CLI tool that uses Google Gemini AI to generate highly focused, interview-ready study guides based on your custom learning roadmap.

## Features

- 🤖 AI-powered, interview-centric study guide generation using Google Gemini
- 📚 Structured learning with topics, sections, and subtopics (from your roadmap)
- 📝 Markdown output with strict, standardized structure and YAML frontmatter
- 🔄 Skips existing files and logs them to avoid overwriting
- 🗂️ Content is organized in a hierarchical folder structure under `docs/`
- 🧑‍💻 Interactive CLI: select which concept to generate
- 🎯 Strict formatting: concise, scannable, and practical (no fluff)
- 🖼️ Mermaid diagrams with enforced syntax rules (see below)

## Prerequisites

- Node.js 18.0.0 or higher
- Google Gemini API key

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**

   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey) and create an API key.
   - Add it to your `.env` file as:
     ```bash
     GEMINI_API_KEY=your_google_gemini_api_key_here
     ```

3. **Create your roadmap:**
   - Create a `roadmap.json` file with your learning structure. Example:
     ```json
     {
       "concepts": [
         {
           "topic": "Data Structures",
           "sections": [
             {
               "id": "1",
               "section": "Arrays",
               "level": "Beginner",
               "subtopics": [
                 { "id": "1", "title": "Array Basics" },
                 { "id": "2", "title": "Array Operations" }
               ]
             }
           ]
         }
       ]
     }
     ```

## Usage

Run the CLI:

```bash
node index.ts
```

1. The CLI will display all available concepts from your roadmap.
2. Enter the number of the concept you want to generate.
3. The tool will generate study guides for all sections and subtopics under that concept, skipping any files that already exist.

## Project Structure

```
interview-prep/
├── index.ts          # Main application logic
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── .gitignore        # Git ignore rules
├── roadmap.json      # Your learning roadmap (create this)
├── docs/             # Generated study guides (auto-created)
└── dist/             # Compiled JavaScript (auto-created)
```

## How It Works

1. The CLI reads your `roadmap.json` file.
2. You select a concept interactively.
3. For each section and subtopic, the tool generates a study guide using Gemini AI.
4. Study guides are saved as Markdown files in `docs/`, with sanitized filenames and IDs.
5. Each file includes YAML frontmatter: topic, section, subtopic, and level.
6. Existing files are skipped and logged.
7. Content is organized in a hierarchical folder structure: `docs/<topic>/<section>/<subtopic>.md`

## Output Format & Prompt Rules

- **Strict Interview Focus:** Content is concise, scannable, and practical. No introductions or summaries.
- **Markdown Only:** Output is GitHub-flavored Markdown.
- **Section Structure:**
  - Core Concepts
  - Key Details & Nuances
  - Practical Examples (code, shell, or Mermaid diagram)
  - Common Pitfalls & Trade-offs (if relevant)
  - Interview Questions (with expert answers)
- **Mermaid Diagrams:**
  - Only `graph TD;` (top-down flowcharts)
  - Node text in double quotes, only letters/numbers/spaces
  - Node IDs are simple (A, B, C1, etc.)
  - Only `-->` connectors
  - No special characters or syntax in node text

## Customization

- Edit the prompt template in `index.ts` to change output style or structure
- Adjust file/folder naming logic as needed
- Customize the YAML frontmatter for your workflow

## License

ISC
