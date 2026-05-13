export enum CandleColor {
  GREEN = "GREEN",
  RED = "RED",
  UNDETERMINED = "UNDETERMINED",
}

export enum Period {
  TEN_SECONDS = 10000,
  THIRTY_SECONDS = 30000,
  ONE_MINUTE = 60000,
  FIVE_MINUTES = 300000,
  THIRTY_MINUTES = 1800000,
  ONE_HOUR = 3600000,
  ONE_DAY = 86400000,
}

export type Candle = {
  currency: string,
  open: number,
  high: number,
  low: number,
  close: number,
  color: CandleColor,
  finalDateTime: Date | null,
}

export type PriceApiResponse = {
  status: {
    error_code: number
    error_message: string
  }
  bitcoin?: {
    usd: number
  }
}
