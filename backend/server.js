import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";  // ✅ Import required module

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Fix for __dirname issue
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Serve static files from the React app
app.use(express.static(path.join(__dirname, '../vite-project/dist')));

// Function to fetch a single quiz question
const fetchSingleQuestion = async () => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Generate a unique multiple-choice coding quiz question in JavaScript, React, or Flutter with easy to moderate difficulty. The question should have 4 options and the correct answer in JSON format. The JSON structure should be: {\"question\": \"Question text\", \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"], \"answer\": \"Correct option\"}."
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      topK: 40
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log("Raw Response from API:", data);

  if (!data || !data.candidates || data.candidates.length === 0) {
    throw new Error("Invalid API response from Gemini");
  }

  let generatedText = data.candidates[0]?.content?.parts?.[0]?.text || "";
  console.log("Generated Text:", generatedText);

  if (!generatedText) {
    throw new Error("No generated content received");
  }

  generatedText = generatedText.replace(/```json|```/g, "").trim();

  let questionData;
  try {
    questionData = JSON.parse(generatedText);
  } catch (parseError) {
    console.error("Error parsing Gemini API response:", parseError);
    return null;
  }

  return questionData;
};

// Endpoint to generate 5 quiz questions
app.post("/generate-quiz", async (req, res) => {
  try {
    const questions = [];

    for (let i = 0; i < 5; i++) {
      const question = await fetchSingleQuestion();
      if (question) {
        questions.push(question);
      } else {
        return res.status(500).json({ error: "Failed to fetch question" });
      }
    }

    res.json(questions);
  } catch (error) {
    console.error("Error fetching Gemini API:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// ✅ The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../vite-project/dist/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
