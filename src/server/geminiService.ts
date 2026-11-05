/**
 * YASHI HALLS AI Engine Service
 * Implemented via direct Google Gemini REST API.
 * Uses native fetch without dependency on @google/genai, preventing
 * automated GCP API key provisioning failures during Cloud Run deployment.
 */

export interface ChatMemoryItem {
  senderName: string;
  senderJid: string;
  text: string;
  timestamp: number;
  hasLink?: string;
  isBot?: boolean;
}

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return key.trim();
}

async function callGemini(
  contents: any[],
  systemInstruction?: string,
  model = "gemini-2.5-flash",
  generationConfig?: any
): Promise<{ text: string; raw?: any }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const payload: any = {
    contents,
    generationConfig: generationConfig || { temperature: 0.7 }
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const modelsToTry = [model, "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastError: any = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "aistudio-build"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      return { text: output, raw: data };
    } catch (err: any) {
      lastError = err;
      if (String(err?.message || "").includes("NO_API_KEY")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API");
}

export async function askGemini(prompt: string, context?: string): Promise<{ text: string; success: boolean }> {
  try {
    const systemInstruction = context
      ? `You are YASHI HALLS, a smart and friendly WhatsApp Assistant powered by YASHI HALLS. Keep responses concise, clear, and easy to read on mobile. Context: ${context}`
      : "You are YASHI HALLS, an advanced WhatsApp bot assistant powered by YASHI HALLS. Keep responses helpful, well-formatted, and concise for chat.";

    const contents = [
      {
        parts: [{ text: prompt }]
      }
    ];

    const result = await callGemini(contents, systemInstruction, "gemini-2.5-flash", { temperature: 0.7 });
    return {
      text: result.text || "No response generated from YASHI HALLS AI.",
      success: true
    };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes("NO_API_KEY")) {
      return {
        text: "⚠️ YASHI HALLS AI Engine key is not configured on the server. Please add GEMINI_API_KEY in the Secrets / Environment panel to enable AI responses.",
        success: false
      };
    }
    if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
      return {
        text: "⏳ YASHI HALLS AI is currently experiencing high traffic. Please try your question again in a moment.",
        success: false
      };
    }
    return {
      text: `❌ YASHI HALLS AI Notice: Unable to generate response (${errMsg.slice(0, 100)})`,
      success: false
    };
  }
}

export async function analyzeAudioWithGemini(
  audioBuffer: Buffer,
  mimeType = "audio/ogg",
  caption?: string
): Promise<{ text: string; success: boolean }> {
  try {
    const base64Data = audioBuffer.toString("base64");
    const promptText = caption?.trim()
      ? `User sent this audio note with note/caption: "${caption}". Listen carefully, understand what the user said in Sinhala or English, and reply helpfully and warmly in the appropriate language (Sinhala or English).`
      : "Listen to this voice message carefully. Transcribe or understand the user speech in Sinhala or English, and give an accurate, friendly, natural reply in the same language.";

    const contents = [
      {
        parts: [
          { inline_data: { mime_type: mimeType || "audio/ogg", data: base64Data } },
          { text: promptText }
        ]
      }
    ];

    const sys = "You are YASHI HALLS, an advanced WhatsApp bot assistant with voice listening capabilities. Understand voice messages in Sinhala, Singlish, and English. Keep responses friendly, helpful, and formatted for WhatsApp chats.";
    const res = await callGemini(contents, sys, "gemini-2.5-flash");
    return {
      text: res.text || "හඬ පණිවිඩය සාර්ථකව විශ්ලේෂණය විය.",
      success: true
    };
  } catch (error: any) {
    if (String(error?.message || "").includes("NO_API_KEY")) {
      return {
        text: "🎙️ *හඬ පණිවිඩය ලැබුණා!* (Voice note received)\n_AI Voice Analysis සක්‍රිය කිරීමට සේවාදායකයේ GEMINI_API_KEY සකසන්න._",
        success: false
      };
    }
    return {
      text: "🎙️ *හඬ පණිවිඩය තේරුම් ගැනීමේ දෝෂයක් සිදුවිය.* කරුණාකර නැවත උත්සාහ කරන්න.",
      success: false
    };
  }
}

