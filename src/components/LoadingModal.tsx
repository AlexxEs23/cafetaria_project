'use client'

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

export default function LoadingModal({ isOpen, message = 'Memproses...' }: LoadingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
          <div className="text-center">
            {/* Spinner */}
            <div className="mx-auto w-16 h-16 mb-4">
              <svg 
                className="animate-spin text-teal-700" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            
            {/* Message */}
            <p className="text-gray-900 font-medium text-lg">{message}</p>
            <p className="text-gray-900 text-sm mt-2">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
