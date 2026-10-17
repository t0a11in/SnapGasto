import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetBody } from './tarjet-body';

describe('TarjetBody', () => {
  let component: TarjetBody;
  let fixture: ComponentFixture<TarjetBody>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetBody],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetBody);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
