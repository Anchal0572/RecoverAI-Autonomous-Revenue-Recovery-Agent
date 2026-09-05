import { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, Tag, ChevronRight } from 'lucide-react';
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
      if (res.documents && res.documents.length > 0 && !selectedDoc) {
        setSelectedDoc(res.documents[0]);
      }
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
      if (res.results && res.results.length > 0) {
        setSelectedDoc(res.results[0]);
      }
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
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">RAG Resolution Knowledge Playbook</h1>
          <p className="text-xs text-slate-400">Contextual recovery policies, escalation procedures, and automated strategy playbooks</p>
        </div>
      </div>

      {/* Search Bar & Category Pills */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search playbook & policies (e.g. 'retry policy', 'payment link timeout', 'escalation')..."
              className="input-field pl-9 h-9 text-xs"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
          >
            Search RAG
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 overflow-x-auto custom-sidebar-scrollbar text-xs">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              !selectedCategory 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All Playbooks ({categories.reduce((sum, c) => sum + c.count, 0)})
          </button>
          {categories.map(cat => (
            <button
              key={cat.category}
              onClick={() => handleCategorySelect(cat.category)}
              className={`px-2.5 py-1 rounded font-medium transition-colors capitalize ${
                selectedCategory === cat.category 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.category} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Document Directory / Right Reading Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Directory Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-3 space-y-2 max-h-[540px] overflow-y-auto custom-sidebar-scrollbar">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-800">
            Resolution Playbooks ({displayDocs.length})
          </div>

          {loading ? (
            <div className="p-4 text-center text-slate-400 text-xs">Loading playbooks...</div>
          ) : displayDocs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">No playbooks found.</div>
          ) : (
            displayDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-colors space-y-1 ${
                    isSelected 
                      ? 'bg-blue-600/15 border-blue-500/30 text-blue-300' 
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">{doc.category}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="font-semibold text-slate-200">{doc.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{doc.content}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Playbook Reader Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-md p-5 flex flex-col justify-between">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30 uppercase">
                  {selectedDoc.category}
                </span>
                <span className="text-xs font-mono text-slate-500">REF-{selectedDoc.id}</span>
              </div>

              <h2 className="text-base font-bold text-slate-100">{selectedDoc.title}</h2>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedDoc.content}
              </div>

              {selectedDoc.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select a playbook document from the left directory to view full operational procedures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

