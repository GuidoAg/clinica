import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoDni',
})
export class FormatoDniPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (!value) return '';
    const digits = value.toString().replace(/\D/g, '').padStart(8, '0');

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}`;
  }
}
