import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FailToastComponent } from './fail-toast.component';

describe('FailToastComponent', () => {
  let component: FailToastComponent;
  let fixture: ComponentFixture<FailToastComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FailToastComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FailToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
