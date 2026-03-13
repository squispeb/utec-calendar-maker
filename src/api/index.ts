import { Hono } from 'hono';
import { parseScheduleMarkdown } from '../parser/pdfParser';

const app = new Hono();

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Parse PDF endpoint
app.post('/parse-pdf', async (c) => {
  try {
    const body = await c.req.json();
    const { markdown } = body;
    
    if (!markdown || typeof markdown !== 'string') {
      return c.json({ error: 'Missing or invalid markdown content' }, 400);
    }
    
    const parsedData = parseScheduleMarkdown(markdown);
    
    return c.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return c.json({ 
      error: 'Failed to parse PDF content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Convert PDF to markdown (placeholder - would integrate with actual PDF parser)
app.post('/convert-pdf', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }
    
    // For now, return a placeholder - in production this would use pdf-parse
    // or integrate with a PDF-to-markdown service
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Placeholder: In production, use pdf-parse here
    // const pdfData = await pdfParse(buffer);
    
    return c.json({
      success: true,
      message: 'PDF received successfully',
      fileName: file.name,
      fileSize: file.size
    });
  } catch (error) {
    console.error('Error converting PDF:', error);
    return c.json({ 
      error: 'Failed to convert PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
