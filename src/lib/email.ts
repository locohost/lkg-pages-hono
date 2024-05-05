import { Context } from 'hono';
import { PostmarkResp } from '../types';

export async function sendPostmark(
  c: Context,
  to: string,
  subject: string,
  body: string,
	tag: string
) {
  const serverTkn = c.env.PM_TKN;
  const mssgs = [
    {
      From: 'admin@lateknight.games',
      To: to,
      Subject: subject,
      Tag: tag,
      HtmlBody: body,
      Headers: [
        {
          Name: 'X-Postmark-Server-Token',
          Value: serverTkn,
        },
      ],
      TrackOpens: true,
      TrackLinks: 'HtmlOnly',
      MessageStream: 'outbound',
    },
  ];
  const resp = await fetch(`https://api.postmarkapp.com/email/batch`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': serverTkn,
    },
    // @ts-ignore
    body: JSON.stringify(mssgs),
  });

  const data = await resp.text();
  console.log('sendPostmark resp: ', data);
  return JSON.parse(data) as PostmarkResp;
}

export async function sendEmail(
  c: Context,
  to: string,
  subject: string,
  body: string
) {
  //console.log('mgCreds: ', mgCreds);
  const mgCreds = c.env.MG_CREDS;
  const form = new FormData();
  form.append('from', 'mark@mg.lateknight.games');
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', body);
  // https://api.mailgun.net/v3/{domain_name}/messages
  const domainName = 'mg.lateknight.games';
  //const auth = Buffer.from(mgCreds).toString('base64');
  console.log('sendEmail creds: ', mgCreds);
  console.log('sendEmail form: ', form);
  const resp = await fetch(
    `https://api.mailgun.net/v3/${domainName}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + mgCreds,
      },
      // @ts-ignore
      body: form,
    }
  );

  const data = await resp.text();
  console.log('sendEmail resp: ', data);
}
