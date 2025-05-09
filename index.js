// index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Parse incoming JSON
app.use(express.json());

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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are MontiBot, a calm, thoughtful, and friendly assistant trained to answer questions about a private Montessori school. Always respond in clear, respectful language suitable for both new and experienced parents. Only answer questions related to Montessori philosophy, admissions, tuition, schedule, and related topics.`
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
