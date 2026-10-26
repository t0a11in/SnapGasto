import { TestBed } from '@angular/core/testing';
import { FileDropzoneComponent } from './file-dropzone.component';
import { formatFileSize, matchesAccept } from './file-dropzone.utils';

const file = (name: string, type: string, bytes = 10): File => new File([new Uint8Array(bytes)], name, { type });

describe('FileDropzoneComponent', () => {
  it('reconoce extensiones, tipos exactos y comodines en accept', () => {
    expect(matchesAccept(file('boleta.PDF', 'application/pdf'), '.pdf')).toBeTrue();
    expect(matchesAccept(file('foto.jpg', 'image/jpeg'), 'image/*')).toBeTrue();
    expect(matchesAccept(file('foto.jpg', 'image/jpeg'), 'image/png')).toBeFalse();
    expect(matchesAccept(file('nota.txt', 'text/plain'), '')).toBeTrue();
  });

  it('formatea tamaños', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1536)).toBe('1,5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('agrega archivos válidos y rechaza los de otro tipo o demasiado grandes', async () => {
    const fixture = TestBed.createComponent(FileDropzoneComponent);
    fixture.componentRef.setInput('accept', 'image/*,.pdf');
    fixture.componentRef.setInput('maxSizeMb', 1);
    const dropzone = fixture.componentInstance;
    let rejectedCount = 0;
    dropzone.rejected.subscribe((r) => (rejectedCount = r.length));

    dropzone.addFiles([
      file('boleta.pdf', 'application/pdf'),
      file('planilla.xlsx', 'application/vnd.ms-excel'),
      file('foto.png', 'image/png', 2 * 1024 * 1024),
    ]);
    await fixture.whenStable();

    expect(dropzone.value().map((f) => f.name)).toEqual(['boleta.pdf']);
    expect(rejectedCount).toBe(2);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.sg-dropzone__item').length).toBe(1);
    expect(host.querySelector('.invalid-feedback')!.textContent).toContain('planilla.xlsx');
  });

  it('respeta multiple=false y maxFiles, y no duplica archivos', () => {
    const single = TestBed.createComponent(FileDropzoneComponent);
    single.componentRef.setInput('multiple', false);
    single.componentInstance.addFiles([file('a.pdf', 'application/pdf'), file('b.pdf', 'application/pdf')]);
    expect(single.componentInstance.value().length).toBe(1);

    const limited = TestBed.createComponent(FileDropzoneComponent);
    limited.componentRef.setInput('maxFiles', 2);
    const a = file('a.pdf', 'application/pdf');
    limited.componentInstance.addFiles([a, a, file('b.pdf', 'application/pdf'), file('c.pdf', 'application/pdf')]);
    expect(limited.componentInstance.value().map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
  });

  it('quita un archivo con su botón', async () => {
    const fixture = TestBed.createComponent(FileDropzoneComponent);
    fixture.componentInstance.addFiles([file('a.pdf', 'application/pdf'), file('b.pdf', 'application/pdf')]);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('button[aria-label="Quitar a.pdf"]')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value().map((f) => f.name)).toEqual(['b.pdf']);
  });

  it('acepta archivos soltados sobre la zona', async () => {
    const fixture = TestBed.createComponent(FileDropzoneComponent);
    await fixture.whenStable();
    const transfer = new DataTransfer();
    transfer.items.add(file('foto.png', 'image/png'));
    const zone = (fixture.nativeElement as HTMLElement).querySelector('.sg-dropzone')!;
    zone.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.value().map((f) => f.name)).toEqual(['foto.png']);
  });
});