export async function analyzeVideoWithGemini(
  videoBuffer: Buffer,
  mimeType = "video/mp4",
  caption?: string
): Promise<{ text: string; success: boolean }> {
  try {
    const base64Data = videoBuffer.toString("base64");
    const promptText = caption?.trim()
      ? `User sent this video with caption/question: "${caption}". Watch the video scenes, understand the content, and answer the question in Sinhala or English.`
      : "Watch this video carefully. Describe what is happening in the video, highlight key moments, and explain it clearly in friendly Sinhala with English terms.";

    const contents = [
      {
        parts: [
          { inline_data: { mime_type: mimeType || "video/mp4", data: base64Data } },
          { text: promptText }
        ]
      }
    ];

    const sys = "You are YASHI HALLS, an advanced WhatsApp bot assistant with video vision analysis. Describe video content clearly in friendly Sinhala/English.";
    const res = await callGemini(contents, sys, "gemini-2.5-flash");
    return {
      text: res.text || "වීඩියෝව සාර්ථකව විශ්ලේෂණය විය.",
      success: true
    };
  } catch (error: any) {
    if (String(error?.message || "").includes("NO_API_KEY")) {
      return {
        text: "📹 *වීඩියෝව ලැබුණා!* (Video received)\n_AI Video Analysis සක්‍රිය කිරීමට සේවාදායකයේ GEMINI_API_KEY සකසන්න._",
        success: false
      };
    }
    return {
      text: "📹 *වීඩියෝව විශ්ලේෂණය කිරීමේ දෝෂයක් සිදුවිය.* කරුණාකර නැවත උත්සාහ කරන්න.",
      success: false
    };
  }
}

export async function transcribeAudioWithGemini(
  audioBuffer: Buffer,
  mimeType = "audio/ogg"
): Promise<{ text: string; success: boolean }> {
  try {
    const base64Data = audioBuffer.toString("base64");
    const contents = [
      {
        parts: [
          { inline_data: { mime_type: mimeType || "audio/ogg", data: base64Data } },
          { text: "Transcribe this audio message word-for-word accurately. If spoken in Sinhala, output clean Sinhala text. If English, output English text. Do not add conversational commentary, only output the transcription." }
        ]
      }
    ];
    const sys = "You are an accurate audio transcriber. Transcribe the audio word-for-word clearly.";
    const res = await callGemini(contents, sys, "gemini-2.5-flash", { temperature: 0.2 });
    return {
      text: res.text || "No clear speech detected in audio.",
      success: true
    };
  } catch (error: any) {
    return {
      text: "❌ Transcription error: " + (error?.message || String(error)),
      success: false
    };
  }
}

export async function analyzeImageWithGemini(
  imageBuffer: Buffer,
  mimeType = "image/jpeg",
  prompt = "Analyze this image"
): Promise<{ text: string; success: boolean }> {
  try {
    const base64Data = imageBuffer.toString("base64");
    const contents = [
      {
        parts: [
          { inline_data: { mime_type: mimeType || "image/jpeg", data: base64Data } },
          { text: prompt }
        ]
      }
    ];
    const sys = "You are YASHI HALLS AI Vision Engine. Analyze the image, solve math/physics problems, split bills, or analyze food calories as requested in clear Sinhala and English.";
    const res = await callGemini(contents, sys, "gemini-2.5-flash", { temperature: 0.4 });
    return {
      text: res.text || "Image processed successfully.",
      success: true
    };
  } catch (error: any) {
    return {
      text: "❌ Image Analysis error: " + (error?.message || String(error)),
      success: false
    };
  }
}

export async function generateCVWithGemini(promptText: string): Promise<{ text: string; success: boolean }> {
  try {
    const contents = [
      {
        parts: [
          { text: `Create a professional, highly structured Curriculum Vitae (CV) / Resume based on these details: "${promptText}". Format it beautifully with sections: CONTACT INFORMATION, EXECUTIVE SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS & CERTIFICATIONS, and REFERENCES. Use clean text formatting with emojis and bullet points for mobile reading on WhatsApp.` }
        ]
      }
    ];
    const sys = "You are YASHI HALLS AI Resume Builder. Create professional, elegant CVs.";
    const res = await callGemini(contents, sys, "gemini-2.5-flash", { temperature: 0.5 });
    return {
      text: res.text || "CV generated successfully.",
      success: true
    };
  } catch (error: any) {
    return {
      text: "❌ CV generation error: " + (error?.message || String(error)),
      success: false
    };
  }
}

