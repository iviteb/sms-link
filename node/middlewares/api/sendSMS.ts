import { json } from 'co-body'

import {
  formatMessage,
  getSettings,
  isMessageValid,
  logEvent,
} from '../../utils/helpers'

export async function sendSMS(ctx: Context, next: () => Promise<any>) {
  const {
    clients: { sms },
  } = ctx

  const settings = await getSettings(ctx)
  const body = await json(ctx.req)

  let settingToCheck = false
  let messageToSend = ''

  switch (body.event) {
    case 'request-created': {
      settingToCheck = settings.allowSendReturnRequestSMS
      messageToSend = formatMessage(
        settings.sendReturnRequestText,
        body,
        'refund'
      )
      break
    }

    case 'parcel-received': {
      settingToCheck = settings.allowSendReturnedParcelReceivedSMS
      messageToSend = formatMessage(
        settings.sendReturnedParcelReceivedText,
        body,
        'refund'
      )
      break
    }

    case 'request-denied': {
      settingToCheck = settings.allowSendReturnRequestDeniedSMS
      messageToSend = formatMessage(
        settings.sendReturnRequestDeniedText,
        body,
        'refund'
      )
      break
    }

    default: {
      settingToCheck = settings.allowSendReturnRequestFinalizedSMS
      messageToSend = formatMessage(
        settings.sendReturnRequestFinalizedText,
        body,
        'refund'
      )
    }
  }

  if (settingToCheck && messageToSend && isMessageValid(messageToSend)) {
    await sms.sendJsonMessage({
      connection_id: settings.connectionID,
      password: settings.password,
      to: body.phone,
      message: messageToSend,
      test: settings.enableSandbox ? 1 : 0,
    })
  } else if (settingToCheck) {
    logEvent('Critical', 'Error', 'get-settings', {
      account: ctx.vtex.account,
      message: 'Empty <message> or invalid character detected!',
      sourceType: 'LOG',
    })
  }

  ctx.status = 200
  ctx.body = 'OK'
  await next()
}
