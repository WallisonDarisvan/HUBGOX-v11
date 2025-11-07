import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';
import { formatPhoneNumber } from '@/lib/utils';

interface CustomField {
  id: string;
  field_type: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface CustomFieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
}

export const CustomFieldRenderer = ({ field, value, onChange, countryCode, onCountryCodeChange }: CustomFieldRendererProps) => {
  const fieldKey = `custom_${field.id}`;

  switch (field.field_type) {
    case 'text':
    case 'email':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldKey}>{field.label}</Label>
          <Input
            id={fieldKey}
            type={field.field_type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder || field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-12"
            required={field.required}
          />
        </div>
      );

    case 'phone':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldKey}>{field.label}</Label>
          <div className="flex gap-2">
            <Select
              value={countryCode || '+55'}
              onValueChange={onCountryCodeChange}
            >
              <SelectTrigger className="w-[120px] h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.dial}>
                    {country.dial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id={fieldKey}
              type="tel"
              placeholder={field.placeholder || "Digite o número"}
              value={value || ''}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                onChange(formatted);
              }}
              className="h-12 flex-1"
              required={field.required}
            />
          </div>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldKey}>{field.label}</Label>
          <Input
            id={fieldKey}
            type="number"
            placeholder={field.placeholder || field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-12"
            required={field.required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldKey}>{field.label}</Label>
          <Textarea
            id={fieldKey}
            placeholder={field.placeholder || field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[100px]"
            required={field.required}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldKey}>{field.label}</Label>
          <Select
            value={value || ''}
            onValueChange={onChange}
            required={field.required}
          >
            <SelectTrigger id={fieldKey} className="h-12">
              <SelectValue placeholder={field.placeholder || `Selecione ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{field.label}</Label>
          <RadioGroup
            value={value || ''}
            onValueChange={onChange}
            required={field.required}
          >
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${fieldKey}-${idx}`} />
                <Label htmlFor={`${fieldKey}-${idx}`} className="font-normal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{field.label}</Label>
          {field.options?.map((option, idx) => {
            const isChecked = Array.isArray(value) && value.includes(option);
            return (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldKey}-${idx}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${fieldKey}-${idx}`} className="font-normal cursor-pointer">
                  {option}
                </Label>
              </div>
            );
          })}
        </div>
      );

    default:
      return null;
  }
};
