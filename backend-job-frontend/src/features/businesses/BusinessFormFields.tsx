import { type FieldErrors, type Path, type UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { QarkSelect } from '@/components/forms/MetaSelects';
import type { UpdateBusinessValues } from './schemas';

interface BusinessFormFieldsProps<T extends UpdateBusinessValues> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}

export function BusinessFormFields<T extends UpdateBusinessValues>({
  register,
  errors,
}: BusinessFormFieldsProps<T>) {
  const field = (name: keyof UpdateBusinessValues) => name as Path<T>;
  const errorOf = (name: keyof UpdateBusinessValues) =>
    (errors as FieldErrors<UpdateBusinessValues>)[name]?.message;

  return (
    <>
      <Input
        label="Emri i biznesit"
        required
        error={errorOf('name')}
        {...register(field('name'))}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <QarkSelect
          label="Qarku"
          required
          placeholder="Zgjidhni qarkun"
          error={errorOf('qark')}
          {...register(field('qark'))}
        />
        <Input label="Qyteti" required error={errorOf('city')} {...register(field('city'))} />
      </div>

      <Input
        label="Adresa"
        required
        error={errorOf('address')}
        {...register(field('address'))}
      />

      <Input
        label="Telefoni"
        type="tel"
        required
        placeholder="+355 4X XXX XXXX"
        hint="Formati shqiptar: +355 i ndjekur nga 8–9 shifra."
        error={errorOf('phone')}
        {...register(field('phone'))}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Faqja web"
          type="url"
          placeholder="https://…"
          hint="Opsionale."
          error={errorOf('website')}
          {...register(field('website'))}
        />
        <Input
          label="Logo (URL)"
          type="url"
          placeholder="https://…"
          hint="Opsionale."
          error={errorOf('logo_url')}
          {...register(field('logo_url'))}
        />
      </div>

      <Textarea
        label="Përshkrimi"
        rows={6}
        required
        hint="10–5000 karaktere."
        error={errorOf('description')}
        {...register(field('description'))}
      />
    </>
  );
}
