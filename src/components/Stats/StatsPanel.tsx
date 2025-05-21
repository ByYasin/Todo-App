import { useMemo } from 'react';
import { Todo, Category, User } from '../../types';

interface StatsPanelProps {
  todos: Todo[];
  categories: Category[];
  user: User | null;
}

const StatsPanel = ({ todos, categories, user }: StatsPanelProps) => {
  // İstatistikleri hesapla
  const stats = useMemo(() => {
    // Toplam görev sayısı
    const totalTasks = todos.length;
    
    // Durumlara göre dağılım
    const statusCounts = todos.reduce(
      (acc, todo) => {
        acc[todo.status] = (acc[todo.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    
    // Önceliklere göre dağılım
    const priorityCounts = todos.reduce(
      (acc, todo) => {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    
    // Kategorilere göre dağılım
    const categoryDistribution = todos.reduce(
      (acc, todo) => {
        const categoryId = todo.category_id;
        if (categoryId !== null) {
          acc[categoryId] = (acc[categoryId] || 0) + 1;
        } else {
          acc['uncategorized'] = (acc['uncategorized'] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string | number, number>
    );
    
    // Tamamlanma oranı
    const completedCount = statusCounts['completed'] || 0;
    const completionRate = totalTasks > 0 
      ? Math.round((completedCount / totalTasks) * 100)
      : 0;
    
    // Yaklaşan görevler (bugün ve gelecek 7 gün)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const upcomingTasks = todos.filter(todo => {
      if (!todo.due_date) return false;
      
      const dueDate = new Date(todo.due_date);
      return dueDate >= now && dueDate <= nextWeek && todo.status !== 'completed';
    });
    
    // Geciken görevler
    const overdueTasks = todos.filter(todo => {
      if (!todo.due_date) return false;
      
      const dueDate = new Date(todo.due_date);
      return dueDate < now && todo.status !== 'completed';
    });

    // Durum yüzdelerini hesapla
    const statusPercentages = {
      pending: totalTasks > 0 ? Math.round((statusCounts['pending'] || 0) / totalTasks * 100) : 0,
      inProgress: totalTasks > 0 ? Math.round((statusCounts['in-progress'] || 0) / totalTasks * 100) : 0,
      completed: totalTasks > 0 ? Math.round((statusCounts['completed'] || 0) / totalTasks * 100) : 0
    };

    // Öncelik yüzdelerini hesapla
    const priorityPercentages = {
      low: totalTasks > 0 ? Math.round((priorityCounts['low'] || 0) / totalTasks * 100) : 0,
      medium: totalTasks > 0 ? Math.round((priorityCounts['medium'] || 0) / totalTasks * 100) : 0,
      high: totalTasks > 0 ? Math.round((priorityCounts['high'] || 0) / totalTasks * 100) : 0
    };
    
    return {
      totalTasks,
      statusCounts,
      priorityCounts,
      categoryDistribution,
      completionRate,
      upcomingTasks,
      overdueTasks,
      statusPercentages,
      priorityPercentages
    };
  }, [todos, categories]);

  // Kategorileri görev sayılarına göre sırala
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const countA = stats.categoryDistribution[a.id] || 0;
      const countB = stats.categoryDistribution[b.id] || 0;
      return countB - countA;
    });
  }, [categories, stats.categoryDistribution]);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        İstatistikler
      </h2>
      
      {/* Özet Sayaçlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Toplam Görev Sayacı */}
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">Toplam Görev</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalTasks}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        
        {/* Tamamlanan Görev Sayacı */}
        <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-100">Tamamlanan</p>
            <h3 className="text-3xl font-bold mt-1">{stats.statusCounts['completed'] || 0}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        {/* Devam Eden Görev Sayacı */}
        <div className="bg-yellow-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-100">Devam Eden</p>
            <h3 className="text-3xl font-bold mt-1">{stats.statusCounts['pending'] || 0}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        {/* Geciken Görev Sayacı */}
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-100">Geciken</p>
            <h3 className="text-3xl font-bold mt-1">{stats.overdueTasks.length}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Durum Dağılımı */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Durum Dağılımı
          </h3>
          
          {/* Durum Dağılımı Pasta Grafik */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36 rounded-full">
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    #10B981 0% ${stats.statusPercentages.completed}%, 
                    #3B82F6 ${stats.statusPercentages.completed}% ${stats.statusPercentages.completed + stats.statusPercentages.inProgress}%, 
                    #F59E0B ${stats.statusPercentages.completed + stats.statusPercentages.inProgress}% 100%
                  )`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xl font-bold">
                  {stats.completionRate}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Durum Lejantı */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-sm bg-green-500 mr-2"></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Tamamlandı</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">{stats.statusCounts['completed'] || 0}</span>
                <span className="text-xs ml-1 text-gray-500">({stats.statusPercentages.completed}%)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Devam Eden</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">{stats.statusCounts['in-progress'] || 0}</span>
                <span className="text-xs ml-1 text-gray-500">({stats.statusPercentages.inProgress}%)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-sm bg-yellow-500 mr-2"></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Bekleyen</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">{stats.statusCounts['pending'] || 0}</span>
                <span className="text-xs ml-1 text-gray-500">({stats.statusPercentages.pending}%)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Öncelik Dağılımı */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Öncelik Dağılımı
          </h3>
          
          {/* Öncelik Bar Grafik */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Yüksek</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.priorityCounts['high'] || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.priorityPercentages.high}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Orta</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.priorityCounts['medium'] || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.priorityPercentages.medium}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Düşük</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.priorityCounts['low'] || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.priorityPercentages.low}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Tamamlanma Oranı */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Tamamlanma Oranı</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completionRate}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.completionRate < 30 ? 'bg-red-500' :
                  stats.completionRate < 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`} 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Kategori Dağılımı */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Kategori Dağılımı
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {sortedCategories.map(category => (
            <div key={category.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center max-w-[70%]">
                  <span 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium truncate">
                    {category.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30">
                  {stats.categoryDistribution[category.id] || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full mt-2">
                <div 
                  className="h-1.5 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${stats.totalTasks > 0 ? (stats.categoryDistribution[category.id] || 0) / stats.totalTasks * 100 : 0}%`,
                    backgroundColor: category.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Yaklaşan ve Geciken Görevler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Yaklaşan Görevler */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Yaklaşan Görevler ({stats.upcomingTasks.length})
          </h3>
          
          {stats.upcomingTasks.length > 0 ? (
            <ul className="space-y-2">
              {stats.upcomingTasks.slice(0, 3).map(task => (
                <li 
                  key={task.id} 
                  className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-center justify-between"
                >
                  <div className="flex items-center overflow-hidden">
                    <div className="min-w-5 h-5 rounded-full mr-3 flex items-center justify-center"
                      style={{
                        backgroundColor: task.priority === 'high' ? '#f87171' :
                                        task.priority === 'medium' ? '#60a5fa' : '#34d399'
                      }}
                    >
                      <span className="text-white text-xs font-bold">
                        {task.priority === 'high' ? 'Y' : task.priority === 'medium' ? 'O' : 'D'}
                      </span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium truncate">{task.title}</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center text-blue-700 dark:text-blue-300 text-sm px-2 py-1 rounded font-medium bg-blue-100 dark:bg-blue-900/40 ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(task.due_date!).toLocaleDateString('tr-TR')}
                  </div>
                </li>
              ))}
              
              {stats.upcomingTasks.length > 3 && (
                <li className="text-center py-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  +{stats.upcomingTasks.length - 3} daha fazla görev
                </li>
              )}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-center">Yaklaşan görev bulunmuyor</p>
            </div>
          )}
        </div>
        
        {/* Geciken Görevler */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Geciken Görevler ({stats.overdueTasks.length})
          </h3>
          
          {stats.overdueTasks.length > 0 ? (
            <ul className="space-y-2">
              {stats.overdueTasks.slice(0, 3).map(task => (
                <li 
                  key={task.id} 
                  className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30 flex items-center justify-between"
                >
                  <div className="flex items-center overflow-hidden">
                    <div className="min-w-5 h-5 rounded-full mr-3 flex items-center justify-center bg-red-500">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <span className="text-red-800 dark:text-red-200 font-medium truncate">{task.title}</span>
                  </div>
                  <div className="flex-shrink-0 flex items-center text-red-700 dark:text-red-300 text-sm px-2 py-1 rounded font-medium bg-red-100 dark:bg-red-900/40 ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(task.due_date!).toLocaleDateString('tr-TR')}
                  </div>
                </li>
              ))}
              
              {stats.overdueTasks.length > 3 && (
                <li className="text-center py-2 text-sm text-red-600 dark:text-red-400 font-medium">
                  +{stats.overdueTasks.length - 3} daha fazla görev
                </li>
              )}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center font-medium">Geciken görev bulunmuyor</p>
              <p className="text-center text-sm text-green-600 dark:text-green-400 mt-1">Harika iş!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel; 