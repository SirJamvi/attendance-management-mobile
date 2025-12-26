import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Storage } from './services/storage';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private storage = inject(Storage);

  constructor() {
    console.log('🚀 AppComponent constructor');
  }

  async ngOnInit() {
    console.log('🔧 AppComponent ngOnInit - Initializing storage...');
    
    // Pastikan storage di-init terlebih dahulu
    await this.storage.init();
    
    console.log('✅ Storage initialized successfully');
  }
}