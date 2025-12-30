import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, ChevronRight, ChevronDown, Zap, Circle, CheckCircle2, Briefcase, Coffee, Inbox, LayoutList, Plus, X, CheckSquare, GripVertical } from 'lucide-react';
import { Task, Theme, List } from '../types';
import { Translation } from '../translations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlanViewProps {
  tasks: Task[];
  lists: List[];
  currentListId: string;
  onSelectList: (id: string) => void;
  onAddTask: (title: string, estimate: number, parentId?: string) => void;
  onStartTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddProject: (title: string) => string | Promise<string>; // Returns new project ID
  onToggleTaskCompletion: (taskId: string) => void;
  onUpdateTask: (taskId: string, title: string, estimate: number) => void;
  onReorderTasks: (tasks: Task[]) => void;
  theme: Theme;
  showCategories: boolean;
  t: Translation;
}

export const PlanView: React.FC<PlanViewProps> = ({
  tasks,
  lists,
  currentListId,
  onSelectList,
  onAddTask,
  onStartTask,
  onDeleteTask,
  onAddProject,
  onToggleTaskCompletion,
  onUpdateTask,
  onReorderTasks,
  theme,
  showCategories,
  t
}) => {
  const isDark = theme === 'dark';

  // State for Main Input (Root Level)
  const [inputValue, setInputValue] = useState('');
  const [hoverEst, setHoverEst] = useState<number>(0);

  // State for Inline Input (Subtask Level)
  const [inlineParentId, setInlineParentId] = useState<string | null>(null);
  const [inlineInputValue, setInlineInputValue] = useState('');
  const [inlineHoverEst, setInlineHoverEst] = useState<number>(0);

  // State for UI
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  // State for Edit Modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEstimate, setEditEstimate] = useState(1);

  // Refs for auto-focus
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Toggle Collapse
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedParents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedParents(newSet);
  };

  // Focus inline input when opened
  useEffect(() => {
    if (inlineParentId && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [inlineParentId]);

  // Handlers
  const handleEstimateClick = async (num: number) => {
    if (!inputValue.trim()) return;

    if (num === 5) {
      // Create Project
      const newProjectId = await onAddProject(inputValue);
      setInputValue(''); // Clear input
      setHoverEst(0);
      // Optionally open inline input for the new project immediately
      setExpandedParents(prev => new Set(prev).add(newProjectId));
      setInlineParentId(newProjectId);
    } else {
      // Create Root Atom
      onAddTask(inputValue, num);
      setInputValue('');
      setHoverEst(0);
    }
  };

  const handleInlineEstimateClick = (num: number) => {
    if (!inlineInputValue.trim() || !inlineParentId) return;
    onAddTask(inlineInputValue, num, inlineParentId);
    setInlineInputValue(''); // Clear for next entry, keep input open
    setInlineHoverEst(0);
    // Focus remains due to React rendering, but we can ensure it if needed
    if (inlineInputRef.current) inlineInputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInputValue('');
      setHoverEst(0);
    }
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInlineParentId(null);
      setInlineInputValue('');
      setInlineHoverEst(0);
    }
  };

  // Edit Modal Handlers
  const handleOpenEditModal = (task: Task) => {
    // Only allow editing non-project tasks
    if (task.isProject) return;
    setEditingTask(task);
    setEditTitle(task.title);
    setEditEstimate(task.estimate);
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editTitle.trim()) return;
    onUpdateTask(editingTask.id, editTitle.trim(), editEstimate);
    setEditingTask(null);
    setEditTitle('');
    setEditEstimate(1);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditEstimate(1);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 只有移动超过 5px 才触发拖拽，防止阻碍点击
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // 这里的逻辑需要能同时处理 rootTasks 和 subTasks
      // 我们可以通过寻找 active 元素的真实映射来确定其 parentId
      const activeTask = tasks.find(t => t.id === active.id);
      if (!activeTask) return;

      const parentId = activeTask.parentId;
      console.log(`[D&D] Drag End - Active: ${activeTask.title}, Parent: ${parentId || 'root'}`);

      const currentLevelTasks = tasks.filter(t =>
        t.listId === currentListId &&
        t.status !== 'archived' &&
        (parentId ? t.parentId === parentId : (!t.parentId || t.parentId === null))
      ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      const oldIndex = currentLevelTasks.findIndex(t => t.id === active.id);
      const newIndex = currentLevelTasks.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSlice = arrayMove(currentLevelTasks, oldIndex, newIndex);
        const updatedTasks = reorderedSlice.map((task, idx) => ({
          ...task,
          sortOrder: idx * 100
        }));

        onReorderTasks(updatedTasks);
      } else {
        console.warn('[D&D] Failed to find indices. Maybe dragging across levels?');
      }
    }
  };

  // Render logic
  // 核心修复：必须按当前列表 ID 过滤，且必须显式排序！
  // 否则 DnD 的 oldIndex/newIndex 算法会相对于内存中乱序的数组计算，导致保存的顺序与视觉不符
  const activeTasks = tasks
    .filter(t => t.status !== 'archived' && t.listId === currentListId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const rootTasks = activeTasks.filter(t => !t.parentId || t.parentId === null);

  const containerClass = `flex flex-col h-full w-full animate-fade-in transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-50 text-stone-900'
    }`;

  const inputContainerClass = `pt-2 pb-4 px-6 sticky top-0 z-20 transition-colors duration-500 ${isDark ? 'bg-zinc-950/90 backdrop-blur' : 'bg-stone-50/90 backdrop-blur'
    }`;

  const getListName = (list: List) => {
    switch (list.type) {
      case 'inbox': return t.common.inbox;
      case 'done': return t.common.done;
      case 'trash': return t.common.trash;
      default: return list.name;
    }
  };

  const getListIcon = (type: string, name: string) => {
    if (type === 'inbox') return <Inbox size={14} />;
    if (type === 'done') return <CheckSquare size={14} />;
    if (name.toLowerCase().includes('work')) return <Briefcase size={14} />;
    if (name.toLowerCase().includes('life')) return <Coffee size={14} />;
    return <LayoutList size={14} />;
  }

  // Helper to render tomato progress
  const renderTomatoes = (completed: number, failed: number, estimate: number) => {
    const remaining = Math.max(0, estimate - completed);
    return (
      <div className="flex items-center gap-0.5 select-none">
        {Array.from({ length: completed }).map((_, i) => (
          <span key={`c-${i}`} className="text-xs grayscale-0">🍅</span>
        ))}
        {Array.from({ length: failed }).map((_, i) => (
          <span key={`f-${i}`} className="text-xs text-ash font-bold mx-0.5">✕</span>
        ))}
        {Array.from({ length: remaining }).map((_, i) => (
          <span key={`e-${i}`} className="text-xs grayscale opacity-30">🍅</span>
        ))}
      </div>
    );
  };

  const isDoneList = currentListId === 'done';

  return (
    <div className={containerClass}>

      {/* Header & List Switcher */}
      <div className={`pt-12 px-6 pb-0 flex flex-col ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
        {/* Horizontal Tabs */}
        {showCategories && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2 animate-fade-in">
            {lists.map(list => {
              const isActive = currentListId === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => onSelectList(list.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap border ${isActive
                    ? (isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-800 border-stone-800 text-white')
                    : (isDark ? 'border-zinc-800 text-zinc-500 hover:text-zinc-300' : 'border-stone-200 text-stone-500 hover:text-stone-900')
                    }`}
                >
                  {getListIcon(list.type, list.name)}
                  {getListName(list)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Main Input Section (Root Level) */}
      {!isDoneList && (
        <div className={inputContainerClass}>
          <div className="max-w-3xl mx-auto">
            <div className="relative transition-all duration-300">
              {/* Integrated Input Container */}
              <div className={`flex items-center border-b-2 py-2 transition-colors ${isDark
                ? 'border-zinc-800 focus-within:border-zinc-100'
                : 'border-stone-200 focus-within:border-stone-900'
                }`}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.plan.whatNeedsToBeDone}
                  className={`flex-1 bg-transparent text-xl focus:outline-none font-mono transition-colors min-w-0 ${isDark
                    ? 'text-white placeholder-zinc-700'
                    : 'text-stone-900 placeholder-stone-400'
                    }`}
                  autoFocus={!inlineParentId}
                />

                {/* Inline Estimator Toolbar - Shows only when typing */}
                {inputValue.trim().length > 0 && (
                  <div
                    className="flex gap-1 ml-4 items-center animate-fade-in shrink-0 select-none"
                    onMouseLeave={() => setHoverEst(0)}
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleEstimateClick(num)}
                        onMouseEnter={() => setHoverEst(num)}
                        className="transition-transform hover:scale-110 px-0.5"
                      >
                        <span className={`text-base filter transition-all duration-200 ${num <= hoverEst ? 'grayscale-0 opacity-100' : 'grayscale opacity-30'
                          }`}>
                          🍅
                        </span>
                      </button>
                    ))}

                    {/* The Splitter (Rule of 4) */}
                    <div className={`h-4 w-px mx-2 ${isDark ? 'bg-zinc-800' : 'bg-stone-300'}`}></div>
                    <button
                      onClick={() => handleEstimateClick(5)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 group ${isDark ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-stone-200 hover:bg-stone-300'
                        }`}
                      title={t.plan.decompose}
                    >
                      <Zap size={12} className={`group-hover:text-amber-500 ${isDark ? 'text-zinc-600' : 'text-stone-500'}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="flex-1 overflow-y-auto px-6 pt-2">
        <div className="max-w-3xl mx-auto space-y-1">
          {rootTasks.length === 0 && (
            <div className={`text-center mt-20 font-mono text-sm opacity-30 ${isDark ? 'text-white' : 'text-black'}`}>
              {isDoneList ? t.plan.noCompletedTasks : t.common.void}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e)}
          >
            <SortableContext
              items={rootTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {rootTasks.map(task => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  activeTasks={activeTasks}
                  expandedParents={expandedParents}
                  toggleExpand={toggleExpand}
                  onToggleTaskCompletion={onToggleTaskCompletion}
                  onStartTask={onStartTask}
                  onDeleteTask={onDeleteTask}
                  handleOpenEditModal={handleOpenEditModal}
                  handleDragEnd={handleDragEnd}
                  isDark={isDark}
                  isDoneList={isDoneList}
                  renderTomatoes={renderTomatoes}
                  t={t}
                  inlineParentId={inlineParentId}
                  setInlineParentId={setInlineParentId}
                  inlineInputValue={inlineInputValue}
                  setInlineInputValue={setInlineInputValue}
                  handleInlineKeyDown={handleInlineKeyDown}
                  inlineInputRef={inlineInputRef}
                  inlineHoverEst={inlineHoverEst}
                  setInlineHoverEst={setInlineHoverEst}
                  handleInlineEstimateClick={handleInlineEstimateClick}
                  sensors={sensors}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseEditModal}
        >
          <div
            className={`w-80 rounded-xl p-6 shadow-2xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-stone-200'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title */}
            <h3 className={`text-lg font-mono font-bold mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {t.plan.editTask}
            </h3>

            {/* Task Name Input */}
            <div className="mb-4">
              <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                {t.plan.taskName}
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg font-mono text-sm border outline-none transition-colors ${isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                  }`}
                autoFocus
              />
            </div>

            {/* Tomato Estimate Selector */}
            <div className="mb-6">
              <label className={`block text-xs font-mono mb-2 ${isDark ? 'text-zinc-400' : 'text-stone-500'}`}>
                {t.plan.tomatoes}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setEditEstimate(num)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${num <= editEstimate
                      ? 'grayscale-0 opacity-100 scale-110'
                      : 'grayscale opacity-30 hover:opacity-50'
                      } ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-stone-100'}`}
                  >
                    🍅
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseEditModal}
                className={`flex-1 py-2 px-4 rounded-lg font-mono text-sm transition-colors ${isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
              >
                {t.plan.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className={`flex-1 py-2 px-4 rounded-lg font-mono text-sm transition-colors ${isDark
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50'
                  }`}
              >
                {t.plan.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SortableTaskItemProps {
  task: Task;
  activeTasks: Task[];
  expandedParents: Set<string>;
  toggleExpand: (id: string) => void;
  onToggleTaskCompletion: (id: string) => void;
  onStartTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  handleOpenEditModal: (task: Task) => void;
  handleDragEnd: (event: DragEndEvent, parentId?: string) => void;
  isDark: boolean;
  isDoneList: boolean;
  renderTomatoes: (c: number, f: number, e: number) => React.ReactNode;
  t: Translation;
  inlineParentId: string | null;
  setInlineParentId: (id: string | null) => void;
  inlineInputValue: string;
  setInlineInputValue: (val: string) => void;
  handleInlineKeyDown: (e: React.KeyboardEvent) => void;
  inlineInputRef: React.RefObject<HTMLInputElement>;
  inlineHoverEst: number;
  setInlineHoverEst: (n: number) => void;
  handleInlineEstimateClick: (n: number) => void;
  sensors: any;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = (props) => {
  const {
    task,
    activeTasks,
    expandedParents,
    toggleExpand,
    onToggleTaskCompletion,
    onStartTask,
    onDeleteTask,
    handleOpenEditModal,
    handleDragEnd,
    isDark,
    isDoneList,
    renderTomatoes,
    t,
    inlineParentId,
    setInlineParentId,
    inlineInputValue,
    setInlineInputValue,
    handleInlineKeyDown,
    inlineInputRef,
    inlineHoverEst,
    setInlineHoverEst,
    handleInlineEstimateClick,
    sensors
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // 确保子任务也是有序的
  const subTasks = activeTasks
    .filter(t => t.parentId === task.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const isExpanded = expandedParents.has(task.id);

  // Progress Calculation for Parent
  const totalEst = subTasks.reduce((acc, t) => acc + t.estimate, 0);
  const totalDone = subTasks.reduce((acc, t) => acc + t.completedPomodoros, 0);
  const hasEntropy = subTasks.some(t => t.failedPomodoros > 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/item mb-2"
    >
      {/* Task Row */}
      <div
        className="flex items-center gap-3 py-1 group/row"
        onDoubleClick={() => !task.isProject && handleOpenEditModal(task)}
      >
        {/* Drag Handle */}
        {!isDoneList && (
          <div
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className={`cursor-grab active:cursor-grabbing opacity-0 group-hover/row:opacity-100 transition-opacity p-1 -ml-6 ${isDark ? 'text-zinc-700 hover:text-zinc-500' : 'text-stone-300 hover:text-stone-500'
              }`}
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Icon / Toggle / Completion Check */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (task.isProject) {
              toggleExpand(task.id);
            } else {
              if (!isDoneList) onToggleTaskCompletion(task.id);
            }
          }}
          className={`flex-shrink-0 transition-colors ${task.isProject
            ? (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-stone-400 hover:text-stone-600')
            : (isDark ? 'text-zinc-700' : 'text-stone-300 hover:text-stone-500')
            } ${isDoneList && !task.isProject ? 'cursor-default opacity-50 pointer-events-none' : ''}`}
        >
          {task.isProject ? (
            isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
          ) : (
            task.status === 'completed'
              ? <CheckCircle2 size={18} className={isDark ? 'text-zinc-600' : 'text-stone-400'} />
              : <Circle size={16} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-baseline justify-between transition-all">
            <span className={`font-mono text-base transition-all ${task.status === 'completed'
              ? (isDark ? 'line-through text-zinc-700' : 'line-through text-stone-300')
              : task.isProject
                ? (isDark ? 'font-bold text-zinc-200' : 'font-bold text-stone-800')
                : (isDark ? 'text-zinc-300' : 'text-stone-700')
              }`}>
              {task.title}
            </span>

            {/* Actions/Stats */}
            <div className="flex items-center gap-4">
              {task.isProject ? (
                <>
                  <div className={`text-xs font-mono flex items-center gap-2 ${isDark ? 'text-zinc-600' : 'text-stone-400'}`}>
                    {hasEntropy && <span className="text-ash" title="Entropy detected">⚠</span>}
                    <span>[{totalDone}/{totalEst}]</span>
                  </div>

                  {!isDoneList && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isExpanded) toggleExpand(task.id);
                        setInlineParentId(task.id);
                        setInlineInputValue('');
                      }}
                      className={`opacity-0 group-hover/item:opacity-100 transition-all hover:scale-110 p-1 rounded-full ${isDark ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-stone-400 hover:bg-stone-200 hover:text-black'
                        }`}
                      title={t.plan.addSubtask}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  {renderTomatoes(task.completedPomodoros, task.failedPomodoros, task.estimate)}
                  {task.status !== 'completed' && !isDoneList && (
                    <button
                      onClick={() => onStartTask(task.id)}
                      className={`p-1 rounded-full border transition-all hover:scale-110 ml-2 ${isDark
                        ? 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-black'
                        : 'border-emerald-700/50 text-emerald-700 hover:bg-emerald-700 hover:text-white'
                        }`}
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  )}
                  {!isDoneList && (
                    <button onClick={() => onDeleteTask(task.id)} className="text-zinc-500 hover:text-ash ml-2">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks with DndContext */}
      {task.isProject && isExpanded && (
        <div className={`mt-2 ml-9 pl-4 border-l ${isDark ? 'border-zinc-800' : 'border-stone-200'} space-y-2 animate-slide-down`}>
          <SortableContext
            items={subTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {subTasks.map(sub => (
              <SortableSubTaskItem
                key={sub.id}
                sub={sub}
                isDark={isDark}
                isDoneList={isDoneList}
                onToggleTaskCompletion={onToggleTaskCompletion}
                handleOpenEditModal={handleOpenEditModal}
                renderTomatoes={renderTomatoes}
                onStartTask={onStartTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </SortableContext>

          {/* Inline Input for Subtasks */}
          {inlineParentId === task.id && !isDoneList ? (
            <div className="flex items-center py-1 -ml-4 pl-4 animate-fade-in relative">
              <div className="flex-1 flex items-center gap-2">
                <input
                  ref={inlineInputRef}
                  type="text"
                  value={inlineInputValue}
                  onChange={(e) => setInlineInputValue(e.target.value)}
                  onKeyDown={handleInlineKeyDown}
                  placeholder={t.plan.nextStep}
                  onBlur={() => {
                    if (inlineInputValue.trim() === '') {
                      setInlineParentId(null);
                    }
                  }}
                  className={`bg-transparent outline-none font-mono text-sm w-full ${isDark ? 'text-white placeholder-zinc-700' : 'text-stone-800 placeholder-stone-400'
                    }`}
                />
                {inlineInputValue.trim().length > 0 && (
                  <div
                    className="flex items-center gap-1 animate-fade-in select-none"
                    onMouseLeave={() => setInlineHoverEst(0)}
                  >
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => handleInlineEstimateClick(num)}
                        onMouseEnter={() => setInlineHoverEst(num)}
                        className="transition-transform hover:scale-110 px-0.5"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <span className={`text-lg filter transition-all duration-200 ${num <= inlineHoverEst ? 'grayscale-0 opacity-100' : 'grayscale opacity-30'
                          }`}>
                          🍅
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setInlineParentId(null)} className={`ml-2 ${isDark ? 'text-zinc-700 hover:text-white' : 'text-stone-300 hover:text-black'}`}>
                <X size={12} />
              </button>
            </div>
          ) : (
            subTasks.length === 0 && !isDoneList && (
              <div
                onClick={() => {
                  setInlineParentId(task.id);
                  setInlineInputValue('');
                }}
                className={`text-xs italic pl-6 cursor-pointer hover:underline ${isDark ? 'text-zinc-800 hover:text-zinc-600' : 'text-stone-300 hover:text-stone-500'}`}
              >
                {t.plan.emptyContainer}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

interface SortableSubTaskItemProps {
  sub: Task;
  isDark: boolean;
  isDoneList: boolean;
  onToggleTaskCompletion: (id: string) => void;
  handleOpenEditModal: (task: Task) => void;
  renderTomatoes: (c: number, f: number, e: number) => React.ReactNode;
  onStartTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const SortableSubTaskItem: React.FC<SortableSubTaskItemProps> = (props) => {
  const { sub, isDark, isDoneList, onToggleTaskCompletion, handleOpenEditModal, renderTomatoes, onStartTask, onDeleteTask } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between group/sub py-1 -ml-4 pl-4 rounded hover:bg-black/5 transition-colors relative"
      onDoubleClick={() => handleOpenEditModal(sub)}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        {/* Subtask Drag Handle */}
        {!isDoneList && (
          <div
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className={`cursor-grab active:cursor-grabbing opacity-0 group-hover/sub:opacity-100 transition-opacity p-0.5 -ml-4 mr-1 ${isDark ? 'text-zinc-700 hover:text-zinc-500' : 'text-stone-300 hover:text-stone-500'
              }`}
          >
            <GripVertical size={12} />
          </div>
        )}

        {/* Subtask Completion Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isDoneList) onToggleTaskCompletion(sub.id);
          }}
          className={`transition-colors mr-1 ${isDark ? 'text-zinc-700 hover:text-zinc-500' : 'text-stone-300 hover:text-stone-500'
            } ${isDoneList ? 'cursor-default opacity-50 pointer-events-none' : ''}`}
        >
          {sub.status === 'completed'
            ? <CheckCircle2 size={16} className={isDark ? 'text-zinc-600' : 'text-stone-400'} />
            : <Circle size={16} />
          }
        </button>

        {/* Subtask Title */}
        <span
          className={`font-mono truncate ${sub.status === 'completed'
            ? (isDark ? 'line-through text-zinc-700' : 'line-through text-stone-300')
            : (isDark ? 'text-zinc-400' : 'text-stone-600')
            }`}
          title={sub.title}
        >
          {sub.title}
        </span>
      </div>

      <div className="flex items-center gap-3 opacity-0 group-hover/sub:opacity-100 transition-opacity pr-2">
        {renderTomatoes(sub.completedPomodoros, sub.failedPomodoros, sub.estimate)}
        {sub.status !== 'completed' && !isDoneList && (
          <button
            onClick={() => onStartTask(sub.id)}
            className={`p-1 rounded-full transition-all ${isDark
              ? 'hover:bg-emerald-500 hover:text-black text-emerald-500'
              : 'hover:bg-emerald-700 hover:text-white text-emerald-700'
              }`}
          >
            <Play size={10} fill="currentColor" />
          </button>
        )}
        {!isDoneList && (
          <button onClick={() => onDeleteTask(sub.id)} className="text-zinc-400 hover:text-ash">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
