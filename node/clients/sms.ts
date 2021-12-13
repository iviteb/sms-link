import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { logEvent } from '../utils/helpers'

export default class SMSLink extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public async sendJsonMessage(body: any) {
    this.http
      .post(
        `http://secure.smslink.ro/sms/gateway/communicate/json.php`,
        JSON.stringify(body)
      )
      .then((response: any) => {
        if (response.response_type === 'ERROR') {
          logEvent('Critical', 'Error', 'smslink-send', {
            account: this.context.account,
            message: response.response_message,
            sourceType: 'LOG',
          })
        } else {
          logEvent('Important', 'Info', 'smslink-send', {
            account: this.context.account,
            message: response.response_message,
            sourceType: 'LOG',
          })
        }
      })
      .catch((error) => {
        logEvent('Critical', 'Error', 'smslink-send', {
          account: this.context.account,
          message: error.toString(),
          sourceType: 'LOG',
        })
      })
  }
}
