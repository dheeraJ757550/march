import { Component } from '@angular/core';
import { Auth } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true
})
export class Login {
  user = { username: '', password: '' };

  loginMode = 'credentials';
  phoneNumber = '';
  emailInput = '';
  otp = '';
  password = '';
  otpSent = false;

  constructor(private authService: Auth, private router: Router) {}

  login() {
    this.authService.login(this.user).subscribe({
      next: (res: any) => {
        this.authService.saveToken(res.token);
        this.router.navigate(['/employees']);
      },
      error: () => {
        alert('Login failed');
      }
    });
  }

  sendEmailOtp() {
    this.authService.sendOtp(this.emailInput).subscribe({
      next: () => { this.otpSent = true; },
      error: () => { alert('Failed to send email OTP'); }
    });
  }

  verifyEmailOtp() {
    this.authService.verifyOtpRegister({
      username: this.emailInput,
      password: this.password,
      otp: this.otp
    }).subscribe({
      next: (res: any) => {
        this.authService.saveToken(res.token);
        this.router.navigate(['/employees']);
      },
      error: () => { alert('Invalid OTP'); }
    });
  }

  sendPhoneOtp() {
    this.authService.sendPhoneOtp(this.phoneNumber).subscribe({
      next: () => { this.otpSent = true; },
      error: () => { alert('Failed to send phone OTP'); }
    });
  }

  verifyPhoneOtp() {
  this.authService.verifyPhoneOtp({
    username: this.phoneNumber,
    password: this.password,
    otp: this.otp
  }).subscribe({
    next: (res: any) => {
      this.authService.saveToken(res.token);
      this.router.navigate(['/employees']);
    },
    error: (err) => {
      console.log('FULL ERROR:', err);  // ← check browser console F12
      alert('Invalid OTP - Status: ' + err.status + ' Message: ' + err.error);
    }
  });
}

  // Resets otpSent when switching tabs
  switchMode(mode: string) {
    this.loginMode = mode;
    this.otpSent = false;
    this.otp = '';
    this.password = '';
  }
}