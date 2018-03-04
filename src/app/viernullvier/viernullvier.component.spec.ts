import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViernullvierComponent } from './viernullvier.component';

describe('ViernullvierComponent', () => {
  let component: ViernullvierComponent;
  let fixture: ComponentFixture<ViernullvierComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViernullvierComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViernullvierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
