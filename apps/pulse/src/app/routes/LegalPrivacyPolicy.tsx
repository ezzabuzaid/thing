const updatedAt = 'October 31, 2024';

const sections = [
  {
    title: 'Personal Information We Collect',
    body: [
      'We collect the information you provide when you create an account, configure integrations, or interact with Thing, including your name, work email, and organization details.',
      'We also receive usage data generated as you collaborate with agents and teammates, such as activity logs, task notes, and timestamps.',
      'When you choose to connect external services, we only pull the scoped data that you explicitly authorize through those providers.',
    ],
  },
  {
    title: 'How We Use Your Information',
    body: [
      'Operate and improve the AI assistance, automations, and scheduling features you rely on.',
      'Provide customer support, security monitoring, and service notifications.',
      'Analyze anonymized, aggregated metrics to guide product decisions without identifying individual users.',
    ],
  },
  {
    title: 'Data Sharing',
    body: [
      'We do not sell personal information.',
      'Trusted infrastructure and analytics partners process data on our behalf under signed agreements that require confidentiality, security, and privacy safeguards.',
      'If legal or compliance obligations arise, we may share limited data with authorities after validating each request.',
    ],
  },
  {
    title: 'Data Retention & Controls',
    body: [
      'Workspace content remains while your organization maintains an active subscription. Owners can export or delete data within the admin console.',
      'Backups are encrypted and retained for up to 30 days before secure deletion.',
      'You can access, update, or request deletion of your personal information by contacting support or using in-product settings.',
    ],
  },
  {
    title: 'Security',
    body: [
      'Thing encrypts data in transit and at rest, enforces role-based access, and monitors for suspicious activity.',
      'We review vendors for security posture and maintain incident response procedures to mitigate risk.',
    ],
  },
  {
    title: 'International Transfers',
    body: [
      'If data leaves your region, we rely on appropriate safeguards such as Standard Contractual Clauses or equivalent frameworks to protect your rights.',
    ],
  },
  {
    title: 'Changes & Questions',
    body: [
      'We will post updates on this page with a new “Last Updated” date whenever the policy changes.',
      'Contact privacy@thing.app with any questions about how we handle your information.',
    ],
  },
];

export default function LegalPrivacyPolicy() {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Effective for Thing and the services we provide to our customers and
            collaborators.
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: {updatedAt}
          </p>
        </header>

        <section className="space-y-6">
          <p>
            Thing helps teams coordinate knowledge work with AI. We only collect
            the information we need to deliver secure, reliable automation for
            your organization. This policy explains what we gather, why we need
            it, and the choices available to you.
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
            If you maintain a workspace on behalf of an organization, you are
            responsible for ensuring that your users are informed about how you
            configure Thing and the data you choose to share with our services.
          </p>
          <p>
            For deletion requests, data export questions, or security contacts,
            email <a href="mailto:admin@january.sh">admin@january.sh</a>.
          </p>
        </footer>
      </div>
    </main>
  );
}
