import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { CategoryAutocompleteComponent } from './category-autocomplete.component';

@Component({
  imports: [CategoryAutocompleteComponent],
  template: `<app-category-autocomplete [field]="f.category" [options]="options" />`,
})
class HostComponent {
  readonly model = signal({ category: '' });
  readonly f = form(this.model);
  readonly options = ['Comida', 'Transporte'];
}

describe('CategoryAutocompleteComponent', () => {
  it('sugiere las categorías existentes mediante datalist', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input')!;
    const list = el.querySelector(`datalist#${input.getAttribute('list')}`)!;
    expect([...list.querySelectorAll('option')].map((o) => o.value)).toEqual(['Comida', 'Transporte']);
  });

  it('marca como nueva una categoría que no existe (sin distinguir mayúsculas)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.model.set({ category: 'comida' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.new-badge')).toBeNull();

    host.model.set({ category: 'Mascotas' });
    await fixture.whenStable();
    expect(el.querySelector('.new-badge')).not.toBeNull();
    expect(el.textContent).toContain('se guardará como categoría nueva');
  });
});
