"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const LrDialog = DialogPrimitive.Root;
const LrDialogTrigger = DialogPrimitive.Trigger;
const LrDialogClose = DialogPrimitive.Close;

const LrDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("lr-dialog-overlay", className)}
    {...props}
  />
));
LrDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface LrDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  maxWidth?: number;
}

const LrDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  LrDialogContentProps
>(({ className, children, maxWidth = 680, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <LrDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn("lr-modal lr-dialog-content", className)}
      style={{ maxWidth }}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
LrDialogContent.displayName = DialogPrimitive.Content.displayName;

interface LrDialogHeadProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}

function LrDialogHead({ icon, title, description }: LrDialogHeadProps) {
  return (
    <div className="lr-modal-head">
      <span className="lr-modal-ico">{icon}</span>
      <div className="min-w-0 flex-1">
        <DialogPrimitive.Title asChild>
          <h3>{title}</h3>
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description asChild>
            <p>{description}</p>
          </DialogPrimitive.Description>
        ) : null}
      </div>
      <LrDialogClose type="button" className="lr-btn lr-btn-icon" aria-label="Close">
        <X size={15} />
      </LrDialogClose>
    </div>
  );
}

function LrDialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("lr-modal-body lr-dialog-body", className)} {...props} />;
}

function LrDialogFoot({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("lr-modal-foot", className)} {...props} />;
}

export {
  LrDialog,
  LrDialogTrigger,
  LrDialogClose,
  LrDialogContent,
  LrDialogHead,
  LrDialogBody,
  LrDialogFoot,
};
