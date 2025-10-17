import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(priceCents: number, currency: string = 'CLP'): string {
    const val = (priceCents ?? 0) / 100;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(val);
  }
}
