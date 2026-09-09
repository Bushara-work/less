import React, { useState, useMemo, useCallback } from 'react';
import {
  AttendanceRow,
  DuplicateGroup,
  SortConfig,
  FilterConfig,
  TimeMode,
  DragOrientation,
} from './types';
import {
  MASTER_HEADERS,
  SYSTEM_PROTECTED_HEADERS,
  extractDateFromFilename,
  parseCSVLine,
  parseCustomDate,
  parseDurationToMinutes,
  convertTimeStringSyntax,
  exportToCSV,
  findDuplicateGroups,
} from './utils/csv';
import { createSampleFiles } from './utils/sampleData';
import { Stage1Upload } from './components/Stage1Upload';
import { HeaderControls } from './components/HeaderControls';
import { FilterPanel } from './components/FilterPanel';
import { TableGrid } from './components/TableGrid';
import { DuplicateEvaluationBar } from './components/DuplicateEvaluationBar';

export default function App() {
  // Stage management: 1 (Upload) or 2 (Master Spreadsheet Editor)
  const [currentStage, setCurrentStage] = useState<1 | 2>(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Master Spreadsheet Data State
  const [headers, setHeaders] = useState<string[]>([...MASTER_HEADERS]);
  const [masterData, setMasterData] = useState<AttendanceRow[]>([]);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    nameOrder: 'asc',
    dateOrder: 'desc',
    isNamePriorityPrimary: true,
    isRankLocked: false,
  });

  // Time & Reorder Modes
  const [timeMode, setTimeMode] = useState<TimeMode>('12h');
  const [isDragReorderModeActive, setIsDragReorderModeActive] = useState<boolean>(false);
  const [dragOrientation, setDragOrientation] = useState<DragOrientation>('vertical');

  // Condition Filters State
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    participantName: '',
    meetingCode: '',
    minDuration: '',
    maxDuration: '',
    startDate: '',
    endDate: '',
    isStartDateInclusive: true,
    isEndDateInclusive: true,
    sno: '',
    startedTime: '',
    joinedTime: '',
    stoppedTime: '',
  });

  // DUPLICATE EVALUATION STATE
  const [isDuplicateModeActive, setIsDuplicateModeActive] = useState<boolean>(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState<number>(0);
  const [highlightedRowIndices, setHighlightedRowIndices] = useState<Set<number>>(new Set());

  // FILE UPLOAD HANDLERS
  const handleAddFiles = (newFiles: FileList | File[]) => {
    const validCsvs: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (file.name.toLowerCase().endsWith('.csv')) {
        if (!uploadedFiles.some((f) => f.name === file.name)) {
          validCsvs.push(file);
        }
      }
    }
    if (validCsvs.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validCsvs]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadDemoData = () => {
    const demoFiles = createSampleFiles();
    setUploadedFiles(demoFiles);
  };

  // COMBINE AND PROCESS CSVs
  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload or drag-and-drop at least one CSV file.');
      return;
    }

    const rowsAccumulator: AttendanceRow[] = [];

    for (const file of uploadedFiles) {
      try {
        const text = await file.text();
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length === 0) continue;

        const fileHeaders = parseCSVLine(lines[0]);
        const fileDate = extractDateFromFilename(file.name);

        const indexMap: { [header: string]: number } = {};
        headers.forEach((header) => {
          indexMap[header] = fileHeaders.findIndex(
            (fh) => fh.toLowerCase() === header.toLowerCase()
          );
        });

        for (let i = 1; i < lines.length; i++) {
          const rowValues = parseCSVLine(lines[i]);
          if (rowValues.length === 0 || rowValues.every((val) => val === '')) continue;

          const structuredObj: AttendanceRow = {};
          headers.forEach((header) => {
            if (header === 'Class Date') {
              structuredObj[header] = fileDate;
            } else {
              const mappedIdx = indexMap[header];
              structuredObj[header] =
                mappedIdx !== -1 && mappedIdx < rowValues.length ? rowValues[mappedIdx] : '';
            }
          });
          rowsAccumulator.push(structuredObj);
        }
      } catch (err) {
        console.error('Error parsing file: ' + file.name, err);
      }
    }

    // Apply sorting
    const sorted = sortDataRows(rowsAccumulator, sortConfig);
    setMasterData(sorted);
    setHighlightedRowIndices(new Set());
    setIsDuplicateModeActive(false);
    setCurrentStage(2);
  };

  // SORTING UTILITY
  const sortDataRows = useCallback((data: AttendanceRow[], config: SortConfig) => {
    if (config.isRankLocked) return [...data];

    const nameDir = config.nameOrder === 'asc' ? 1 : -1;
    const dateDir = config.dateOrder === 'asc' ? 1 : -1;

    const checkName = (a: AttendanceRow, b: AttendanceRow) => {
      const nameA = (a['Participant Name'] || '').toLowerCase();
      const nameB = (b['Participant Name'] || '').toLowerCase();
      return nameA.localeCompare(nameB) * nameDir;
    };

    const checkDate = (a: AttendanceRow, b: AttendanceRow) => {
      const dateA = parseCustomDate(a['Class Date']);
      const dateB = parseCustomDate(b['Class Date']);
      return (dateA.getTime() - dateB.getTime()) * dateDir;
    };

    return [...data].sort((a, b) => {
      if (config.isNamePriorityPrimary) {
        const res = checkName(a, b);
        return res !== 0 ? res : checkDate(a, b);
      } else {
        const res = checkDate(a, b);
        return res !== 0 ? res : checkName(a, b);
      }
    });
  }, []);

  const handleUpdateSortConfig = (updates: Partial<SortConfig>) => {
    const newConfig = { ...sortConfig, ...updates };
    setSortConfig(newConfig);
    if (!newConfig.isRankLocked) {
      setMasterData((prev) => sortDataRows(prev, newConfig));
    }
  };

  // Header click: toggle primary sort priority
  const handleHeaderSortClick = (header: string) => {
    if (sortConfig.isRankLocked || isDragReorderModeActive) return;
    if (header === 'Participant Name' && !sortConfig.isNamePriorityPrimary) {
      handleUpdateSortConfig({ isNamePriorityPrimary: true });
    } else if (header === 'Class Date' && sortConfig.isNamePriorityPrimary) {
      handleUpdateSortConfig({ isNamePriorityPrimary: false });
    }
  };

  // Header arrow click: flip direction
  const handleHeaderArrowClick = (header: string) => {
    if (sortConfig.isRankLocked) return;
    if (header === 'Participant Name') {
      handleUpdateSortConfig({
        nameOrder: sortConfig.nameOrder === 'asc' ? 'desc' : 'asc',
      });
    } else if (header === 'Class Date') {
      handleUpdateSortConfig({
        dateOrder: sortConfig.dateOrder === 'asc' ? 'desc' : 'asc',
      });
    }
  };

  // TIME FORMAT CONVERSION
  const handleToggleTimeMode = () => {
    const nextMode = timeMode === '12h' ? '24h' : '12h';
    setTimeMode(nextMode);
    setMasterData((prev) =>
      prev.map((row) => {
        const updatedRow = { ...row };
        ['Attendance Started at', 'Joined at(beta)', 'Attendance Stopped at'].forEach((h) => {
          if (updatedRow[h]) {
            updatedRow[h] = convertTimeStringSyntax(updatedRow[h]);
          }
        });
        return updatedRow;
      })
    );
  };

  // ORGANIZE (DRAG & DROP) TOGGLES
  const handleToggleDragReorder = () => {
    setIsDragReorderModeActive((prev) => !prev);
  };

  const handleToggleDragOrientation = () => {
    setDragOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'));
  };

  // COLUMN REORDERING
  const handleReorderColumns = (fromIndex: number, toIndex: number) => {
    setHeaders((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  // ROW REORDERING
  const handleReorderRows = (fromIndex: number, toIndex: number) => {
    setMasterData((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  // CELL DATA EDITING
  const handleCellChange = (originalIndex: number, header: string, value: string) => {
    setMasterData((prev) => {
      const copy = [...prev];
      if (copy[originalIndex]) {
        copy[originalIndex] = { ...copy[originalIndex], [header]: value };
      }
      return copy;
    });
  };

  // CONTEXT MENU ACTIONS
  const handleInsertColumnLeft = (targetColumnKey: string) => {
    const newColName = prompt('Enter a unique name for your new custom column:');
    if (!newColName) return;
    const cleanCol = newColName.trim();
    if (!cleanCol || headers.includes(cleanCol)) {
      alert('Column name cannot be empty or a duplicate.');
      return;
    }

    const idx = headers.indexOf(targetColumnKey);
    if (idx !== -1) {
      const nextHeaders = [...headers];
      nextHeaders.splice(idx, 0, cleanCol);
      setHeaders(nextHeaders);
      setMasterData((prev) =>
        prev.map((row) => ({ ...row, [cleanCol]: '' }))
      );
    }
  };

  const handleDeleteColumn = (columnKey: string) => {
    if (SYSTEM_PROTECTED_HEADERS.includes(columnKey)) {
      alert('Protected base headers cannot be deleted.');
      return;
    }
    setHeaders((prev) => prev.filter((h) => h !== columnKey));
    setMasterData((prev) =>
      prev.map((row) => {
        const copy = { ...row };
        delete copy[columnKey];
        return copy;
      })
    );
  };

  const handleInsertRowAbove = (rowIndex: number) => {
    const blankRow: AttendanceRow = {};
    headers.forEach((h) => {
      blankRow[h] = '';
    });
    setMasterData((prev) => {
      const copy = [...prev];
      copy.splice(rowIndex, 0, blankRow);
      return copy;
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    setMasterData((prev) => prev.filter((_, i) => i !== rowIndex));
    // Clear or adjust highlights
    setHighlightedRowIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < rowIndex) next.add(idx);
        else if (idx > rowIndex) next.add(idx - 1);
      });
      return next;
    });
  };

  // FILTER LOGIC
  const handleUpdateFilter = (key: keyof FilterConfig, value: string | boolean) => {
    setFilterConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterConfig({
      participantName: '',
      meetingCode: '',
      minDuration: '',
      maxDuration: '',
      startDate: '',
      endDate: '',
      isStartDateInclusive: true,
      isEndDateInclusive: true,
      sno: '',
      startedTime: '',
      joinedTime: '',
      stoppedTime: '',
    });
    setIsDuplicateModeActive(false);
    setDuplicateGroups([]);
    setHighlightedRowIndices(new Set());
  };

  // DUPLICATE EVALUATION ENGINE
  const handleCheckDuplicates = () => {
    // If duplicate mode is already active, advance to next or re-evaluate
    if (isDuplicateModeActive) {
      if (currentDuplicateIndex < duplicateGroups.length - 1) {
        setCurrentDuplicateIndex((prev) => prev + 1);
        return;
      }
    }

    const groups = findDuplicateGroups(masterData, headers);

    if (groups.length === 0) {
      alert('There is no duplicated data.');
      setIsDuplicateModeActive(false);
      setDuplicateGroups([]);
      setHighlightedRowIndices(new Set());
      return;
    }

    // Populate highlighted row indices for all duplicated items
    const newHighlighted = new Set<number>();
    groups.forEach((g) => {
      g.originalIndices.forEach((idx) => newHighlighted.add(idx));
    });

    setDuplicateGroups(groups);
    setHighlightedRowIndices(newHighlighted);
    setCurrentDuplicateIndex(0);
    setIsDuplicateModeActive(true);
  };

  // Approve a duplicate set: remove yellow highlighting, move to next
  const handleApproveDuplicateGroup = (groupIndex: number) => {
    if (!duplicateGroups[groupIndex]) return;

    const group = duplicateGroups[groupIndex];
    group.approved = true;
    group.ignored = false;

    // Remove highlighting for this group's rows
    setHighlightedRowIndices((prev) => {
      const next = new Set(prev);
      group.originalIndices.forEach((idx) => next.delete(idx));
      return next;
    });

    // Advance to next duplicate set
    if (groupIndex < duplicateGroups.length - 1) {
      setCurrentDuplicateIndex(groupIndex + 1);
    }
  };

  // Ignore a duplicate set: keep yellow highlighting, move to next
  const handleIgnoreDuplicateGroup = (groupIndex: number) => {
    if (!duplicateGroups[groupIndex]) return;

    const group = duplicateGroups[groupIndex];
    group.ignored = true;
    group.approved = false;

    // Advance to next duplicate set
    if (groupIndex < duplicateGroups.length - 1) {
      setCurrentDuplicateIndex(groupIndex + 1);
    }
  };

  // Deduplicate helper: keep 1 row and delete clone rows from table
  const handleDeleteDuplicatesInGroup = (groupIndex: number) => {
    if (!duplicateGroups[groupIndex]) return;
    const group = duplicateGroups[groupIndex];
    const keepIdx = group.originalIndices[0];
    const removeIndices = new Set(group.originalIndices.slice(1));

    setMasterData((prev) => prev.filter((_, idx) => !removeIndices.has(idx)));

    // Re-evaluate duplicates after deletion
    setTimeout(() => {
      const updatedGroups = findDuplicateGroups(
        masterData.filter((_, idx) => !removeIndices.has(idx)),
        headers
      );
      setDuplicateGroups(updatedGroups);
      if (updatedGroups.length === 0) {
        setIsDuplicateModeActive(false);
        setHighlightedRowIndices(new Set());
      } else {
        const nextHighlighted = new Set<number>();
        updatedGroups.forEach((g) => g.originalIndices.forEach((idx) => nextHighlighted.add(idx)));
        setHighlightedRowIndices(nextHighlighted);
        setCurrentDuplicateIndex((prev) => Math.min(prev, updatedGroups.length - 1));
      }
    }, 50);
  };

  // Edit value in duplicate evaluation card -> updates all duplicate copies in masterData
  const handleUpdateDuplicateSampleValue = (header: string, value: string) => {
    if (!duplicateGroups[currentDuplicateIndex]) return;
    const group = duplicateGroups[currentDuplicateIndex];

    // Update the sample in state
    group.sampleRow[header] = value;

    // Update in masterData for all matching copies
    setMasterData((prev) => {
      const copy = [...prev];
      group.originalIndices.forEach((idx) => {
        if (copy[idx]) {
          copy[idx] = { ...copy[idx], [header]: value };
        }
      });
      return copy;
    });
  };

  // Scroll smoothly to a row in the table
  const handleScrollToRow = (rowIndex: number) => {
    const rowElement = document.getElementById(`table-row-${rowIndex}`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rowElement.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        rowElement.classList.remove('ring-2', 'ring-blue-500');
      }, 1500);
    }
  };

  // ACTIVE GROUP ROW INDICES
  const activeGroupRowIndices = useMemo(() => {
    if (!isDuplicateModeActive || !duplicateGroups[currentDuplicateIndex]) {
      return new Set<number>();
    }
    return new Set<number>(duplicateGroups[currentDuplicateIndex].originalIndices);
  }, [isDuplicateModeActive, duplicateGroups, currentDuplicateIndex]);

  // FILTERED MASTER DATA FOR RENDERING
  const displayData = useMemo(() => {
    const {
      participantName,
      meetingCode,
      minDuration,
      maxDuration,
      startDate,
      endDate,
      isStartDateInclusive,
      isEndDateInclusive,
      sno,
      startedTime,
      joinedTime,
      stoppedTime,
    } = filterConfig;

    const valName = participantName.toLowerCase().trim();
    const valCode = meetingCode.toLowerCase().trim();
    const valSno = sno.toLowerCase().trim();
    const valMinDur = parseFloat(minDuration);
    const valMaxDur = parseFloat(maxDuration);
    const dateStartObj = parseCustomDate(startDate.trim());
    const dateEndObj = parseCustomDate(endDate.trim());
    const valStarted = startedTime.toLowerCase().trim();
    const valJoined = joinedTime.toLowerCase().trim();
    const valStopped = stoppedTime.toLowerCase().trim();

    return masterData
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => {
        if (valName && !String(row['Participant Name'] || '').toLowerCase().includes(valName)) return false;
        if (valCode && !String(row['Meeting code'] || '').toLowerCase().includes(valCode)) return false;
        if (valSno && !String(row['SNo'] || '').toLowerCase().includes(valSno)) return false;
        if (valStarted && !String(row['Attendance Started at'] || '').toLowerCase().includes(valStarted)) return false;
        if (valJoined && !String(row['Joined at(beta)'] || '').toLowerCase().includes(valJoined)) return false;
        if (valStopped && !String(row['Attendance Stopped at'] || '').toLowerCase().includes(valStopped)) return false;

        if (!isNaN(valMinDur) || !isNaN(valMaxDur)) {
          const totalMins = parseDurationToMinutes(row['Attended Duration']);
          if (!isNaN(valMinDur) && totalMins < valMinDur) return false;
          if (!isNaN(valMaxDur) && totalMins > valMaxDur) return false;
        }

        if (startDate.trim() || endDate.trim()) {
          const targetDate = parseCustomDate(row['Class Date']);
          if (startDate.trim()) {
            if (isStartDateInclusive && targetDate < dateStartObj) return false;
            if (!isStartDateInclusive && targetDate <= dateStartObj) return false;
          }
          if (endDate.trim()) {
            if (isEndDateInclusive && targetDate > dateEndObj) return false;
            if (!isEndDateInclusive && targetDate >= dateEndObj) return false;
          }
        }

        return true;
      });
  }, [masterData, filterConfig]);

  // DOWNLOAD EXPORT
  const handleDownload = () => {
    exportToCSV(masterData, headers);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1440px] mx-auto">
        <header className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              CSV Attendance Merger & Editor
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Combine multiple attendance reports, detect & resolve duplicate rows, filter, reorder, and export clean data.
            </p>
          </div>
          {currentStage === 2 && (
            <div className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 font-medium">
              {masterData.length} records loaded
            </div>
          )}
        </header>

        {/* STAGE 1: UPLOAD PHASE */}
        {currentStage === 1 && (
          <Stage1Upload
            files={uploadedFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onProcessFiles={handleProcessFiles}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {/* STAGE 2: VERIFY, EDIT & EXPORT MASTER PHASE */}
        {currentStage === 2 && (
          <div id="stage-2" className="space-y-4">
            {/* Header Controls (Sort, Priority, Lock, Time, Organize, Download, Back) */}
            <HeaderControls
              sortConfig={sortConfig}
              onUpdateSortConfig={handleUpdateSortConfig}
              timeMode={timeMode}
              onToggleTimeMode={handleToggleTimeMode}
              isDragReorderModeActive={isDragReorderModeActive}
              onToggleDragReorder={handleToggleDragReorder}
              dragOrientation={dragOrientation}
              onToggleDragOrientation={handleToggleDragOrientation}
              onGoBack={() => setCurrentStage(1)}
              onDownload={handleDownload}
            />

            {/* Condition Filters & Duplicate Trigger */}
            <FilterPanel
              filterConfig={filterConfig}
              onUpdateFilter={handleUpdateFilter}
              onResetFilters={handleResetFilters}
              onCheckDuplicates={handleCheckDuplicates}
              isDuplicateModeActive={isDuplicateModeActive}
              duplicateCount={duplicateGroups.length}
            />

            {/* Duplicate Evaluation Bar / Mode */}
            {isDuplicateModeActive && (
              <DuplicateEvaluationBar
                groups={duplicateGroups}
                currentIndex={currentDuplicateIndex}
                headers={headers}
                onSelectIndex={(idx) => setCurrentDuplicateIndex(idx)}
                onApproveGroup={handleApproveDuplicateGroup}
                onIgnoreGroup={handleIgnoreDuplicateGroup}
                onDeleteDuplicatesInGroup={handleDeleteDuplicatesInGroup}
                onUpdateSampleValue={handleUpdateDuplicateSampleValue}
                onExit={() => setIsDuplicateModeActive(false)}
                onScrollToRow={handleScrollToRow}
              />
            )}

            {/* Main Spreadsheet Grid */}
            <TableGrid
              headers={headers}
              data={masterData}
              displayData={displayData}
              sortConfig={sortConfig}
              isDragReorderModeActive={isDragReorderModeActive}
              dragOrientation={dragOrientation}
              highlightedRowIndices={highlightedRowIndices}
              activeGroupRowIndices={activeGroupRowIndices}
              onCellChange={handleCellChange}
              onReorderColumns={handleReorderColumns}
              onReorderRows={handleReorderRows}
              onHeaderSortClick={handleHeaderSortClick}
              onHeaderArrowClick={handleHeaderArrowClick}
              onInsertColumnLeft={handleInsertColumnLeft}
              onDeleteColumn={handleDeleteColumn}
              onInsertRowAbove={handleInsertRowAbove}
              onDeleteRow={handleDeleteRow}
            />
          </div>
        )}
      </div>
    </div>
  );
}
