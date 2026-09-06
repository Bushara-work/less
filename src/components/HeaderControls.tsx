import React from 'react';
import { SortConfig, TimeMode, DragOrientation } from '../types';
import { Download, ArrowLeft, Clock } from 'lucide-react';

interface HeaderControlsProps {
  sortConfig: SortConfig;
  onUpdateSortConfig: (config: Partial<SortConfig>) => void;
  timeMode: TimeMode;
  onToggleTimeMode: () => void;
  isDragReorderModeActive: boolean;
  onToggleDragReorder: () => void;
  dragOrientation: DragOrientation;
  onToggleDragOrientation: () => void;
  onGoBack: () => void;
  onDownload: () => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  sortConfig,
  onUpdateSortConfig,
  timeMode,
  onToggleTimeMode,
  isDragReorderModeActive,
  onToggleDragReorder,
  dragOrientation,
  onToggleDragOrientation,
  onGoBack,
  onDownload,
}) => {
  const { nameOrder, dateOrder, isNamePriorityPrimary, isRankLocked } = sortConfig;

  const handleRankLockToggle = () => {
    onUpdateSortConfig({ isRankLocked: !isRankLocked });
  };

  const handlePriorityToggle = () => {
    if (isRankLocked) return;
    onUpdateSortConfig({ isNamePriorityPrimary: !isNamePriorityPrimary });
  };

  const glyph = dragOrientation === 'vertical' ? '||' : '═';

  return (
    <div className="stage-2-header flex flex-col gap-3">
      {/* Top Header Row */}
      <div className="header-row-1 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          id="back-btn"
          onClick={onGoBack}
          className="btn btn-secondary text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back / Add More Files
        </button>

        <button
          type="button"
          id="download-btn"
          onClick={onDownload}
          className="btn btn-success text-sm shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download Master File (.csv)
        </button>
      </div>

      {/* Control Tools Row */}
      <div className="header-row-2 flex flex-wrap items-center justify-between gap-3">
        {/* Sort Controls */}
        <div className="sort-controls flex flex-wrap items-center gap-2.5 bg-white border border-gray-300 px-3 py-2 rounded-lg shadow-2xs text-sm">
          {/* Name Order */}
          <div className="control-group flex items-center gap-1.5">
            <label htmlFor="name-sort-rule" className="font-semibold text-gray-700">
              Name Order:
            </label>
            <select
              id="name-sort-rule"
              value={nameOrder}
              disabled={isRankLocked}
              onChange={(e) => onUpdateSortConfig({ nameOrder: e.target.value as 'asc' | 'desc' })}
              className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 font-medium text-xs sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="asc">Alphabetical (A → Z)</option>
              <option value="desc">Reverse Alphabetical (Z → A)</option>
            </select>
          </div>

          {/* Priority Switch */}
          <button
            type="button"
            id="priority-switch-btn"
            disabled={isRankLocked}
            onClick={handlePriorityToggle}
            className="switch-btn text-xs font-semibold py-1 px-2.5"
            title={isRankLocked ? "Sort configuration is locked" : "Switch primary priority"}
          >
            {isNamePriorityPrimary ? "Name Priority First ⇄" : "Date Priority First ⇄"}
          </button>

          {/* Date Order */}
          <div className="control-group flex items-center gap-1.5">
            <label htmlFor="date-sort-rule" className="font-semibold text-gray-700">
              Date Order:
            </label>
            <select
              id="date-sort-rule"
              value={dateOrder}
              disabled={isRankLocked}
              onChange={(e) => onUpdateSortConfig({ dateOrder: e.target.value as 'asc' | 'desc' })}
              className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 font-medium text-xs sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="desc">Newest → Oldest</option>
              <option value="asc">Oldest → Newest</option>
            </select>
          </div>

          {/* Rank Lock Button */}
          <button
            type="button"
            id="rank-lock-btn"
            onClick={handleRankLockToggle}
            className={`lock-container ${isRankLocked ? 'is-locked' : 'is-unlocked'}`}
            title={isRankLocked ? "Unlock Sort Configuration" : "Lock Sort Configuration"}
            aria-label="Toggle sort configuration lock"
          >
            <div className="css-lock" />
          </button>
        </div>

        {/* Action Controls: Time format & Reorder mode */}
        <div className="vertical-button-stack flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="time-convert-btn"
            onClick={onToggleTimeMode}
            className="btn-toggle-time flex items-center gap-1.5"
            title="Toggle between 12-hour AM/PM and 24-hour military timestamps"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Time Format ({timeMode === '12h' ? '12h ⇄ 24h' : '24h ⇄ 12h'})
          </button>

          {/* Reorder Button with Sub-toggle pill */}
          <button
            type="button"
            id="toggle-reorder-btn"
            onClick={onToggleDragReorder}
            className={`switch-btn font-semibold ${
              isDragReorderModeActive ? 'bg-blue-50 border-blue-400 text-blue-800' : ''
            }`}
            title="Toggle Drag & Drop organize mode"
          >
            <span>Organize</span>
            <span
              className="sub-toggle-pill select-none"
              style={{
                color: isDragReorderModeActive ? '#000000' : '#94a3b8',
                background: isDragReorderModeActive ? '#e2e8f0' : 'transparent',
                cursor: isDragReorderModeActive ? 'pointer' : 'not-allowed',
                padding: '2px 6px',
                borderRadius: '3px',
                marginLeft: '4px',
              }}
              onClick={(e) => {
                if (isDragReorderModeActive) {
                  e.stopPropagation();
                  onToggleDragOrientation();
                }
              }}
              title={
                isDragReorderModeActive
                  ? `Click to switch to ${dragOrientation === 'vertical' ? 'Rows (═)' : 'Columns (||)'}`
                  : 'Enable organize mode to switch orientation'
              }
            >
              {glyph}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
