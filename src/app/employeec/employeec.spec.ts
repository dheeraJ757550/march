import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Employeec } from './employeec';

describe('Employeec', () => {
  let component: Employeec;
  let fixture: ComponentFixture<Employeec>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employeec]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Employeec);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
