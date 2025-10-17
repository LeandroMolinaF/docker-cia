import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateLong', standalone: true })
export class DateLongPipe implements PipeTransform {
  transform(value?: string | Date, locale: string = 'en-US'): string {
    if (!value) return '';
    const d = (typeof value === 'string') ? new Date(value) : value;
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: '2-digit' }).format(d);
  }
}
