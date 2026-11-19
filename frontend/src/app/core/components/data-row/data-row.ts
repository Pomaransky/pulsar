import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-row',
  imports: [],
  templateUrl: './data-row.html',
  styleUrl: './data-row.scss',
})
export class DataRow {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input() icon = '';
  @Input() valueClass = '';
  @Input() vertical = false;
}
