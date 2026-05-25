import { TestBed } from '@angular/core/testing';

import { Employee, EmployeeService } from './employeeService';

describe('Employee', () => {
  let service: EmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
