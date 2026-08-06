"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

export type AnimatedSelectOption = {
  value: string;
  label: string;
};

type AnimatedSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: AnimatedSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
};

export function AnimatedSelect({ label, placeholder, value, options, onChange, disabled = false, hint }: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  const open = isOpen && !disabled;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <motion.button
          type="button"
          whileHover={disabled ? undefined : { y: -1 }}
          whileTap={disabled ? undefined : { scale: 0.99 }}
          onClick={() => {
            if (!disabled) setIsOpen((current) => !current);
          }}
          disabled={disabled}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-right text-base font-semibold text-[#0A2540] outline-none transition-all hover:border-[#D4AF37] hover:bg-[#FFFCF7] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <span className={selectedOption ? "" : "text-slate-400"}>{selectedOption?.label ?? placeholder}</span>
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </motion.button>

        {hint ? <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p> : null}

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute z-30 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(10,37,64,0.12)]"
            >
              <div className="max-h-72 overflow-y-auto p-2">
                {options.map((option) => {
                  const active = option.value === value;

                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-right text-sm font-bold transition-colors ${
                        active ? "bg-[#0A2540] text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {active ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
