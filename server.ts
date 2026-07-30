import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MAMUTHUB Management Panel", version: "2.4.0-prod" });
});

// AI Diagnostic / Assistant Endpoint
app.post("/api/ai/diagnose", async (req, res) => {
  try {
    const { prompt, systemContext } = req.body;
    const client = getGeminiClient();

    if (!client) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing or not configured.",
        reply: "Sistem AI API anahtarı henüz yapılandırılmadı. Lütfen Ayarlar -> Secrets menüsünden GEMINI_API_KEY ekleyin."
      });
    }

    const fullPrompt = `Sen MAMUTHUB Yönetim Paneli'nin kıdemli AI Sistem Mühendisi ve Siber Güvenlik Analistisin (MAMUT-AI). 
Aşağıdaki sistem durumu ve kullanıcı sorusunu analiz ederek Türkçe, net, profesyonel, maddeler halinde ve teknik öneriler sunan bir yanıt oluştur.

SİSTEM BAĞLAMI:
${JSON.stringify(systemContext || {}, null, 2)}

KULLANICI SORUSU / TALEP:
${prompt}
`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    return res.json({ reply: response.text || "Yapay zeka yanıt üretemedi." });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "AI Diagnose Error" });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MAMUTHUB Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
