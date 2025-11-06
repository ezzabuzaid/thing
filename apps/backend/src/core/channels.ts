import type { User } from '@thing/db';
import { Resend } from 'resend';

export default {
  whatsapp: async ({
    user,
    title,
    summary,
    runUrl,
  }: {
    user: User;
    title: string;
    summary: string;
    runUrl: string;
  }) => {
    const message = `${title}\n\n${summary}\n\nView full run: ${runUrl}`;
    const response = await fetch(
      'https://ypwql9.api.infobip.com/whatsapp/1/message/template',
      {
        method: 'POST',
        headers: {
          Authorization: `App ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        redirect: 'follow',
        body: JSON.stringify({
          messages: [
            {
              from: '12347528977',
              to: '962792807794',
              messageId: '7dcee2f1-b80d-462c-ad1d-5c250d6d1ae1',
              content: {
                templateName: 'test_whatsapp_template_en',
                templateData: {
                  body: {
                    placeholders: [message],
                  },
                },
                language: 'en',
              },
            },
          ],
        }),
      },
    );
    return await response.text();
  },
  email: async (options: {
    user: User;
    title: string;
    summary: string;
    runUrl: string;
  }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const summaryHtml = options.summary.replace(/\n/g, '<br />');
    const response = await resend.emails.send({
      from: 'January <admin@schedules.january.sh>',
      to: [options.user.email],
      subject: `Prompt: ${options.title}`,
      html: `<h1>${options.title}</h1><p>${summaryHtml}</p><p><a href="${options.runUrl}">View full run</a></p>`,
    });
    return response;
  },
};
