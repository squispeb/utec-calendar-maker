import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Convert PDF to markdown using markitdown MCP
app.post('/convert-pdf', async (c) => {
  try {
    const body = await c.req.json();
    const { dataUri, content } = body;
    
    // For now, return the raw content if provided
    // In production, this would call the markitdown MCP tool
    if (content) {
      return c.json({ 
        success: true, 
        markdown: content 
      });
    }
    
    // If dataUri is provided, we need to decode and process
    if (dataUri) {
      // Extract base64 data
      const base64Match = dataUri.match(/base64,(.+)/);
      if (!base64Match) {
        return c.json({ error: 'Invalid data URI format' }, 400);
      }
      
      // For now, return a message that markitdown needs to be called
      // The actual conversion would happen via markitdown MCP
      return c.json({
        success: false,
        error: 'Markitdown MCP not yet implemented on server',
        message: 'Using fallback PDF.js extraction'
      });
    }
    
    return c.json({ error: 'No content or dataUri provided' }, 400);
    
  } catch (error) {
    console.error('Error converting PDF:', error);
    return c.json({ 
      error: 'Failed to convert PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;