import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { sq } from 'date-fns/locale';
import type { Job, SalaryPeriod } from '@/api';
import { salaryPeriodLabels } from './labels';

const numberFormatter = new Intl.NumberFormat('sq-AL');

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

interface SalaryShape {
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod | null;
}

export function formatSalary(job: SalaryShape): string | null {
  const { salary_min, salary_max, salary_period } = job;
  if (salary_min == null && salary_max == null) return null;

  const period = salary_period ? ` / ${salaryPeriodLabels[salary_period]}` : '';

  if (salary_min != null && salary_max != null) {
    return `${formatNumber(salary_min)} – ${formatNumber(salary_max)} Lekë${period}`;
  }
  if (salary_min != null) {
    return `Nga ${formatNumber(salary_min)} Lekë${period}`;
  }
  return `Deri ${formatNumber(salary_max as number)} Lekë${period}`;
}

export function formatSalaryForJob(job: Job): string {
  return formatSalary(job) ?? 'Paga nuk specifikohet';
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return format(date, 'd MMMM yyyy', { locale: sq });
}

export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return format(date, 'd MMM yyyy, HH:mm', { locale: sq });
}

export function formatRelative(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true, locale: sq });
}

export function isFutureDate(value: string | null | undefined): boolean {
  const date = toDate(value);
  if (!date) return false;
  return date.getTime() > Date.now();
}
