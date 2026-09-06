import React, { useState } from 'react';
import { AttendanceRow, DragOrientation, SortConfig, ContextMenuState } from '../types';
import { getExcelColumnLetterLabel, SYSTEM_PROTECTED_HEADERS } from '../utils/csv';

interface TableGridProps {
  headers: string[];
  data: AttendanceRow[];
  displayData: { row: AttendanceRow; originalIndex: number }[];
  sortConfig: SortConfig;
  isDragReorderModeActive: boolean;
  dragOrientation: DragOrientation;
  highlightedRowIndices: Set<number>;
  activeGroupRowIndices: Set<number>;
  onCellChange: (originalRowIndex: number, header: string, value: string) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onReorderRows: (fromOriginalIndex: number, toOriginalIndex: number) => void;
  onHeaderSortClick: (header: string) => void;
  onHeaderArrowClick: (header: string) => void;
  onInsertColumnLeft: (columnKey: string) => void;
  onDeleteColumn: (columnKey: string) => void;
  onInsertRowAbove: (originalRowIndex: number) => void;
  onDeleteRow: (originalRowIndex: number) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({
  headers,
  data,
  displayData,
  sortConfig,
  isDragReorderModeActive,
  dragOrientation,
  highlightedRowIndices,
  activeGroupRowIndices,
  onCellChange,
  onReorderColumns,
  onReorderRows,
  onHeaderSortClick,
  onHeaderArrowClick,
  onInsertColumnLeft,
  onDeleteColumn,
  onInsertRowAbove,
  onDeleteRow,
}) => {
  // Drag states
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<{ index: number; side: 'left' | 'right' } | null>(null);

  const [draggedRowOriginalIndex, setDraggedRowOriginalIndex] = useState<number | null>(null);
  const [dragOverRowOriginalIndex, setDragOverRowOriginalIndex] = useState<{ originalIndex: number; side: 'top' | 'bottom' } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: null,
  });

  const { isNamePriorityPrimary, nameOrder, dateOrder, isRankLocked } = sortConfig;

  // Handle column context menu
  const handleColumnContextMenu = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'column',
      targetColumnKey: header,
    });
  };

  // Handle row context menu
  const handleRowContextMenu = (e: React.MouseEvent, originalRowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'row',
      targetRowIndex: originalRowIndex,
    });
  };

  const closeContextMenu = () => {
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0, type: null });
    }
  };

  // COLUMN DRAG & DROP HANDLERS (Vertical Organize Mode)
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    if (!isDragReorderModeActive || dragOrientation !== 'vertical') return;
    setDraggedColumnIndex(index);

    // Build sheer translucent ghost drag preview
    if (e.dataTransfer) {
      const ghost = document.createElement('div');
      ghost.className = 'drag-sheer-ghost';
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.width = '160px';
      ghost.style.zIndex = '9999';

      const headerLabel = headers[index];
      const letter = getExcelColumnLetterLabel(index);
      ghost.innerHTML = `
        <div style="background: #e2e8f0; font-weight: bold; text-align: center; padding: 4px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">${letter}</div>
        <div style="background: #f8fafc; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #cbd5e1; font-size: 12px; color: #1e3a8a;">${headerLabel}</div>
        <div style="padding: 6px 8px; font-size: 11px; color: #475569; background: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${data.length > 0 ? (data[0][headerLabel] || 'Sample Data') : ''}
        </div>
      `;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 20);
      setTimeout(() => {
        if (document.body.contains(ghost)) document.body.removeChild(ghost);
      }, 0);
    }
  };

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    if (!isDragReorderModeActive || dragOrientation !== 'vertical' || draggedColumnIndex === null) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const side = e.clientX < midpoint ? 'left' : 'right';
    setDragOverColumnIndex({ index, side });
  };

  const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColumnIndex !== null && draggedColumnIndex !== targetIndex) {
      onReorderColumns(draggedColumnIndex, targetIndex);
    }
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

  // ROW DRAG & DROP HANDLERS (Horizontal Organize Mode)
  const handleRowDragStart = (e: React.DragEvent, originalIndex: number, row: AttendanceRow) => {
    if (!isDragReorderModeActive || dragOrientation !== 'horizontal') return;
    setDraggedRowOriginalIndex(originalIndex);

    // Build sheer translucent ghost drag preview for the row
    if (e.dataTransfer) {
      const ghost = document.createElement('div');
      ghost.className = 'drag-sheer-ghost';
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.minWidth = '320px';
      ghost.style.maxWidth = '500px';
      ghost.style.zIndex = '9999';

      const firstFewValues = headers.slice(0, 4).map(h => row[h] || '-').join(' | ');
      ghost.innerHTML = `
        <div style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: #1e3a8a; background: rgba(255, 255, 255, 0.95); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 4px;">
          Row Data: ${firstFewValues}
        </div>
      `;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 15);
      setTimeout(() => {
        if (document.body.contains(ghost)) document.body.removeChild(ghost);
      }, 0);
    }
  };

  const handleRowDragOver = (e: React.DragEvent, originalIndex: number) => {
    if (!isDragReorderModeActive || dragOrientation !== 'horizontal' || draggedRowOriginalIndex === null) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const side = e.clientY < midpoint ? 'top' : 'bottom';
    setDragOverRowOriginalIndex({ originalIndex, side });
  };

  const handleRowDrop = (e: React.DragEvent, targetOriginalIndex: number) => {
    e.preventDefault();
    if (draggedRowOriginalIndex !== null && draggedRowOriginalIndex !== targetOriginalIndex) {
      onReorderRows(draggedRowOriginalIndex, targetOriginalIndex);
    }
    setDraggedRowOriginalIndex(null);
    setDragOverRowOriginalIndex(null);
  };

  const handleRowDragEnd = () => {
    setDraggedRowOriginalIndex(null);
    setDragOverRowOriginalIndex(null);
  };

  return (
    <div className="table-container relative bg-white rounded-lg shadow-sm border border-gray-300 mt-4 overflow-x-auto">
      {/* Outside click mask for context menus */}
      {contextMenu.visible && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={closeContextMenu}
        />
      )}

      {/* Column Context Menu */}
      {contextMenu.visible && contextMenu.type === 'column' && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg py-1 min-w-[160px] text-xs font-medium"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div
            onClick={() => {
              if (contextMenu.targetColumnKey) onInsertColumnLeft(contextMenu.targetColumnKey);
              closeContextMenu();
            }}
            className="px-3 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer text-gray-700"
          >
            <span className="text-blue-600 font-bold text-sm">+</span>
            <span>Insert Column Left</span>
          </div>

          <div
            onClick={() => {
              if (contextMenu.targetColumnKey) {
                if (SYSTEM_PROTECTED_HEADERS.includes(contextMenu.targetColumnKey)) {
                  alert('Protected base headers cannot be deleted.');
                } else {
                  onDeleteColumn(contextMenu.targetColumnKey);
                }
              }
              closeContextMenu();
            }}
            className={`px-3 py-2 flex items-center gap-2 cursor-pointer ${
              contextMenu.targetColumnKey && SYSTEM_PROTECTED_HEADERS.includes(contextMenu.targetColumnKey)
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'hover:bg-red-50 text-red-600'
            }`}
          >
            <div className="css-trash-icon" />
            <span>Delete Column</span>
          </div>
        </div>
      )}

      {/* Row Context Menu */}
      {contextMenu.visible && contextMenu.type === 'row' && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg py-1 min-w-[160px] text-xs font-medium"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div
            onClick={() => {
              if (contextMenu.targetRowIndex !== undefined) onInsertRowAbove(contextMenu.targetRowIndex);
              closeContextMenu();
            }}
            className="px-3 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer text-gray-700"
          >
            <span className="text-blue-600 font-bold text-sm">+</span>
            <span>Insert Row Above</span>
          </div>

          <div
            onClick={() => {
              if (contextMenu.targetRowIndex !== undefined) onDeleteRow(contextMenu.targetRowIndex);
              closeContextMenu();
            }}
            className="px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
          >
            <div className="css-trash-icon" />
            <span>Delete Row</span>
          </div>
        </div>
      )}

      <table id="master-table" className="w-full border-collapse">
        <thead>
          {/* Row 1: Excel column letter headers (A, B, C...) */}
          <tr id="table-header-letters">
            <th className="excel-row-header w-12 min-w-12 border border-gray-200" style={{ width: '48px' }} />
            {headers.map((header, colIdx) => {
              const letter = getExcelColumnLetterLabel(colIdx);
              const isColDragging = draggedColumnIndex === colIdx;
              const isDragOver = dragOverColumnIndex?.index === colIdx;
              const dragOverClass = isDragOver
                ? dragOverColumnIndex.side === 'left'
                  ? 'header-drag-over-left'
                  : 'header-drag-over-right'
                : '';

              return (
                <th
                  key={`col-letter-${header}-${colIdx}`}
                  draggable={isDragReorderModeActive && dragOrientation === 'vertical'}
                  onDragStart={(e) => handleColumnDragStart(e, colIdx)}
                  onDragOver={(e) => handleColumnDragOver(e, colIdx)}
                  onDrop={(e) => handleColumnDrop(e, colIdx)}
                  onDragEnd={handleColumnDragEnd}
                  onContextMenu={(e) => handleColumnContextMenu(e, header)}
                  className={`excel-row-header border border-gray-200 py-1 text-xs select-none transition-colors ${
                    isDragReorderModeActive && dragOrientation === 'vertical' ? 'draggable-header hover:bg-blue-50' : ''
                  } ${isColDragging ? 'header-dragging' : ''} ${dragOverClass}`}
                  title={
                    isDragReorderModeActive && dragOrientation === 'vertical'
                      ? 'Drag column header letter to reorder'
                      : 'Right click for column options'
                  }
                >
                  {letter}
                </th>
              );
            })}
          </tr>

          {/* Row 2: Real column title headers */}
          <tr id="table-headers" className="bg-gray-50/80">
            <th className="excel-row-header w-12 min-w-12 border border-gray-200 text-gray-500 text-xs">#</th>
            {headers.map((header, colIdx) => {
              const isNameOrDate = header === 'Participant Name' || header === 'Class Date';
              const isPrimary =
                (isNamePriorityPrimary && header === 'Participant Name') ||
                (!isNamePriorityPrimary && header === 'Class Date');
              const currentDir = header === 'Participant Name' ? nameOrder : dateOrder;

              return (
                <th
                  key={`col-title-${header}-${colIdx}`}
                  className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700 select-none"
                >
                  {isNameOrDate ? (
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        onClick={() => {
                          if (!isDragReorderModeActive && !isRankLocked) {
                            onHeaderSortClick(header);
                          }
                        }}
                        className={`cursor-pointer transition-colors ${
                          !isDragReorderModeActive && !isRankLocked ? 'hover:text-blue-600' : ''
                        }`}
                        title={
                          isRankLocked
                            ? 'Sort rank is locked'
                            : isDragReorderModeActive
                            ? 'Organize mode is on'
                            : 'Click to set as primary sort priority'
                        }
                      >
                        {header}
                        <span className="text-2xs font-normal text-gray-400 ml-1">
                          ({isPrimary ? 'Primary' : 'Secondary'})
                        </span>
                      </span>

                      {/* Up/down sort direction arrow */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isRankLocked) onHeaderArrowClick(header);
                        }}
                        className={`css-arrow-icon ${currentDir === 'asc' ? 'arrow-up' : 'arrow-down'} ${
                          isRankLocked ? 'is-disabled' : ''
                        }`}
                        title={isRankLocked ? 'Sort direction locked' : 'Click to toggle sort direction'}
                      />
                    </div>
                  ) : (
                    <span>{header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody id="table-body">
          {displayData.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="text-center py-10 text-gray-400 text-sm italic border border-gray-200"
              >
                No attendance records match your filter criteria.
              </td>
            </tr>
          ) : (
            displayData.map(({ row, originalIndex }, displayIdx) => {
              const isRowHighlighted = highlightedRowIndices.has(originalIndex);
              const isActiveGroupRow = activeGroupRowIndices.has(originalIndex);
              const isRowDragging = draggedRowOriginalIndex === originalIndex;
              const isDragOver = dragOverRowOriginalIndex?.originalIndex === originalIndex;
              const dragOverRowClass = isDragOver
                ? dragOverRowOriginalIndex.side === 'top'
                  ? 'row-drag-over-top'
                  : 'row-drag-over-bottom'
                : '';

              return (
                <tr
                  key={`row-${originalIndex}`}
                  id={`table-row-${originalIndex}`}
                  draggable={isDragReorderModeActive && dragOrientation === 'horizontal'}
                  onDragStart={(e) => handleRowDragStart(e, originalIndex, row)}
                  onDragOver={(e) => handleRowDragOver(e, originalIndex)}
                  onDrop={(e) => handleRowDrop(e, originalIndex)}
                  onDragEnd={handleRowDragEnd}
                  className={`transition-colors ${
                    isRowHighlighted ? 'duplicate-highlight' : ''
                  } ${isActiveGroupRow ? 'duplicate-highlight-current' : ''} ${
                    isRowDragging ? 'row-dragging' : ''
                  } ${dragOverRowClass} ${
                    isDragReorderModeActive && dragOrientation === 'horizontal' ? 'draggable-row' : ''
                  }`}
                >
                  {/* Row Number Cell - CRITICAL: User asked:
                      "i really like the existing mode for draging rows when that mode is on though
                       i don't want the row number to be highlighted when a row is being movement"
                      So this td always keeps .excel-row-header styling without blue dragging background! */}
                  <td
                    onContextMenu={(e) => handleRowContextMenu(e, originalIndex)}
                    className="excel-row-header border border-gray-200 text-xs font-semibold select-none cursor-pointer"
                    title="Right-click for row options"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isRowHighlighted && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Duplicate row detected" />
                      )}
                      <span>{displayIdx + 1}</span>
                    </div>
                  </td>

                  {/* Data Cells */}
                  {headers.map((header) => (
                    <td
                      key={`cell-${originalIndex}-${header}`}
                      className="border border-gray-200 px-2 py-1 text-xs"
                    >
                      <input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => onCellChange(originalIndex, header, e.target.value)}
                        className="w-full px-1 py-0.5 text-xs text-gray-800 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded border border-transparent hover:border-gray-200"
                      />
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
