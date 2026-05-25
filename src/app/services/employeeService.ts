import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';



export interface Employee{
  id:number;
  name:string;
  department:string;
  salary:number;
}

@Injectable({
  providedIn: 'root',
})

export class EmployeeService {
  private apiUrl = 'https://localhost:7288/api/Employee';
  constructor (private http:HttpClient){}

getEmployees(): Observable<Employee[]>{
  return this.http.get<Employee[]>(this.apiUrl);
}

addEmployee(emp:Employee):Observable<Employee>{
  return this.http.post<Employee>(this.apiUrl,emp);
}

updateEmployee(id:number ,emp:Employee):Observable<Employee>{
  return this.http.put<Employee>(`${this.apiUrl}/${id}`,emp);
}
  
deleteEmployee(id:number){
  return this.http.delete(`${this.apiUrl}/${id}`);
}

}
