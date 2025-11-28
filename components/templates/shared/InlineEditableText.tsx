import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, ElementType, KeyboardEvent } from "react";
import { cn } from "@/utils";

export type TextField = "title" | "subtitle";

interface InlineEditableTextProps {
  element: ElementType;
  field: TextField;
  value?: string;
  placeholder: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  onTextChange?: (field: TextField, value: string) => void;
}

export function InlineEditableText({
  element,
  field,
  value,
  placeholder,
  className,
  style,
  ariaLabel,
  onTextChange,
}: InlineEditableTextProps) {
  const normalizedValue = value ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(normalizedValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditable = Boolean(onTextChange);
  const Tag = element;

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (!isEditable) return;
    setIsEditing(true);
  }, [isEditable]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDraft(normalizedValue);
  }, [normalizedValue]);

  const handleCommit = useCallback(() => {
    setIsEditing(false);
    if (!onTextChange) {
      return;
    }
    if (draft !== normalizedValue) {
      onTextChange(field, draft);
    }
  }, [draft, field, normalizedValue, onTextChange]);

  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    handleCommit();
  }, [handleCommit, isEditing]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isEditable) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleCommit();
      }
    },
    [cancelEditing, handleCommit, isEditable],
  );

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  }, []);

  const startKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        startEditing();
      }
    },
    [startEditing],
  );

  if (!isEditable) {
    return (
      <Tag className={className} style={style}>
        {normalizedValue || placeholder}
      </Tag>
    );
  }

  const displayClassName = cn(
    className,
    "cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={handleDraftChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          className,
          "border-0 bg-transparent p-0 outline-none placeholder:text-muted-foreground focus-visible:outline-none",
        )}
        style={style}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <Tag
      className={displayClassName}
      style={style}
      onClick={startEditing}
      onKeyDown={startKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ? `${ariaLabel} (press Enter to edit)` : undefined}
    >
      {normalizedValue || placeholder}
    </Tag>
  );
}
