import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Grid,
  Loader2,
  X,
  Keyboard
} from 'lucide-react';
import { openPdfInNewTab, downloadPdfUrl } from '../utils/pdfExport';
import { convertPdfToImages } from '../utils/pdfRenderer';

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  fileName?: string;
  extractedImages?: string[];
  className?: string;
  showControls?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  title,
  fileName,
  extractedImages: initialImages,
  className = '',
  showControls = true,
}) => {
  const [slideImages, setSlideImages] = useState<string[]>(initialImages || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialImages || initialImages.length === 0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'slides' | 'pdf'>('slides');
  const [showGridView, setShowGridView] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Render PDF pages on mount if no initial images provided
  useEffect(() => {
    let isMounted = true;

    if (initialImages && initialImages.length > 0) {
      setSlideImages(initialImages);
      setIsLoading(false);
      return;
    }

    if (!pdfUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    convertPdfToImages(pdfUrl, 50, 1.8)
      .then((res) => {
        if (isMounted) {
          if (res.images && res.images.length > 0) {
            setSlideImages(res.images);
            setViewMode('slides');
          } else {
            setViewMode('pdf');
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('PDF slayt dönüştürme uyarısı, PDF moduna geçiliyor:', err);
        if (isMounted) {
          setViewMode('pdf');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, initialImages]);

  const totalPages = slideImages.length;

  const nextSlide = () => {
    if (currentSlideIndex < totalPages - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  // Fullscreen Handlers
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Listen to browser native fullscreen change
  useEffect(() => {
    const handleFSChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Keyboard navigation listener (Arrow keys, Space, PageUp/Down, Escape, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else if (showGridView) {
          setShowGridView(false);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, totalPages, isFullscreen, showGridView]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative select-none ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] rounded-none border-0'
          : `rounded-2xl border border-slate-800 shadow-2xl ${className}`
      }`}
    >
      {/* Top Bar Controls */}
      {showControls && (
        <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 text-xs gap-3 z-10">
          <div className="flex items-center gap-3 truncate">
            {slideImages.length > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg px-2.5 py-1 text-blue-400 font-semibold">
                <span>Sunum Slaytları ({totalPages} Sayfa)</span>
              </div>
            )}

            <span className="font-semibold text-slate-200 truncate hidden sm:inline">{title}</span>

            <span className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-slate-400 border border-slate-700/50">
              <Keyboard className="w-3 h-3 text-blue-400" />
              <span>Yön Tuşları (← →) ile İlerle</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalPages > 0 && (
              <button
                onClick={() => setShowGridView(!showGridView)}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showGridView
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Izgara Görünümü"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Izgara</span>
              </button>
            )}

            {/* In-App Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              title={isFullscreen ? 'Tam Ekrandan Çık (Esc)' : 'Uygulama İçi Tam Ekran Yap'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Küçült</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Tam Ekran Yap</span>
                </>
              )}
            </button>

            {/* External New Tab Button */}
            <button
              onClick={() => openPdfInNewTab(pdfUrl, fileName)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 font-semibold flex items-center gap-1 transition-all"
              title="Yeni Tarayıcı Sekmesinde Aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Dış Sekme</span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadPdfUrl(pdfUrl, fileName || `${title}.pdf`)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
              title="PDF İndir"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* If fullscreen, Close Fullscreen button */}
            {isFullscreen && (
              <button
                onClick={exitFullscreen}
                className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 transition-all ml-1"
                title="Tam Ekranı Kapat (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 w-full h-full relative bg-slate-950 overflow-hidden flex flex-col justify-center items-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-300">PDF sayfaları sunum için hazırlanıyor...</p>
            <p className="text-xs text-slate-500">Lütfen birkaç saniye bekleyin.</p>
          </div>
        ) : viewMode === 'slides' && totalPages > 0 ? (
          showGridView ? (
            /* Grid View */
            <div className="w-full h-full p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-slate-950">
              {slideImages.map((imgSrc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setShowGridView(false);
                  }}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-video bg-white flex items-center justify-center ${
                    currentSlideIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[1.02]'
                      : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={imgSrc} alt={`Sayfa ${idx + 1}`} className="w-full h-full object-contain" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Interactive Clean Presentation View */
            <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 relative group">
              {/* Slide Image Container */}
              <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden my-auto">
                <img
                  src={slideImages[currentSlideIndex]}
                  alt={`Slayt ${currentSlideIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white transition-all cursor-pointer"
                  style={{ imageRendering: 'high-quality' }}
                  onClick={nextSlide}
                  title="Sonraki slayt için tıklayın"
                />

                {/* Subtle Hover-Only Edge Touch / Click Zones (Does not ruin slide visual aesthetics!) */}
                {totalPages > 1 && (
                  <>
                    {/* Left Subtle Hover Area */}
                    <button
                      onClick={prevSlide}
                      disabled={currentSlideIndex === 0}
                      className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-start pl-3 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden hover:bg-gradient-to-r hover:from-black/40 hover:to-transparent"
                      title="Önceki Slayt (Sol Ok / Sol Tık)"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700/80 text-white flex items-center justify-center shadow-lg backdrop-blur hover:bg-blue-600 hover:scale-110 transition-all">
                        <ChevronLeft className="w-6 h-6" />
                      </div>
                    </button>

                    {/* Right Subtle Hover Area */}
                    <button
                      onClick={nextSlide}
                      disabled={currentSlideIndex === totalPages - 1}
                      className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-end pr-3 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden hover:bg-gradient-to-l hover:from-black/40 hover:to-transparent"
                      title="Sonraki Slayt (Sağ Ok / Sağ Tık)"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700/80 text-white flex items-center justify-center shadow-lg backdrop-blur hover:bg-blue-600 hover:scale-110 transition-all">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Navigation & Controls Bar */}
              <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs mt-2 shrink-0 backdrop-blur shadow-2xl z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlideIndex === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-all"
                    title="Önceki (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-mono text-slate-300 min-w-[70px] text-center">
                    <strong className="text-blue-400 text-sm">{currentSlideIndex + 1}</strong> / {totalPages}
                  </span>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlideIndex === totalPages - 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-all"
                    title="Sonraki (→)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Klavyede Yön Tuşlarını Kullanın</span>

                  {!showControls && (
                    <button
                      onClick={toggleFullscreen}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      <span>{isFullscreen ? 'Küçült' : 'Tam Ekran'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Safe Non-Blocking Fallback Card */
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-300 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-white">{title || 'PDF Belgesi Yüklendi'}</h3>
              <p className="text-xs text-slate-400">
                Görsel sunum slaytları hazırlanıyor veya doğrudan belgenizi görüntülemek için aşağıdaki seçenekleri kullanabilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => openPdfInNewTab(pdfUrl, fileName)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>PDF'i Sekmede Gör</span>
              </button>
              <button
                onClick={() => downloadPdfUrl(pdfUrl, fileName || `${title}.pdf`)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>PDF İndir</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
