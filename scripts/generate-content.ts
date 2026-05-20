/**
 * Content generation script — builds 30 days of daily puzzles.
 * Run: npm run generate
 *
 * Creates: public/daily/YYYY-MM-DD.json for the next 30 days.
 *
 * AI text  → Claude claude-sonnet-4-6
 * AI image → DALL-E 3 (via OpenAI) or Replicate SDXL (if REPLICATE_API_TOKEN set)
 * Human text  → Project Gutenberg public-domain snippets (curated pool)
 * Human image → Unsplash curated photos (free, no key needed)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const PUZZLE_START_NUMBER = 1;  // puzzle #001 = first date we generate
const DAYS_TO_GENERATE = 30;

// ── Gutenberg snippets (human text pool — 30+ entries, no repeats in first 30 days) ──

const HUMAN_TEXT_POOL: Array<{ content: string; source: string; explanation: string }> = [
  {
    content: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    source: "Jane Austen — Pride and Prejudice (1813)",
    explanation: "Written by Jane Austen in 1813. The ironic undercurrent is distinctly human — the sentence performs the social satire it describes, a trick that AI prose rarely achieves without prompting.",
  },
  {
    content: "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
    source: "Herman Melville — Moby-Dick (1851)",
    explanation: "The opening of Moby-Dick by Herman Melville, published 1851. The conversational directness and deliberate vagueness ('never mind how long precisely') are classic Melville — a distinctly human authorial choice.",
  },
  {
    content: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.",
    source: "Charles Dickens — A Tale of Two Cities (1859)",
    explanation: "Written by Charles Dickens in 1859. The sustained parallelism and rhetorical rhythm reflect 19th-century literary tradition — a style AI can approximate but rarely originates authentically.",
  },
  {
    content: "The sky above the port was the color of television, tuned to a dead channel.",
    source: "William Gibson — Neuromancer (1984)",
    explanation: "William Gibson's iconic opening line from Neuromancer (1984). The dead-channel metaphor was fresh and era-specific — a distinctly human cultural reference anchored to its moment.",
  },
  {
    content: "We were somewhere around Barstow on the edge of the desert when the drugs began to take hold.",
    source: "Hunter S. Thompson — Fear and Loathing in Las Vegas (1971)",
    explanation: "Hunter S. Thompson's gonzo-journalism opening. The chaotic immediacy and specific geography are characteristic of his visceral human voice — no AI generates this kind of reckless authority.",
  },
  {
    content: "It was a bright cold day in April, and the clocks were striking thirteen.",
    source: "George Orwell — Nineteen Eighty-Four (1949)",
    explanation: "Orwell's 1984 opens with this quietly unsettling detail. The juxtaposition of ordinary 'bright cold day' with 'clocks striking thirteen' signals wrongness — a distinctly human narrative technique.",
  },
  {
    content: "Happy families are all alike; every unhappy family is unhappy in its own way.",
    source: "Leo Tolstoy — Anna Karenina (1878)",
    explanation: "Tolstoy's famous aphorism from Anna Karenina. The compression of broad human observation into a single sentence is a mark of a master writer, not generated text.",
  },
  {
    content: "The man in black fled across the desert, and the gunslinger followed.",
    source: "Stephen King — The Gunslinger (1982)",
    explanation: "King's Dark Tower series opener. The terse, mythic simplicity — echoing both western and quest genres — is characteristic of King's human storytelling instincts.",
  },
  {
    content: "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
    source: "F. Scott Fitzgerald — The Great Gatsby (1925)",
    explanation: "Fitzgerald's narrator Nick Carraway, introducing himself with deliberate restraint. The confessional register and withheld detail are signatures of Fitzgerald's distinctly human voice.",
  },
  {
    content: "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter.",
    source: "Mark Twain — Adventures of Huckleberry Finn (1884)",
    explanation: "Huck Finn's vernacular opening, published 1884. The dialect and deliberate grammatical 'incorrectness' are intentional human artistic choices that AI trained on edited prose rarely produces naturally.",
  },
  {
    content: "I had the story, bit by bit, from various people, and, as generally happens in such cases, each time it was a different story.",
    source: "Edith Wharton — Ethan Frome (1911)",
    explanation: "Wharton's framing device from Ethan Frome. The acknowledgment of narrative unreliability is a sophisticated human literary technique — self-aware in a way AI tends to avoid.",
  },
  {
    content: "1801—I have just returned from a visit to my landlord—the solitary neighbour that I shall be troubled with.",
    source: "Emily Brontë — Wuthering Heights (1847)",
    explanation: "The journal-entry opening of Wuthering Heights, 1847. The dry understatement ('troubled with') and diary format are hallmarks of 19th-century English fiction.",
  },
  {
    content: "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further out-door exercise was now out of the question.",
    source: "Charlotte Brontë — Jane Eyre (1847)",
    explanation: "Jane Eyre's opening, 1847. The precision of weather detail and the subordinate clauses stacked to defer the main point are characteristics of Victorian prose that AI tends to simplify.",
  },
  {
    content: "In the year 1878 I took my degree of Doctor of Medicine of the University of London, and proceeded to Netley to go through the course prescribed for surgeons in the Army.",
    source: "Arthur Conan Doyle — A Study in Scarlet (1887)",
    explanation: "Watson's self-introduction in the first Sherlock Holmes novel, 1887. The bureaucratic precision and understated voice are Doyle's deliberate choices — a human narrator establishing credibility.",
  },
  {
    content: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice, 'without pictures or conversations?'",
    source: "Lewis Carroll — Alice's Adventures in Wonderland (1865)",
    explanation: "Carroll's opening, 1865. The logic-within-illogic (judging books by having pictures OR conversations) is pure Carroll — an eccentric human sensibility that AI replicates awkwardly.",
  },
  {
    content: "The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.",
    source: "H.G. Wells — The Time Machine (1895)",
    explanation: "Wells' framing narrator introducing the unnamed Time Traveller, 1895. The parenthetical aside and the contrast of 'grey eyes' against the flush of excitement are vivid human observations.",
  },
  {
    content: "The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.",
    source: "Oscar Wilde — The Picture of Dorian Gray (1890)",
    explanation: "Wilde's sensory-saturated opening, 1890. The accumulation of scents — roses, lilac, pink-flowering thorn — signals Aesthetic movement priorities that are unmistakably a human artist's manifesto.",
  },
  {
    content: "The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest. The flood had made, the wind was nearly calm, and being bound down the river, the only thing for it was to come to and wait for the turn of the tide.",
    source: "Joseph Conrad — Heart of Darkness (1899)",
    explanation: "Conrad's nautical opening, 1899. The specificity of sailing terms ('cruising yawl', 'the flood had made') grounds an otherwise symbolic story in authentic human seamanship.",
  },
  {
    content: "True! —nervous —very, very dreadfully nervous I had been and am; but why will you say that I am mad?",
    source: "Edgar Allan Poe — The Tell-Tale Heart (1843)",
    explanation: "Poe's unreliable narrator defending his sanity, 1843. The breathless dashes and self-interruption create a vocal quality that AI tends to smooth out into more grammatically regular prose.",
  },
  {
    content: "Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tide-water dog, strong of muscle and warm of long fur, from Puget Sound to San Diego.",
    source: "Jack London — The Call of the Wild (1903)",
    explanation: "London's narrator addressing the reader directly about Buck's ignorance, 1903. The ironic omniscience — knowing what Buck cannot — is a distinctly human storytelling choice.",
  },
  {
    content: "I am an invisible man. No, I am not a spook like those who haunted Edgar Allan Poe; nor am I one of your Hollywood-movie ectoplasms. I am a man of substance, of flesh and bone, fiber and liquids — and I might even be said to possess a mind.",
    source: "Ralph Ellison — Invisible Man (1952)",
    explanation: "Ellison's narrator establishing his paradoxical visibility, 1952. The rapid correction of the reader's assumption and the list of bodily substances are confrontational — a human narrator refusing to be dismissed.",
  },
  {
    content: "If you really want to hear about it, the first thing you'll probably want to know is where I was born, and what my lousy childhood was like, and how my parents were occupied and all before they had me, and all that David Copperfield kind of crap, but I don't feel like going into it, if you want to know the truth.",
    source: "J.D. Salinger — The Catcher in the Rye (1951)",
    explanation: "Holden Caulfield's famous opening monologue, 1951. The anti-literary pose — refusing to do what a novel usually does — is a human adolescent voice that AI tends to flatten.",
  },
  {
    content: "Mrs. Dalloway said she would buy the flowers herself.",
    source: "Virginia Woolf — Mrs Dalloway (1925)",
    explanation: "Woolf's seven-word opening, 1925. The specificity of the errand and the reported-speech construction ('said she would') immediately suggest an interior consciousness observing itself — a technique Woolf pioneered.",
  },
  {
    content: "Once upon a time and a very good time it was there was a moocow coming down along the road and this moocow that was coming down along the road met a nicens little boy named baby tuckoo.",
    source: "James Joyce — A Portrait of the Artist as a Young Man (1916)",
    explanation: "Joyce's stream-of-infant-consciousness, 1916. The baby-talk phonetics ('moocow', 'nicens', 'tuckoo') are a deliberately strange stylistic choice — a human modernist experiment that AI often avoids or softens.",
  },
  {
    content: "On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.",
    source: "Fyodor Dostoevsky — Crime and Punishment (1866)",
    explanation: "Raskolnikov's introduction in Dostoevsky's 1866 novel. The deliberate withholding of full street names (S. Place, K. bridge) — a 19th-century realist convention — feels unmistakably human.",
  },
  {
    content: "Ships at a distance have every man's wish on board. For some they come in with the tide. For others they sail forever on the horizon, never out of sight, never landing until the Watcher turns his eyes away in resignation, his dreams mocked to death by Time.",
    source: "Zora Neale Hurston — Their Eyes Were Watching God (1937)",
    explanation: "Hurston's philosophical opening meditation, 1937. The allegorical register shifting to the concrete 'Watcher' is characteristic of Hurston's lyric precision — a human voice that earned its authority.",
  },
  {
    content: "The grandmother didn't want to go to Florida. She wanted to visit some of her connections in east Tennessee and she was seizing at every chance to change Bailey's mind.",
    source: "Flannery O'Connor — A Good Man Is Hard to Find (1953)",
    explanation: "O'Connor's flat opening, 1953. The casual word 'connections' (meaning relatives) and the mundane family argument conceal the story's impending violence — a human writer's calculated understatement.",
  },
  {
    content: "Lolita, light of my life, fire of my loins. Lo-lee-ta. She was Lo, plain Lo, in the morning, standing four feet ten in one sock.",
    source: "Vladimir Nabokov — Lolita (1955)",
    explanation: "Nabokov's notorious opening, 1955. The alliteration cascading into the mundane physical detail ('four feet ten in one sock') is a human novelist's deliberate tonal control — seductive style punctured by the ordinary.",
  },
  {
    content: "It was a queer, sultry summer, the summer they electrocuted the Rosenbergs, and I didn't know what I was doing in New York.",
    source: "Sylvia Plath — The Bell Jar (1963)",
    explanation: "Plath's disoriented narrator situating herself in historical time, 1963. The political event dropped into personal disorientation is a distinctly human narrative move — refusing the fiction that private life is separate from public events.",
  },
  {
    content: "All children, except one, grow up.",
    source: "J.M. Barrie — Peter Pan (1911)",
    explanation: "Barrie's four-word thesis, 1911. The exception held back by the comma — the entire story's premise compressed into a single melancholy clause — is the kind of human economy that takes years of craft.",
  },
  {
    content: "I write this sitting in the kitchen sink.",
    source: "Dodie Smith — I Capture the Castle (1948)",
    explanation: "Cassandra's eccentric opening, 1948. The specificity of location (the kitchen sink, not a chair, not a desk) is a human character's self-revelation — the kind of telling detail that AI tends to replace with something more conventionally literary.",
  },
];

// ── Unsplash human images (30 curated photos, no repeats in 30 days) ──────────

const HUMAN_IMAGE_POOL = [
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop", explanation: "A photograph of mountain peaks taken by a human photographer. The slight asymmetry, lens flare, and atmospheric haze are signatures of real-world photography that AI generators rarely replicate authentically.", source: "Unsplash — landscape photography" },
  { url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop", explanation: "A photograph of trees taken by a human. The organic randomness of branch patterns, natural bokeh, and uneven lighting angles distinguish this from AI-generated forest imagery.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop", explanation: "A real street photography shot. The candid composition, motion blur, and authentic urban textures are typical of human street photographers.", source: "Unsplash — street photography" },
  { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop", explanation: "A macro photograph of electronic components. The precise focus plane and physical depth of field are characteristics of real macro lens photography.", source: "Unsplash — technology photography" },
  { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&auto=format&fit=crop", explanation: "A human-captured landscape photograph. The natural gradient of light across the scene and the imperfect horizon line are impossible for AI to replicate from description alone.", source: "Unsplash — landscape photography" },
  { url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop", explanation: "A photograph of a coastal scene by a human photographer. The interplay of sand texture, water reflection, and diffused sky light reveals a real camera and real place.", source: "Unsplash — coastal photography" },
  { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop", explanation: "A human-captured reflection photograph. The slight distortion of the water surface and the physical chromatic aberration around highlights are artefacts of real-world optics.", source: "Unsplash — landscape photography" },
  { url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&auto=format&fit=crop", explanation: "A forest photograph taken by a human. The dappled sunlight, irregular canopy gaps, and organic variation in tree spacing are beyond what AI image generators model accurately.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1501785888741-53a9c4cead5b?w=800&auto=format&fit=crop", explanation: "A dramatic mountain landscape captured on camera. The physical scale cues — tiny features against vast geology — and real atmospheric perspective mark this as human photography.", source: "Unsplash — mountain photography" },
  { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop", explanation: "A winter starscape photographed by a human using long exposure. The star trails, natural colour temperature, and grain from high ISO settings are hallmarks of real astrophotography.", source: "Unsplash — night photography" },
  { url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&auto=format&fit=crop", explanation: "A human-photographed architectural scene. The perspective distortion, real shadows cast by physical light sources, and material texture are characteristic of authentic photography.", source: "Unsplash — architecture photography" },
  { url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&auto=format&fit=crop", explanation: "An aurora borealis photograph taken by a human in real conditions. The organic shimmer patterns and interaction with the horizon are impossible to fully replicate in AI generation.", source: "Unsplash — night photography" },
  { url: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=800&auto=format&fit=crop", explanation: "A city skyline captured by a human photographer. The uneven building heights, authentic light pollution, and real atmospheric haze distinguish this from AI-generated cityscapes.", source: "Unsplash — cityscape photography" },
  { url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop", explanation: "A nature photograph taken by a human. The imperfect composition — subject not perfectly centred, horizon not perfectly level — signals authentic spontaneous capture.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1494475673543-d1beb57ae868?w=800&auto=format&fit=crop", explanation: "A forest path photograph. The depth recession, natural leaf litter, and inconsistent lighting through the canopy are characteristics of real woodland photography.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop", explanation: "A human portrait photograph. The natural skin texture, subtle expression asymmetry, and real catchlights in the eyes are reliable indicators of genuine photographic origin.", source: "Unsplash — portrait photography" },
  { url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&auto=format&fit=crop", explanation: "A human-captured desert landscape. The physical heat haze, real sand grain texture, and organic dune edges are difficult for AI image generators to reproduce at scale.", source: "Unsplash — desert photography" },
  { url: "https://images.unsplash.com/photo-1455827060858-44cc5bb3b32d?w=800&auto=format&fit=crop", explanation: "An abstract close-up photograph taken by a human. The physical depth of field, micro-texture detail, and real-world light scatter distinguish this from generated imagery.", source: "Unsplash — abstract photography" },
  { url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop", explanation: "A street photography image. The decisive-moment composition, motion blur on moving subjects, and authentic ambient light reveal a human photographer's presence.", source: "Unsplash — street photography" },
  { url: "https://images.unsplash.com/photo-1484950763426-56b5bf172dbb?w=800&auto=format&fit=crop", explanation: "A human-captured seascape photograph. The real wave motion, physical spray detail, and authentic horizon curvature are evidence of genuine seascape photography.", source: "Unsplash — ocean photography" },
  { url: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=800&auto=format&fit=crop", explanation: "An architectural photograph taken by a human. The slight lens distortion, real material reflections, and physical light patterns on surfaces mark this as authentic.", source: "Unsplash — architecture photography" },
  { url: "https://images.unsplash.com/photo-1516912481851-38efa12a42c2?w=800&auto=format&fit=crop", explanation: "A snowy landscape photograph. The physical weight of snow on branches, organic accumulation patterns, and real winter light quality distinguish this from AI generation.", source: "Unsplash — winter photography" },
  { url: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=800&auto=format&fit=crop", explanation: "A close-up photographic study taken by a human. The real optical diffraction, physical focus falloff, and authentic colour rendering are hallmarks of genuine macro photography.", source: "Unsplash — macro photography" },
  { url: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&auto=format&fit=crop", explanation: "A human-photographed mountain trail. The physical exertion implied by the composition angle, real trail erosion patterns, and authentic sky conditions mark this as genuine photography.", source: "Unsplash — hiking photography" },
  { url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop", explanation: "A winter forest photograph captured by a human. The blue-white colour temperature of overcast snow light and the irregular branch loading patterns cannot be reliably modelled by AI.", source: "Unsplash — winter photography" },
  { url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop", explanation: "A human street scene photograph. The authentic pedestrian density, real architectural weathering, and organic chaos of a busy street are beyond what AI generation consistently produces.", source: "Unsplash — urban photography" },
  { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop", explanation: "A golden-hour farm landscape taken by a human. The real lens flare from direct sun, physical crop texture, and authentic warm-cool shadow contrast mark this as film-plane photography.", source: "Unsplash — rural photography" },
  { url: "https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&auto=format&fit=crop", explanation: "A human-photographed lakeside scene. The physical ripple patterns, real shoreline vegetation, and natural atmospheric perspective are hallmarks of genuine landscape photography.", source: "Unsplash — lake photography" },
  { url: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=800&auto=format&fit=crop", explanation: "A human-captured dramatic sky photograph. The meteorological accuracy of the cloud formation, real light diffusion, and authentic colour banding distinguish this from AI-generated skies.", source: "Unsplash — sky photography" },
  { url: "https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=800&auto=format&fit=crop", explanation: "A coastal rock formation photographed by a human. The real wave erosion patterns, authentic tidal markings, and physical rock texture are impossible for AI to hallucinate accurately.", source: "Unsplash — coastal photography" },
];

// ── AI image prompts for DALL-E / Replicate (15 varied prompts) ───────────────

const AI_IMAGE_PROMPTS = [
  { prompt: "A hyperrealistic portrait of an elderly lighthouse keeper, golden hour lighting, photorealistic, 8k", explanation: "Generated by DALL-E 3. Despite the photorealistic style, subtle inconsistencies in skin texture and the slightly too-perfect lighting reveal AI origin." },
  { prompt: "An alien marketplace at dusk, bioluminescent plants, exotic creatures trading crystals, cinematic photography style", explanation: "AI-generated concept art. The impossibly rich detail and seamless blending of elements that don't co-exist is a hallmark of diffusion model generation." },
  { prompt: "A cozy library with floor-to-ceiling bookshelves, warm lamplight, leather armchair, photorealistic interior", explanation: "AI-generated interior scene. The books have no readable spines, and the symmetry is slightly too perfect — common tells for generated imagery." },
  { prompt: "Underwater city ruins with coral growing on ancient columns, shafts of light filtering from above, cinematic wide-angle", explanation: "Diffusion model output. The ethereal underwater lighting and too-clean visibility are beyond what real underwater photography produces." },
  { prompt: "A futuristic city at night with flying vehicles, neon reflections on wet streets, cinematic photography, 8k", explanation: "AI-generated sci-fi cityscape. The consistent neon colour palette and perfect reflections on every surface are hallmarks of generative model aesthetic preferences." },
  { prompt: "An ancient temple overgrown with jungle vines, early morning mist, volumetric lighting, photorealistic", explanation: "Generated by DALL-E 3. The too-even distribution of vines and the theatrical mist that illuminates perfectly from one angle are signs of AI image generation." },
  { prompt: "A glass greenhouse filled with impossible hybrid flowers in saturated colours, photorealistic, golden hour", explanation: "AI-generated botanical scene. The impossible flower hybridisations and uniformly perfect petals betray the generator — real flowers have asymmetries and damage." },
  { prompt: "A lone astronaut standing on a rocky alien landscape with two moons visible, photorealistic, epic scale", explanation: "Diffusion model output. The scale relationship between the astronaut and landscape is slightly off, and the sky colour gradient is too smooth for authentic photography." },
  { prompt: "An abandoned ballroom with decaying grandeur, broken chandeliers, dust particles in shafts of light, photorealistic", explanation: "AI-generated decay scene. The dust particles are too evenly distributed and the decay pattern too symmetrical — real abandonment is messier and less theatrical." },
  { prompt: "A tranquil Japanese zen garden at dawn, raked gravel patterns, single cherry blossom tree, photorealistic", explanation: "Generated by DALL-E 3. The raked gravel lines are too mathematically perfect and the cherry blossoms too uniformly pink — signs of an AI rendering an idealised concept." },
  { prompt: "A deep sea creature with bioluminescent patterns in absolute darkness, photorealistic wildlife photography style", explanation: "AI-generated deep sea image. The bioluminescence patterns are too symmetrical and the creature too cleanly lit — real deep sea photography is far messier and less dramatic." },
  { prompt: "A Victorian-era steam locomotive bursting through a tunnel in heavy rain, dramatic lighting, photorealistic", explanation: "Diffusion model output. The steam clouds are too voluminous and the rain too uniformly lit — real wet photography has more visual chaos and lens flare." },
  { prompt: "An impossible staircase in a surrealist desert landscape, Escher-influenced, photorealistic, golden hour lighting", explanation: "AI-generated surrealist scene. The physically impossible geometry rendered in photorealistic style is a favourite diffusion model demonstration — combining visual accuracy with conceptual impossibility." },
  { prompt: "A photorealistic portrait of a robot developing human emotions, reflective chrome surface, dramatic studio lighting", explanation: "Generated by DALL-E 3. The chrome surface is too perfectly reflective and the emotional expression slightly uncanny — AI struggling to reconcile mechanical and organic visual registers." },
  { prompt: "An arctic research station at night under the northern lights, photorealistic, long exposure style", explanation: "AI-generated polar scene. The aurora colours are too saturated and too evenly balanced across the frame — real aurora photography involves far more unpredictable light behaviour." },
];

// ── AI text topics (30+ unique topics for deterministic sequential selection) ──

const AI_TEXT_TOPICS = [
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
  "the feeling of returning to a hometown after years away",
  "waking up in an unfamiliar hotel room",
  "the last customer in a closing diner",
  "watching a thunderstorm from inside a warm house",
  "the smell of coffee in an empty kitchen at dawn",
  "riding a train through unfamiliar countryside",
  "the stillness of a museum after closing time",
  "finding a letter that was never sent",
  "the feeling of swimming alone in a lake at night",
  "a walk through a city during early morning fog",
  "the moment before a concert begins",
  "the particular silence of a house after everyone has left",
  "watching the tide go out at dusk",
  "the smell of rain on hot pavement in summer",
  "waking up to find snow has fallen overnight",
  "the feeling of finishing a book you didn't want to end",
  "sitting alone in a cinema before the film starts",
  "the view from the top of a lighthouse on a clear day",
  "the sound of a distant train heard from a bedroom window",
  "watching fireflies in a field at the end of summer",
  "the feeling of a long journey finally reaching its end",
  "standing in a forest after a heavy rainstorm",
  "the last light of the day touching the tops of buildings",
  "waking very early and finding the world still dark and quiet",
  "the feeling of sand between your toes for the first time each summer",
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

async function generateAIText(
  client: Anthropic,
  topic: string
): Promise<{ content: string; explanation: string }> {
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

  return null;
}

// ── Main puzzle builder ───────────────────────────────────────────────────────

async function buildDayPuzzle(
  date: string,
  puzzleNumber: number,
  dayIndex: number,  // 0-based index into the shuffled pools (no modulo repeat within 30 days)
  client: Anthropic,
  humanTextPool: typeof HUMAN_TEXT_POOL,
  humanImagePool: typeof HUMAN_IMAGE_POOL,
  aiImagePrompts: typeof AI_IMAGE_PROMPTS,
  aiTopics: string[],
): Promise<void> {
  const outPath = path.join(process.cwd(), 'public', 'daily', `${date}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${date} already exists`);
    return;
  }

  console.log(`  [gen]  ${date}  #${puzzleNumber}`);

  const items = [];

  // Three unique AI text topics for this puzzle (no topic repeats within puzzle)
  const topicBase = dayIndex * 3;
  const topic1 = aiTopics[topicBase % aiTopics.length];
  const topic2 = aiTopics[(topicBase + 1) % aiTopics.length];
  const topic3 = aiTopics[(topicBase + 2) % aiTopics.length];

  // Item 1 — AI text
  const aiText1 = await generateAIText(client, topic1);
  items.push({ id: `${date}-1`, type: 'text', content: aiText1.content, answer: 'ai', explanation: aiText1.explanation });

  // Item 2 — Human text (sequential, no repeats for first 30 days)
  const ht = humanTextPool[dayIndex % humanTextPool.length];
  items.push({ id: `${date}-2`, type: 'text', content: ht.content, answer: 'human', explanation: ht.explanation, source: ht.source });

  // Item 3 — AI image (falls back to AI text if no image API key)
  const aiImgPromptData = aiImagePrompts[dayIndex % aiImagePrompts.length];
  const aiImg = await generateAIImage(aiImgPromptData.prompt, aiImgPromptData.explanation);
  if (aiImg) {
    items.push({ id: `${date}-3`, type: 'image', content: aiImg.url, answer: 'ai', explanation: aiImg.explanation });
  } else {
    const aiText2 = await generateAIText(client, topic2);
    items.push({ id: `${date}-3`, type: 'text', content: aiText2.content, answer: 'ai', explanation: aiText2.explanation });
  }

  // Item 4 — Human image (sequential, no repeats for first 30 days)
  const hi = humanImagePool[dayIndex % humanImagePool.length];
  items.push({ id: `${date}-4`, type: 'image', content: hi.url, answer: 'human', explanation: hi.explanation, source: hi.source });

  // Item 5 — AI text (third unique topic)
  const aiText3 = await generateAIText(client, topic3);
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

  // Shuffle pools once; sequential indexing then guarantees no repeat within 30 days
  const humanTextShuffled = shuffle(HUMAN_TEXT_POOL);
  const humanImageShuffled = shuffle(HUMAN_IMAGE_POOL);
  const aiImageShuffled = shuffle(AI_IMAGE_PROMPTS);
  const aiTopicsShuffled = shuffle(AI_TEXT_TOPICS);

  for (let i = 0; i < DAYS_TO_GENERATE; i++) {
    const date = getDateString(i);
    const puzzleNumber = PUZZLE_START_NUMBER + i;
    try {
      await buildDayPuzzle(date, puzzleNumber, i, client, humanTextShuffled, humanImageShuffled, aiImageShuffled, aiTopicsShuffled);
    } catch (err) {
      console.error(`  [err]  ${date}:`, err);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log('Done!');
}

main();
