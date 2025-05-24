import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DroppableProps, DropResult, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import TodoItem from './TodoItem';
import { Todo, Category } from '../types';


interface StrictModeDroppable extends Omit<DroppableProps, 'children'> {
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement<any>;
}


type StatusType = 'pending' | 'in-progress' | 'completed';


const StrictModeDroppable = ({ children, ...props }: StrictModeDroppable) => {
  // React 18+ uyumluluğu için
  
  const [enabled, setEnabled] = useState(false);
  
  React.useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props} isCombineEnabled={false}>{children}</Droppable>;
};

interface DraggableTodoListProps {
  todos: Todo[];
  onDeleteTodo: (id: number) => void;
  onEditTodo: (todo: Todo) => void;
  onStatusChange: (id: number, status: string) => void;
  categories: Category[];
}

const DraggableTodoList: React.FC<DraggableTodoListProps> = ({
  todos,
  onDeleteTodo,
  onEditTodo,
  onStatusChange,
  categories,
}) => {
  
  const todosByStatus: Record<StatusType, Todo[]> = {
    pending: todos.filter((todo: Todo) => todo.status === 'pending'),
    'in-progress': todos.filter((todo: Todo) => todo.status === 'in-progress'),
    completed: todos.filter((todo: Todo) => todo.status === 'completed'),
  };

  
  const statusTitles: Record<StatusType, string> = {
    pending: 'Bekleyen',
    'in-progress': 'Devam Ediyor',
    completed: 'Tamamlanan',
  };

  
  const statusColors: Record<StatusType, string> = {
    pending: 'bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500/80 dark:to-amber-600/80',
    'in-progress': 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500/80 dark:to-blue-600/80',
    completed: 'bg-gradient-to-r from-green-400 to-green-500 dark:from-green-500/80 dark:to-green-600/80',
  };

  
  const statusIcons: Record<StatusType, React.ReactElement> = {
    pending: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'in-progress': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    completed: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  
  const [showNoTaskMessage, setShowNoTaskMessage] = useState(true);

  
  const onDragEnd = (result: DropResult): void => {
    const { source, destination } = result;

    
    if (!destination) {
      return;
    }

    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    
    if (source.droppableId === destination.droppableId) {
      
      return;
    }

    
    const todoId = parseInt(result.draggableId.split('-')[1]);
    const newStatus = destination.droppableId;

    if (todoId && newStatus) {
      onStatusChange(todoId, newStatus);
    }
  };

  return (
    <div className="mb-4">
      {todos.length === 0 && showNoTaskMessage ? (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Görev Bulunamadı</h2>
          <p className="text-gray-500 dark:text-gray-300 mb-6">Arama kriterlerinize uygun görev bulunamadı.</p>
          <button
            onClick={() => setShowNoTaskMessage(false)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Bu mesajı gizle
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd} isCombineEnabled={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(todosByStatus).map(([status, statusTodos]) => (
              <div
                key={status}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden mb-4 md:mb-0 border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:shadow-lg"
              >
                
                <div className={`${statusColors[status as StatusType]} text-white px-4 py-3 flex items-center justify-between`}>
                  <h3 className="font-medium flex items-center text-lg">
                    {statusIcons[status as StatusType]}
                    {statusTitles[status as StatusType]}
                  </h3>
                  <span className="bg-white/20 backdrop-blur-sm text-sm text-white rounded-full w-7 h-7 flex items-center justify-center font-medium shadow-inner">
                    {statusTodos.length}
                  </span>
                </div>

                
                <StrictModeDroppable droppableId={status} isDropDisabled={false} ignoreContainerClipping={false}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[200px] transition-all duration-300 ${
                        snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-800/20' : ''
                      }`}
                      style={{ maxHeight: '70vh', overflowY: 'auto' }}
                    >
                      {statusTodos.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center p-6">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-gray-300 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d={
                                  status === 'pending' 
                                    ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                                    : status === 'in-progress' 
                                    ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                    : "M5 13l4 4L19 7"
                                } 
                              />
                            </svg>
                            <p className="text-gray-400 dark:text-gray-400 text-sm">
                              Bu durumda görev yok
                            </p>
                            <p className="text-blue-500 dark:text-blue-400 text-xs mt-2">
                              Bir görevi buraya sürükleyebilirsiniz
                            </p>
                          </div>
                        </div>
                      ) : (
                        statusTodos.map((todo: Todo, index: number) => (
                          <Draggable key={`todo-${todo.id}`} draggableId={`todo-${todo.id}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 rounded-lg transform transition-all ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg scale-[1.02] rotate-1 ring-2 ring-blue-300 dark:ring-blue-700 z-10' 
                                    : 'hover:shadow-md shadow-sm border border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <TodoItem
                                  todo={todo}
                                  onDelete={onDeleteTodo}
                                  onEdit={onEditTodo}
                                  categories={categories}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default DraggableTodoList; 