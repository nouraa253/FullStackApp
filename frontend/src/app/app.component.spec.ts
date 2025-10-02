import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CustomerService, Customer } from './customer.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  const customerServiceMock = {
    getCustomers: () => of([] as Customer[]),
    addCustomer: () => of({} as Customer),
    deleteCustomer: () => of(void 0)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [FormsModule, HttpClientTestingModule],
      providers: [{ provide: CustomerService, useValue: customerServiceMock }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title "frontend"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('frontend');
  });

  it('should render header "Customer List"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); 
    const el: HTMLElement = fixture.nativeElement;
    const header = el.querySelector('h2');
    expect(header?.textContent).toContain('Customer List');
  });

  it('should render the "Add Customer" form', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); 
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[placeholder="Enter name"]')).toBeTruthy();
    expect(el.querySelector('input[placeholder="Enter email"]')).toBeTruthy();
    expect(el.querySelector('button')).toBeTruthy();
  });
});
