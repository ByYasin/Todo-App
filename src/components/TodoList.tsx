import { Todo } from '../types'
import TodoItem from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  onDelete: (id: number) => void
  onEdit: (todo: Todo) => void
}

const TodoList = ({ todos, onDelete, onEdit }: TodoListProps) => {
  // Todo'ları durumlarına göre gruplama
  const pendingTodos = todos.filter(todo => todo.status === 'pending')
  const inProgressTodos = todos.filter(todo => todo.status === 'in-progress')
  const completedTodos = todos.filter(todo => todo.status === 'completed')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Bekleyen Görevler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
          Bekleyen ({pendingTodos.length})
        </h3>
        
        <div className="space-y-3">
          {pendingTodos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">Bekleyen görev yok</p>
          ) : (
            pendingTodos.map(todo => (
              <TodoItem 
                key={todo.id} 
                todo={todo} 
                onDelete={onDelete} 
                onEdit={onEdit} 
              />
            ))
          )}
        </div>
      </div>

      {/* Devam Eden Görevler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          Devam Eden ({inProgressTodos.length})
        </h3>
        
        <div className="space-y-3">
          {inProgressTodos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">Devam eden görev yok</p>
          ) : (
            inProgressTodos.map(todo => (
              <TodoItem 
                key={todo.id} 
                todo={todo} 
                onDelete={onDelete} 
                onEdit={onEdit} 
              />
            ))
          )}
        </div>
      </div>

      {/* Tamamlanan Görevler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          Tamamlandı ({completedTodos.length})
        </h3>
        
        <div className="space-y-3">
          {completedTodos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">Tamamlanan görev yok</p>
          ) : (
            completedTodos.map(todo => (
              <TodoItem 
                key={todo.id} 
                todo={todo} 
                onDelete={onDelete} 
                onEdit={onEdit} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TodoList 