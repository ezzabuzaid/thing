import { Resend } from 'resend';

export default {
  whatsapp: async () => {
    const response = await fetch(
      'https://ypwql9.api.infobip.com/whatsapp/1/message/template',
      {
        method: 'POST',
        headers: {
          Authorization:
            'App 3d595da993ea9c158acfc440868aa43d-f22f0ae5-3040-4445-9730-75cc90605810',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        redirect: 'follow',
        body: JSON.stringify({
          messages: [
            {
              from: '447860088970',
              to: '962792807794',
              messageId: '7dcee2f1-b80d-462c-ad1d-5c250d6d1ae1',
              content: {
                templateName: 'test_whatsapp_template_en',
                templateData: {
                  body: {
                    placeholders: ['Ezz'],
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
  email: async (options: { to: string[]; subject: string; html: string }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: 'January <admin@schedules.january.sh>',
      ...options,
    });
    return response;
  },
};
