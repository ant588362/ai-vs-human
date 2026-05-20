/**
 * Static puzzle generator — no API keys needed.
 * Run: node scripts/generate-static.js
 * Generates public/daily/*.json for May 21 – June 17, 2026 (skips existing files).
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'daily');

// ── Human text pool (indices 0-29 in fixed order) ────────────────────────────
const HUMAN_TEXTS = [
  // 0 – used by May 19 (kept for reference, skipped)
  { content: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.", source: "Charles Dickens — A Tale of Two Cities (1859)", explanation: "Written by Charles Dickens in 1859. The sustained parallelism and rhetorical rhythm reflect 19th-century literary tradition — a style AI can approximate but rarely originates authentically." },
  // 1 – used by May 20 (kept for reference, skipped)
  { content: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", source: "Jane Austen — Pride and Prejudice (1813)", explanation: "Written by Jane Austen in 1813. The ironic undercurrent is distinctly human — the sentence performs the social satire it describes, a trick that AI prose rarely achieves without prompting." },
  // 2 – May 21
  { content: "The sky above the port was the color of television, tuned to a dead channel.", source: "William Gibson — Neuromancer (1984)", explanation: "Gibson's iconic opening line from Neuromancer (1984). The dead-channel metaphor was culturally specific and fresh in 1984 — a distinctly human reference anchored to its historical moment." },
  // 3 – May 22
  { content: "We were somewhere around Barstow on the edge of the desert when the drugs began to take hold.", source: "Hunter S. Thompson — Fear and Loathing in Las Vegas (1971)", explanation: "Thompson's gonzo-journalism opening. The chaotic immediacy and specific geography are characteristic of his visceral human voice — no AI generates this kind of reckless authority." },
  // 4 – May 23
  { content: "It was a bright cold day in April, and the clocks were striking thirteen.", source: "George Orwell — Nineteen Eighty-Four (1949)", explanation: "Orwell's 1984 opens with this quietly unsettling detail. The juxtaposition of ordinary weather with 'clocks striking thirteen' signals wrongness — a distinctly human narrative technique." },
  // 5 – May 24
  { content: "Happy families are all alike; every unhappy family is unhappy in its own way.", source: "Leo Tolstoy — Anna Karenina (1878)", explanation: "Tolstoy's famous aphorism from Anna Karenina. The compression of broad human observation into a single sentence is a mark of a master writer, not generated text." },
  // 6 – May 25
  { content: "The man in black fled across the desert, and the gunslinger followed.", source: "Stephen King — The Gunslinger (1982)", explanation: "King's Dark Tower opener. The terse mythic simplicity — echoing both western and quest genres — is characteristic of King's human storytelling instincts." },
  // 7 – May 26
  { content: "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.", source: "F. Scott Fitzgerald — The Great Gatsby (1925)", explanation: "Fitzgerald's narrator Nick Carraway, introducing himself with deliberate restraint. The confessional register and withheld detail are signatures of Fitzgerald's distinctly human voice." },
  // 8 – May 27
  { content: "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter.", source: "Mark Twain — Adventures of Huckleberry Finn (1884)", explanation: "Huck Finn's vernacular opening, 1884. The deliberate grammatical 'incorrectness' is an intentional human artistic choice that AI trained on edited prose rarely produces naturally." },
  // 9 – May 28
  { content: "I had the story, bit by bit, from various people, and, as generally happens in such cases, each time it was a different story.", source: "Edith Wharton — Ethan Frome (1911)", explanation: "Wharton's framing device from Ethan Frome. The acknowledgment of narrative unreliability is a sophisticated human literary technique — self-aware in a way AI tends to avoid." },
  // 10 – May 29
  { content: "1801—I have just returned from a visit to my landlord—the solitary neighbour that I shall be troubled with.", source: "Emily Brontë — Wuthering Heights (1847)", explanation: "The journal-entry opening of Wuthering Heights, 1847. The dry understatement ('troubled with') and diary format are hallmarks of 19th-century English fiction." },
  // 11 – May 30
  { content: "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further out-door exercise was now out of the question.", source: "Charlotte Brontë — Jane Eyre (1847)", explanation: "Jane Eyre's opening, 1847. The precision of weather detail and the subordinate clauses stacked to defer the main point are characteristics of Victorian prose that AI tends to simplify." },
  // 12 – May 31
  { content: "In the year 1878 I took my degree of Doctor of Medicine of the University of London, and proceeded to Netley to go through the course prescribed for surgeons in the Army.", source: "Arthur Conan Doyle — A Study in Scarlet (1887)", explanation: "Watson's self-introduction in the first Sherlock Holmes novel, 1887. The bureaucratic precision and understated voice are Doyle's deliberate choices — a human narrator establishing credibility." },
  // 13 – June 1
  { content: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice, 'without pictures or conversations?'", source: "Lewis Carroll — Alice's Adventures in Wonderland (1865)", explanation: "Carroll's opening, 1865. The logic-within-illogic (judging books by having pictures OR conversations) is pure Carroll — an eccentric human sensibility that AI replicates awkwardly." },
  // 14 – June 2
  { content: "The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.", source: "H.G. Wells — The Time Machine (1895)", explanation: "Wells' framing narrator introducing the unnamed Time Traveller, 1895. The parenthetical aside and the contrast of grey eyes against the flush of excitement are vivid human observations." },
  // 15 – June 3
  { content: "The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.", source: "Oscar Wilde — The Picture of Dorian Gray (1890)", explanation: "Wilde's sensory-saturated opening, 1890. The accumulation of scents — roses, lilac, pink-flowering thorn — signals Aesthetic movement priorities that are unmistakably a human artist's manifesto." },
  // 16 – June 4
  { content: "The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest. The flood had made, the wind was nearly calm, and being bound down the river, the only thing for it was to come to and wait for the turn of the tide.", source: "Joseph Conrad — Heart of Darkness (1899)", explanation: "Conrad's nautical opening, 1899. The specificity of sailing terms grounds an otherwise symbolic story in authentic human seamanship." },
  // 17 – June 5
  { content: "True! —nervous —very, very dreadfully nervous I had been and am; but why will you say that I am mad?", source: "Edgar Allan Poe — The Tell-Tale Heart (1843)", explanation: "Poe's unreliable narrator defending his sanity, 1843. The breathless dashes and self-interruption create a vocal quality that AI tends to smooth out into more grammatically regular prose." },
  // 18 – June 6
  { content: "Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tide-water dog, strong of muscle and warm of long fur, from Puget Sound to San Diego.", source: "Jack London — The Call of the Wild (1903)", explanation: "London's narrator addressing the reader directly about Buck's ignorance, 1903. The ironic omniscience — knowing what Buck cannot — is a distinctly human storytelling choice." },
  // 19 – June 7
  { content: "I am an invisible man. No, I am not a spook like those who haunted Edgar Allan Poe; nor am I one of your Hollywood-movie ectoplasms. I am a man of substance, of flesh and bone, fiber and liquids — and I might even be said to possess a mind.", source: "Ralph Ellison — Invisible Man (1952)", explanation: "Ellison's narrator establishing his paradoxical visibility, 1952. The rapid correction of the reader's assumption is confrontational — a human narrator refusing to be dismissed." },
  // 20 – June 8
  { content: "If you really want to hear about it, the first thing you'll probably want to know is where I was born, and what my lousy childhood was like, and how my parents were occupied and all before they had me, and all that David Copperfield kind of crap, but I don't feel like going into it, if you want to know the truth.", source: "J.D. Salinger — The Catcher in the Rye (1951)", explanation: "Holden Caulfield's famous opening monologue, 1951. The anti-literary pose — refusing to do what a novel usually does — is a human adolescent voice that AI tends to flatten." },
  // 21 – June 9
  { content: "Mrs. Dalloway said she would buy the flowers herself.", source: "Virginia Woolf — Mrs Dalloway (1925)", explanation: "Woolf's seven-word opening, 1925. The specificity of the errand and the reported-speech construction immediately suggest an interior consciousness observing itself — a technique Woolf pioneered." },
  // 22 – June 10
  { content: "Once upon a time and a very good time it was there was a moocow coming down along the road and this moocow that was coming down along the road met a nicens little boy named baby tuckoo.", source: "James Joyce — A Portrait of the Artist as a Young Man (1916)", explanation: "Joyce's stream-of-infant-consciousness, 1916. The baby-talk phonetics are a deliberately strange stylistic choice — a human modernist experiment that AI often avoids or softens." },
  // 23 – June 11
  { content: "On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.", source: "Fyodor Dostoevsky — Crime and Punishment (1866)", explanation: "Raskolnikov's introduction, 1866. The deliberate withholding of full street names — a 19th-century realist convention — feels unmistakably human." },
  // 24 – June 12
  { content: "Ships at a distance have every man's wish on board. For some they come in with the tide. For others they sail forever on the horizon, never out of sight, never landing until the Watcher turns his eyes away in resignation, his dreams mocked to death by Time.", source: "Zora Neale Hurston — Their Eyes Were Watching God (1937)", explanation: "Hurston's philosophical opening meditation, 1937. The allegorical register shifting to the concrete 'Watcher' is characteristic of Hurston's lyric precision — a human voice that earned its authority." },
  // 25 – June 13
  { content: "The grandmother didn't want to go to Florida. She wanted to visit some of her connections in east Tennessee and she was seizing at every chance to change Bailey's mind.", source: "Flannery O'Connor — A Good Man Is Hard to Find (1953)", explanation: "O'Connor's flat opening, 1953. The casual word 'connections' and the mundane family argument conceal the story's impending violence — a human writer's calculated understatement." },
  // 26 – June 14
  { content: "Lolita, light of my life, fire of my loins. Lo-lee-ta. She was Lo, plain Lo, in the morning, standing four feet ten in one sock.", source: "Vladimir Nabokov — Lolita (1955)", explanation: "Nabokov's notorious opening, 1955. The alliteration cascading into mundane physical detail ('four feet ten in one sock') is deliberate human tonal control — seductive style punctured by the ordinary." },
  // 27 – June 15
  { content: "It was a queer, sultry summer, the summer they electrocuted the Rosenbergs, and I didn't know what I was doing in New York.", source: "Sylvia Plath — The Bell Jar (1963)", explanation: "Plath's disoriented narrator situating herself in historical time, 1963. The political event dropped into personal disorientation is a distinctly human narrative move." },
  // 28 – June 16
  { content: "All children, except one, grow up.", source: "J.M. Barrie — Peter Pan (1911)", explanation: "Barrie's four-word thesis, 1911. The exception held back by the comma — the entire story's premise compressed into a single melancholy clause — is the kind of economy that takes years of craft." },
  // 29 – June 17
  { content: "I write this sitting in the kitchen sink.", source: "Dodie Smith — I Capture the Castle (1948)", explanation: "Cassandra's eccentric opening, 1948. The specificity of location (the kitchen sink, not a chair, not a desk) is a human character's self-revelation — the kind of telling detail that AI replaces with something more conventionally literary." },
];

// ── Human image pool (indices 0-29) ──────────────────────────────────────────
const HUMAN_IMAGES = [
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop", explanation: "A photograph of mountain peaks taken by a human photographer. The slight asymmetry, lens flare, and atmospheric haze are signatures of real-world photography that AI generators rarely replicate authentically.", source: "Unsplash — landscape photography" },
  { url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop", explanation: "A photograph of trees taken by a human. The organic randomness of branch patterns, natural bokeh, and uneven lighting angles distinguish this from AI-generated forest imagery.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop", explanation: "A real street photography shot. The candid composition, motion blur, and authentic urban textures are typical of human street photographers.", source: "Unsplash — street photography" },
  { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop", explanation: "A macro photograph of electronic components. The precise focus plane and physical depth of field are characteristics of real macro lens photography.", source: "Unsplash — technology photography" },
  { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&auto=format&fit=crop", explanation: "A human-captured landscape photograph. The natural light gradient and imperfect horizon line are impossible for AI to replicate from description alone.", source: "Unsplash — landscape photography" },
  { url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop", explanation: "A photograph of a coastal scene by a human photographer. The interplay of sand texture, water reflection, and diffused sky light reveals a real camera and real place.", source: "Unsplash — coastal photography" },
  { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop", explanation: "A human-captured reflection photograph. The slight distortion of the water surface and physical chromatic aberration around highlights are artefacts of real-world optics.", source: "Unsplash — landscape photography" },
  { url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&auto=format&fit=crop", explanation: "A forest photograph taken by a human. The dappled sunlight, irregular canopy gaps, and organic variation in tree spacing are beyond what AI image generators model accurately.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1501785888741-53a9c4cead5b?w=800&auto=format&fit=crop", explanation: "A dramatic mountain landscape captured on camera. The physical scale cues and real atmospheric perspective mark this as human photography.", source: "Unsplash — mountain photography" },
  { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop", explanation: "A winter starscape photographed by a human using long exposure. The natural colour temperature and grain from high ISO settings are hallmarks of real astrophotography.", source: "Unsplash — night photography" },
  { url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&auto=format&fit=crop", explanation: "A human-photographed architectural scene. The perspective distortion, real shadows, and material texture are characteristic of authentic photography.", source: "Unsplash — architecture photography" },
  { url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&auto=format&fit=crop", explanation: "An aurora borealis photograph taken by a human. The organic shimmer patterns and interaction with the horizon are impossible to fully replicate in AI generation.", source: "Unsplash — night photography" },
  { url: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=800&auto=format&fit=crop", explanation: "A city skyline captured by a human photographer. The uneven building heights, authentic light pollution, and real atmospheric haze distinguish this from AI-generated cityscapes.", source: "Unsplash — cityscape photography" },
  { url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop", explanation: "A nature photograph taken by a human. The imperfect composition — subject not perfectly centred, horizon not perfectly level — signals authentic spontaneous capture.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1494475673543-d1beb57ae868?w=800&auto=format&fit=crop", explanation: "A forest path photograph. The depth recession, natural leaf litter, and inconsistent lighting through the canopy are characteristics of real woodland photography.", source: "Unsplash — nature photography" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop", explanation: "A human portrait photograph. The natural skin texture, subtle expression asymmetry, and real catchlights in the eyes are reliable indicators of genuine photographic origin.", source: "Unsplash — portrait photography" },
  { url: "https://images.unsplash.com/photo-1455827060858-44cc5bb3b32d?w=800&auto=format&fit=crop", explanation: "An abstract close-up photograph taken by a human. The physical depth of field and real-world light scatter distinguish this from generated imagery.", source: "Unsplash — abstract photography" },
  { url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop", explanation: "A street photography image. The decisive-moment composition, motion blur, and authentic ambient light reveal a human photographer's presence.", source: "Unsplash — street photography" },
  { url: "https://images.unsplash.com/photo-1484950763426-56b5bf172dbb?w=800&auto=format&fit=crop", explanation: "A human-captured seascape photograph. The real wave motion, physical spray detail, and authentic horizon curvature are evidence of genuine seascape photography.", source: "Unsplash — ocean photography" },
  { url: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=800&auto=format&fit=crop", explanation: "An architectural photograph taken by a human. The slight lens distortion, real material reflections, and physical light patterns mark this as authentic.", source: "Unsplash — architecture photography" },
  { url: "https://images.unsplash.com/photo-1516912481851-38efa12a42c2?w=800&auto=format&fit=crop", explanation: "A snowy landscape photograph. The physical weight of snow on branches and organic accumulation patterns distinguish this from AI generation.", source: "Unsplash — winter photography" },
  { url: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=800&auto=format&fit=crop", explanation: "A close-up photographic study taken by a human. The real optical diffraction, physical focus falloff, and authentic colour rendering are hallmarks of genuine macro photography.", source: "Unsplash — macro photography" },
  { url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop", explanation: "A winter forest photograph captured by a human. The blue-white colour temperature of overcast snow light and irregular branch loading patterns cannot be reliably modelled by AI.", source: "Unsplash — winter photography" },
  { url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop", explanation: "A human street scene photograph. The authentic pedestrian density, real architectural weathering, and organic chaos of a busy street are beyond what AI generation consistently produces.", source: "Unsplash — urban photography" },
  { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop", explanation: "A golden-hour farm landscape taken by a human. The real lens flare, physical crop texture, and authentic warm-cool shadow contrast mark this as film-plane photography.", source: "Unsplash — rural photography" },
  { url: "https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&auto=format&fit=crop", explanation: "A human-photographed lakeside scene. The physical ripple patterns, real shoreline vegetation, and natural atmospheric perspective are hallmarks of genuine landscape photography.", source: "Unsplash — lake photography" },
  { url: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=800&auto=format&fit=crop", explanation: "A human-captured dramatic sky photograph. The meteorological accuracy of the cloud formation, real light diffusion, and authentic colour banding distinguish this from AI-generated skies.", source: "Unsplash — sky photography" },
  { url: "https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=800&auto=format&fit=crop", explanation: "A coastal rock formation photographed by a human. The real wave erosion patterns, authentic tidal markings, and physical rock texture are impossible for AI to hallucinate accurately.", source: "Unsplash — coastal photography" },
  { url: "https://images.unsplash.com/photo-1476900543704-4312b650e104?w=800&auto=format&fit=crop", explanation: "A human-photographed coast scene at dusk. The real colour gradients in the sky and authentic horizon haze are signs of genuine long-exposure photography.", source: "Unsplash — coastal photography" },
  { url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&auto=format&fit=crop", explanation: "A human-captured desert landscape. The physical heat haze, real sand grain texture, and organic dune edges are difficult for AI image generators to reproduce accurately.", source: "Unsplash — desert photography" },
];

// ── AI text passages (3 per puzzle day, days 2-29) ────────────────────────────
// Each entry: [passage1, topic1, passage2, topic2, passage3, topic3]
const AI_PASSAGES = [
  // Day 2 – May 21 – puzzle #3
  [
    "From thirty thousand feet the world becomes a circuit board — cities bleeding amber light into the dark, the thin orange thread of a highway connecting nowhere to nowhere, and above it all the absolute silence of altitude, which is not quiet at all but only the absence of the sounds you expected. She pressed her forehead to the cold oval of the window and thought about everyone below who would never look up to see her passing.",
    "the view from an airplane window at night",
    "The photograph had been tucked between the pages of a library book returned decades late, and whoever had returned it had either forgotten or not cared. A woman stood in front of a cedar tree that no longer existed, squinting into light that was long dead. She was laughing at something outside the frame, something she alone could see, and the not-knowing of it felt like an ache.",
    "finding an old photograph of someone you don't recognize",
    "He climbed the hundred and twelve steps every night at nine, wound the mechanism, checked the Fresnel lens for soot, and wrote the same three words in the logbook: light. wind. sea. The world beyond the glass was permanent and indifferent, and he had made his peace with that. What he had not expected, after twenty years, was how much he would miss the sound of other people breathing in the dark.",
    "a lighthouse keeper's nightly routine",
  ],
  // Day 3 – May 22 – puzzle #4
  [
    "By three in the afternoon the library had settled into its deepest quiet — the particular silence of a place that exists to hold things rather than to be inhabited. A single overhead light hummed above the periodicals. She could hear her own swallowing. It occurred to her that she had never thought of silence as having a texture before, but this one was like the inside of a book not yet opened.",
    "the quiet of a library on a weekday afternoon",
    "The town was smaller than memory had made it, and stranger — the barbershop was a nail salon, the drive-in was a car wash, the oak in front of her childhood house had been taken down, leaving a pale circle of exposed earth like a wound not quite healed. She had known, intellectually, that it would be different. She had not understood, until now, that it would be different in exactly the ways that would hurt.",
    "the feeling of returning to a hometown after years away",
    "The ceiling fan turned slowly, making no difference to the heat. Through the thin wall she could hear voices from the television in the adjacent room, a laugh track at intervals, the muffled syllables of people she would never meet. She lay in the unfamiliar dark and tried to locate herself: what city, what floor, what day. The answers came slowly, like sediment settling.",
    "waking up in an unfamiliar hotel room",
  ],
  // Day 4 – May 23 – puzzle #5
  [
    "The diner closed at eleven but he was still there at five to, nursing the last of his coffee, and she refilled it without asking because that was the rule for the last customer — you kept them as long as they needed, because the dark outside meant something and the light inside meant something else. He left a tip that was too large and she knew, without asking, that he had nowhere particular to go.",
    "the last customer in a closing diner",
    "The thunder came first as a low suggestion, then as a fact. From inside the house it was almost possible to believe that weather was something that happened to other people — to the garden, to the street, to the whole ordinary world — while inside remained permanent and warm and unchanged. She lit a second candle more for the smell than the light and watched the rain flatten the grass.",
    "watching a thunderstorm from inside a warm house",
    "The smell arrived before consciousness did: coffee, old wood, the particular mineral cold of a house that has been dark all night. She moved through it without turning on the lights, guided by the coffee, by the slight lessening of darkness in the east. There is a version of the world that exists only in this hour, she thought — orderly, unhurried, not yet belonging to the day.",
    "the smell of coffee in an empty kitchen at dawn",
  ],
  // Day 5 – May 24 – puzzle #6
  [
    "The countryside unreeled itself in the window like a slow film — wet fields, a farmhouse, a stand of bare trees against a sky the colour of old pewter, then more fields, more sky. He had forgotten how much of England looked like waiting. The other passengers slept or read or stared at their phones, and he thought: this is the last kind of moving where you can still feel yourself moving.",
    "riding a train through unfamiliar countryside",
    "In the museum after closing the paintings became themselves again. Without the hum of tourists, without the shuffle of audio guides and the occasional camera click, they stood in their frames in a silence that felt earned. The guard walked his final round and did not look at anything. He had learned, years ago, that to really look you had to come back alone — in dreams, in the hours before sleep, when the guard was gone.",
    "the stillness of a museum after closing time",
    "The envelope was addressed in handwriting she didn't recognize — neat, deliberate, the kind that had been taught and then half-forgotten. Inside: three pages, folded once, the ink slightly faded, the paper soft from years of handling. It was a love letter. It had never been sent. It had been written to someone who might still be alive and who, for forty years, had never known.",
    "finding a letter that was never sent",
  ],
  // Day 6 – May 25 – puzzle #7
  [
    "The lake at night was its own country — cold, dark, patrolled by nothing, responsible to nothing. She pushed off the dock into water that closed around her like a second skin and swam toward the far shore and the star it was holding. There is a particular aloneness that is not loneliness, she thought, that is only possible when you are the only warm thing for miles.",
    "the feeling of swimming alone in a lake at night",
    "The fog had arrived overnight and turned the city into a series of suggestions. Buildings appeared and disappeared. A traffic light bled green into the wet air, then vanished. She walked streets that she knew by heart and found them strangely tender, stripped of their certainty, as though the city was offering itself as something uncertain and provisional — look, it seemed to say, how easily I can become only an idea of myself.",
    "a walk through a city during early morning fog",
    "The houselights went down and the crowd fell into silence the way sand falls, gradually, each person quieting by the quietness of the person next to them, until the room was holding something that had not existed a moment before — not nothing, but the shape of what was about to happen, which is its own kind of presence. She felt her own breath slow. She thought: here.",
    "the moment before a concert begins",
  ],
  // Day 7 – May 26 – puzzle #8
  [
    "After the last door closed, the house had a different quality — not empty exactly, but relieved of its obligation to be a house. The chairs stood at their angles. The dishes drained. The rooms were no longer performing themselves, and so they could be, briefly, what they actually were: large boxes of accumulated time, full of air and the shapes of people who were somewhere else.",
    "the particular silence of a house after everyone has left",
    "The tide went out slowly, indifferently, taking its colour with it — the greens and silvers and the brief brightness of the reflected late sun — until what remained was wet sand, dark and patient, stippled with the holes of things that had retreated. She stood at the waterline and watched the world shrink. There is a version of loss, she thought, that does not ask your permission.",
    "watching the tide go out at dusk",
    "The smell rose from the pavement with the first drops — something ancient and mineral, released from the stone by the heat, half-chemical, half-alive. She stopped on the sidewalk and breathed it in without deciding to. Around her, others paused too, briefly, before continuing — each of them ambushed by the same involuntary memory of other summers, other rain, other versions of themselves standing in the warmth and smelling the earth come back.",
    "the smell of rain on hot pavement in summer",
  ],
  // Day 8 – May 27 – puzzle #9
  [
    "She woke to a quality of light that was wrong — too bright too early, too diffuse, coming from everywhere at once. Then the silence: no traffic, no birds, only a muffled compression of the world. She crossed to the window and found that overnight the city had been revised. Every edge softened. Every distinction erased. The street below her was unrecognizable and, for reasons she could not name, that felt like relief.",
    "waking up to find snow has fallen overnight",
    "The last page arrived and she turned it slowly, as though her reluctance alone could postpone the ending. She had been in the book for eleven days, carrying it through her mornings, her commutes, her evenings at the kitchen table. Now the characters would continue without her, in some dimension she could not enter. She closed the cover and sat for a while in the particular grief of a world completed — finished, unrevisable, over.",
    "the feeling of finishing a book you didn't want to end",
    "The cinema was almost dark even before the lights went fully down. She had chosen the end of the row deliberately, and sat with her coat still on and her popcorn untouched, looking at the blank screen that was not yet blank but only waiting. There is something about the two minutes before a film, she thought, that is better than almost anything: pure expectation, nothing yet decided, the story still infinite.",
    "sitting alone in a cinema before the film starts",
  ],
  // Day 9 – May 28 – puzzle #10
  [
    "From the top of the lighthouse on a clear day you could see the exact place where the world decided to become water. The land ran out with a kind of patience and then stopped, and beyond it the sea made its own argument — older, larger, entirely disinterested in the lighthouse or the woman standing in it or the small fact of her looking. She understood, suddenly, why sailors had gods.",
    "the view from the top of a lighthouse on a clear day",
    "It came every night at eleven forty-seven — she had checked — a long low moan of metal on metal, diminishing, absorbed into the dark. She had lived in this house for six years and had never once gone to the window to watch it pass. But she listened. She always listened. There was something in the sound of a train heard from a bed that stood for everything you had decided not to do.",
    "the sound of a distant train heard from a bedroom window",
    "The fireflies appeared without announcement, rising from the long grass at the field's edge as the last light died. She sat on the fence rail and watched them sign their small bright signatures to the dark and then unsign them. There would come a year, she knew, when she would see them for the last time without knowing it was the last time, and the thought of that was almost too much to hold.",
    "watching fireflies in a field at the end of summer",
  ],
  // Day 10 – May 29 – puzzle #11
  [
    "The train slowed into the station and she felt something unknot in her chest — the particular loosening of a tension she had not known she was carrying. The journey had been long enough that she had almost forgotten what the destination felt like, and now it returned, not as a place but as a quality of air, a familiar smell, the particular angle of the light off the platform. She thought: I am here. She thought: it is over. She thought: I am home.",
    "the feeling of a long journey finally reaching its end",
    "After the rain the forest had become a different thing. Every surface held its own small sky. The ferns were bowed and dripping. The smell was enormous — earth and green and something older, released from beneath the soil by the weight of the water. She picked her way along the muddy path and felt, with each step, the sponge of it underfoot, the world still swallowing what the sky had given back.",
    "standing in a forest after a heavy rainstorm",
    "At six the light changed on the tops of the buildings — gold going amber going the particular pink that belongs only to the hour of its own ending. Below, the streets were still noisy with the ordinary business of the city, but up there, at that altitude, the day was already leaving. She stood at her window and watched it go and thought: everything beautiful is a kind of instruction, if only you can read it in time.",
    "the last light of the day touching the tops of buildings",
  ],
  // Day 11 – May 30 – puzzle #12
  [
    "She woke at four, when the world was still completely dark, and lay still in the particular silence of the hour before birds. The house had a different quality in this hour — not hostile, but honest, stripped of its daytime purposes, returning to whatever it was before people had filled it with their needs. She lay in the dark and breathed and thought about nothing in particular, which was its own kind of luxury.",
    "waking very early and finding the world still dark and quiet",
    "The sand was always a shock after months away from it — cold the first moment and then immediately, fundamentally warm, working up between her toes with a precision that felt personal. She stood at the edge of the wave wash and let her feet sink and thought: this is the one sensation that never loses anything. Every summer she was ten again. Every summer the ocean was new.",
    "the feeling of sand between your toes for the first time each summer",
    "The snow fell the way it always fell in the first hour — unhurried, without drama, each flake completing its long deliberate descent as though there were no wind and no other flake, as though the sky had made it specifically and was watching to see where it would land. She stood at the window with her coffee and thought: here it is. Here it is again.",
    "the feeling of watching the first snow fall of winter",
  ],
  // Day 12 – May 31 – puzzle #13
  [
    "The bookshop smelled of slow time — of pages that had spent decades absorbing the particular quality of light in other rooms, of hands that had held and returned and passed along, of everything that had been thought near these books and left its trace in the air. She moved slowly through the narrow stacks and felt, as she always did here, that she was inside something's memory rather than her own.",
    "the smell of an old bookshop",
    "The platform held them for a moment longer than it should have, and then the train moved and the city began to rearrange itself in the window. She was pressed against a stranger's shoulder, anchored to a strap above her head, part of a collective body performing its morning obligation. She thought about each of them separately — each private morning, each destination — and then the thought dissolved in the noise.",
    "a morning commute on a crowded subway",
    "The last day was the longest, the way last days always were, bloated with the accumulated weight of the ones before it. She had tried to hold every detail — the smell of the pool, the sound of the fan at night, the specific quality of the afternoon light through the curtains — because she already knew, at nine, that memory was unreliable and that she would lose most of this before October.",
    "the last day of summer vacation as a child",
  ],
  // Day 13 – June 1 – puzzle #14
  [
    "The window was a small cold rectangle of dark, and against it the reflection of the cabin interior — the overhead lights, the seated passengers, herself — floated like a ghost over the invisible land below. Somewhere under that darkness there were towns whose names she didn't know, lit from within, going about their business. She thought: we are always passing over other lives without knowing what they are.",
    "the view from an airplane window at night",
    "The photograph was black and white and small, the size of a playing card, its corners bent soft with age. A man stood beside a car she didn't recognise, in a street that no longer existed. He was not looking at the camera. He seemed to be listening to something just outside the frame, and his expression was entirely concentrated — not absent, but entirely present to something invisible. She turned it over. Nothing.",
    "finding an old photograph of someone you don't recognize",
    "The clockwork required winding at the same hour every night — if he forgot, the mechanism slowed and the rhythm of the light changed, and a ship somewhere out there might misread its distance from the rocks. He had not forgotten in twenty-three years. It was, he supposed, the closest he had come to prayer: the same gesture, every night, regardless of how he felt about it.",
    "a lighthouse keeper's nightly routine",
  ],
  // Day 14 – June 2 – puzzle #15
  [
    "By two in the afternoon the reading room held only three people, each in a separate silence, each entirely absent from the others. The light came in at an angle that only existed in this hour and gave everything a quality of deliberateness — the dust motes, the spines of books, the slight movement of a page being turned. She had come in with a specific question. She had forgotten what it was. That seemed fine.",
    "the quiet of a library on a weekday afternoon",
    "The town had grown in the wrong directions — outward, toward the highway, away from the water. The streets she had named in her childhood had been renamed. The school was a storage facility. She drove slowly, looking for something she recognised, and found it finally in the smell of the river coming through the car window — unchanged, exact, thirty years old and absolutely accurate.",
    "the feeling of returning to a hometown after years away",
    "The sheets were too stiff and the pillow smelled of strangers' hair. Outside the window a city she didn't know was conducting its evening — sirens at intervals, a restaurant noise somewhere below, the particular percussion of a street she would never learn. She lay in the foreign dark and tried to make herself at home in her own body, which was the only place she had brought with her.",
    "waking up in an unfamiliar hotel room",
  ],
  // Day 15 – June 3 – puzzle #16
  [
    "He was still there at closing — the same booth, the same coffee, the same distant expression of a man who had arranged himself in a public space in order to be private. She had refilled his cup four times without being asked. There is an art to the last customer, she had learned: you do not hurry them, you do not hover, you let them be the last warm person in the place for as long as they need.",
    "the last customer in a closing diner",
    "The first lightning came without thunder — just the white revelation of the garden in the dark, snapshot and gone. Then the rain, then the thunder arriving late and enormous, shaking the window in its frame. She didn't move from the sofa. Outside was becoming something extreme, and inside was defined entirely by that extremity, its warmth sharp and particular in the way that warmth only is when something outside threatens it.",
    "watching a thunderstorm from inside a warm house",
    "Before anyone else was awake, the coffee was hers alone. She held the mug with both hands and stood at the kitchen window and watched the garden materialise slowly out of the dark, growing more specific with each degree of morning. This was the one half-hour she kept for herself, in which the day had not yet declared its intentions and everything was still possible.",
    "the smell of coffee in an empty kitchen at dawn",
  ],
  // Day 16 – June 4 – puzzle #17
  [
    "The train moved through villages she would never visit, past houses whose curtained windows gave nothing away, past gardens whose roses were past their best and whose sheds were full of things she would never know about. She had the window seat and she watched it all go by — the life going on without her, the world being itself, privately, in the gap between two cities she was only passing through.",
    "riding a train through unfamiliar countryside",
    "Without the visitors the paintings were only paintings again — no longer performing their accessibility, no longer waiting to be understood. In the long gallery the Rembrandts regarded the empty room with their usual ambiguity. The guards sat in their chairs at the end of each gallery and looked at nothing in particular and the building settled around them, ancient and dark and full of all that had been kept.",
    "the stillness of a museum after closing time",
    "The letter was dated 1962 and addressed to a woman whose name she didn't recognise, in a city where her grandmother had once lived. Three pages in a careful hand — not formal, but careful, the way you are careful when you want to be understood precisely. The last line: I think I may not send this. Below it, nothing. And she hadn't. And here it was.",
    "finding a letter that was never sent",
  ],
  // Day 17 – June 5 – puzzle #18
  [
    "The water was cold enough to matter and dark enough to be more than itself — every arm's length became a negotiation, every stroke a small decision to continue. She turned onto her back and looked at the stars and let herself be held by the cold and the dark in equal measure, and thought: this is the only kind of alone that doesn't feel like loss.",
    "the feeling of swimming alone in a lake at night",
    "The fog had erased all certainty of distance. Buildings arrived suddenly and passed. She knew the street by the sound of her footsteps, by the particular camber of the pavement under her shoes, by the smell of the bakery that meant she was two blocks from home. The city she walked through this morning was not the city she knew — it was the city's idea of itself, temporarily.",
    "a walk through a city during early morning fog",
    "The room darkened by degrees — first the houselights, then the exit signs dimmed, then the absolute black of a space made entirely for watching. She had been to this theatre before but it was always different, this moment — the held breath of an audience becoming a single organism, surrendering its individual silences to a collective one. Then the light on the curtain. Then: begin.",
    "the moment before a concert begins",
  ],
  // Day 18 – June 6 – puzzle #19
  [
    "She went from room to room after they'd gone, not looking for anything, just moving through the spaces they had occupied and that now held only the shapes they'd left: a cup on the wrong side of the sink, a shoe under the coffee table, a book left open to a page she would never read. The house was louder in their absence than it had been with them in it.",
    "the particular silence of a house after everyone has left",
    "The water pulled back from the sand with a sound like breathing — like the world exhaling after a long held breath — and left behind it a wet darkness that reflected nothing. She stood at the edge where wet became dry and watched the light going out of the water. The tide, she had read, was the moon's business, not the sea's. Even the ocean is pulled by something.",
    "watching the tide go out at dusk",
    "The first drops hit the pavement and the smell rose immediately — ancient, mineral, alive. Around her people walked faster without deciding to, their bodies responding before their minds had processed the rain. She stopped and breathed it in: that smell, which was the smell of earth remembering water, of stone releasing what it had held all summer, of everything that had been dry agreeing to change.",
    "the smell of rain on hot pavement in summer",
  ],
  // Day 19 – June 7 – puzzle #20
  [
    "She was awake before she understood what was different — a quality of silence, a particular stillness, a light coming through the curtains that was too even, too complete. She crossed to the window. The street below was gone, replaced by a white that had erased all the useful distinctions — kerb from pavement, pavement from garden — and given everything back transformed. She stood in her bare feet on the cold floor and felt something loosen in her chest.",
    "waking up to find snow has fallen overnight",
    "She read the last sentence three times, each time more slowly, and then closed the book over her thumb as though she might go back. She had been inside it for two weeks, carrying it on the commute, reading it in the bath, waking early to get another chapter before the day began. Now the story was complete and she was outside it again, returned to herself, blinking.",
    "the feeling of finishing a book you didn't want to end",
    "She had arrived early deliberately, wanting these minutes before the film began — the screen blank and enormous and entirely available, the seats filling slowly around her, the room settling into its preparatory hush. She liked to watch the trailers. She liked the moment when the sound expanded and the picture sharpened into focus. But most of all she liked this: the almost.",
    "sitting alone in a cinema before the film starts",
  ],
  // Day 20 – June 8 – puzzle #21
  [
    "At the top of the lighthouse, on a clear day, you could see the curvature of the earth in the line where sea met sky — or you thought you could, which amounted to the same thing. The world was immense from here and perfectly still. She had climbed the hundred steps because she'd been told the view was worth it, and she understood, now, that 'worth it' meant something different at the top of a lighthouse than it did anywhere else.",
    "the view from the top of a lighthouse on a clear day",
    "The train passed every night at the same hour, its sound arriving first as a vibration in the mattress springs before resolving into the specific groan and rush of something fast and purposeful going somewhere she was not. She had learned to sleep through it. But some nights it moved through her instead of past her, and she lay awake a long time after, listening to where the silence had been.",
    "the sound of a distant train heard from a bedroom window",
    "By the end of August the fireflies had grown fewer, their signals shorter, their appearances less reliable. She went out every evening anyway and sat in the grass at the field's margin and watched for them — the small cold lights that asked no question and carried no answer, that simply were and were and then were not. She thought: this is what it means to pay attention to something while it lasts.",
    "watching fireflies in a field at the end of summer",
  ],
  // Day 21 – June 9 – puzzle #22
  [
    "The announcement came first, then the slowing, then the particular quality of stillness that is a train stopped at its destination rather than between stations. She had been in motion for nine hours. Now the platform was a fixed point and she walked toward it as though learning to walk again, one foot placed deliberately before the other, relearning the grammar of staying still.",
    "the feeling of a long journey finally reaching its end",
    "The path was deep with wet leaves after the storm — each step a soft collapse, the smell enormous around her, everything that had been dry and contained in the soil now given back to the air. The trees still dripped. Between the trunks, the light came through in shafts where the clouds had broken, and the forest that had been dark an hour ago was full of the ordinary miracle of light returned.",
    "standing in a forest after a heavy rainstorm",
    "The light on the tops of the buildings changed at six and continued changing — amber to gold to the particular rose that the evening offers briefly and then takes away. She stood in the street and tipped her head back. Around her the city continued its business, indifferent to its own beauty, which is perhaps the only way to live in a place that is beautiful every evening without going mad.",
    "the last light of the day touching the tops of buildings",
  ],
  // Day 22 – June 10 – puzzle #23
  [
    "She woke before four into absolute dark and lay still and let the dark be what it was. The sounds of the house arranged themselves around her: the refrigerator's cycling, the creak of the roof settling in the cold, the barely-sound of her own breathing. There was something about this hour that belonged to no one — not to night, which was ending, and not yet to morning, which had not decided to begin.",
    "waking very early and finding the world still dark and quiet",
    "The beach was always the same and always different — the sand itself redistributed overnight by wind and tide, the horizon identical but the light on it changed. She walked down to the water's edge and paused, and then, because she always did, she took off her shoes and stepped in. Cold. Always cold. And the sand came up between her toes with its old familiar insistence, exactly as it had always done.",
    "the feeling of sand between your toes for the first time each summer",
    "By afternoon the snow had accumulated enough to change everything: the garden was a different shape, the trees were carrying something they hadn't been carrying this morning, the street outside the window was quieter than a street should be. She made tea and stood at the window and watched it still falling — unhurried, without apparent intention, each flake taking the full amount of time it needed.",
    "the feeling of watching the first snow fall of winter",
  ],
  // Day 23 – June 11 – puzzle #24
  [
    "The shop was down a flight of steps from street level, which meant it had survived by being overlooked. Inside: the accumulated smell of ten thousand books, organised by a logic that was entirely personal and entirely consistent — biography by colour, fiction by the decade it felt like, poetry in no order at all except the order of what deserved to be found accidentally. She spent an hour there and emerged feeling restored.",
    "the smell of an old bookshop",
    "The platform was packed before the doors opened. When the train came it swallowed them in one practised motion and they arranged themselves in the compressed democracy of rush hour — strangers pressed into adjacency, each one performing the commuter's art of being present without being there. She held the strap above her head and felt the city moving under her feet, entirely indifferent to any of them.",
    "a morning commute on a crowded subway",
    "The last day of summer was always the same day — not the actual last, but the day when something in the light shifted and you understood that it had already begun to leave. She was ten and then she was twelve and then she was fifteen, and every year it arrived with the same authority. She could not have said what changed. But she always knew. She always knew.",
    "the last day of summer vacation as a child",
  ],
  // Day 24 – June 12 – puzzle #25
  [
    "The window was dark and the reflection of the cabin hung in it like a transparency — overlaid on the invisible country thirty thousand feet below. She had been in the air for seven hours and had lost track of which ocean they were crossing. It didn't matter. Up here, geography was an abstraction. Only the small pressurised world of the aircraft was real: the recirculated air, the distant hum of engines, the astonishing fact of flight.",
    "the view from an airplane window at night",
    "It was in her grandmother's house, in a shoebox on a shelf in the back of a closet. A woman — twenty, perhaps, in the style of the early forties — standing in front of a car, one hand raised against the sun. Not posing. Not performing for the camera. Simply standing, squinting, alive. She stared at it for a long time and felt the particular helplessness of being unable to ask.",
    "finding an old photograph of someone you don't recognize",
    "The machinery of the light ran on clockwork, and the clockwork ran on his attention — nightly, unhurried, as reliable as the tides it helped the ships navigate. He thought of himself not as a keeper of the light but as a keeper of the interval: the rhythm of it, the reliable pulse that turned the dark into information. He wound the mechanism and watched the beam sweep out across the water and thought: this, at least, is something I can do.",
    "a lighthouse keeper's nightly routine",
  ],
  // Day 25 – June 13 – puzzle #26
  [
    "By midday the reading room had achieved its fullest quiet — not absence but concentration, each person folded into the particular silence of sustained attention. She had been there since nine and had read nothing; she had simply been inside the quiet, which seemed purpose enough. There is a quality of library silence, she thought, that is different from other silences: it has intent.",
    "the quiet of a library on a weekday afternoon",
    "The drive from the airport took twenty minutes and the town came at her in a series of recognitions and failures of recognition — the hardware store, gone; the bowling alley, gone; the hill above the cemetery, still the same hill, still the same gradient, still producing in her the same slight anxiety it had always produced. She parked in front of a house that was now the wrong colour and sat in the car a long time.",
    "the feeling of returning to a hometown after years away",
    "The hotel room held a hum she couldn't locate — air conditioning, or something deeper in the building's infrastructure, a vibration that was below hearing but above silence. She lay in the wide unfamiliar bed and looked at the ceiling and tried to locate herself in the story of her own day, which felt very far away. Tomorrow she would be someone who knew where she was. Tonight she was only here.",
    "waking up in an unfamiliar hotel room",
  ],
  // Day 26 – June 14 – puzzle #27
  [
    "At eleven forty-five she began to turn off the lights and the last customer pretended not to notice. He was reading something — or holding something that looked like reading. She worked around him, stacking chairs, counting the till, performing the theatre of closing without performing its central act. Finally she stood at the counter and looked at him and he looked up and said: I'll go. And he went.",
    "the last customer in a closing diner",
    "The storm declared itself at two in the afternoon and she had nowhere to be. She pulled the blanket from the back of the sofa and arranged herself at the window and watched the weather achieve its intentions — lightning first, then the delay, then the enormous sound of something decided. Inside the house everything was warm and unnecessary and specifically good because of what was happening on the other side of the glass.",
    "watching a thunderstorm from inside a warm house",
    "She heard the coffee maker before she smelled it and smelled it before she was properly awake. By the time she got downstairs the kitchen was holding its quiet morning version of itself — still, grey-lit, waiting. She poured a mug and stood at the counter without turning on the light and breathed in the smell, which was the smell of the day not yet started, the best of all possible smells.",
    "the smell of coffee in an empty kitchen at dawn",
  ],
  // Day 27 – June 15 – puzzle #28
  [
    "The countryside outside the window was giving nothing away — wet fields, the occasional farmhouse set back from the road, pylons crossing the hills at intervals. It was the kind of landscape that existed entirely for itself, that did not perform or explain. She watched it go by and felt something release in her that she hadn't known was held — the particular relief of passing through a place that has no claim on you.",
    "riding a train through unfamiliar countryside",
    "After hours the museum became itself — not a place for looking but a place for holding. The paintings hung in the silence with the patience of things that have outlasted everything that made them. A guard dozed in his chair and the building settled around him, and all the accumulated acts of seeing that had happened in these rooms seemed to remain, like a warmth left by a body that has left the room.",
    "the stillness of a museum after closing time",
    "She found it tucked into the back of a drawer in a desk she was clearing out — three pages in a handwriting she didn't know, folded into thirds, sealed with a piece of tape gone amber with age. The date at the top: October 1958. The last line, on the third page, in smaller letters: perhaps I will not send this. There was no address. There was no name at the bottom. There was only this.",
    "finding a letter that was never sent",
  ],
  // Day 28 – June 16 – puzzle #29
  [
    "The lake received her with its usual cold indifference and she swam out past the dock lights into the dark, where the water was deepest and most itself. On her back she could see the stars and the stars' reflections and for a moment she was not sure which way was up, which was fine — which was, she thought, the entire point of swimming alone at night in water too deep to stand in.",
    "the feeling of swimming alone in a lake at night",
    "She turned left off the main road and walked into the fog that had settled in the older part of the city, and the streets became something provisional — their edges uncertain, their distances unreliable. She had lived here for years and knew every corner, but this morning knowledge wasn't enough; you needed something else to navigate by: sound, smell, the sense of the pavement's particular slope.",
    "a walk through a city during early morning fog",
    "The musicians took their seats and the audience felt it — a collective adjustment, a straightening. The conductor entered and the hall went under completely, every voice and movement absorbed into a listening so total it seemed to have physical weight. She closed her programme and breathed and thought: everything that happens next will happen only once. The thought was almost unbearable. The thought was wonderful.",
    "the moment before a concert begins",
  ],
  // Day 29 – June 17 – puzzle #30
  [
    "After they left she walked the rooms slowly, touching nothing, looking at how the space held the shapes of their presence — the imprint of bodies on the sofa cushions, the glasses rinsed but not yet put away, the good smell of the evening still in the air. The house was full of them, she realised. It would be full of them all night. She sat in the kitchen in the quiet and let it be.",
    "the particular silence of a house after everyone has left",
    "The tide retreated with enormous patience, taking its time about becoming less. She sat on the cold rock at the water's edge and watched it go and thought about how strange it was — that the ocean had this daily practice of diminishment and return, and that it was governed by something at a distance of two hundred and thirty-nine thousand miles, and that none of this was strange to the ocean.",
    "watching the tide go out at dusk",
    "She was halfway down the block when the rain began and the smell rose from the hot pavement immediately — alive, ancestral, the smell of stone agreeing to become itself again after a long dry period of pretending to be something harder. She stopped and breathed it in. Around her, people quickened their pace. She stood still a moment longer, giving the rain its due.",
    "the smell of rain on hot pavement in summer",
  ],
];

// ── Puzzle definitions ────────────────────────────────────────────────────────
const PUZZLES = [];

for (let dayIndex = 2; dayIndex <= 29; dayIndex++) {
  const dateObj = new Date('2026-05-19');
  dateObj.setUTCDate(dateObj.getUTCDate() + dayIndex);
  const date = dateObj.toISOString().split('T')[0];
  const puzzleNumber = dayIndex + 1;

  const ht = HUMAN_TEXTS[dayIndex];
  const hi = HUMAN_IMAGES[dayIndex];
  const [p1, t1, p2, t2, p3, t3] = AI_PASSAGES[dayIndex - 2];

  const items = [
    { type: 'text', content: p1, answer: 'ai', explanation: `Generated by Claude claude-sonnet-4-6 about "${t1}". AI text often produces grammatically perfect sentences with slightly generic emotional beats — look for overly balanced structure and lack of truly surprising word choices.` },
    { type: 'text', content: ht.content, answer: 'human', explanation: ht.explanation, source: ht.source },
    { type: 'text', content: p2, answer: 'ai', explanation: `Generated by Claude claude-sonnet-4-6 about "${t2}". The polished structure and conceptually inventive metaphors are characteristic of language model output.` },
    { type: 'image', content: hi.url, answer: 'human', explanation: hi.explanation, source: hi.source },
    { type: 'text', content: p3, answer: 'ai', explanation: `Generated by Claude claude-sonnet-4-6 about "${t3}". Notice the even pacing and absence of the kinds of small errors or tonal shifts that appear in prose written under genuine emotional pressure.` },
  ];

  // Deterministic shuffle based on puzzle number
  const seed = puzzleNumber;
  const order = [0, 1, 2, 3, 4];
  for (let i = 4; i > 0; i--) {
    const j = (seed * (i + 3) + i * 7) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const shuffled = order.map(i => items[i]);
  shuffled.forEach((item, i) => { item.id = `${date}-${i + 1}`; });

  PUZZLES.push({ date, puzzleNumber, items: shuffled });
}

// ── Write files ───────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
let skipped = 0;

for (const puzzle of PUZZLES) {
  const outPath = path.join(OUT_DIR, `${puzzle.date}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${puzzle.date}`);
    skipped++;
  } else {
    fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2));
    console.log(`  [done] ${puzzle.date}  #${puzzle.puzzleNumber}`);
    written++;
  }
}

console.log(`\nDone. Written: ${written}, Skipped: ${skipped}`);
