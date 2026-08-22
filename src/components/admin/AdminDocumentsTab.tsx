import React, { useState, useEffect } from 'react';
import { fetchPlatformDocuments } from '../../services/adminService';
import {
  Search,
  FileText,
  Eye,
  ExternalLink,
  Filter,
  Loader2,
} from 'lucide-react';

export const AdminDocumentsTab: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlatformDocuments().then((docs) => {
      setDocuments(docs);
      setFilteredDocs(docs);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let res = documents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.client_name?.toLowerCase().includes(q) ||
          d.industry?.toLowerCase().includes(q) ||
          d.id?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      res = res.filter((d) => d.status === statusFilter);
    }

    setFilteredDocs(res);
  }, [searchQuery, statusFilter, documents]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals by title, client or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Status:</span>
          </span>
          {['all', 'DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'PAID'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Global Documents Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading platform documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No quotations or invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 font-['Outfit']">
                <tr>
                  <th className="px-6 py-3.5">Proposal / Invoice Details</th>
                  <th className="px-6 py-3.5">Industry Category</th>
                  <th className="px-6 py-3.5">Deal Volume</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Views</th>
                  <th className="px-6 py-3.5 text-right">Client Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-['Plus_Jakarta_Sans',sans-serif]">
                {filteredDocs.map((doc) => {
                  const isApproved = doc.status === 'APPROVED' || doc.status === 'PAID';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Document Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{doc.title || 'Untitled Proposal'}</p>
                            <p className="text-[11px] text-slate-400">Client: {doc.client_name || 'Anonymous'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Industry */}
                      <td className="px-6 py-4">
                        <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md font-mono uppercase">
                          {doc.industry?.replace('_', ' ') || 'General'}
                        </span>
                      </td>

                      {/* Deal Volume */}
                      <td className="px-6 py-4">
                        <strong className="font-mono text-slate-100 font-bold">
                          {doc.currency_code || '$'} {(doc.total_investment || 0).toLocaleString()}
                        </strong>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : doc.status === 'VIEWED'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {doc.status || 'DRAFT'}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{doc.views_count || 0}</span>
                        </span>
                      </td>

                      {/* Client Portal Link */}
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/?view=${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-semibold transition-all"
                        >
                          <span>Open View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
