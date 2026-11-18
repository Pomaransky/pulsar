import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputFieldSignalForms } from './input-field-signal-forms';

describe('InputFieldSignalForms', () => {
  let component: InputFieldSignalForms;
  let fixture: ComponentFixture<InputFieldSignalForms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputFieldSignalForms],
    }).compileComponents();

    fixture = TestBed.createComponent(InputFieldSignalForms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
