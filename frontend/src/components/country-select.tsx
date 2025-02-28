'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const countryCodes = [
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'UK' },
  { code: '+91', name: 'India' },
  { code: '+61', name: 'Australia' },
  { code: '+86', name: 'China' },
  { code: '+81', name: 'Japan' },
  { code: '+49', name: 'Germany' },
  { code: '+33', name: 'France' },
  { code: '+7', name: 'Russia' },
  { code: '+55', name: 'Brazil' },
  // Add more country codes as needed
];

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CountrySelect({ value, onValueChange }: CountrySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[110px]">
        <SelectValue placeholder="Code" />
      </SelectTrigger>
      <SelectContent className="max-h-[200px]" position="popper">
        {countryCodes.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.code} {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 