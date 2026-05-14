import { Loader2, Trash2, X } from "lucide-react";

export const DeleteModal = ({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
      <button
        onClick={onClose}
        disabled={loading}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        <X size={18} />
      </button>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Delete your account?
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        All your data, investment plans, and personal details will be
        permanently removed. This action cannot be reversed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Deleting…
            </>
          ) : (
            "Yes, delete"
          )}
        </button>
      </div>
    </div>
  </div>
);
