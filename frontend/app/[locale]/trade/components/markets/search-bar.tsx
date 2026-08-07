"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ placeholder, value, onChange }: SearchBarProps) {
  return (
    <div className="p-2 border-b border-border">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full bg-background border border-border text-xs pl-7 pr-2 py-1.5 focus:outline-none focus:border-primary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
