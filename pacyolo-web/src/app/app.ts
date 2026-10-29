import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainerComponent } from './core/components/notification-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('pacyolo-web');
}
