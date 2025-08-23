import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Database } from 'lucide-react';

interface ExportButtonProps {
  onExport: (format?: 'csv' | 'json' | 'pdf') => void;
  loading?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport, loading = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onExport(format);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Exportar
      </button>

      {showDropdown && (
        <>
          {/* Overlay to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 mr-3 text-green-600" />
                Exportar como CSV
              </button>
              
              <button
                onClick={() => handleExport('json')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Database className="h-4 w-4 mr-3 text-blue-600" />
                Exportar como JSON
              </button>
              
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-4 w-4 mr-3 text-red-600" />
                Exportar como PDF
              </button>
            </div>
            
            <div className="border-t border-gray-200 py-2">
              <div className="px-4 py-2 text-xs text-gray-500">
                Los datos se exportarán con timestamp actual
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};