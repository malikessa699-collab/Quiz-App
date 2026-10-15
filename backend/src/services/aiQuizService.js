const config = require('../config');

/**
 * AI Quiz Generation Service.
 *
 * Supports two providers (OpenAI, Google Gemini) via REST calls.
 * If no provider is configured, or the AI call fails, it falls back
 * to a deterministic built-in generator so the application still
 * works offline. Question payloads are validated before use so that
 * generated content can never execute as code.
 */

// ------------------------------------------------------------------
// Built-in fallback generator
// ------------------------------------------------------------------

const EASY_MCQ_BANK = [
  {
    topic: 'general',
    q: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    answer: 'Mars',
    explanation: 'Mars appears reddish because of iron oxide (rust) on its surface.',
  },
  {
    topic: 'general',
    q: 'What is the chemical symbol for water?',
    options: ['H2O', 'CO2', 'O2', 'NaCl'],
    answer: 'H2O',
    explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.',
  },
  {
    topic: 'general',
    q: 'How many continents are there on Earth?',
    options: ['5', '6', '7', '8'],
    answer: '7',
    explanation: 'The seven continents are Africa, Antarctica, Asia, Australia, Europe, North America, and South America.',
  },
];

const MEDIUM_MCQ_BANK = [
  {
    topic: 'general',
    q: 'In Python, which keyword is used to define a function?',
    options: ['func', 'def', 'function', 'define'],
    answer: 'def',
    explanation: 'Python functions are defined with the "def" keyword followed by the function name.',
  },
  {
    topic: 'general',
    q: 'What does HTTP stand for?',
    options: [
      'HyperText Transfer Protocol',
      'High Transfer Text Protocol',
      'HyperText Transmission Process',
      'Host Transfer Text Protocol',
    ],
    answer: 'HyperText Transfer Protocol',
    explanation: 'HTTP is the protocol used for transferring hypertext requests and responses on the web.',
  },
  {
    topic: 'general',
    q: 'Which organ pumps blood throughout the human body?',
    options: ['Lungs', 'Liver', 'Heart', 'Brain'],
    answer: 'Heart',
    explanation: 'The heart is a muscular organ that circulates blood through the vascular system.',
  },
];

const HARD_MCQ_BANK = [
  {
    topic: 'general',
    q: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    answer: 'O(log n)',
    explanation: 'Binary search halves the search space each step, giving logarithmic time complexity.',
  },
  {
    topic: 'general',
    q: 'Which quantum number describes the orientation of an orbital in space?',
    options: ['Principal', 'Azimuthal', 'Magnetic', 'Spin'],
    answer: 'Magnetic',
    explanation: 'The magnetic quantum number (ml) describes the orientation of an orbital around the nucleus.',
  },
  {
    topic: 'general',
    q: 'In the OSI model, which layer provides end-to-end communication and error recovery?',
    options: ['Network', 'Data Link', 'Transport', 'Session'],
    answer: 'Transport',
    explanation: 'The Transport layer (Layer 4) ensures reliable end-to-end delivery with error recovery.',
  },
];

const TRUEFALSE_BANK = [
  {
    q: 'The Great Wall of China is visible from the Moon with the naked eye.',
    answer: 'False',
    explanation: 'This is a common myth; the wall is not visible from the Moon without aid.',
  },
  {
    q: 'Light travels faster than sound.',
    answer: 'True',
    explanation: 'Light travels at about 300,000 km/s while sound travels at about 343 m/s in air.',
  },
  {
    q: 'Sharks are mammals.',
    answer: 'False',
    explanation: 'Sharks are cartilaginous fish, not mammals.',
  },
  {
    q: 'JavaScript is a statically typed language by default.',
    answer: 'False',
    explanation: 'JavaScript is dynamically typed.',
  },
  {
    q: 'Water boils at 100°C at sea level.',
    answer: 'True',
    explanation: 'At standard atmospheric pressure, water boils at 100°C.',
  },
];

