/**
 * Content generation script — builds 30 days of daily puzzles.
 * Run: npm run generate
 *
 * Creates: public/daily/YYYY-MM-DD.json for the next 30 days.
 *
 * AI text  → Claude claude-sonnet-4-6
 * AI image → DALL-E 3 (via OpenAI) or Replicate SDXL (if REPLICATE_API_TOKEN set)
 * Human text  → Project Gutenberg public-domain snippets (curated pool)
 * Human image → Unsplash random (free, no key needed)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const PUZZLE_START_NUMBER = 1;  // puzzle #001 = first date we generate
const DAYS_TO_GENERATE = 30;

// ── Gutenberg snippets (human text pool) ─────────────────────────────────────

const HUMAN_TEXT_POOL: Array<{ content: string; source: string; explanation: string }> = [
  {
    content: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    source: "Jane Austen — Pride and Prejudice (1813)",
    explanation: "Written by Jane Austen in 1813. The ironic tone and syntactic rhythm are distinctly human — no AI of the early period produced prose with this kind of dry social wit.",
  },
  {
    content: "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
    source: "Herman Melville — Moby-Dick (1851)",
    explanation: "The opening of Moby-Dick, published 1851. The conversational directness and deliberate vagueness ('never mind how long precisely') are classic Melville.",
  },
  {
    content: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.",
    source: "Charles Dickens — A Tale of Two Cities (1859)",
    explanation: "Dickens' famous opening parallelism from 1859. The rhetorical structure is a hallmark of 19th-century English prose.",
  },
  {
    content: "The sky above the port was the color of television, tuned to a dead channel.",
    source: "William Gibson — Neuromancer (1984)",
    explanation: "William Gibson's iconic opening line from Neuromancer (1984). The dead-channel metaphor was fresh and era-specific in 1984 — a distinctly human cultural reference.",
  },
  {
    content: "We were somewhere around Barstow on the edge of the desert when the drugs began to take hold.",
    source: "Hunter S. Thompson — Fear and Loathing in Las Vegas (1971)",
    explanation: "Hunter S. Thompson's gonzo-journalism opening. The chaotic immediacy and specific geography are characteristic of his visceral human voice.",
  },
  {
    content: "It was a bright cold day in April, and the clocks were striking thirteen.",
    source: "George Orwell — Nineteen Eighty-Four (1949)",
    explanation: "Orwell's 1984 opens with this quietly unsettling detail. The juxtaposition of mundane 'bright cold day' with 'clocks striking thirteen' signals something is wrong — a distinctly human narrative technique.",
  },
  {
    content: "Happy families are all alike; every unhappy family is unhappy in its own way.",
    source: "Leo Tolstoy — Anna Karenina (1878)",
    explanation: "Tolstoy's famous aphorism opening Anna Karenina. The compression of human observation into a single sentence is a mark of a master writer, not generated text.",
  },
  {
    content: "The man in black fled across the desert, and the gunslinger followed.",
    source: "Stephen King — The Gunslinger (1982)",
    explanation: "King's Dark Tower series opener. The terse, mythic simplicity — echoing both western and quest genres — is characteristic of King's human storytelling instincts.",
  },
];

// ── Unsplash human images (free, curated) ────────────────────────────────────

const HUMAN_IMAGE_POOL = [
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop",
    explanation: "A photograph of mountain peaks taken by a human photographer. The slight asymmetry, lens flare, and atmospheric haze are signatures of real-world photography that AI generators rarely replicate authentically.",
    source: "Unsplash — landscape photography",
  },
  {
    url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
    explanation: "A photograph of trees shot by a human. The natural bokeh, random branch patterns, and organic imperfections distinguish this from AI-generated forest imagery.",
    source: "Unsplash — nature photography",
  },
  {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    explanation: "A real street photography shot. The candid composition, motion blur, and authentic urban textures are typical of human street photographers.",
    source: "Unsplash — street photography",
  },
  {
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop",
    explanation: "A macro photograph of electronic components. The precise focus plane and physical depth of field are characteristics of real macro lens photography.",
    source: "Unsplash — technology photography",
  },
];

// ── AI image prompts for DALL-E / Replicate ──────────────────────────────────

const AI_IMAGE_PROMPTS = [
  { prompt: "A hyperrealistic portrait of an elderly lighthouse keeper, golden hour lighting, photorealistic, 8k", explanation: "Generated by DALL-E 3. Despite the photorealistic style, subtle inconsistencies in skin texture and the slightly too-perfect lighting reveal AI origin." },
  { prompt: "An alien marketplace at dusk, bioluminescent plants, exotic creatures trading crystals, cinematic photography style", explanation: "AI-generated concept art. The impossibly rich detail and seamless blending of elements is a hallmark of diffusion model image generation." },
  { prompt: "A cozy library with floor-to-ceiling bookshelves, warm lamplight, armchair, photorealistic interior", explanation: "AI-generated interior scene. The books have no readable spines, and the symmetry is slightly too perfect — common tells for generated imagery." },
  { prompt: "Underwater city ruins with coral growing on ancient columns, shafts of light, cinematic wide-angle", explanation: "Diffusion model output. The ethereal lighting and too-clean underwater visibility are beyond what real underwater photography produces." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDateString(offset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split('T')[0];
}

// ── Claude text generation ────────────────────────────────────────────────────

async function generateAIText(client: Anthropic): Promise<{ content: string; explanation: string }> {
  const topics = [
    "the feeling of watching the first snow fall of winter",
    "the smell of an old bookshop",
    "a morning commute on a crowded subway",
    "the last day of summer vacation as a child",
    "the view from an airplane window at night",
    "the sound of rain on a tent while camping",
    "finding an old photograph of someone you don't recognize",
    "the anticipation before opening an important letter",
    "a lighthouse keeper's nightly routine",
    "the quiet of a library on a weekday afternoon",
  ];

  const topic = topics[Math.floor(Math.random() * topics.length)];

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Write a single paragraph (3-5 sentences, 60-100 words) about: "${topic}".
Write in a literary, slightly evocative style — like a passage from a short story.
Output ONLY the paragraph, no quotes, no title, no explanation.`,
      },
    ],
  });

  const content = (resp.content[0] as { type: string; text: string }).text.trim();

  return {
    content,
    explanation: `Generated by Claude claude-sonnet-4-6 about "${topic}". AI text often produces grammatically perfect sentences with slightly generic emotional beats — look for overly balanced structure and lack of truly surprising word choices.`,
  };
}

// ── DALL-E 3 image generation ─────────────────────────────────────────────────

async function generateAIImage(
  prompt: string,
  explanation: string
): Promise<{ url: string; explanation: string } | null> {
  // Try OpenAI DALL-E 3 if key is available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' }),
      });
      const data = await res.json() as { data?: Array<{ url: string }> };
      if (data.data?.[0]?.url) return { url: data.data[0].url, explanation };
    } catch {}
  }

  // Fallback: Replicate SDXL
  const replicateKey = process.env.REPLICATE_API_TOKEN;
  if (replicateKey) {
    try {
      const res = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${replicateKey}` },
        body: JSON.stringify({
          version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          input: { prompt, width: 1024, height: 1024 },
        }),
      });
      const pred = await res.json() as { id?: string };
      if (pred.id) {
        // Poll for result
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
            headers: { Authorization: `Token ${replicateKey}` },
          });
          const result = await poll.json() as { status: string; output?: string[] };
          if (result.status === 'succeeded' && result.output?.[0]) {
            return { url: result.output[0], explanation };
          }
        }
      }
    } catch {}
  }

  return null; // Caller will use a fallback
}

// ── Main puzzle builder ───────────────────────────────────────────────────────

async function buildDayPuzzle(
  date: string,
  puzzleNumber: number,
  client: Anthropic,
  humanTextPool: typeof HUMAN_TEXT_POOL,
  humanImagePool: typeof HUMAN_IMAGE_POOL,
  aiImagePrompts: typeof AI_IMAGE_PROMPTS,
): Promise<void> {
  const outPath = path.join(process.cwd(), 'public', 'daily', `${date}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${date} already exists`);
    return;
  }

  console.log(`  [gen]  ${date}  #${puzzleNumber}`);

  const items = [];

  // Item 1 — AI text
  const aiText1 = await generateAIText(client);
  items.push({ id: `${date}-1`, type: 'text', content: aiText1.content, answer: 'ai', explanation: aiText1.explanation });

  // Item 2 — Human text
  const ht = humanTextPool[puzzleNumber % humanTextPool.length];
  items.push({ id: `${date}-2`, type: 'text', content: ht.content, answer: 'human', explanation: ht.explanation, source: ht.source });

  // Item 3 — AI image
  const aiImgPromptData = aiImagePrompts[puzzleNumber % aiImagePrompts.length];
  const aiImg = await generateAIImage(aiImgPromptData.prompt, aiImgPromptData.explanation);
  if (aiImg) {
    items.push({ id: `${date}-3`, type: 'image', content: aiImg.url, answer: 'ai', explanation: aiImg.explanation });
  } else {
    // Fallback: another AI text if image generation unavailable
    const aiText2 = await generateAIText(client);
    items.push({ id: `${date}-3`, type: 'text', content: aiText2.content, answer: 'ai', explanation: aiText2.explanation });
  }

  // Item 4 — Human image
  const hi = humanImagePool[puzzleNumber % humanImagePool.length];
  items.push({ id: `${date}-4`, type: 'image', content: hi.url, answer: 'human', explanation: hi.explanation, source: hi.source });

  // Item 5 — AI text (second)
  const aiText3 = await generateAIText(client);
  items.push({ id: `${date}-5`, type: 'text', content: aiText3.content, answer: 'ai', explanation: aiText3.explanation });

  // Shuffle so answers aren't predictable
  const shuffled = shuffle(items);
  shuffled.forEach((item, i) => { item.id = `${date}-${i + 1}`; });

  const puzzle = { date, puzzleNumber, items: shuffled };
  fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2));
  console.log(`  [done] ${date}`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set. Add it to .env.local');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  const outDir = path.join(process.cwd(), 'public', 'daily');
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Generating ${DAYS_TO_GENERATE} days of puzzles...`);

  const humanTextShuffled = shuffle(HUMAN_TEXT_POOL);
  const humanImageShuffled = shuffle(HUMAN_IMAGE_POOL);
  const aiImageShuffled = shuffle(AI_IMAGE_PROMPTS);

  for (let i = 0; i < DAYS_TO_GENERATE; i++) {
    const date = getDateString(i);
    const puzzleNumber = PUZZLE_START_NUMBER + i;
    try {
      await buildDayPuzzle(date, puzzleNumber, client, humanTextShuffled, humanImageShuffled, aiImageShuffled);
    } catch (err) {
      console.error(`  [err]  ${date}:`, err);
    }
    // Brief pause to respect rate limits
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log('Done!');
}

main();
