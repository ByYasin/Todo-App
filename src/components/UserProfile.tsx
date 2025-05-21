import { useState } from 'react';
import { User } from '../types';

interface UserProfileProps {
  user: User | null;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  if (!user) return null;
  
  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium overflow-hidden">
          {initials}
        </div>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <p className="font-medium text-gray-800 dark:text-white">{user.username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{user.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
      
      {/* Dropdown dışına tıklanırsa dropdown kapanır */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default UserProfile; 