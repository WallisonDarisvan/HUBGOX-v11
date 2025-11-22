import { memo } from 'react';
import { CustomFieldRenderer } from './CustomFieldRenderer';

interface CustomField {
  id: string;
  field_type: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

// Memoized version of CustomFieldRenderer for performance
export const CustomFieldRendererMemoized = memo(CustomFieldRenderer, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.field.id === nextProps.field.id &&
    prevProps.field.field_type === nextProps.field.field_type &&
    prevProps.field.label === nextProps.field.label &&
    prevProps.field.required === nextProps.field.required &&
    prevProps.value === nextProps.value &&
    JSON.stringify(prevProps.field.options) === JSON.stringify(nextProps.field.options)
  );
});

CustomFieldRendererMemoized.displayName = 'CustomFieldRendererMemoized';