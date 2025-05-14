// index.js
const fs = require('fs');
const path = require('path');

// Load stored embeddings from disk
const embeddingData = JSON.parse(fs.readFileSync(path.resolve('data/embeddings.json'), 'utf-8'));

// Cosine similarity function
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dot / (mag1 * mag2);
}

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());           // Enable CORS for all routes
app.use(express.json());   // Enable JSON body parsing

// Root route — this is the part you're adding now
app.get('/', (req, res) => {
  res.send('Welcome to the MontiBot backend!');
});

// Simple health check route
app.get('/ping', (req, res) => {
  res.send('MontiBot backend active');
});

//Chat route
const fetch = require('node-fetch');

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }
// Embed the user's message
const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: userMessage
  })
});

const embeddingDataResponse = await embeddingResponse.json();
const userEmbedding = embeddingDataResponse.data[0].embedding;

// Compare user embedding to stored snippets
const ranked = embeddingData.map(item => ({
  ...item,
  score: cosineSimilarity(userEmbedding, item.embedding)
})).sort((a, b) => b.score - a.score);

const topMatch = ranked[0];
const contextText = topMatch ? topMatch.text : '';
console.log('🔍 System prompt:', contextText
  ? `You must answer using only the following information. Do not omit phone numbers, email addresses, or URLs. Quote details exactly:\n\n${contextText}`
  : `You are MontiBot, a calm, thoughtful, and friendly assistant trained to answer questions about our Montessori school.`
);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
messages: [
  {
    role: 'system',

content: contextText
  ? `You must answer using only the following information. Do not omit phone numbers, email addresses, or URLs. Quote details exactly:\n\n${contextText}`
  : `You are MontiBot, a calm, thoughtful, and friendly assistant trained to answer questions about our Montessori school.`

  },
  {
    role: 'user',
    content: userMessage
  }
],
        max_tokens: 300
      })
    });

    const data = await response.json();
    const { prompt_tokens, completion_tokens, total_tokens } = data.usage || {};
console.log("Token usage:", { prompt_tokens, completion_tokens, total_tokens });


    // Log the full OpenAI response for debugging
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    if (Array.isArray(data.choices) && data.choices.length > 0 && data.choices[0].message) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({
        error: 'Unexpected API response structure',
        data: data  // include full response for debugging
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`MontiBot server running on port ${port}`);
});
