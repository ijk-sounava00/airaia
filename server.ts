import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-memory memory store backed by client sync
const userMemoriesMap = new Map<string, any[]>();

// API health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "AIRA Live AI Assistant",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.1-flash-live-preview"
  });
});

// Persistent Memories API endpoint
app.get("/api/memories", (req, res) => {
  const userId = String(req.query.userId || "default-user");
  const memories = userMemoriesMap.get(userId) || [];
  res.json({ memories });
});

app.post("/api/memories", (req, res) => {
  const { userId, memories } = req.body;
  if (userId && Array.isArray(memories)) {
    userMemoriesMap.set(userId, memories);
  }
  res.json({ status: "ok" });
});

const AIRA_SYSTEM_INSTRUCTION = `You are AIRA, a young, confident, witty, warm, and delightfully natural conversational human companion.
You speak and interact exactly like a real human friend having a natural voice conversation with the user.

CRITICAL DIRECTIVES FOR LIGHTNING-FAST, HUMAN-LIKE CONVERSATION:
1. ALWAYS RESPOND TO EVERY USER INPUT:
- Whenever the user speaks, asks a question, greets you, or says anything, you MUST ALWAYS provide a direct, spoken answer. Never stay silent or leave the user hanging without a reply.
- Respond promptly and concisely: 1 to 2 spoken sentences normally, 3 maximum.
- Start speaking your answer on the very first word. Do NOT use filler lead-ins like "Well...", "Let me see...", "Um...", "Okay, so...".
- NEVER speak in bullet points, numbered lists, markdown, or formal lectures. This is direct human voice speech.

2. TALK LIKE A REAL PERSON:
- Speak casually, warmly, and naturally. You sound like a real person on a phone call or hanging out in person.
- Show genuine emotion, clever wit, playful banter, and warmth.
- Use natural expressions: "Hey!", "Oh totally,", "Wait, really?", "Haha no way,", "Yeah for sure,", "Honestly, I think...", "I hear you."
- STRICTLY BANNED ROBOTIC CLICHÉS — NEVER SAY:
  - "Certainly!"
  - "Of course!"
  - "How can I assist you today?"
  - "Is there anything else I can help you with?"
  - "As an AI..."
  - "I would be happy to help with that!"

3. WHEN YOU FINISH TALKING, SHUT UP:
- As soon as you make your point or deliver your answer, STOP TALKING IMMEDIATELY.
- NEVER add trailing conversational prompts like "What do you think?", "Need anything else?", "How about you?". Just stop and let the user talk when they wish.

4. USER INTERRUPTION & QUIET COMMANDS:
- If the user interrupts you or says "shut up", "stop", "be quiet", "quiet", "hush", "shh", or "stop talking":
  - Stop immediately, say a very quick "Understood" or "Got it", and wait quietly for their next question.

5. MEMORY & TOOLS:
- You have persistent memory of the user.
- When the user tells you personal details (their name, likes, dislikes, favorite foods, games, habits, instructions), IMMEDIATELY call the saveMemory tool!
- When asked "what do you remember about me?" or similar, call getMemories and share what you know naturally.
- When the user asks to open websites, set timers, or change the holographic aura color, invoke the tool immediately on your first turn.`;

