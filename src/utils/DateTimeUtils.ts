export class DateTimeUtils {
	static calculateDifference(d1: Date, d2: Date): number {
		return Math.abs((d1.getTime() - d2.getTime()) / 1000);
	}
}
