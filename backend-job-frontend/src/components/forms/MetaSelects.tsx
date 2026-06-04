import { forwardRef } from 'react';
import { useCategories, useQarks } from '@/api/hooks/useMeta';
import { EMPLOYMENT_TYPES } from '@/api';
import { employmentTypeLabels } from '@/lib/labels';
import { Select, type SelectProps } from '@/components/ui/Select';

interface MetaSelectProps extends SelectProps {
  placeholder?: string;
}

export const QarkSelect = forwardRef<HTMLSelectElement, MetaSelectProps>(function QarkSelect(
  { placeholder, ...props },
  ref,
) {
  const { data } = useQarks();
  return (
    <Select ref={ref} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {(data ?? []).map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </Select>
  );
});

export const CategorySelect = forwardRef<HTMLSelectElement, MetaSelectProps>(function CategorySelect(
  { placeholder, ...props },
  ref,
) {
  const { data } = useCategories();
  return (
    <Select ref={ref} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {(data ?? []).map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </Select>
  );
});

export const EmploymentTypeSelect = forwardRef<HTMLSelectElement, MetaSelectProps>(
  function EmploymentTypeSelect({ placeholder, ...props }, ref) {
    return (
      <Select ref={ref} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {EMPLOYMENT_TYPES.map((value) => (
          <option key={value} value={value}>
            {employmentTypeLabels[value]}
          </option>
        ))}
      </Select>
    );
  },
);