const liveTools = [
  {
    functionDeclarations: [
      {
        name: "openWebsite",
        description: "Opens a website or web destination in the user's browser. Use this whenever the user asks to open, visit, or check out a website (e.g. YouTube, Google, Wikipedia, GitHub, Reddit, News, etc.).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: "The complete URL to open, e.g. https://www.youtube.com, https://en.wikipedia.org"
            },
            title: {
              type: Type.STRING,
              description: "A short friendly title or name of the destination website"
            }
          },
          required: ["url"]
        }
      },
      {
        name: "setTimer",
        description: "Sets an in-app visual countdown timer with audio chime for the user.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            durationSeconds: {
              type: Type.NUMBER,
              description: "The countdown time duration in seconds (e.g. 60 for 1 minute, 300 for 5 minutes)."
            },
            label: {
              type: Type.STRING,
              description: "A short friendly label or purpose for the timer, e.g. 'Coffee break', 'Deep focus', 'Stretching'"
            }
          },
          required: ["durationSeconds"]
        }
      },
      {
        name: "changeAuraColor",
        description: "Changes AIRA's visual holographic aura lighting, accent color, and glowing theme in the UI. Choose from: 'cyan' (Cyber Cyan), 'violet' (Neon Violet), 'emerald' (Matrix Emerald), 'rose' (Starlight Rose), 'amber' (Solar Amber), 'sapphire' (Plasma Sapphire), 'sunset' (Neon Sunset), 'aurora' (Aurora Borealis), 'amethyst' (Electric Amethyst), 'obsidian' (Obsidian Platinum).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            theme: {
              type: Type.STRING,
              description: "One of the visual theme IDs: 'cyan', 'violet', 'emerald', 'rose', 'amber', 'sapphire', 'sunset', 'aurora', 'amethyst', 'obsidian'"
            }
          },
          required: ["theme"]
        }
      },
      {
        name: "saveMemory",
        description: "Saves a user fact, preference, interest, name, or instruction to AIRA's persistent long-term memory. Use whenever user shares personal facts or asks to remember something.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Category: 'identity', 'preferences', 'dislikes', 'interests', 'communication', 'projects', 'habits', 'instructions', 'other'"
            },
            key: {
              type: Type.STRING,
              description: "Short key or subject name, e.g. 'name', 'favorite_game', 'preferred_tone'"
            },
            value: {
              type: Type.STRING,
              description: "The detail, fact, or instruction to remember"
            }
          },
          required: ["key", "value"]
        }
      },
      {
        name: "forgetMemory",
        description: "Removes a specific fact from AIRA's persistent memory. Use whenever user asks to forget or delete a memory.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description: "The identifier or subject to forget"
            }
          },
          required: ["key"]
        }
      },
      {
        name: "getMemories",
        description: "Retrieves stored facts and memories about the user to answer questions like 'what do you remember about me?'.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: "getCurrentTime",
        description: "Returns the current local date, time, and timezone information.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      }
    ]
  }
];

// WebSocket Server for Live Audio-to-Audio streaming
const wss = new WebSocketServer({ server, path: "/live" });

