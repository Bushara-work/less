import React from 'react';
import { DuplicateGroup, AttendanceRow } from '../types';
import { Check, EyeOff, ArrowRight, ArrowLeft, X, Trash2 } from 'lucide-react';

interface DuplicateEvaluationBarProps {
  groups: DuplicateGroup[];
  currentIndex: number;
  headers: string[];
  onSelectIndex: (index: number) => void;
  onApproveGroup: (index: number) => void;
  onIgnoreGroup: (index: number) => void;
  onDeleteDuplicatesInGroup?: (index: number) => void;
  onUpdateSampleValue: (header: string, value: string) => void;
  onExit: () => void;
  onScrollToRow: (rowIndex: number) => void;
}

export const DuplicateEvaluationBar: React.FC<DuplicateEvaluationBarProps> = ({
  groups,
  currentIndex,
  headers,
  onSelectIndex,
  onApproveGroup,
  onIgnoreGroup,
  onDeleteDuplicatesInGroup,
  onUpdateSampleValue,
  onExit,
  onScrollToRow,
}) => {
  if (groups.length === 0 || currentIndex < 0 || currentIndex >= groups.length) {
    return null;
  }

  const currentGroup = groups[currentIndex];
  const sample = currentGroup.sampleRow;
  const isApproved = currentGroup.approved;
  const isIgnored = currentGroup.ignored;

  const handleNext = () => {
    if (currentIndex < groups.length - 1) {
      onSelectIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectIndex(currentIndex - 1);
    }
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-md mb-4 text-gray-800 transition-all duration-200">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-white font-bold text-xs uppercase px-2 py-1 rounded shadow-xs">
            Duplicate Evaluation
          </span>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">
            Duplicate Set {currentIndex + 1} of {groups.length}
          </span>
          <span className="text-xs text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-medium">
            {currentGroup.originalIndices.length} identical copies
          </span>
          {isApproved && (
            <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded border border-green-300">
              ✓ Approved (Highlight Cleared)
            </span>
          )}
          {isIgnored && !isApproved && (
            <span className="text-xs bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300">
              Highlighted (Ignored)
            </span>
          )}
        </div>

        {/* Row location badges */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600">Location in Table:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {currentGroup.originalIndices.map((rowIdx) => (
              <button
                key={rowIdx}
                type="button"
                onClick={() => onScrollToRow(rowIdx)}
                className="text-xs font-bold bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                title={`Click to scroll to row #${rowIdx + 1}`}
              >
                Row #{rowIdx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onExit}
            className="ml-2 text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-amber-200 transition-colors"
            title="Exit Duplicate Evaluation Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editable Unique Line of Data */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Unique Data Line (Editable & updates duplicate rows):
          </p>
          <span className="text-2xs text-gray-500 italic">
            Edit fields below or edit directly in the table cells highlighted yellow.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-white p-2.5 rounded border border-amber-300">
          {headers.map((header) => (
            <div key={header} className="flex flex-col">
              <label className="text-2xs font-semibold text-gray-600 truncate mb-1" title={header}>
                {header}
              </label>
              <input
                type="text"
                value={sample[header] || ''}
                onChange={(e) => onUpdateSampleValue(header, e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 bg-amber-50/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Actions & Step Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Approve Button */}
          <button
            type="button"
            onClick={() => onApproveGroup(currentIndex)}
            className="btn btn-success text-xs sm:text-sm py-1.5 px-3 shadow-xs"
            title="Approve row data and remove yellow highlighting, then move to next duplicate"
          >
            <Check className="w-4 h-4" />
            Approve (Remove Yellow Highlight) & Next
          </button>

          {/* Ignore Button */}
          <button
            type="button"
            onClick={() => onIgnoreGroup(currentIndex)}
            className="btn btn-secondary text-xs sm:text-sm py-1.5 px-3 border border-gray-300 shadow-xs"
            title="Keep yellow highlighting and move to next duplicate row"
          >
            <EyeOff className="w-4 h-4 text-amber-600" />
            Ignore (Keep Yellow Highlight) & Next
          </button>

          {/* Deduplicate helper */}
          {onDeleteDuplicatesInGroup && (
            <button
              type="button"
              onClick={() => onDeleteDuplicatesInGroup(currentIndex)}
              className="btn btn-secondary text-xs sm:text-sm py-1.5 px-2.5 text-red-700 hover:bg-red-50 border border-red-200"
              title="Keep the first row and delete the identical duplicate copies from the table"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Keep 1 & Remove Clones
            </button>
          )}
        </div>

        {/* Navigation & Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="switch-btn py-1 px-2.5 text-xs font-semibold disabled:opacity-40"
            title="Go to previous duplicate set"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Prev
          </button>

          <span className="text-xs font-medium text-gray-600">
            {currentIndex + 1} / {groups.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= groups.length - 1}
            className="switch-btn py-1 px-2.5 text-xs font-semibold disabled:opacity-40"
            title="Go to next duplicate set"
          >
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onExit}
            className="btn btn-secondary text-xs py-1 px-3 ml-2 border border-gray-300"
          >
            Exit Duplicate Mode
          </button>
        </div>
      </div>
    </div>
  );
};
