import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonSpinner
  ]
})
export class LoadingSpinnerComponent implements OnInit {
  // Terima pesan opsional dari parent
  @Input() message: string = '';

  constructor() {}

  ngOnInit() {}
}