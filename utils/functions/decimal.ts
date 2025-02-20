/**
 * Set decimal precision of a number
 * @param value - Value
 * @param decimal - Decimal
 * @returns Decimal precision of a number
 */
export default function decimal(value: number, decimal: number): number {
	return Math.floor(value * Math.pow(10, decimal)) / Math.pow(10, decimal)
}
