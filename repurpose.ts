import { generateText } from "ai";
import { gateway } from "./gateway";

export const OUTPUT_FORMATS = [
  { id: "twitter_thread", label: "X / Twitter Thread", icon: "Twitter", color: "#1DA1F2" },
  { id: "linkedin_post", label: "LinkedIn Post", icon: "Linkedin", color: "#0A66C2" },
  { id: "instagram_caption", label: "Instagram Caption", icon: "Instagram", color: "#E1306C" },
  { id: "instagram_hooks", label: "Instagram Hooks (5)", icon: "Zap", color: "#F77737" },
  { id: "email_newsletter", label: "Email Newsletter", icon: "Mail", color: "#10B981" },
  { id: "youtube_script", label: "YouTube Script", icon: "Youtube", color: "#FF0000" },
  { id: "blog_summary", label: "Blog Summary", icon: "FileText", color: "#7C3AED" },
  { id: "tiktok_hook", label: "TikTok Hook", icon: "Music", color: "#FF004F" },
  { id: "podcast_intro", label: "Podcast Intro", icon: "Mic", color: "#F59E0B" },
  { id: "facebook_post", label: "Facebook Post", icon: "Facebook", color: "#1877F2" },
  { id: "whatsapp_broadcast", label: "WhatsApp Broadcast", icon: "MessageCircle", color: "#25D366" },
  { id: "sms_campaign", label: "SMS Campaign", icon: "Smartphone", color: "#A855F7" },
];

const FORMAT_PROMPTS: Record<string, string> = {
  twitter_thread: `Create an engaging Twitter/X thread with 5-8 numbered tweets. Each tweet must be under 280 characters. Start with a hook tweet, build to a climax, end with a CTA. Format as numbered list: "1/\n[tweet]\n\n2/\n[tweet]..."`,
  linkedin_post: `Write a professional LinkedIn post (150-300 words). Start with a bold opening line, use line breaks for readability, include 3-5 relevant hashtags at the end. Personal, insightful tone.`,
  instagram_caption: `Write an Instagram caption (100-150 words). Start with an attention-grabbing first line, include a story or insight, end with a question to drive engagement, add 10-15 relevant hashtags on new lines.`,
  instagram_hooks: `Generate 5 distinct Instagram hook lines. Each hook should be under 15 words and stop the scroll. Number them 1-5. Make them varied in style (question, bold statement, curiosity gap, surprising stat, relatable pain point).`,
  email_newsletter: `Write an email newsletter section. Include: Subject line, Preview text, Opening paragraph, 3 key takeaways in bullet points, Closing CTA. Keep it scannable and valuable.`,
  youtube_script: `Write a YouTube video script outline (300-500 words). Include: Hook (first 15 seconds), Intro (what viewer will learn), 3 main sections with talking points, outro with subscribe CTA. Mark each section clearly.`,
  blog_summary: `Write a blog post summary suitable for a blog intro or meta description variant. 150-200 words. Include the main insight, why it matters, and what the reader will learn. Engaging, SEO-friendly.`,
  tiktok_hook: `Write 3 TikTok video hook scripts (opening 3-5 seconds each). Each should create immediate curiosity or emotion. Format: numbered list with the hook text and a brief note on delivery style.`,
  podcast_intro: `Write a podcast episode intro script (60-90 seconds when read aloud). Include: attention-grabbing opener, brief context, what the episode covers, why it matters today. Conversational and energetic.`,
  facebook_post: `Write a Facebook post (100-200 words). More conversational and community-focused than LinkedIn. Include a story element, ask a question to spark comments, no hashtags needed.`,
  whatsapp_broadcast: `Write a WhatsApp broadcast message (50-80 words). Conversational, direct, personal tone. No formal language. Include a clear action or takeaway. Use line breaks for readability. No hashtags.`,
  sms_campaign: `Write 3 SMS campaign variations (under 160 characters each). Direct, action-oriented, include a CTA. Numbered 1-3.`,
};

interface VoiceSettings {
  examples?: string[];
  toneFormality?: number;
  toneLength?: number;
  toneHumor?: number;
}

function buildVoiceContext(voice?: VoiceSettings | null): string {
  if (!voice) return "";

  const lines: string[] = [];

  if (voice.examples && voice.examples.length > 0) {
    lines.push("BRAND VOICE EXAMPLES (match this style):");
    voice.examples.slice(0, 3).forEach((ex, i) => {
      lines.push(`Example ${i + 1}: "${ex.substring(0, 300)}"`);
    });
    lines.push("");
  }

  const formality = voice.toneFormality ?? 50;
  const length = voice.toneLength ?? 50;
  const humor = voice.toneHumor ?? 30;

  lines.push("TONE PARAMETERS:");
  lines.push(`- Formality: ${formality < 33 ? "Casual/conversational" : formality > 66 ? "Formal/professional" : "Semi-formal"}`);
  lines.push(`- Length: ${length < 33 ? "Concise and punchy" : length > 66 ? "Detailed and thorough" : "Moderate length"}`);
  lines.push(`- Humor: ${humor < 33 ? "Serious and straightforward" : humor > 66 ? "Witty and humorous" : "Occasionally light-hearted"}`);

  return lines.join("\n");
}

export async function generateRepurposedContent(
  inputContent: string,
  formatId: string,
  voice?: VoiceSettings | null,
  customInstruction?: string
): Promise<string> {
  const formatPrompt = FORMAT_PROMPTS[formatId];
  if (!formatPrompt) throw new Error(`Unknown format: ${formatId}`);

  const voiceContext = buildVoiceContext(voice);
  const customNote = customInstruction ? `\nSPECIAL INSTRUCTION: ${customInstruction}` : "";

  const systemPrompt = `You are an expert content repurposing specialist. Transform the given content into the requested format while preserving the core message and key insights.

${voiceContext}

RULES:
- Preserve the author's core ideas and unique perspective
- Adapt style for each platform's audience expectations
- Make it feel native to the platform, not copied
- Be creative but accurate to the source material
${customNote}`;

  const userPrompt = `SOURCE CONTENT:
${inputContent.substring(0, 3000)}

OUTPUT FORMAT REQUEST:
${formatPrompt}

Generate the content now:`;

  const { text } = await generateText({
    model: gateway("google/gemma-4-31b-it:free"),
    system: systemPrompt,
    prompt: userPrompt,
    maxTokens: 1000,
  });

  return text;
}
