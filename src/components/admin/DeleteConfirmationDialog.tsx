// src/components/admin/DeleteConfirmationDialog.tsx

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Item?",
  description = "This action cannot be undone. This will permanently delete the selected item from your database.",
  isDeleting = false
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[90%] sm:max-w-[400px] rounded-[24px] p-0 overflow-hidden border-0 shadow-2xl bg-white gap-0">
        
        {/* Header Section with Icon */}
        <div className="flex flex-col items-center text-center p-8 pb-6">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-50/50">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
               <Trash2 className="h-5 w-5 text-red-600" />
            </div>
          </div>

          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold text-gray-900 text-center">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {/* Footer Actions */}
        <AlertDialogFooter className="flex-row gap-3 p-6 pt-2 bg-gray-50/50 sm:justify-center w-full border-t border-gray-100">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl border-gray-200 text-gray-700 font-semibold hover:bg-white hover:text-gray-900 shadow-sm mt-0"
          >
            Cancel
          </AlertDialogCancel>
          
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 gap-2 m-0"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}