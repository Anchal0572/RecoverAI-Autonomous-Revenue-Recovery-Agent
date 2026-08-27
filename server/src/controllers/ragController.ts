/**
 * RAG Controller — Knowledge Base Query and Document Listing
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { RAGKnowledgeService } from '../services/RAGKnowledgeService';

const ragService = new RAGKnowledgeService();

/**
 * POST /api/v1/rag/query
 * Query the knowledge base
 */
export async function queryKnowledge(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { query, category, limit = 5 } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const result = ragService.query(query.trim(), category, Math.min(limit, 10));

    return res.json({
      query: result.query,
      results: result.results.map(r => ({
        id: r.document.id,
        category: r.document.category,
        title: r.document.title,
        content: r.document.content,
        tags: r.document.tags,
        relevanceScore: Math.round(r.relevanceScore * 100) / 100
      })),
      context: result.context,
      totalMatches: result.totalMatches,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error querying knowledge base:', error);
    return res.status(500).json({ error: 'Knowledge base query failed.' });
  }
}

/**
 * GET /api/v1/rag/documents
 * List knowledge base documents
 */
export async function listDocuments(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { category } = req.query;
    const documents = ragService.getDocuments(category as string);
    const categories = ragService.getCategories();

    return res.json({
      documents: documents.map(d => ({
        id: d.id,
        category: d.category,
        title: d.title,
        content: d.content,
        tags: d.tags,
        priority: d.priority
      })),
      categories,
      totalDocuments: documents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error listing documents:', error);
    return res.status(500).json({ error: 'Failed to list knowledge base documents.' });
  }
}