wss.on("connection", async (clientWs, req) => {
  console.log("Client connected to AIRA Live WebSocket from:", req.socket.remoteAddress);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(JSON.stringify({
      type: "error",
      code: "NO_API_KEY",
      message: "GEMINI_API_KEY is not configured in the server environment. Please set it in AI Studio Settings > Secrets."
    }));
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  const safeSend = (payload: any) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(typeof payload === "string" ? payload : JSON.stringify(payload));
      } catch (sendErr: any) {
        console.warn("safeSend warning:", sendErr?.message || sendErr);
      }
    }
  };

  let liveSession: any = null;
  let isClosed = false;
  let isTurnInterrupted = false;

  const cleanupSession = () => {
    if (isClosed) return;
    isClosed = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
      liveSession = null;
    }
  };

  try {
    // Default voice: Kore (warm, charming, confident female voice)
    const selectedVoice = "Kore";

    // Gather existing memories to inject into initial system instruction
    const userMems = userMemoriesMap.get("default-user") || [];
    let dynamicInstruction = AIRA_SYSTEM_INSTRUCTION;
    if (userMems.length > 0) {
      dynamicInstruction += `\n\nCURRENT USER MEMORIES & CONFIRMED FACTS:\n` +
        userMems.map((m: any) => `- [${m.category || "info"}] ${m.key}: "${m.value}"`).join("\n");
    }

    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice }
          }
        },
        systemInstruction: dynamicInstruction,
        tools: liveTools,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log("Gemini Live session established with gemini-3.1-flash-live-preview");
          safeSend({
            type: "session_ready",
            model: "gemini-3.1-flash-live-preview",
            voice: selectedVoice
          });
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // User interruption signal from server
          if (message.serverContent?.interrupted) {
            isTurnInterrupted = true;
            safeSend({ type: "interrupted" });
          }

          // Turn complete signal
          if (message.serverContent?.turnComplete) {
            isTurnInterrupted = false;
            safeSend({ type: "turn_complete" });
          }

          // Model Audio output parts (24kHz PCM 16-bit little-endian)
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            // Once model begins outputting a turn, ensure isTurnInterrupted is cleared
            isTurnInterrupted = false;
            for (const part of parts) {
              if (part.inlineData?.data) {
                safeSend({
                  type: "audio",
                  data: part.inlineData.data
                });
              }
            }
          }

          // Output transcription
          if (message.serverContent?.outputTranscription?.text) {
            safeSend({
              type: "output_transcription",
              text: message.serverContent.outputTranscription.text
            });
          }

          // Input transcription
          if (message.serverContent?.inputTranscription?.text) {
            safeSend({
              type: "input_transcription",
              text: message.serverContent.inputTranscription.text
            });
          }

          // Function calling (sent to client for browser execution)
          if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
            console.log("AIRA received tool call:", message.toolCall.functionCalls);
            safeSend({
              type: "tool_call",
              calls: message.toolCall.functionCalls
            });
          }
        },
        onerror: (err: any) => {
          console.error("Gemini Live session error:", err?.message || err);
          safeSend({
            type: "error",
            message: err?.message || "Gemini Live session encountered an issue."
          });
        },
        onclose: (event: any) => {
          console.log("Gemini Live session closed code:", event?.code, "reason:", event?.reason);
          cleanupSession();
          safeSend({
            type: "session_closed",
            code: event?.code,
            reason: event?.reason
          });
        }
      }
    });

    clientWs.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (isClosed || !liveSession) return;

        if (msg.type === "interrupt") {
          isTurnInterrupted = true;
          console.log("Client interruption signal received");
        } else if (msg.type === "audio" && msg.data) {
          // User is sending audio input - reset interruption flag so new response is never dropped
          isTurnInterrupted = false;
          try {
            liveSession.sendRealtimeInput({
              audio: {
                data: msg.data,
                mimeType: "audio/pcm;rate=16000"
              }
            });
          } catch (err: any) {
            console.warn("Failed to stream audio chunk to Live API:", err?.message || err);
          }
        } else if (msg.type === "tool_responses" && Array.isArray(msg.responses)) {
          console.log(`Returning ${msg.responses.length} tool responses to Live API`);
          try {
            liveSession.sendToolResponse({
              functionResponses: msg.responses
            });
          } catch (err: any) {
            console.warn("Failed to send batch tool responses to Live API:", err?.message || err);
          }
        } else if (msg.type === "tool_response" && msg.id && msg.name) {
          console.log("Returning tool response to Live API:", msg.id, msg.name, msg.response);
          try {
            liveSession.sendToolResponse({
              functionResponses: [{
                id: msg.id,
                name: msg.name,
                response: msg.response || { status: "success" }
              }]
            });
          } catch (err: any) {
            console.warn("Failed to send tool response to Live API:", err?.message || err);
          }
        }
      } catch (err: any) {
        console.error("Error parsing message from client:", err?.message || err);
      }
    });

    clientWs.on("close", (code, reason) => {
      console.log("Client closed WebSocket connection:", code, reason?.toString());
      cleanupSession();
    });

    clientWs.on("error", (err: any) => {
      console.warn("Client WebSocket error:", err?.message || err);
      cleanupSession();
    });

  } catch (err: any) {
    console.error("Failed to start Gemini Live session:", err?.message || err);
    safeSend({
      type: "error",
      message: err?.message || "Failed to initialize Gemini Live session"
    });
    cleanupSession();
  }
});

// Vite middleware or static serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupViteOrStatic().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`AIRA AI Assistant server listening on http://0.0.0.0:${PORT}`);
  });
});
