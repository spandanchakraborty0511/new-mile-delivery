const aiAgentService = require('../services/aiAgentService');

async function chat(req, res, next) {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const response = await aiAgentService.handleChat(messages, req.user);
    
    return res.json({ response });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };
