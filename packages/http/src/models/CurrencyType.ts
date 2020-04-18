const TICKER = 'HNT'
const DC_TICKER = 'DC'
const SEC_TICKER = 'STO'

export default class CurrencyType {
  public ticker: string
  public coefficient: number

  constructor(ticker: string, coefficient: number) {
    this.ticker = ticker
    this.coefficient = coefficient
  }

  static get default(): CurrencyType {
    return new CurrencyType(TICKER, 0.00000001)
  }

  static get data_credit(): CurrencyType {
    return new CurrencyType(DC_TICKER, 1)
  }

  static get security(): CurrencyType {
    return new CurrencyType(SEC_TICKER, 0.00000001)
  }
}
