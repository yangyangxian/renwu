import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui-kit/Dialog";
import { Button } from "@/components/ui-kit/Button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: (e?: React.MouseEvent) => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onOpenChange,
  title = "Delete?",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} className="max-w-xs">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button">{cancelText}</Button>
        </DialogClose>
        <Button variant="destructive" type="button" onClick={onConfirm}>
          {confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
