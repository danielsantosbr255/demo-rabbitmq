import { Candle, CandleColor } from "./candle.types.js"

export class CandleEntity {
  private open: number = 0
  private close: number = 0
  private high: number = 0
  private low: number = Infinity
  private values: number[] = []
  private finalDateTime: Date | null = null;

  constructor(
    private currency: string,
    private color: CandleColor = CandleColor.UNDETERMINED
  ) { }

  addValue(value: number): void {
    this.values.push(value)
    if (this.values.length === 1) this.open = value

    if (value < this.low) this.low = value
    if (value > this.high) this.high = value
  }

  closeCandle(): void {
    if (this.values.length === 0) return

    this.close = this.values[this.values.length - 1]
    this.finalDateTime = new Date()
    this.color = this.open > this.close ? CandleColor.RED : CandleColor.GREEN
  }

  toSimpleObject(): Candle {
    return {
      currency: this.currency,
      color: this.color,
      open: this.open,
      close: this.close,
      high: this.high,
      low: this.low,
      finalDateTime: this.finalDateTime,
    }
  }
}
