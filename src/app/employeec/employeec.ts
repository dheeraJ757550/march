import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../services/employeeService';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { Chat } from '../services/chat';

@Component({
  selector: 'app-employeec',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employeec.html',
  styleUrls: ['./employeec.css'],
  providers: [EmployeeService]
})
export class Employeec implements OnInit, AfterViewChecked {

  isEditMode: boolean = false;
  editEmployeeId: number = 0;
  employees: Employee[] = [];
  newEmployee: Employee = {
    id: 0,
    name: '',
    department: '',
    salary: 0
  };
activeTab: string = 'chat';
  messages: any[] = [];
  userInput: string = '';
  isTyping = false;
  @ViewChild('chatBody') chatBody!: ElementRef;

  constructor(
    private employeeService: EmployeeService,
    private authService: Auth,
    private router: Router,
    private chatService: Chat
  ) {}

  setTab(tab: string) {
  this.activeTab = tab;
}
goToInterview() {
  this.router.navigate(['/interview']);
}

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngAfterViewChecked() {
    if (this.chatBody) {
      this.chatBody.nativeElement.scrollTop =
      this.chatBody.nativeElement.scrollHeight;
    }
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe(data => {
      this.employees = data;
    });
  }

  addEmployee() {
    this.employeeService.addEmployee(this.newEmployee).subscribe(() => {
      this.loadEmployees();
      this.newEmployee = {
        id: 0,
        name: '',
        department: '',
        salary: 0
      };
    });
  }

  deleteEmployee(id: number) {
    this.employeeService.deleteEmployee(id).subscribe(() => {
      this.loadEmployees();
    });
  }

  editEmployee(emp: Employee) {
    this.newEmployee = { ...emp };
    this.isEditMode = true;
    this.editEmployeeId = emp.id;
  }

  saveEmployee() {
    if (this.isEditMode) {
      this.employeeService.updateEmployee(this.editEmployeeId, this.newEmployee)
        .subscribe(() => {
          this.loadEmployees();
          this.resetForm();
        });
    } else {
      this.employeeService.addEmployee(this.newEmployee)
        .subscribe(() => {
          this.loadEmployees();
          this.resetForm();
        });
    }
  }

  resetForm() {
    this.newEmployee = {
      id: 0,
      name: '',
      department: '',
      salary: 0
    };
    this.isEditMode = false;
    this.editEmployeeId = 0;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({ sender: 'user', text: this.userInput });
    this.isTyping = true;

    this.chatService.sendMessage(this.userInput).subscribe({
      next: (res: any) => {
        console.log("API RESPONSE:", res);

        let botReply = '';
        if (res.reply) {
          botReply = res.reply.replace(/\n/g, '<br>');
        } else {
          botReply = JSON.stringify(res);
        }

        this.messages.push({ sender: 'bot', text: botReply });
        this.isTyping = false;
      },
      error: () => {
        this.messages.push({ sender: 'bot', text: 'Error from server' });
        this.isTyping = false;
      }
    });

    this.userInput = '';
  }
}