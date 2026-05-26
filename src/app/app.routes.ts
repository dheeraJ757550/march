import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Employeec } from './employeec/employeec';
import { authGuard } from './guards/auth-guard';
import { InterviewPrep } from './interview-prep/interview-prep';

export const routes: Routes = [
    {path:'',component:Register},

    {path:'login',component:Login},
    {path:'register',component:Register},
    // {path:'employees',component:Employeec,canActivate:[authGuard]},
  {path:'employees',component:Employeec},
    { path: 'interview', component: InterviewPrep }
];
