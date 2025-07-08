import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoBoolSiNO',
})
export class FormatoBoolSiNOPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    return '';
  }
}
