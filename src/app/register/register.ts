import { Component } from '@angular/core';
import { Auth } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from "@angular/router";
import { SocialAuthService, GoogleLoginProvider, SocialAuthServiceConfig, SOCIAL_AUTH_CONFIG, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
  providers: [
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('876460507379-r63i228ko6kepejlv8sbh35f7u9bgv3l.apps.googleusercontent.com')
          }
        ]
      } as SocialAuthServiceConfig
    },
    SocialAuthService
  ]
})
export class Register {

  // otpSent = false;
timer = 30;
canResend = false;
interval: any;

  user={
    username:'',
    password:'',
    otp:''
  };
   otpSent = false;
  constructor( private socialAuthService: SocialAuthService,private authService:Auth , private router: Router ){
    this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        const googleToken = user.idToken;
        if (googleToken) {
          this.authService.googleLogin(googleToken).subscribe({
            next: (res: any) => {
              this.authService.saveToken(res.token);
              this.router.navigate(['/employees']);
            },
            error: (err) => {
              console.log('Google login error:', err);
            }
          });
        }
      }
    });
  }

   sendOtp() {
  this.authService.sendOtp(this.user.username).subscribe({
    next: (res) => {
      console.log(res);
      alert('OTP sent successfully');
      this.otpSent = true;
      this.startTimer();
    },
    error: (err) => {
      console.log("ERROR:", err);
      alert('Failed to send OTP');
    }
  });
}

startTimer() {
  this.timer = 30;
  this.canResend = false;

  this.interval = setInterval(() => {
    this.timer--;

    if (this.timer === 0) {
      this.canResend = true;
      clearInterval(this.interval);
    }
  }, 1000);
}

resendOtp() {
  if (!this.canResend) return;

  this.sendOtp(); // reuse same method
}
  // register(){
  //   this.authService.register(this.user).subscribe({
  //     next:()=>{
  //       alert('Registration successful');
  //     },
  //     error:()=>{
  //       alert('Registration failed');
  //     }
  //   });
  // }
  register() {
  this.authService.verifyOtpRegister(this.user).subscribe({
    next: (res: any) => {
      this.authService.saveToken(res.token);

      // alert('Registered & Logged in');

      this.router.navigate(['/employees']); // go to dashboard
    },
    error: () => {
      alert('Invalid OTP');
    }
  });
}
  //  register() {
  //   this.authService.verifyOtpRegister(this.user).subscribe({
  //     next: () => alert('Registered Successfully'),
  //     error: () => alert('Invalid OTP')
  //   });
  // }

}
