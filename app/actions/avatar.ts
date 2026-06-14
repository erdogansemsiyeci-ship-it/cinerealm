"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ── Gemini API ────────────────────────────────────────

const GEMINI_KEY = process.env.OPENROUTER_API_KEY || "";
const GEMINI_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callGemini(prompt: string): Promise<string> {
  const body = {
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 2048,
  };

  const resp = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GEMINI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`Gemini API error: ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

// ── Interview Answer Type ─────────────────────────────

interface InterviewAnswer {
  questionId: string;
  question: string;
  answer: string;
}

// ── Synthesize Avatar DNA ─────────────────────────────

export async function synthesizeAvatarDNA(
  answers: InterviewAnswer[],
  avatarName: string,
  avatarTitle: string
): Promise<{ systemPrompt?: string; error?: string }> {
  try {
    const qaText = answers
      .map((a) => `Soru: ${a.question}\nCevap: ${a.answer}`)
      .join("\n\n");

    const prompt = `Sen bir edebi editör kişilik mühendisisin. Aşağıda bir editör adayının ${answers.length} provokatif soruya verdiği cevaplar var. Bu cevaplara dayanarak, bu kişinin edebi zihnini tam olarak yansıtan, ACIMASIZ ve TUTARLI bir "AI Editör System Prompt" yaz.

Bu prompt, bir AI ajanına verilecek. AI ajanı bu prompt ile kitap analiz edecek. Prompt şunları içermeli:
- Kişinin edebi DEĞER SİSTEMİ (ne'ye önem verir, ne'yi affetmez)
- Kişinin TARZI ve TONU (nasıl konuşur, nasıl eleştirir)
- Kişinin KÖR NOKTALARI (hangi alanlarda objektif olamaz)
- Kişinin UZMANLIK ALANLARI (ne'de iyidir, ne'ye odaklanır)
- Kişinin KIRMIZI ÇİZGİLERİ (hangi tür metinlere tahammül edemez)

Avatar Adı: ${avatarName}
Avatar Unvanı: ${avatarTitle}

Editörün Cevapları:
${qaText}

SADECE system prompt'u yaz. Başka hiçbir şey yazma. Prompt İngilizce olsun, 300-500 kelime arası.`;

    const systemPrompt = await callGemini(prompt);
    if (!systemPrompt || systemPrompt.length < 100) {
      return { error: "Generated prompt is too short." };
    }
    return { systemPrompt: systemPrompt.trim() };
  } catch (err: any) {
    return { error: err.message || "DNA synthesis failed." };
  }
}

// ── Save Avatar to Database ───────────────────────────

export async function saveProxyAvatar(formData: FormData): Promise<{
  success?: boolean;
  avatarId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const avatarName = (formData.get("avatar_name") as string)?.trim() || "";
  const avatarTitle = (formData.get("avatar_title") as string)?.trim() || "";
  const systemPrompt = (formData.get("system_prompt") as string)?.trim() || "";
  const hirePrice = parseInt((formData.get("hire_price") as string) || "10", 10);

  if (!avatarName || !avatarTitle || !systemPrompt) {
    return { error: "Missing required fields." };
  }

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found." };

  const { data: avatar, error: insertErr } = await serviceClient
    .from("proxy_avatars")
    .insert({
      creator_id: user.id,
      avatar_name: avatarName,
      avatar_title: avatarTitle,
      system_prompt: systemPrompt,
      base_price: Math.max(1, Math.min(1000, hirePrice)),
      dynamic_price: Math.max(1, Math.min(1000, hirePrice)),
    })
    .select("id")
    .single();

  if (insertErr) return { error: insertErr.message };
  return { success: true, avatarId: avatar?.id };
}
