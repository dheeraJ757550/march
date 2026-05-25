import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Employeec } from "./employeec/employeec";
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Employeec,FormsModule,HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  protected readonly title = signal('employee-ui');
}
