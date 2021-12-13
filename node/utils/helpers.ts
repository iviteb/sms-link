import { Apps } from '@vtex/api'
import axios from 'axios'
import type { ColossusContext } from 'colossus'
import SplunkEvents from 'splunk-events'

const SPLUNK_ENDPOINT = 'splunk-heavyforwarder-public.vtex.com'
const splunkEvents = new SplunkEvents()

function splunkCustomFetcher(context: ColossusContext) {
  const headers = context.headers || {}

  return axios({
    ...context,
    headers: {
      ...headers,
      'Proxy-Authorization': context.vtex.authToken,
      'X-Vtex-Proxy-To': `https://${SPLUNK_ENDPOINT}:8088`,
    },
  })
}

splunkEvents.config({
  debug: true,
  endpoint: `http://${SPLUNK_ENDPOINT}`,
  request: splunkCustomFetcher,
  token: '473bad07-24e0-4c46-964e-d6f059ec8789',
})

export const getSettings = (ctx: any) => {
  const apps = new Apps(ctx.vtex)

  return apps.getAppSettings(ctx.vtex.userAgent)
}

export const isMessageValid = (message: string) => {
  // eslint-disable-next-line no-useless-escape
  return /^[a-zA-Z0-9 \!\@\#\$\%\&\*\(\)\_\+\-\|\=\;\:\,\.\<\>\/\?\[\]\{\}\~\^\\\\"\'\`\\n\\r\\t]+$/.test(
    message
  )
}

export const formatMessage = (message: string, data: any, type = 'order') => {
  let newMessage = message

  if (type === 'order') {
    newMessage = newMessage
      .replace('{order_id}', data.orderId)
      .replace('{first_name}', data.clientProfileData.firstName)
      .replace('{last_name}', data.clientProfileData.lastName)
      .replace('{email}', data.clientProfileData.email)
      .replace('{order_total}', (Number(data.value) / 100).toString())
  }

  if (type === 'refund') {
    newMessage = newMessage
      .replace('{name}', data.name)
      .replace('{email}', data.email)
      .replace('{gift_card_code}', data.giftCardCode)
      .replace('{gift_card_id}', data.giftCardId)
      .replace('{refunded_amount}', data.refundedAmount)
      .replace('{request_id}', data.requestId)
      .replace('{order_id}', data.orderId)
  }

  return newMessage
}

export const logEvent = (
  level: string,
  type: string,
  workflow: string,
  event: any
) => {
  try {
    splunkEvents.logEvent(level, type, workflow, '-', event)
  } catch (e) {
    return e
  }
}