const SHORT_BANK = [
  {
    q: 'What does "CPU" stand for?',
    answer: 'Central Processing Unit',
    explanation: 'The CPU is the primary component that processes instructions.',
  },
  {
    q: 'Name the currency of Japan.',
    answer: 'Yen',
    explanation: 'The official currency of Japan is the yen (¥).',
  },
  {
    q: 'What is the largest ocean on Earth?',
    answer: 'Pacific',
    explanation: 'The Pacific Ocean is the largest and deepest ocean.',
  },
  {
    q: 'Who developed the theory of general relativity?',
    answer: 'Einstein',
    explanation: 'Albert Einstein published the theory of general relativity in 1915.',
  },
  {
    q: 'What does "HTML" stand for?',
    answer: 'HyperText Markup Language',
    explanation: 'HTML is the standard markup language for web documents.',
  },
];

function pickFromBank(bank, count, usedIndices) {
  let available = [];
  for (let i = 0; i < bank.length; i += 1) {
    if (!usedIndices.has(i)) available.push({ index: i, item: bank[i] });
  }
  // If the bank is exhausted, reset so questions can repeat deterministically.
  if (available.length === 0) {
    usedIndices.clear();
    available = bank.map((item, index) => ({ index, item }));
  }
  // Deterministic pseudo-shuffle
  const shuffled = available.sort((a, b) => (a.item.q < b.item.q ? -1 : 1));
  const chosen = shuffled.slice(0, count);
  chosen.forEach((c) => usedIndices.add(c.index));
  return chosen.map((c) => c.item);
}

/**
 * Deterministic topic-aware built-in generator.
 * Produces structurally valid questions (no AI required).
 */
function generateBuiltin({ topic, difficulty, questionTypes, count }) {
  const used = new Set();
  const questions = [];
  const types = questionTypes && questionTypes.length ? questionTypes : ['mcq', 'truefalse', 'short'];
  const countsPerType = Math.max(1, Math.floor(count / types.length));
  const remainder = count - countsPerType * types.length;

  types.forEach((type, idx) => {
    let n = countsPerType;
    if (idx < remainder) n += 1;
    for (let i = 0; i < n && questions.length < count; i += 1) {
      if (type === 'mcq') {
        const bank = difficulty === 'easy' ? EASY_MCQ_BANK : difficulty === 'hard' ? HARD_MCQ_BANK : MEDIUM_MCQ_BANK;
        const item = pickFromBank(bank, 1, used)[0];
        questions.push({
          type: 'mcq',
          text: item.q,
          options: item.options,
          correctAnswer: item.answer,
          explanation: `${item.explanation} (Topic: ${topic})`,
          marks: 1,
        });
      } else if (type === 'truefalse') {
        const item = pickFromBank(TRUEFALSE_BANK, 1, used)[0];
        questions.push({
          type: 'truefalse',
          text: item.q,
          options: ['True', 'False'],
          correctAnswer: item.answer,
          explanation: `${item.explanation} (Topic: ${topic})`,
          marks: 1,
        });
      } else {
        const item = pickFromBank(SHORT_BANK, 1, used)[0];
        questions.push({
          type: 'short',
          text: item.q,
          options: [],
          correctAnswer: item.answer,
          explanation: `${item.explanation} (Topic: ${topic})`,
          marks: 1,
        });
      }
    }
  });

  return questions;
}

// ------------------------------------------------------------------
// Provider clients
// ------------------------------------------------------------------

async function callOpenAI(prompt) {
  const { apiKey, model } = config.ai.openai;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an expert educational quiz generator. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 300)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return extractJson(content);
}

async function callGemini(prompt) {
  const { apiKey, model } = config.ai.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return extractJson(text);
}

