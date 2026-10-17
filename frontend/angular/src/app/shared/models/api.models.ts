export interface Menu {
	path?: string;
	title?: string;
	icon?: string;
	type?: string;
	badgeType?: string;
	badgeValue?: string;
	active?: boolean;
	bookmark?: boolean;
	children?: Menu[];
}



export type CircuitBraker = 'CLOSED' | 'OPEN' | 'HALF-OPEN';
export type TokenLife = 'CLOSED' | 'OPEN' | 'DEAD' ;
