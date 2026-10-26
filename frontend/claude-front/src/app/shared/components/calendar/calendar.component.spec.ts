import { TestBed } from '@angular/core/testing';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { CalendarComponent } from './calendar.component';

describe('CalendarComponent', () => {
  it('muestra el calendario en español', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.componentRef.setInput('value', '2026-10-22');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('ngb-datepicker')).not.toBeNull();
    expect(host.textContent).toContain('Lu');
    expect(host.querySelector('.sg-calendar__day.is-selected')!.textContent).toContain('22');
  });

  it('al elegir un día entrega la fecha en AAAA-MM-DD', () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    const calendar = fixture.componentInstance;
    calendar.onSelect(new NgbDate(2026, 10, 5));
    expect(calendar.value()).toBe('2026-10-05');
  });

  it('marca los días indicados', async () => {
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.componentRef.setInput('value', '2026-10-01');
    fixture.componentRef.setInput('marked', ['2026-10-10', '2026-10-20']);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.sg-calendar__mark').length).toBe(2);
  });
});
