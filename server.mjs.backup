
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

const allowedStyles = [
  "Modern",
  "Traditional Indian",
  "Minimalist",
  "Luxury"
];

const allowedFloors = Array.from(
  { length: 10 },
  (_, i) => i + 1
);

app.post("/api/design", async (req, res) => {
  try {
    const prompt = req.body?.prompt;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Please enter a design prompt."
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        error: "Keep your prompt under 1000 characters."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    const model =
      process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are AIArchitect's design assistant.
Return only valid JSON with this structure:
{
  "message": "brief reply",
  "changes": {
    "style": null,
    "floors": null,
    "balcony": null,
    "exteriorColor": null,
    "woodPanels": null,
    "largeWindows": null
  }
}

Allowed styles: ${allowedStyles.join(", ")}.
Floors: integer from 1 to 10.
Boolean fields: balcony, woodPanels, largeWindows.
Color: six-digit hex code.
Use null for any field the user has not requested to change.
When the user explicitly requests a floor count, return that exact count if it is between 1 and 10.
Never return executable code.`
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: prompt.trim() }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      }
    );

    // Read the response body only once.
    const responseBody = await response.text();
    let data;

    try {
      data = JSON.parse(responseBody);
    } catch {
      console.error("Gemini returned a non-JSON response.");
      return res.status(502).json({
        error: "Gemini returned an invalid response."
      });
    }

    if (!response.ok) {
      console.error("Gemini HTTP status:", response.status);
      console.error("Gemini details:", data.error?.message || "Unknown API error");

      return res.status(502).json({
        error: data.error?.message || "Gemini API request failed."
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    if (!text) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    const result = JSON.parse(text);
    const c = result.changes || {};
    const changes = {};

    if (allowedStyles.includes(c.style)) {
      changes.style = c.style;
    }

    if (
      Number.isInteger(c.floors) &&
      allowedFloors.includes(c.floors)
    ) {
      changes.floors = c.floors;
    }

    for (const key of [
      "balcony",
      "woodPanels",
      "largeWindows"
    ]) {
      if (typeof c[key] === "boolean") {
        changes[key] = c[key];
      }
    }

    if (
      typeof c.exteriorColor === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(c.exteriorColor)
    ) {
      changes.exteriorColor = c.exteriorColor;
    }

    return res.json({
      message: String(result.message || "Design response ready."),
      changes
    });

  } catch (error) {
    console.error("AIArchitect backend error:", error.message);

    return res.status(500).json({
      error: "The backend could not complete the design request."
    });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(
    `AIArchitect backend running on port ${process.env.PORT || 3001}`
  );
});
