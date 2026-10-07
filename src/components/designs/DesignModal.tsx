import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Upload, Palette, Check, AlertCircle, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DesignType, DesignStatus } from '../../types';

// Compress uploaded image via HTML5 Canvas to avoid localStorage quota limits
const compressImageToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      // If SVG or already very small (< 80KB), keep as is
      if (file.type === 'image/svg+xml' || rawDataUrl.length < 80 * 1024) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to rawDataUrl if Image decoding fails
        resolve(rawDataUrl);
      };
      img.onload = () => {
        try {
          const MAX_DIM = 700;
          let width = img.width || 500;
          let height = img.height || 500;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export as WebP (supports transparency + high compression)
          let compressed = canvas.toDataURL('image/webp', 0.82);
          if (!compressed || compressed === 'data:,' || compressed.length > rawDataUrl.length) {
            compressed = canvas.toDataURL('image/png');
          }
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
};

export const DesignModal: React.FC = () => {
  const {
    isDesignModalOpen,
    setIsDesignModalOpen,
    editingDesign,
    setEditingDesign,
    customers,
    createDesign,
    updateDesign,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCustomers = useMemo(
    () => customers.filter(c => !c.archivedAt),
    [customers]
  );

  const [designType, setDesignType] = useState<DesignType>('IMAGE');
  const [name, setName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [status, setStatus] = useState<DesignStatus>('READY');
  const [fileUrl, setFileUrl] = useState('');
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Sync state when opening modal or switching between create / edit mode
  useEffect(() => {
    if (isDesignModalOpen) {
      if (editingDesign) {
        setDesignType(editingDesign.type || 'IMAGE');
        setName(editingDesign.name || '');
        setSelectedCustomerId(editingDesign.customerId || '');
        setStatus(editingDesign.status || 'READY');
        setFileUrl(editingDesign.fileUrl || '');
        setExternalUrlInput(
          editingDesign.fileUrl && editingDesign.fileUrl.startsWith('http')
            ? editingDesign.fileUrl
            : ''
        );
        setNotes(editingDesign.notes || '');
        setErrorMessage('');
      } else {
        setDesignType('IMAGE');
        setName('');
        setSelectedCustomerId('');
        setStatus('READY');
        setFileUrl('');
        setExternalUrlInput('');
        setShowUrlInput(false);
        setNotes('');
        setErrorMessage('');
      }
    }
  }, [isDesignModalOpen, editingDesign]);

  const handleClose = () => {
    setEditingDesign(null);
    setIsDesignModalOpen(false);
    setErrorMessage('');
    setIsProcessingImage(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Le fichier image dépasse la limite maximale de 25 Mo.');
      return;
    }

    setErrorMessage('');
    setIsProcessingImage(true);
    try {
      const optimizedDataUrl = await compressImageToDataUrl(file);
      setFileUrl(optimizedDataUrl);
      if (!name.trim()) {
        // Suggest a clean name from file name if empty
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setName(baseName);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors du chargement de l’image.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyExternalUrl = () => {
    if (externalUrlInput.trim()) {
      setFileUrl(externalUrlInput.trim());
      setShowUrlInput(false);
      setErrorMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isProcessingImage) {
      setErrorMessage('Veuillez patienter pendant l’optimisation de l’image...');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Le nom du design est obligatoire.');
      return;
    }

    const finalFileUrl =
      designType === 'IMAGE'
        ? fileUrl || (externalUrlInput.trim() ? externalUrlInput.trim() : '')
        : fileUrl || '';

    const finalStatus: DesignStatus =
      designType === 'CUSTOM' && status === 'READY' && !finalFileUrl
        ? 'CUSTOM_REQUEST'
        : status;

    if (editingDesign) {
      updateDesign(editingDesign.id, {
        name: trimmedName,
        type: designType,
        customerId: selectedCustomerId || null,
        fileUrl: finalFileUrl,
        status: finalStatus,
        notes: notes.trim() || undefined,
      });
    } else {
      createDesign({
        name: trimmedName,
        type: designType,
        customerId: selectedCustomerId || null,
        fileUrl: finalFileUrl,
        status: finalStatus,
        notes: notes.trim() || undefined,
      });
    }

    handleClose();
  };

  if (!isDesignModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              {editingDesign ? `Modifier Design (${editingDesign.id})` : 'Nouveau Design'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ajout ou modification d'un visuel (PNG, JPG, WEBP, SVG) ou d'une demande sur mesure.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Design Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setDesignType('IMAGE');
                setStatus('READY');
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition cursor-pointer ${
                designType === 'IMAGE'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Option 1 — Image / Fichier fourni
            </button>
            <button
              type="button"
              onClick={() => {
                setDesignType('CUSTOM');
                setStatus('CUSTOM_REQUEST');
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition cursor-pointer ${
                designType === 'CUSTOM'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Option 2 — Design personnalisé
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Nom du design *
            </label>
            <input
              type="text"
              placeholder={
                designType === 'IMAGE'
                  ? 'Ex: Logo Streetwear Minimaliste'
                  : 'Ex: Calligraphie Arabe Nomade — À créer'
              }
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              required
            />
          </div>

          {/* Customer Association */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Client associé (optionnel)
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="">-- Aucun (Design universel catalogue) --</option>
              {activeCustomers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* File Upload or Custom Explanations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {designType === 'IMAGE'
                  ? 'Fichier image (PNG, JPG, WEBP, SVG)'
                  : 'Maquette / Image (optionnel pour sur-mesure)'}
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(prev => !prev)}
                className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                {showUrlInput ? 'Masquer lien URL' : 'Ou coller un lien URL image'}
              </button>
            </div>

            {showUrlInput && (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://exemple.com/mon-design.png"
                  value={externalUrlInput}
                  onChange={e => setExternalUrlInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyExternalUrl}
                  className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            )}

            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {isProcessingImage ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <span>Optimisation et chargement de l'image en cours...</span>
                </div>
              ) : fileUrl ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={fileUrl}
                      alt="Aperçu"
                      className="w-16 h-16 object-contain rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-1"
                    />
                    <div className="text-left text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
                        Visuel prêt à être enregistré
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                        Cliquer dans le cadre pour remplacer l'image
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setFileUrl('');
                      setExternalUrlInput('');
                    }}
                    className="relative z-10 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition cursor-pointer"
                    title="Retirer l'image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
                  <div className="text-xs text-zinc-700 dark:text-zinc-200 font-medium">
                    Glisser une image ici ou cliquer pour parcourir
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Compression automatique haute qualité (PNG, JPG, WEBP, SVG)
                  </div>
                </div>
              )}
            </div>

            {designType === 'CUSTOM' && !fileUrl && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-semibold block">Design personnalisé (Sur mesure)</span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Aucun fichier n'est obligatoire immédiatement. Vous pourrez rajouter le visuel final plus tard en modifiant ce design.
                </p>
              </div>
            )}
          </div>

          {/* Status selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Statut du design
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as DesignStatus)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="READY">Prêt pour impression (Ready)</option>
              <option value="CUSTOM_REQUEST">Demande personnalisée / À concevoir</option>
              <option value="FILE_PROVIDED">Fichier brut fourni par client</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Notes & dimensions souhaitées
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Centrage poitrine, largeur 20cm, finition DTF..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isProcessingImage}
              className="px-5 py-2 text-xs font-semibold text-white dark:text-zinc-950 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-400 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isProcessingImage
                  ? 'Optimisation...'
                  : editingDesign
                  ? 'Enregistrer les modifications'
                  : 'Enregistrer le design'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