function extractJson(text) {
  if (!text) throw new Error('AI returned an empty response.');
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI response did not contain valid JSON.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ------------------------------------------------------------------
// Validation & sanitization
// ------------------------------------------------------------------

function validateQuestion(question, index) {
  const type = question.type;
  if (!['mcq', 'truefalse', 'short'].includes(type)) {
    throw new Error(`Question ${index + 1}: invalid type "${type}".`);
  }
  const text = String(question.text || '').trim();
  if (text.length < 5) {
    throw new Error(`Question ${index + 1}: question text is too short.`);
  }
  let correctAnswer = String(question.correctAnswer || '').trim();
  if (!correctAnswer) {
    throw new Error(`Question ${index + 1}: missing correct answer.`);
  }

  let options = [];
  if (type === 'mcq') {
    options = (Array.isArray(question.options) ? question.options : []).map((o) => String(o).trim()).filter(Boolean);
    if (options.length !== 4) {
      throw new Error(`Question ${index + 1}: MCQs must have exactly 4 options.`);
    }
    if (!options.includes(correctAnswer)) {
      throw new Error(`Question ${index + 1}: correct answer must match one option.`);
    }
  } else if (type === 'truefalse') {
    options = ['True', 'False'];
    if (!['True', 'False'].includes(correctAnswer)) {
      throw new Error(`Question ${index + 1}: True/False answer must be True or False.`);
    }
  }

  return {
    type,
    text,
    options,
    correctAnswer,
    explanation: String(question.explanation || '').trim(),
    marks: 1,
  };
}

// ------------------------------------------------------------------
// Main generation entry point
// ------------------------------------------------------------------

/**
 * Generate a quiz.
 * @param {object} params { topic, difficulty, count, questionTypes, gradeLevel }
 * @returns {Promise<{questions: array, source: string}>}
 */
async function generateQuiz(params) {
  const { topic, difficulty = 'medium', count = 10, questionTypes = ['mcq', 'truefalse', 'short'], gradeLevel = '' } = params;

  const provider = (config.ai.provider || '').toLowerCase();
  const hasOpenAI = provider === 'openai' && config.ai.openai.apiKey;
  const hasGemini = provider === 'gemini' && config.ai.gemini.apiKey;

  if (hasOpenAI || hasGemini) {
    try {
      const typeList = questionTypes.join(', ');
      const prompt = `Generate a quiz about "${topic}" for ${gradeLevel ? `grade/level: ${gradeLevel}, ` : ''}difficulty "${difficulty}" with exactly ${count} questions.

Question types to include (mix evenly): ${typeList}.

Return ONLY JSON in this exact shape:
{
  "questions": [
    {
      "type": "mcq" | "truefalse" | "short",
      "text": "question text",
      "options": ["A", "B", "C", "D"] (4 options for mcq; ["True","False"] for truefalse; [] for short),
      "correctAnswer": "exact answer text that matches one option for mcq",
      "explanation": "clear, concise educational explanation"
    }
  ]
}

Rules:
- Questions must be factually accurate and appropriate for the topic.
- MCQs need exactly 4 plausible options with one correct answer.
- True/False answers must be exactly "True" or "False".
- Short-answer questions should expect a short, unambiguous answer.
- Never include code in the JSON. No markdown fences.`;

      const raw = hasOpenAI ? await callOpenAI(prompt) : await callGemini(prompt);
      const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
      if (rawQuestions.length < 1) {
        throw new Error('AI returned no questions.');
      }
      const questions = rawQuestions.slice(0, count).map((q, i) => validateQuestion(q, i));
      return { questions, source: 'ai' };
    } catch (err) {
      console.error('[AI] Generation failed, falling back to builtin:', err.message);
      const questions = generateBuiltin({ topic, difficulty, questionTypes, count });
      return { questions, source: 'builtin' };
    }
  }

  const questions = generateBuiltin({ topic, difficulty, questionTypes, count });
  return { questions, source: 'builtin' };
}

module.exports = { generateQuiz, generateBuiltin, validateQuestion };