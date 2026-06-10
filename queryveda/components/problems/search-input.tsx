"use client";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <Input
      className="max-w-sm"
      placeholder="Search problems..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
