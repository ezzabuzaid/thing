const updatedAt = 'October 31, 2024';

type Section = {
  title: string;
  body: string[];
};

const sections: Section[] = [
  {
    title: 'Account Eligibility',
    body: [
      'You must be at least 18 years old and authorized to bind your organization to these terms. Workspace owners are responsible for the activity of every member invited to Thing.',
      'You agree to keep account credentials secure and to promptly notify us if you suspect unauthorized use.',
    ],
  },
  {
    title: 'Workspace Content',
    body: [
      'You retain ownership of the information, files, and automations you upload to Thing.',
      'Granting us a limited license to host, process, and display that content is required to provide the service, troubleshoot issues, and maintain backups.',
    ],
  },
  {
    title: 'Acceptable Use',
    body: [
      'Do not use Thing to break the law, exploit security vulnerabilities, send spam, or infringe on intellectual property.',
      'AI-generated suggestions may contain errors. You are responsible for verifying outputs and ensuring any downstream usage complies with applicable regulations.',
    ],
  },
  {
    title: 'Subscriptions & Billing',
    body: [
      'Paid plans renew automatically at the end of each billing cycle unless canceled through the admin console.',
      'Invoices are due within the stated period. Late or failed payments may lead to suspension of access.',
    ],
  },
  {
    title: 'Service Availability',
    body: [
      'We strive for high uptime, but downtime may occur for maintenance, new feature rollouts, or factors outside our control.',
      'If we materially change or discontinue features, we will provide reasonable notice whenever possible.',
    ],
  },
  {
    title: 'Termination',
    body: [
      'You may terminate your account at any time. We reserve the right to suspend or close accounts that violate these terms or create operational risk.',
      'Following termination, we will delete workspace data according to our retention policy unless a longer period is required by law.',
    ],
  },
  {
    title: 'Liability & Disclaimers',
    body: [
      'Thing is provided “as is”. To the fullest extent permitted by law, we disclaim implied warranties and limit our liability to the fees paid for the 12 months prior to the issue.',
      'Neither party is liable for indirect or consequential damages, including lost profits or data.',
    ],
  },
  {
    title: 'Governing Law',
    body: [
      'These terms are governed by the laws of California, USA, without regard to conflict of laws rules. Disputes will be handled in the state or federal courts located in San Francisco County.',
    ],
  },
  {
    title: 'Contact & Notices',
    body: [
      'We will send legal notices to the email associated with your workspace owner account.',
      'Questions about these terms can be directed to admin@january.sh.',
    ],
  },
];

export default function LegalTermsServices() {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            These terms govern access to and use of Thing, our automation and AI
            collaboration platform.
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: {updatedAt}
          </p>
        </header>

        <section className="space-y-6">
          <p>
            By creating a workspace, inviting teammates, or using our services,
            you agree to these Terms of Service. If you are accepting on behalf
            of a company, you confirm that you have authority to bind that
            entity.
          </p>
        </section>

        <dl className="space-y-10">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <dt className="text-xl font-semibold">{section.title}</dt>
              <dd className="space-y-3 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <footer className="space-y-3 text-sm text-muted-foreground">
          <p>
            From time to time we may update these terms to reflect product and
            regulatory changes. We will notify workspace owners when updates
            take effect.
          </p>
          <p>
            If you disagree with any revisions, you should stop using Thing and
            cancel your subscription before the new terms apply.
          </p>
        </footer>
      </div>
    </main>
  );
}
