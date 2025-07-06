import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlay } from './components/loading-overlay/loading-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingOverlay],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'clinica';
}
