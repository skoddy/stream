import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubBtnComponent } from './sub-btn.component';

describe('SubBtnComponent', () => {
  let component: SubBtnComponent;
  let fixture: ComponentFixture<SubBtnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubBtnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
