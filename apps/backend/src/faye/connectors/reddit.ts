type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

type Range<From extends number, To extends number> =
  | Exclude<Enumerate<To>, Enumerate<From>>
  | From;

interface ListingQuery {
  after?: string;
  before?: string;
  count?: Range<0, 100>;
  limit: Range<1, 100>;
  show?: string;
}

type ListingResponse<T> = {
  data: {
    after: string | null;
    before: string | null;
    children: Array<{ data: T }>;
  };
};

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

const ACCEPT = 'application/json, text/javascript, */*; q=0.01';

const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const ORIGIN = 'https://www.reddit.com';
const REFERER = 'https://www.reddit.com/';
const listings = {
  async _client<T>(name: string, listing: string, query: ListingQuery) {
    const { limit = 25, after, before, ...rest } = query;
    const base = new URL(
      `https://www.reddit.com/r/${encodeURIComponent(name)}/${encodeURIComponent(listing)}.json`,
    );
    base.searchParams.set('limit', String(Math.max(1, Math.min(limit, 100))));
    if (after) base.searchParams.set('after', after);
    if (before) base.searchParams.set('before', before);

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        base.searchParams.set(key, String(value));
      }
    });
    console.log('Fetching Reddit URL:', base.toString());
    const res = await fetch(base, {
      method: 'GET',
      // reddit often blocks non-browser-like requests; these headers help
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: ACCEPT,
        'Accept-Language': ACCEPT_LANGUAGE,
        Referer: REFERER,
        Origin: ORIGIN,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      redirect: 'follow',
      credentials: 'omit',
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch /r/${name}/${listing}: ${res.status} ${res.statusText}`,
      );
    }
    const json = (await res.json()) as ListingResponse<T>;

    const children = Array.isArray(json?.data?.children)
      ? json.data.children
      : [];
    return {
      posts: children,
      after: json.data.after,
      before: json.data.before,
    };
  },
  async hot(name: string, options: ListingQuery & { g?: string }) {
    const result = await this._client<any>(name, 'hot', options);
    result.posts.map((child) => {
      return {
        title: child.data.title,
        url: child.data.url,
        score: child.data.score,
        ups: child.data.ups,
        subreddit_id: child.data.subreddit,
        subreddit_subscribers: 0,
        text: child.data.selftext,
        created_utc: child.data.created_utc,
        num_comments: child.data.num_comments,
        author_fullname: child.data.author_fullname,
      };
    });
    return result;
  },
};
