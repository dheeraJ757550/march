import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Chat {
  
  private apiUrl = 'https://localhost:7288/api/Chat';

  constructor(private http: HttpClient) {}

  sendMessage(message: string) {
    return this.http.post(this.apiUrl, { message });
  }
}