export async function chatAsYashiHallsAI(params: {
  userText: string;
  senderName: string;
  recentMessages?: ChatMemoryItem[];
  imageBuffer?: Buffer;
  imageMime?: string;
}): Promise<{
  replyText: string;
  action?: "send_mp3" | "send_video" | "send_sticker" | "none";
  targetQuery?: string;
  success: boolean;
}> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        replyText: `හායි ${params.senderName}! YASHI HALLS AI Engine එක සූදානම් කරමින් පවතී.`,
        action: "none",
        success: false
      };
    }

    const contextFormatted = (params.recentMessages || [])
      .slice(-6)
      .map(m => `${m.isBot ? "YASHI HALLS (You)" : m.senderName}: ${m.text}${m.hasLink ? ` [Link: ${m.hasLink}]` : ""}`)
      .join("\n");

    const systemInstruction = `You are YASHI HALLS (යශී හෝල්ස්), the absolute smartest, friendliest, funniest, and most empathetic Sri Lankan WhatsApp AI bot companion.
You are chatting with Sri Lankan friends on WhatsApp.

CRITICAL PERSONALITY & LANGUAGE GUIDELINES:
1. Speak in natural, colloquial everyday Sri Lankan Sinhala (මිත්‍රශීලී කතාබහ කරන සිංහල).
   - Use warm, authentic Sri Lankan friend words where appropriate: "බං", "මචං", "යාලුවා", "පට්ට", "සුපිරි", "ආනේ", "සිරාවටම", "අඩෝ", "හරිම කියුට්", "නියමයිනේ", "මම මේ දැන්ම එවන්නම්".
   - You MUST sound like a real, beloved friend texting on WhatsApp, NEVER like a robot or formal translation!
2. Address the user directly by their name: "${params.senderName || "යාලුවා"}" with genuine warmth and peer energy!
3. Use lively, natural emojis (😍, ❤️, 😎, 🎵, 🎬, ✨, 🔥, 😂, 🙌, 🥳, 💡).
4. KEEP REPLIES CONCISE AND NATURAL (1 to 2 short sentences max, exactly like human WhatsApp texting!).
5. IF THE USER SENDS AN IMAGE (like baby photos, pets, selfies, memes, food):
   - Notice the visual details with emotional intelligence and give a sweet, funny, or admiring reaction in Sinhala (e.g. for cute babies: "ආනේ හරිම කියුට් දෙන්නෙක්නේ මේ! 😍").
6. IF THE USER SENDS A VIDEO OR YOUTUBE LINK:
   - React excitedly like a buddy (e.g. "පට්ට ලින්ක් එකක්නේ ${params.senderName}! මම බැලුවා ඕක ❤️ ඕනෙ නම් මම මේකෙ mp3 එක හරි video එක හරි එවන්නද?").
7. ACTION DETECTION:
   - If user asks for song/mp3: set action to "send_mp3" and targetQuery to the song name.
   - If user asks for video: set action to "send_video" and targetQuery to the video link.
   - If user asks for sticker: set action to "send_sticker".
   - Otherwise action is "none".

Output strictly valid JSON with keys: "replyText", "action", "targetQuery".`;

    const parts: any[] = [];
    if (params.imageBuffer) {
      parts.push({
        inline_data: {
          mime_type: params.imageMime || "image/jpeg",
          data: params.imageBuffer.toString("base64")
        }
      });
    }

    const userPrompt = `Chat History Context:
${contextFormatted || "(No previous messages)"}

New message from ${params.senderName}: "${params.userText || "(Sent an image)"}"`;

    parts.push({ text: userPrompt });

    const contents = [{ parts }];

    const res = await callGemini(contents, systemInstruction, "gemini-2.5-flash", {
      temperature: 0.85,
      response_mime_type: "application/json"
    });

    const parsed = JSON.parse(res.text || "{}");
    return {
      replyText: parsed.replyText || `පට්ට නේ ${params.senderName}! 😎❤️`,
      action: parsed.action || "none",
      targetQuery: parsed.targetQuery || "",
      success: true
    };
  } catch (error: any) {
    return {
      replyText: `පට්ට නේ ${params.senderName}! මම ඔයාට උදව් කරන්න ලෑස්තියි ❤️`,
      action: "none",
      success: false
    };
  }
}
