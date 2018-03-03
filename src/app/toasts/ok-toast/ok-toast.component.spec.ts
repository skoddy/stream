import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OkToastComponent } from './ok-toast.component';

describe('OkToastComponent', () => {
  let component: OkToastComponent;
  let fixture: ComponentFixture<OkToastComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OkToastComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OkToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
