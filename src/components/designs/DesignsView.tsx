import React, { useState, useMemo } from 'react';
import {
  Palette,
  Plus,
  Archive,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DesignsView: React.FC = () => {
  const {
    designs,
    orders,
    searchQuery,
    setIsDesignModalOpen,
    setEditingDesign,
    archiveDesign,
    restoreDesign,
    deleteDesignPermanently,
  } = useApp();

  const [viewScope, setViewScope] = useState<'active' | 'archived'>('active');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeCount = designs.filter(d => !d.archivedAt).length;
  const archivedCount = designs.filter(d => Boolean(d.archivedAt)).length;

  const filteredDesigns = useMemo(() => {
    return designs
      .filter(d => (viewScope === 'active' ? !d.archivedAt : Boolean(d.archivedAt)))
      .filter(d => {
        if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (d.name || '').toLowerCase().includes(q) ||
          (d.customerName || '').toLowerCase().includes(q) ||
          (d.id || '').toLowerCase().includes(q)
        );
      });
  }, [designs, viewScope, typeFilter, searchQuery]);

  // Count usage only in active, non-cancelled orders
  const getUsageCount = (designId: string) => {
    let count = 0;
    orders
      .filter(o => !o.archivedAt && o.status !== 'ANNULEE')
      .forEach(o => {
        o.items.forEach(it => {
          if (it.frontDesignId === designId || it.backDesignId === designId) {
            count++;
          }
        });
      });
    return count;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'READY':
        return 'Prêt à imprimer';
      case 'CUSTOM_REQUEST':
        return 'Sur mesure / À créer';
      case 'FILE_PROVIDED':
        return 'Fichier client';
      default:
        return status;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Galerie & Bibliothèque de Designs
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestion des visuels clients, maquettes et demandes sur mesure réutilisables.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDesign(null);
            setIsDesignModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Nouveau design</span>
        </button>
      </div>

      {/* Scope & Type filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Scope: Actifs vs Archivés */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewScope('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewScope === 'active'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Designs Actifs ({activeCount})
          </button>
          <button
            onClick={() => setViewScope('archived')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewScope === 'archived'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archives ({archivedCount})</span>
          </button>
        </div>

        {/* Filter type */}
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'IMAGE', label: 'Avec image' },
            { id: 'CUSTOM', label: 'Sur mesure' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Designs */}
      {filteredDesigns.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
          <Palette className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
          <div>
            {viewScope === 'active'
              ? 'Aucun design actif enregistré pour le moment.'
              : 'Aucun design archivé.'}
          </div>
          {viewScope === 'active' && (
            <button
              onClick={() => {
                setEditingDesign(null);
                setIsDesignModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Créer mon premier design
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredDesigns.map(design => {
            const usageCount = getUsageCount(design.id);
            return (
              <div
                key={design.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail area */}
                  <div className="h-44 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-3 relative group">
                    {design.fileUrl ? (
                      <img
                        src={design.fileUrl}
                        alt={design.name}
                        className="max-h-full max-w-full object-contain drop-shadow-xs"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Palette className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-80" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                          {design.type === 'CUSTOM' ? 'Design sur mesure' : 'Visuel sans aperçu'}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          Cliquer sur modifier pour ajouter l'image
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 text-white backdrop-blur-xs">
                        {getStatusLabel(design.status)}
                      </span>
                    </div>
                  </div>

                  {/* Info area */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-1">
                        {design.name}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {design.id}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="text-zinc-400">Client :</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {design.customerName || 'Catalogue général'}
                      </span>
                    </div>

                    {design.notes && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                        "{design.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer bar */}
                <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    Commandes actives : <strong className="text-zinc-900 dark:text-white font-mono">{usageCount}</strong>
                  </span>

                  {viewScope === 'active' ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDesign(design);
                          setIsDesignModalOpen(true);
                        }}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition p-1 cursor-pointer"
                        title="Modifier ce design"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => archiveDesign(design.id)}
                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition p-1 cursor-pointer"
                        title="Archiver ce design"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => restoreDesign(design.id)}
                        className="px-2 py-0.5 text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                        title="Restaurer ce design"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurer
                      </button>
                      {confirmDeleteId === design.id ? (
                        <button
                          onClick={() => {
                            deleteDesignPermanently(design.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 text-[11px] bg-red-600 text-white font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                          title="Confirmer la suppression définitive"
                        >
                          Confirmer
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(design.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
