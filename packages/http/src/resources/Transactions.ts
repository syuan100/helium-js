import camelcaseKeys from 'camelcase-keys'
import type Client from '../Client'
import type { AnyTransaction, TxnJsonObject } from '../models/Transaction'
import Block from '../models/Block'
import Account from '../models/Account'
import Transaction from '../models/Transaction'
import PendingTransaction from '../models/PendingTransaction'
import ResourceList from '../ResourceList'
import Hotspot from '../models/Hotspot'
import Validator from '../models/Validator'

interface Counts {
  varsV1: number;
  validatorHeartbeatV1: number;
  unstakeValidatorV1: number;
  transferValidatorStakeV1: number;
  transferHotspotV1: number;
  tokenBurnV1: number;
  tokenBurnExchangeRateV1: number;
  stateChannelOpenV1: number;
  stateChannelCloseV1: number;
  stakeValidatorV1: number;
  securityExchangeV1: number;
  securityCoinbaseV1: number;
  routingV1: number;
  rewardsV2: number;
  rewardsV1: number;
  redeemHtlcV1: number;
  priceOracleV1: number;
  pocRequestV1: number;
  pocReceiptsV1: number;
  paymentV2: number;
  paymentV1: number;
  ouiV1: number;
  genGatewayV1: number;
  dcCoinbaseV1: number;
  createHtlcV1: number;
  consensusGroupV1: number;
  consensusGroupFailureV1: number;
  coinbaseV1: number;
  assertLocationV2: number;
  assertLocationV1: number;
  addGatewayV1: number;
}

interface ListParams {
  cursor?: string
  filterTypes?: Array<string>
}

function transactionsUrlFromBlock(block: Block): string {
  if (block.height) {
    return `/blocks/${block.height}/transactions`
  }
  if (block.hash) {
    return `/blocks/hash/${block.hash}/transactions`
  }
  throw new Error('Block must have either height or hash')
}

type Context = Block | Account | Hotspot | Validator

export default class Transactions {
  private client!: Client

  private context?: Context

  constructor(client: Client, context?: Context) {
    this.client = client
    this.context = context
  }

  async submit(txn: string): Promise<PendingTransaction> {
    const url = '/pending_transactions'
    const { data: { data } } = await this.client.post(url, { txn })
    return new PendingTransaction(data)
  }

  async get(hash: string): Promise<AnyTransaction> {
    const url = `/transactions/${hash}`
    const { data: { data } } = await this.client.get(url)
    return Transaction.fromJsonObject(data)
  }

  async counts() {
    let url = ''
    if (this.context instanceof Validator) {
      url = `/validators/${this.context.address}/activity/counts`
    } else {
      throw new Error('invalid context')
    }
    const { data: { data: stats } } = await this.client.get(url)
    return camelcaseKeys(stats) as Counts
  }

  async list(params: ListParams = {}): Promise<ResourceList<AnyTransaction>> {
    if (this.context instanceof Block) {
      return this.listFromBlock(params)
    }
    if (this.context instanceof Account) {
      return this.listFromAccount(params)
    }
    if (this.context instanceof Hotspot) {
      return this.listFromHotspot(params)
    }
    if (this.context instanceof Validator) {
      return this.listFromValidator(params)
    }
    throw new Error('Must provide a block, account or hotspot to list transactions from')
  }

  private async listFromBlock(params: ListParams): Promise<ResourceList<AnyTransaction>> {
    const block = this.context as Block
    const url = transactionsUrlFromBlock(block)
    const response = await this.client.get(url, { cursor: params.cursor })
    const { data: { data: txns, cursor } } = response
    const data = txns.map((d: TxnJsonObject) => Transaction.fromJsonObject(d))
    return new ResourceList(data, this.list.bind(this), cursor)
  }

  private async listFromAccount(params: ListParams): Promise<ResourceList<AnyTransaction>> {
    const account = this.context as Account
    const url = `/accounts/${account.address}/activity`
    const filter_types = params.filterTypes ? params.filterTypes.join() : undefined
    const response = await this.client.get(url, { cursor: params.cursor, filter_types })
    const { data: { data: txns, cursor } } = response
    const data = txns.map((d: TxnJsonObject) => Transaction.fromJsonObject(d))
    return new ResourceList(data, this.list.bind(this), cursor)
  }

  private async listFromHotspot(params: ListParams): Promise<ResourceList<AnyTransaction>> {
    const hotspot = this.context as Hotspot
    const url = `/hotspots/${hotspot.address}/activity`
    const filter_types = params.filterTypes ? params.filterTypes.join() : undefined
    const response = await this.client.get(url, { cursor: params.cursor, filter_types })
    const { data: { data: txns, cursor } } = response
    const data = txns.map((d: TxnJsonObject) => Transaction.fromJsonObject(d))
    return new ResourceList(data, this.list.bind(this), cursor)
  }

  private async listFromValidator(params: ListParams): Promise<ResourceList<AnyTransaction>> {
    const validator = this.context as Validator
    const url = `/validators/${validator.address}/activity`
    const filter_types = params.filterTypes ? params.filterTypes.join() : undefined
    const response = await this.client.get(url, { cursor: params.cursor, filter_types })
    const { data: { data: txns, cursor } } = response
    const data = txns.map((d: TxnJsonObject) => Transaction.fromJsonObject(d))
    return new ResourceList(data, this.list.bind(this), cursor)
  }
}
