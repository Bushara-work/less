import React from 'react';
import { FilterConfig } from '../types';
import { Filter, RotateCcw, AlertTriangle } from 'lucide-react';

interface FilterPanelProps {
  filterConfig: FilterConfig;
  onUpdateFilter: (key: keyof FilterConfig, value: string | boolean) => void;
  onResetFilters: () => void;
  onCheckDuplicates: () => void;
  isDuplicateModeActive: boolean;
  duplicateCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterConfig,
  onUpdateFilter,
  onResetFilters,
  onCheckDuplicates,
  isDuplicateModeActive,
  duplicateCount,
}) => {
  return (
    <div className="filter-panel bg-white border border-gray-300 p-4 rounded-lg shadow-2xs mt-3">
      {/* Panel Header */}
      <div className="filter-header-title flex items-center justify-between font-bold text-gray-700 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm">Condition Filters</span>
        </div>
        <span className="text-xs font-normal text-gray-500">
          Filters update table view in real-time
        </span>
      </div>

      {/* Inputs Grid */}
      <div className="filter-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 items-end">
        {/* Participant Name */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Participant Name</label>
          <input
            type="text"
            id="filter-name"
            value={filterConfig.participantName}
            onChange={(e) => onUpdateFilter('participantName', e.target.value)}
            className="filter-input"
            placeholder="Search name..."
          />
        </div>

        {/* Meeting Code */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Meeting Code</label>
          <input
            type="text"
            id="filter-code"
            value={filterConfig.meetingCode}
            onChange={(e) => onUpdateFilter('meetingCode', e.target.value)}
            className="filter-input"
            placeholder="Search code..."
          />
        </div>

        {/* Duration Threshold */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Duration Threshold (Minutes)</label>
          <div className="range-inputs flex gap-2">
            <input
              type="number"
              id="filter-dur-min"
              value={filterConfig.minDuration}
              onChange={(e) => onUpdateFilter('minDuration', e.target.value)}
              className="filter-input w-1/2"
              placeholder="Min (e.g. 45)"
            />
            <input
              type="number"
              id="filter-dur-max"
              value={filterConfig.maxDuration}
              onChange={(e) => onUpdateFilter('maxDuration', e.target.value)}
              className="filter-input w-1/2"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Class Date Bounds */}
        <div className="filter-box flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">Class Date Bounds</label>
            <div className="flex gap-2">
              <span
                id="start-date-toggle"
                onClick={() => onUpdateFilter('isStartDateInclusive', !filterConfig.isStartDateInclusive)}
                className="toggle-link text-xs font-medium"
                title="Toggle Start Date Inclusive / Exclusive"
              >
                Start: {filterConfig.isStartDateInclusive ? 'Inc' : 'Exc'}
              </span>
              <span
                id="end-date-toggle"
                onClick={() => onUpdateFilter('isEndDateInclusive', !filterConfig.isEndDateInclusive)}
                className="toggle-link text-xs font-medium"
                title="Toggle End Date Inclusive / Exclusive"
              >
                End: {filterConfig.isEndDateInclusive ? 'Inc' : 'Exc'}
              </span>
            </div>
          </div>
          <div className="range-inputs flex gap-2">
            <input
              type="text"
              id="filter-date-start"
              value={filterConfig.startDate}
              onChange={(e) => onUpdateFilter('startDate', e.target.value)}
              className="filter-input w-1/2"
              placeholder="Start Date"
            />
            <input
              type="text"
              id="filter-date-end"
              value={filterConfig.endDate}
              onChange={(e) => onUpdateFilter('endDate', e.target.value)}
              className="filter-input w-1/2"
              placeholder="End Date/Now"
            />
          </div>
        </div>

        {/* Student Number */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Student Number</label>
          <input
            type="text"
            id="filter-sno"
            value={filterConfig.sno}
            onChange={(e) => onUpdateFilter('sno', e.target.value)}
            className="filter-input"
            placeholder="Search student number..."
          />
        </div>

        {/* Started At */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Started At</label>
          <input
            type="text"
            id="filter-started-time"
            value={filterConfig.startedTime}
            onChange={(e) => onUpdateFilter('startedTime', e.target.value)}
            className="filter-input"
            placeholder="Search join time..."
          />
        </div>

        {/* Joined At (beta) */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Joined At (beta)</label>
          <input
            type="text"
            id="filter-joined-time"
            value={filterConfig.joinedTime}
            onChange={(e) => onUpdateFilter('joinedTime', e.target.value)}
            className="filter-input"
            placeholder="Search beta timestamp..."
          />
        </div>

        {/* Stopped At */}
        <div className="filter-box flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Stopped At</label>
          <input
            type="text"
            id="filter-stopped-time"
            value={filterConfig.stoppedTime}
            onChange={(e) => onUpdateFilter('stoppedTime', e.target.value)}
            className="filter-input"
            placeholder="Search leave time..."
          />
        </div>

        {/* Action Buttons: Reset Filters & Check Duplicates */}
        <div className="filter-box flex gap-2 w-full col-span-1 sm:col-span-2 lg:col-span-4 mt-1">
          <button
            type="button"
            id="reset-filters-btn"
            onClick={onResetFilters}
            className="btn btn-danger h-9 text-xs sm:text-sm font-semibold flex-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters ↺
          </button>

          <button
            type="button"
            id="duplicate-sift-btn"
            onClick={onCheckDuplicates}
            className={`btn h-9 text-xs sm:text-sm font-semibold flex-1 transition-colors ${
              isDuplicateModeActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                : 'btn-warning'
            }`}
            title="Scan for duplicate rows, highlight them in yellow, and evaluate identical sets"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {isDuplicateModeActive
              ? `Duplicate Mode (${duplicateCount} ${duplicateCount === 1 ? 'set' : 'sets'}) ↻`
              : 'Check Duplicates'}
          </button>
        </div>
      </div>
    </div>
  );
};
