import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  FileText, 
  Zap, 
  EyeOff, 
  HelpCircle, 
  RotateCcw,
  Sparkles,
  MousePointer,
  Monitor,
  ExternalLink,
  Edit3,
  Save,
  Check,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Presentation } from '../types';
import { convertPdfToImages } from '../utils/pdfRenderer';

interface PresenterModeModalProps {
  presentation: Presentation;
  onClose: () => void;
}

export const PresenterModeModal: React.FC<PresenterModeModalProps> = ({
  presentation,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [slideImages, setSlideImages] = useState<string[]>(presentation.extractedImages || []);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(!presentation.extractedImages || presentation.extractedImages.length === 0);

  const totalPages = Math.max(
    slideImages.length,
    presentation.slides?.length || 0,
    presentation.pageCount || 1
  );

  // Presenter tools state
  const [isLaserPointerActive, setIsLaserPointerActive] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [laserPercent, setLaserPercent] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isBlackoutActive, setIsBlackoutActive] = useState<boolean>(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);

  // Speaker notes state
  const [customNotes, setCustomNotes] = useState<Record<number, string>>({});
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [editingNoteText, setEditingNoteText] = useState<string>('');
  const [isSavedBadgeVisible, setIsSavedBadgeVisible] = useState<boolean>(false);

  // Pitch Stopwatch Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  const slideContainerRef = useRef<HTMLDivElement>(null);
  const audienceWindowRef = useRef<Window | null>(null);

  // Convert PDF to images if not pre-extracted
  useEffect(() => {
    let isMounted = true;
    if (presentation.extractedImages && presentation.extractedImages.length > 0) {
      setSlideImages(presentation.extractedImages);
      setIsLoadingImages(false);
      return;
    }

    if (!presentation.pdfUrl) {
      setIsLoadingImages(false);
      return;
    }

    setIsLoadingImages(true);
    convertPdfToImages(presentation.pdfUrl, 50, 3.0)
      .then((res) => {
        if (isMounted) {
          if (res.images && res.images.length > 0) {
            setSlideImages(res.images);
          }
          setIsLoadingImages(false);
        }
      })
      .catch((err) => {
        console.warn('PDF slayt dönüştürme uyarısı:', err);
        if (isMounted) {
          setIsLoadingImages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [presentation.pdfUrl, presentation.extractedImages]);

  // Sync current page note text when page changes or customNotes update
  useEffect(() => {
    const defaultText = presentation.slides?.[currentPage - 1]?.content || '';
    const currentNote = customNotes[currentPage] !== undefined ? customNotes[currentPage] : defaultText;
    setEditingNoteText(currentNote);
    setIsEditingNotes(false);
  }, [currentPage, customNotes, presentation.slides]);

  // Broadcast / Direct Sync to Audience Window (2. Ekran / Projeksiyon)
  const syncAudienceWindow = () => {
    const currentImgUrl = slideImages[currentPage - 1] || null;
    const syncData = {
      type: 'SLIDE_SYNC',
      page: currentPage,
      totalPages: totalPages,
      imgUrl: currentImgUrl,
      pdfUrl: presentation.pdfUrl,
      blackout: isBlackoutActive,
      laserActive: isLaserPointerActive,
      laserX: laserPercent.x,
      laserY: laserPercent.y,
      slideTitle: presentation.slides?.[currentPage - 1]?.title || `Slayt ${currentPage}`,
    };

    // BroadcastChannel
    try {
      const channel = new BroadcastChannel(`pitch_presentation_${presentation.id}`);
      channel.postMessage(syncData);
      channel.close();
    } catch (e) {
      // BroadcastChannel unsupported fallback
    }

    // Direct postMessage if popup reference exists
    if (audienceWindowRef.current && !audienceWindowRef.current.closed) {
      audienceWindowRef.current.postMessage(syncData, '*');
    }
  };

  // Trigger sync on state changes
  useEffect(() => {
    syncAudienceWindow();
  }, [currentPage, isBlackoutActive, isLaserPointerActive, laserPercent, slideImages, totalPages, presentation.id, presentation.pdfUrl]);

  // Open Projected Audience Window in Second Display / Pop-up
  const openAudienceWindow = () => {
    if (audienceWindowRef.current && !audienceWindowRef.current.closed) {
      audienceWindowRef.current.focus();
      syncAudienceWindow();
      return;
    }

    const currentImgUrl = slideImages[currentPage - 1] || '';
    const audienceWin = window.open('', 'AudienceWindow', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
    
    if (audienceWin) {
      audienceWindowRef.current = audienceWin;
      audienceWin.document.write(`
        <!DOCTYPE html>
        <html lang="tr">
          <head>
            <meta charset="utf-8">
            <title>Projeksiyon Ekranı - ${presentation.title}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { background: #000; color: #fff; font-family: system-ui, sans-serif; height: 100vh; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; }
              #slideImg { max-width: 100vw; max-height: 100vh; object-fit: contain; box-shadow: 0 0 50px rgba(0,0,0,0.9); image-rendering: -webkit-optimize-contrast; image-rendering: high-quality; }
              #pdfFrame { border: none; width: 100vw; height: 100vh; display: none; }
              .blackout { display: ${isBlackoutActive ? 'block' : 'none'}; position: fixed; inset: 0; background: #000; z-index: 9999; }
              .laser-dot { 
                position: absolute; 
                width: 20px; 
                height: 20px; 
                border-radius: 50%; 
                background: #f43f5e; 
                box-shadow: 0 0 25px 8px rgba(244, 63, 94, 0.95); 
                pointer-events: none; 
                transform: translate(-50%, -50%); 
                z-index: 8888;
                display: ${isLaserPointerActive ? 'block' : 'none'};
                transition: left 0.05s linear, top 0.05s linear;
              }
              .laser-dot::after {
                content: '';
                display: block;
                width: 6px;
                height: 6px;
                background: #fff;
                border-radius: 50%;
                margin: 7px auto;
              }
              .info-overlay { position: fixed; bottom: 12px; right: 12px; background: rgba(0,0,0,0.65); padding: 5px 12px; border-radius: 8px; font-size: 11px; color: #94a3b8; font-family: monospace; z-index: 7777; border: 1px solid rgba(255,255,255,0.1); }
            </style>
          </head>
          <body>
            <div id="blackout" class="blackout"></div>
            <div id="laserDot" class="laser-dot" style="left: ${laserPercent.x}%; top: ${laserPercent.y}%;"></div>
            <img id="slideImg" src="${currentImgUrl}" alt="Slayt ${currentPage}" style="${currentImgUrl ? 'display:block' : 'display:none'}" />
            <iframe id="pdfFrame" src="${presentation.pdfUrl || ''}#page=${currentPage}&toolbar=0&navpanes=0" style="${currentImgUrl ? 'display:none' : 'display:block'}"></iframe>
            <div class="info-overlay" id="infoBox">Projeksiyon (Canlı Senkron) &bull; Sayfa ${currentPage}</div>

            <script>
              function handleUpdate(data) {
                if (!data) return;
                const { page, imgUrl, pdfUrl, blackout, laserActive, laserX, laserY } = data;
                
                const slideImg = document.getElementById('slideImg');
                const pdfFrame = document.getElementById('pdfFrame');
                const blackoutEl = document.getElementById('blackout');
                const laserEl = document.getElementById('laserDot');
                const infoBox = document.getElementById('infoBox');

                if (blackoutEl) {
                  blackoutEl.style.display = blackout ? 'block' : 'none';
                }

                if (laserEl) {
                  laserEl.style.display = laserActive ? 'block' : 'none';
                  if (laserX !== undefined && laserY !== undefined) {
                    laserEl.style.left = laserX + '%';
                    laserEl.style.top = laserY + '%';
                  }
                }

                if (imgUrl && slideImg) {
                  slideImg.src = imgUrl;
                  slideImg.style.display = 'block';
                  if (pdfFrame) pdfFrame.style.display = 'none';
                } else if (pdfFrame) {
                  pdfFrame.src = (pdfUrl || '') + '#page=' + page + '&toolbar=0&navpanes=0';
                  pdfFrame.style.display = 'block';
                  if (slideImg) slideImg.style.display = 'none';
                }

                if (infoBox && page) {
                  infoBox.textContent = 'Projeksiyon (Canlı Senkron) • Sayfa ' + page;
                }
              }

              // BroadcastChannel listener
              try {
                const channel = new BroadcastChannel('pitch_presentation_${presentation.id}');
                channel.onmessage = (e) => handleUpdate(e.data);
              } catch(e) {}

              // Window postMessage listener
              window.addEventListener('message', (e) => handleUpdate(e.data));
            </script>
          </body>
        </html>
      `);
      audienceWin.document.close();
      
      // Send immediate initial sync
      setTimeout(() => syncAudienceWindow(), 100);
    }
  };

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Mouse move for laser pointer calculation (relative percentage)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (slideContainerRef.current) {
      const rect = slideContainerRef.current.getBoundingClientRect();
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;

      setLaserPos({ x: xPx, y: yPx });

      const xPct = Math.min(100, Math.max(0, (xPx / rect.width) * 100));
      const yPct = Math.min(100, Math.max(0, (yPx / rect.height) * 100));
      setLaserPercent({ x: xPct, y: yPct });
    }
  };

  // Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keybindings if user is typing in notes textarea
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsBlackoutActive((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLaserPointerActive((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowSpeakerNotes((prev) => !prev);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, onClose]);

  // Save Speaker Note handler
  const handleSaveNote = () => {
    setCustomNotes((prev) => ({
      ...prev,
      [currentPage]: editingNoteText,
    }));
    setIsEditingNotes(false);
    setIsSavedBadgeVisible(true);
    setTimeout(() => setIsSavedBadgeVisible(false), 2000);
  };

  const currentSlide = presentation.slides?.[currentPage - 1];
  const nextSlide = presentation.slides?.[currentPage];
  const currentImgUrl = slideImages[currentPage - 1];
  const nextImgUrl = slideImages[currentPage];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#03060d] text-white flex flex-col justify-between overflow-hidden select-none cursor-default font-sans"
    >
      {/* Blackout Screen Effect ('B' Key) */}
      {isBlackoutActive && (
        <div 
          className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center space-y-3 cursor-pointer" 
          onClick={() => setIsBlackoutActive(false)}
        >
          <EyeOff className="w-12 h-12 text-slate-700 animate-pulse" />
          <p className="text-slate-400 text-xs font-mono">Ekran Karartıldı. Çıkmak için tıklayın veya 'B' tuşuna basın.</p>
        </div>
      )}

      {/* Top Header Controls Bar */}
      <div className="h-14 bg-[#0a0f1d] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>PITCH / SUNUCU MODU</span>
          </span>
          <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
            {presentation.title}
          </h2>
        </div>

        {/* Stopwatch & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pitch Stopwatch */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">{formatTime(secondsElapsed)}</span>
            <button 
              onClick={() => setSecondsElapsed(0)}
              title="Süreyi Sıfırla"
              className="text-slate-500 hover:text-white ml-1"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Dual Screen Audience Window Opener */}
          <button
            onClick={openAudienceWindow}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
            title="Projeksiyona Gönderilecek Seyirci Penceresini Aç (2. Ekran)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Projeksiyon Ekranı Aç (2. Ekran)</span>
            <ExternalLink className="w-3 h-3 text-emerald-200 hidden md:inline" />
          </button>

          {/* Laser Toggle */}
          <button
            onClick={() => setIsLaserPointerActive(!isLaserPointerActive)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isLaserPointerActive 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Lazer İşaretleyici (L)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lazer (L)</span>
          </button>

          {/* Notes Toggle */}
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showSpeakerNotes 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Konuşmacı Panel (N)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notlar (N)</span>
          </button>

          {/* Shortcut Help */}
          <button
            onClick={() => setShowShortcutHelp(true)}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            title="Kısayollar"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors border border-rose-500/30 ml-1"
            title="Sunum Modundan Çık (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Pitch Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Slide Canvas Frame */}
        <div 
          ref={slideContainerRef}
          onMouseMove={handleMouseMove}
          className="flex-1 p-3 sm:p-6 flex flex-col items-center justify-center relative bg-[#050811] overflow-hidden"
        >
          {/* Laser Pointer Red Glow Effect on Presenter Screen */}
          {isLaserPointerActive && (
            <div
              className="pointer-events-none absolute z-40 w-6 h-6 rounded-full bg-rose-500 shadow-[0_0_22px_8px_rgba(244,63,94,0.95)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
              style={{
                left: `${laserPos.x}px`,
                top: `${laserPos.y}px`,
              }}
            >
              <div className="w-2 h-2 bg-white rounded-full mx-auto my-2" />
            </div>
          )}

          {isLoadingImages ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-300">Slayt görselleri projeksiyon için hazırlanıyor...</p>
            </div>
          ) : currentImgUrl ? (
            /* Direct Slide Image Display (High Resolution & Fast 60fps Sync) */
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={currentImgUrl}
                alt={`Slayt ${currentPage}`}
                className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-xl shadow-2xl border border-slate-800 bg-white"
                style={{ imageRendering: 'high-quality' }}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              />
            </div>
          ) : (
            /* Fallback Clean Slide Card */
            <div className="w-full max-w-3xl aspect-video bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between shadow-2xl text-left">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">
                  Slayt {currentPage} / {totalPages}
                </span>
                <h2 className="text-2xl font-bold text-white">
                  {currentSlide?.title || `${presentation.title} - Slayt ${currentPage}`}
                </h2>
                {currentSlide?.subtitle && (
                  <p className="text-sm text-slate-400 italic">{currentSlide.subtitle}</p>
                )}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-sm text-slate-300 leading-relaxed">
                  {currentSlide?.content || presentation.description}
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono flex items-center justify-between pt-4 border-t border-slate-800">
                <span>Kod: {presentation.code}</span>
                <span>Kategori: {presentation.category}</span>
              </div>
            </div>
          )}
        </div>

        {/* Speaker Notes & Next Slide Drawer (Right Side) */}
        {showSpeakerNotes && (
          <div className="w-80 sm:w-96 bg-[#0b101d] border-l border-slate-800/80 p-5 flex flex-col justify-between shrink-0 space-y-4 shadow-2xl z-20 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Konuşmacı Notları (Slayt {currentPage})</span>
                </h3>

                {/* Edit / Save Note Controls */}
                <div className="flex items-center gap-1.5">
                  {isSavedBadgeVisible && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <Check className="w-3 h-3" />
                      <span>Kaydedildi</span>
                    </span>
                  )}
                  {isEditingNotes ? (
                    <button
                      onClick={handleSaveNote}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Save className="w-3 h-3" />
                      <span>Kaydet</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Note Content Area */}
              {isEditingNotes ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400">Bu slayt için özel konuşmacı notunuzu yazın:</label>
                  <textarea
                    rows={6}
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    placeholder="Slayt anlatımı sırasında hatırlamak istediğiniz anahtar kelimeler..."
                    className="w-full bg-slate-900 border border-purple-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditingNotes(false);
                        const defaultText = presentation.slides?.[currentPage - 1]?.content || '';
                        setEditingNoteText(customNotes[currentPage] !== undefined ? customNotes[currentPage] : defaultText);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold"
                    >
                      Notu Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 whitespace-pre-wrap font-sans">
                    {editingNoteText || 'Bu slayt için eklenmiş bir konuşmacı notu bulunmuyor. "Düzenle" butonuna tıklayarak kendi özel notlarınızı ekleyebilirsiniz.'}
                  </p>

                  {currentSlide?.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vurgulanacak Maddeler:</p>
                      <ul className="space-y-1">
                        {currentSlide.bulletPoints.map((bp, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SONRAKİ SLAYT ÖNİZLEME (Next Slide Preview Card) */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-purple-400" />
                  <span>Sonraki Slayt Önizleme</span>
                </span>
                {currentPage < totalPages && (
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/50">
                    Slayt {currentPage + 1} / {totalPages}
                  </span>
                )}
              </div>

              {currentPage < totalPages ? (
                <div className="space-y-2">
                  {/* Next Slide Thumbnail Preview */}
                  {nextImgUrl ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black group cursor-pointer" onClick={() => setCurrentPage((prev) => prev + 1)}>
                      <img src={nextImgUrl} alt="Sonraki Slayt" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <p className="text-xs font-bold text-white truncate">
                        {nextSlide?.title || `${presentation.title} - Slayt ${currentPage + 1}`}
                      </p>
                      {nextSlide?.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate">{nextSlide.subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
                  <p className="text-xs font-bold text-amber-400">Sunum Sonu</p>
                  <p className="text-[10px] text-slate-500">Bu son slayttır.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="h-16 bg-[#0a0f1d] border-t border-slate-800/80 px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold transition-all"
            title="Önceki Slayt (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-mono text-sm font-bold text-white px-3.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <strong className="text-purple-400">{currentPage}</strong> / {totalPages}
          </span>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white font-bold transition-all shadow-lg shadow-purple-600/30"
            title="Sonraki Slayt (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filmstrip Quick Slide Selector */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md scale-110 ring-2 ring-purple-400/50'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Klavye: [←] [→] | Karart: [B] | Lazer: [L]
        </div>
      </div>

      {/* Shortcut Help Modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121929] border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Klavye Kısayolları Kılavuzu</span>
              <button onClick={() => setShowShortcutHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </h3>
            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Sonraki Slayt</span>
                <span className="font-mono text-amber-300 font-bold">[→] / [Boşluk] / [PageDown]</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Önceki Slayt</span>
                <span className="font-mono text-amber-300 font-bold">[←] / [PageUp]</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Projeksiyonda Lazer Aç / Kapat</span>
                <span className="font-mono text-rose-400 font-bold">[L] Tuşu</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Ekranı Karart (Blackout)</span>
                <span className="font-mono text-purple-400 font-bold">[B] Tuşu</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Konuşmacı Notları Göster / Gizle</span>
                <span className="font-mono text-blue-400 font-bold">[N] Tuşu</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Moddan Çıkış</span>
                <span className="font-mono text-slate-300 font-bold">[Esc]</span>
              </div>
            </div>
            <button
              onClick={() => setShowShortcutHelp(false)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

