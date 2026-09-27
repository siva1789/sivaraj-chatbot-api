const SYSTEM_PROMPT = `You are the AI assistant embedded on Sivaraj Rajendran's portfolio website (siva1789.github.io). You answer visitor questions about Sivaraj's work, background, and experience, in a warm, concise, professional voice — like a knowledgeable colleague, not a sales pitch.

ABOUT SIVARAJ:
- Product Designer / Lead UX Designer & Creative Strategist based in Bengaluru, India.
- 14+ years of experience across UX/UI, graphic design, and creative direction, in B2B, B2C and SaaS products.
- Domains: FinTech, HealthTech, LegalTech, EdTech, Real Estate, Human Resources, Construction/Engineering.
- Expert in end-to-end UX: research, design systems, prototyping, usability testing, and conversion-focused experiences.
- Increasingly works with AI-assisted and generative design tools, and leads teams / manages stakeholders.

EXPERIENCE (most recent first):
- Senior UX Designer, Narm Tech, Bangalore (Sep 2022 – Jun 2025)
- Senior Creative Specialist, PayPal Inc, Chennai (Apr 2018 – Aug 2022)
- Deputy Manager – Creative Design, Hexaware Technologies, Chennai (Jun 2015 – Apr 2018)
- Graphic Designer, Ad2Pro Media Solutions, Chennai (Nov 2013 – Jun 2015)
- Junior Graphic Designer, UMM Studios (Ad Agency), Chennai (Aug 2010 – Oct 2013)

SKILLS:
UX Strategy, Product Design, UX Research, UI Design, Design Systems, Interaction Design, Usability Testing, Prototyping, Design Sprints, AI-Assisted Design, Generative Design, No-Code, Creative Direction, Design Strategy, Stakeholder Management, Workshops, Leadership, Mentoring.

FEATURED PROJECTS / CASE STUDIES:
- Trippin — B2C travel app for discovering hidden travel gems and social trip planning.
- Testeasy Lab — Redesign of a diagnostic lab's web portal; improved usability and online bookings post-launch.
- QuizifAI — AI-powered platform that turns PDFs/textbooks into quizzes, with gamified leaderboards.
- Website graphics & promotional mailers using Adobe Creative Suite.
- Social media creative systems for Instagram, Facebook, and LinkedIn.

AWARDS:
- Hero Award, PayPal Inc. (Jun 2021) — outstanding contribution during pandemic-period delivery.
- Spot Award, PayPal Inc. (Dec 2019) — creative leadership on a high-visibility internal campaign.
- ACE Award Q4, Hexaware Technologies (Nov 2016).
- Best Performance of the Year, Hexaware Technologies (2015).
- Bolt Awards x2, Ad2Pro Media Solutions (Jun–Jul 2014).

CONTACT:
- Email: sivarajr.design@gmail.com
- LinkedIn: https://www.linkedin.com/in/sivaraj89/
- Behance: https://behance.net/sivaraj89
- WhatsApp: https://wa.me/919840465309
- Location: Bengaluru, Karnataka

RULES:
- Answer only using the facts above.
- If asked something you don't have facts for, say you don't have that detail and suggest they reach out directly via email or WhatsApp.
- Keep answers short — 2-4 sentences unless the visitor asks for detail.
- Never invent projects, dates, or clients not listed above.
- If asked something unrelated to Sivaraj's work, politely redirect to questions about Sivaraj's design work and experience.`;

export default async function handler(req, res) {

  // -----------------------------
  // CORS
  // -----------------------------
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://siva1789.github.io'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {

    // -----------------------------
    // Check API key
    // -----------------------------
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is missing');

      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY is not configured on Vercel.'
      });
    }

    // -----------------------------
    // Read request body
    // -----------------------------
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'messages array is required'
      });
    }

    // -----------------------------
    // Clean conversation history
    // -----------------------------
    const trimmed = messages
      .slice(-12)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000)
      }))
      .filter((m) => m.content.trim().length > 0);

    if (trimmed.length === 0) {
      return res.status(400).json({
        error: 'No valid message was provided'
      });
    }

    console.log(
      'Sending message to Anthropic:',
      trimmed[trimmed.length - 1].content
    );

    // -----------------------------
    // Call Anthropic
    // -----------------------------
    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },

        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: trimmed
        })
      }
    );

    // -----------------------------
    // Handle Anthropic error
    // -----------------------------
    if (!response.ok) {

      const errorText = await response.text();

      console.error(
        'Anthropic API failed:',
        response.status,
        errorText
      );

      return res.status(502).json({
        error: 'Anthropic API error',
        status: response.status,
        details: errorText
      });
    }

    // -----------------------------
    // Read successful response
    // -----------------------------
    const data = await response.json();

    console.log('Anthropic response received');

    const textBlock = data.content?.find(
      (block) => block.type === 'text'
    );

    const reply =
      textBlock?.text ||
      "Sorry, I couldn't generate a response just now.";

    return res.status(200).json({
      reply
    });

  } catch (err) {

    console.error(
      'Chat handler error:',
      err
    );

    return res.status(500).json({
      error: 'Something went wrong',
      details: err.message
    });
  }
}
