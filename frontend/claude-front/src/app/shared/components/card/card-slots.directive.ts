import { Directive } from '@angular/core';

/** Marca el contenido que va a la derecha del título: `<div cardActions>…</div>`. */
@Directive({ selector: '[cardActions]' })
export class CardActionsDirective {}

/** Marca el contenido del pie de la card: `<div cardFooter>…</div>`. */
@Directive({ selector: '[cardFooter]' })
export class CardFooterDirective {}
