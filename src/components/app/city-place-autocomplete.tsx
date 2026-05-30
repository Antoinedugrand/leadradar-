"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { LOCALE_BCP47 } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export interface CityPlaceSelection {
  description: string;
  placeId: string;
}

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

interface CityPlaceAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: CityPlaceSelection) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: ReactNode;
}

const DEBOUNCE_MS = 300;
const MIN_INPUT_LENGTH = 2;

export function CityPlaceAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  disabled = false,
  required = false,
  className,
  icon,
}: CityPlaceAutocompleteProps) {
  const { t, locale } = useLocale();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const requestIdRef = useRef(0);

  const updateDropdownPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const rect = input.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    setShowEmpty(false);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (rootRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest(".lr-city-suggestions-portal")) {
        return;
      }

      closeSuggestions();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeSuggestions]);

  useEffect(() => {
    if (!isOpen || predictions.length === 0) {
      return;
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, predictions.length, updateDropdownPosition]);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_INPUT_LENGTH || disabled) {
      setPredictions([]);
      setIsLoading(false);
      setShowEmpty(false);
      if (trimmed.length < MIN_INPUT_LENGTH) {
        closeSuggestions();
      }
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setShowEmpty(false);

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          input: trimmed,
          language: LOCALE_BCP47[locale],
        });
        const response = await fetch(`/api/places/autocomplete?${params.toString()}`);
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          setPredictions([]);
          setShowEmpty(false);
          closeSuggestions();
          return;
        }

        const data = (await response.json()) as { predictions?: PlacePrediction[] };
        const nextPredictions = data.predictions ?? [];
        setPredictions(nextPredictions);
        setActiveIndex(-1);
        setIsOpen(nextPredictions.length > 0);
        setShowEmpty(nextPredictions.length === 0);
        if (nextPredictions.length > 0) {
          updateDropdownPosition();
        }
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setPredictions([]);
        closeSuggestions();
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, disabled, locale, closeSuggestions, updateDropdownPosition]);

  function selectPrediction(prediction: PlacePrediction) {
    onChange(prediction.description);
    onSelect?.({ description: prediction.description, placeId: prediction.placeId });
    closeSuggestions();
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || predictions.length === 0) {
      if (event.key === "Escape") {
        closeSuggestions();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % predictions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? predictions.length - 1 : index - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const prediction = predictions[activeIndex];
      if (prediction) {
        selectPrediction(prediction);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSuggestions();
    }
  }

  const showDropdown = isOpen && predictions.length > 0;
  const showEmptyState = showEmpty && !isLoading && value.trim().length >= MIN_INPUT_LENGTH;

  return (
    <div ref={rootRef} className={cn("lr-city-autocomplete", className)}>
      <div className="lr-input-group">
        {icon ? <span className="lr-input-ico">{icon}</span> : null}
        <input
          ref={inputRef}
          id={id}
          className="lr-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            if (predictions.length > 0) {
              updateDropdownPosition();
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {isLoading ? (
        <p className="lr-city-suggestions-status" role="status">
          {t("places.suggestionsLoading")}
        </p>
      ) : null}

      {showEmptyState ? (
        <p className="lr-city-suggestions-status">{t("places.noSuggestions")}</p>
      ) : null}

      {showDropdown && dropdownStyle && typeof document !== "undefined"
        ? createPortal(
            <ul
              id={listboxId}
              className="lr-city-suggestions lr-city-suggestions-portal"
              role="listbox"
              style={{
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
            >
              {predictions.map((prediction, index) => (
                <li key={prediction.placeId} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "lr-city-suggestion",
                      index === activeIndex && "lr-city-suggestion-active",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectPrediction(prediction)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="lr-city-suggestion-main">
                      {prediction.mainText ?? prediction.description}
                    </span>
                    {prediction.secondaryText ? (
                      <span className="lr-city-suggestion-secondary">{prediction.secondaryText}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
