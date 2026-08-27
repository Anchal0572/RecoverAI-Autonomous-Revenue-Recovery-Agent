import { useState, useEffect } from 'react';
import {
  BookOpen, Search, FileText, Shield, Zap, HelpCircle,
  AlertTriangle, Tag
} from 'lucide-react';
import { queryKnowledgeBase, fetchKnowledgeDocuments } from '../api';

interface KnowledgeDoc {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority?: number;
  relevanceScore?: number;
}

interface Category {
  category: string;
  count: number;
  description: string;
}

const categoryConfig: Record<string, { icon: any; color: string }> = {
  policies: { icon: Shield, color: '#3b82f6' },
  playbooks: { icon: Zap, color: '#10b981' },
  escalation: { icon: AlertTriangle, color: '#f59e0b' },
  faqs: { icon: HelpCircle, color: '#8b5cf6' }
};

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeDoc[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async (category?: string) => {
    setLoading(true);
    try {
      const res = await fetchKnowledgeDocuments(category || undefined);
      setDocuments(res.documents || []);
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await queryKnowledgeBase(query, selectedCategory || undefined);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Search failed', err);
    }
    setSearching(false);
  };

  const handleCategorySelect = (cat: string | null) => {
    setSelectedCategory(cat);
    setSearchResults(null);
    setSelectedDoc(null);
    loadDocuments(cat || undefined);
  };

  useEffect(() => { loadDocuments(); }, []);

  const displayDocs = searchResults || documents;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          📚 Knowledge Base
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          RAG-powered knowledge system — merchant policies, recovery playbooks, escalation rules & FAQs
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search knowledge base... (e.g., 'retry policy', 'payment link playbook', 'escalation workflow')"
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
            Search
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleCategorySelect(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            !selectedCategory
              ? 'bg-primary text-white border-primary'
              : 'text-gray-400 border-border hover:border-gray-500'
          }`}
        >
          All ({categories.reduce((sum, c) => sum + c.count, 0)})
        </button>
        {categories.map(cat => {
          const config = categoryConfig[cat.category] || { icon: FileText, color: '#6b7280' };
          const Icon = config.icon;
          return (
            <button
              key={cat.category}
              onClick={() => handleCategorySelect(cat.category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                selectedCategory === cat.category
                  ? 'text-white border-transparent'
                  : 'text-gray-400 border-border hover:border-gray-500'
              }`}
              style={selectedCategory === cat.category ? { background: config.color, borderColor: config.color } : {}}
            >
              <Icon className="w-3 h-3" />
              {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ({cat.count})
            </button>
          );
        })}
      </div>

      {/* Search Results Badge */}
      {searchResults && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
          </span>
          <button
            onClick={() => { setSearchResults(null); setQuery(''); }}
            className="text-xs text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Documents + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto custom-sidebar-scrollbar">
          {loading ? (
            <div className="glass-card p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : displayDocs.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No documents found</p>
            </div>
          ) : (
            displayDocs.map(doc => {
              const config = categoryConfig[doc.category] || { icon: FileText, color: '#6b7280' };
              const Icon = config.icon;
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-surface/80 border-border hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: config.color }}>
                      {doc.category}
                    </span>
                    {doc.relevanceScore !== undefined && (
                      <span className="text-[10px] text-green-400 ml-auto">
                        {Math.round(doc.relevanceScore * 100)}% match
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-200">{doc.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{doc.content}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Document Detail */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const config = categoryConfig[selectedDoc.category] || { icon: FileText, color: '#6b7280' };
                  const Icon = config.icon;
                  return (
                    <>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${config.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ color: config.color, background: `${config.color}15` }}
                      >
                        {selectedDoc.category}
                      </span>
                    </>
                  );
                })()}
              </div>

              <h2 className="text-lg font-semibold text-gray-100 mb-4">{selectedDoc.title}</h2>

              <div className="prose prose-sm prose-invert max-w-none">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedDoc.content}</p>
              </div>

              {selectedDoc.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface border border-border rounded text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-400">Select a document to view details</h3>
              <p className="text-xs text-gray-500 mt-1">
                Browse categories or search for specific topics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
