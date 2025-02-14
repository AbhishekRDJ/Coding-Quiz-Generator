import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = 'AIzaSyAJGIJk9kP9wOwuQgJPwYIICzblqv2GXmA'; // Use .env for security

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
      temperature: 0.8, // Increase randomness (0.7–1.0 is best for variety)
      topK: 40 // Higher values increase diversity
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

  // 🛠 Remove Markdown formatting (if present)
  generatedText = generatedText.replace(/```json|```/g, "").trim();

  // 🛠 Handle JSON safely
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

    // Fetch 5 questions
    for (let i = 0; i < 5; i++) {
      const question = await fetchSingleQuestion();
      if (question) {
        questions.push(question);
      } else {
        // If fetching a question fails, return an error
        return res.status(500).json({ error: "Failed to fetch question" });
      }
    }

    // Return all 5 questions
    res.json(questions);
  } catch (error) {
    console.error("Error fetching Gemini API:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
