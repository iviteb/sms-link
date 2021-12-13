import type {
  ClientsConfig,
  EventContext,
  RecorderState,
  ServiceContext,
} from '@vtex/api'
import { LRUCache, method, Service } from '@vtex/api'

import { Clients } from './clients'
import { sendSMS } from './middlewares/api/sendSMS'
import { orderCancelled } from './middlewares/orderCancelled'
import { orderCreated } from './middlewares/orderCreated'
import { paymentApproved } from './middlewares/paymentApproved'
import { paymentDenied } from './middlewares/paymentDenied'

const TIMEOUT_MS = 800

const memoryCache = new LRUCache<string, any>({ max: 5000 })

metrics.trackCache('status', memoryCache)

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    status: {
      memoryCache,
    },
  },
}

declare global {
  type Context = ServiceContext<Clients, State>

  interface StatusChangeContext extends EventContext<Clients> {
    body: {
      domain: string
      orderId: string
      currentState: string
      lastState: string
      currentChangeDate: string
      lastChangeDate: string
    }
  }

  type State = RecorderState
}

export default new Service({
  clients,
  events: {
    orderCreated,
    orderCancelled,
    paymentApproved,
    paymentDenied,
  },
  routes: {
    sendSMS: method({
      POST: sendSMS,
    }),
  },
})
