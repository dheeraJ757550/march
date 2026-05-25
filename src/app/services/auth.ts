import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'https://prep-interview-4kyo.onrender.com/api/auth';
  constructor(private http: HttpClient) {}

  register(user:any){
    return this.http.post(`${this.apiUrl}/register`, user);
  }
  login(user:any){
    return this.http.post<any>(`${this.apiUrl}/login`, user);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
   sendOtp(email: string) {
  return this.http.post<any>(`${this.apiUrl}/send-otp`, JSON.stringify(email), {
    headers: { 'Content-Type': 'application/json' }
  });
}

  verifyOtpRegister(data: any) {
    return this.http.post(`${this.apiUrl}/verify-otp-register`, data);
  }
  googleLogin(token: string) {
  return this.http.post(`${this.apiUrl}/google-login`, { token }, {
    headers: { 'Content-Type': 'application/json' }
  });
}
sendPhoneOtp(phone: string) {
  return this.http.post(
    `${this.apiUrl}/send-otp-phone`,
    JSON.stringify(phone),
    { headers: { 'Content-Type': 'application/json' }}
  );
}

verifyPhoneOtp(data: { username: string, password: string, otp: string }) {
  return this.http.post(
    `${this.apiUrl}/verify-otp-phone-register`,
    data
  );
}
  
}
