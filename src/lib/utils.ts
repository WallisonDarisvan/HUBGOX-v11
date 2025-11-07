import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 15 dígitos (máximo internacional)
  const limitedNumbers = numbers.slice(0, 15);
  
  // Formatação inteligente baseada no tamanho
  const length = limitedNumbers.length;
  
  if (length === 0) return '';
  if (length <= 2) return limitedNumbers;
  
  // Formato brasileiro: DD XXXXX XXXX (celular 11 dígitos) ou DD XXXX XXXX (fixo 10 dígitos)
  if (length <= 6) {
    return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2)}`;
  }
  if (length === 10) {
    // Fixo: DD XXXX XXXX
    return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2, 6)} ${limitedNumbers.slice(6)}`;
  }
  if (length === 11) {
    // Celular: DD XXXXX XXXX
    return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2, 7)} ${limitedNumbers.slice(7)}`;
  }
  
  // Para números mais longos (12-15 dígitos), usa formato genérico
  if (length <= 13) {
    return `${limitedNumbers.slice(0, 2)} ${limitedNumbers.slice(2, 7)} ${limitedNumbers.slice(7)}`;
  }
  
  return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 7)} ${limitedNumbers.slice(7, 11)} ${limitedNumbers.slice(11)}`;
}
