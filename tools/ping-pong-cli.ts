import z from 'zod';

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

function pong(data: any) {
  process.stdout.write(JSON.stringify(data) + '\n');
}

async function ping<T extends z.ZodObject<any, any, any>>(
  commandName: string,
  schema: T,
  generator: (input: z.input<T>) => AsyncGenerator<any, void, unknown>,
) {
  const [, , command, ...options] = process.argv;
  if (command === commandName) {
    const args: Record<string, string> = {};
    for (let i = 0; i < options.length; i++) {
      const arg = options[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = options[i + 1];
        args[key] = value;
        i++;
      }
    }
    for await (const event of generator(schema.parse(args))) {
      pong(event);
    }
  }
}

ping(
  'repeat',
  z.object({
    max: z.coerce.number().min(1),
    delay: z.coerce.number().min(0),
  }),
  async function* ({ max, delay }) {
    let count = 0;

    while (count < max) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      count++;
      yield { count };
    }

    pong({ done: true });
  },
);

ping(
  'countdown',
  z.object({
    start: z.coerce.number().min(0),
    delay: z.coerce.number().min(0),
  }),
  async function* ({ start, delay }) {
    const surprise = arg('surprise', 'false');
    if (surprise === 'true') {
      throw new Error('Surprise error!');
    }
    let count = start;

    while (count > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      count--;
      yield { count };
    }

    pong({ done: true });
  },
);

// Usage:
// node pintg-pong-cli.js repeat --max 5 --delay 1000
// node ping-pong-cli.js countdown --start 5 --delay 1000
