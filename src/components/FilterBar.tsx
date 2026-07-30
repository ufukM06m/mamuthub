import React, { useState } from 'react';
import { Briefcase, Users, Filter, X, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_FIELDS, DEFAULT_TARGET_AUDIENCES } from '../data/mockData';
import { Presentation } from '../types';

interface FilterBarProps {
  presentations: Presentation[];
  selectedFields: string[];
  selectedTargetAudiences: string[];
  allFields?: string[];
  allTargetAudiences?: string[];
  onToggleField: (field: string) => void;
  onToggleTargetAudience: (audience: string) => void;
  onClearFilters: () => void;
  onOpenManageTaxonomy?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  presentations,
  selectedFields,
  selectedTargetAudiences,
  allFields = DEFAULT_FIELDS,
  allTargetAudiences = DEFAULT_TARGET_AUDIENCES,
  onToggleField,
  onToggleTargetAudience,
  onClearFilters,
  onOpenManageTaxonomy,
}) => {
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [isAudiencesOpen, setIsAudiencesOpen] = useState(false);

  // Compute all available fields from managed taxonomy
  const availableFields = Array.from(new Set(allFields)).sort();

  // Compute all available target audiences from managed taxonomy
  const availableAudiences = Array.from(new Set(allTargetAudiences)).sort();

  // Count helper
  const getFieldCount = (field: string) =>
    presentations.filter((p) => p.fields?.includes(field)).length;

  const getAudienceCount = (audience: string) =>
    presentations.filter((p) => p.targetAudiences?.includes(audience)).length;

  const totalActiveFilters = selectedFields.length + selectedTargetAudiences.length;

  return (
    <div className="relative z-30 bg-[#121929]/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/20 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Dropdown Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pr-2 border-r border-slate-800">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filtrele:</span>
          </div>

          {/* ALAN (Field) Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFieldsOpen(!isFieldsOpen);
                setIsAudiencesOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedFields.length > 0
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>Alan / Sektör</span>
              {selectedFields.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {selectedFields.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFieldsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Field Dropdown Panel */}
            {isFieldsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFieldsOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0d1424] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 space-y-1.5 max-h-80 overflow-y-auto">
                  <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1">
                    <span>ALAN SEÇİN (ÇOKLU SEÇİM)</span>
                    {onOpenManageTaxonomy ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsFieldsOpen(false);
                          onOpenManageTaxonomy();
                        }}
                        className="text-blue-400 hover:text-blue-300 underline text-[10px]"
                      >
                        Yönet
                      </button>
                    ) : (
                      <span className="text-blue-400 font-mono">{selectedFields.length} Seçili</span>
                    )}
                  </div>
                  {availableFields.map((field) => {
                    const isSelected = selectedFields.includes(field);
                    const count = getFieldCount(field);
                    return (
                      <button
                        key={field}
                        onClick={() => onToggleField(field)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                          isSelected
                            ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-600 bg-slate-900'}`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{field}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* HEDEF KİTLE (Target Audience) Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsAudiencesOpen(!isAudiencesOpen);
                setIsFieldsOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedTargetAudiences.length > 0
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Hedef Kitle</span>
              {selectedTargetAudiences.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center ml-0.5">
                  {selectedTargetAudiences.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAudiencesOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Audience Dropdown Panel */}
            {isAudiencesOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAudiencesOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0d1424] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 space-y-1.5 max-h-80 overflow-y-auto">
                  <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1">
                    <span>HEDEF KİTLE SEÇİN (ÇOKLU)</span>
                    {onOpenManageTaxonomy ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAudiencesOpen(false);
                          onOpenManageTaxonomy();
                        }}
                        className="text-amber-400 hover:text-amber-300 underline text-[10px]"
                      >
                        Yönet
                      </button>
                    ) : (
                      <span className="text-amber-400 font-mono">{selectedTargetAudiences.length} Seçili</span>
                    )}
                  </div>
                  {availableAudiences.map((audience) => {
                    const isSelected = selectedTargetAudiences.includes(audience);
                    const count = getAudienceCount(audience);
                    return (
                      <button
                        key={audience}
                        onClick={() => onToggleTargetAudience(audience)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600 bg-slate-900'}`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{audience}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {totalActiveFilters > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Filtreleri Temizle ({totalActiveFilters})</span>
          </button>
        )}
      </div>

      {/* Selected Active Filter Chips Bar */}
      {totalActiveFilters > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Aktif Filtreler:</span>

          {/* Selected Field Chips */}
          {selectedFields.map((field) => (
            <span
              key={field}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[11px] font-medium shadow-sm"
            >
              <Briefcase className="w-3 h-3 text-blue-400" />
              <span>{field}</span>
              <button
                onClick={() => onToggleField(field)}
                className="hover:bg-blue-500/30 p-0.5 rounded transition-colors text-blue-300 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Selected Audience Chips */}
          {selectedTargetAudiences.map((audience) => (
            <span
              key={audience}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-medium shadow-sm"
            >
              <Users className="w-3 h-3 text-amber-400" />
              <span>{audience}</span>
              <button
                onClick={() => onToggleTargetAudience(audience)}
                className="hover:bg-amber-500/30 p-0.5 rounded transition-colors text-amber-300 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
