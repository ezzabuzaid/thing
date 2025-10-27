import {
  type MutationFunction,
  type MutationFunctionContext,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Client, type Endpoints } from '@thing/client';

export function getOrigin(defaultOrigin = ''): string {
  let origin = '';
  try {
    origin = window.location.origin;
  } catch {
    origin = defaultOrigin;
  }
  return origin;
}
export const client = new Client({
  fetch: (request) => fetch(request as any, { credentials: 'include' }) as any,
  baseUrl: 'http://localhost:3000',
  // import.meta.env.VITE_API_URL === '/'
  //   ? getOrigin('/')
  //   : import.meta.env.VITE_API_URL,
});

type DataEndpoints = {
  [K in keyof Endpoints]: K extends `${'GET'} ${string}` ? K : never;
}[keyof Endpoints];

type MutationEndpoints = {
  [K in keyof Endpoints]: K extends `${'POST' | 'PUT' | 'PATCH' | 'DELETE'} ${string}`
    ? K
    : never;
}[keyof Endpoints];

/**
 * A hook to fetch data from the API
 * @param endpoint - The API endpoint to fetch from (e.g. 'GET /payments')
 * @param params - Query parameters for the request
 * @param options - Additional options for the query
 * @returns The query result containing data and status
 *
 * @example
 * // Fetch all payments
 * const { data: payments } = useData('GET /payments', {
 *   since: '2023-01-01',
 *   until: '2023-12-31'
 * });
 */
export function useData<E extends DataEndpoints>(
  endpoint: E,
  input?: Endpoints[E]['input'],
  options?: Omit<
    UseQueryOptions<
      Endpoints[E]['output'],
      Endpoints[E]['error'],
      Endpoints[E]['output']
    >,
    'queryFn' | 'meta' | 'queryKey'
  >,
): UseQueryResult<Endpoints[E]['output'], Endpoints[E]['error']> {
  return useQuery({
    queryKey: [endpoint, JSON.stringify(input)],
    ...options,
    meta: { endpoint, input },
    queryFn: () => client.request(endpoint, input ?? ({} as never)),
  });
}

type WithMutationFn<E extends keyof Endpoints> = Omit<
  UseMutationOptions<Endpoints[E]['output'], Endpoints[E]['error'], unknown>,
  'mutationFn' | 'mutationKey'
> & {
  invalidate?: DataEndpoints[];
  mutationFn: MutationFunction<
    Endpoints[E]['output'] | undefined,
    (
      input: Endpoints[E]['input'],
      context: MutationFunctionContext,
    ) => Promise<Endpoints[E]['output']>
  >;
};
type WithoutMutationFn<E extends keyof Endpoints> = Omit<
  UseMutationOptions<
    Endpoints[E]['output'],
    Endpoints[E]['error'],
    Endpoints[E]['input']
  >,
  'mutationFn' | 'mutationKey'
> & {
  invalidate?: DataEndpoints[];
};

/**
 * A hook to perform an action on the API with a custom mutation function.
 * The `mutate` function from the result will not take any arguments.
 * The `mutationFn` receives a `dispatch` function that you can call to trigger the API request.
 *
 * @param endpoint - The API endpoint to perform the action on (e.g. 'POST /payments').
 * @param options - Options for the mutation, including a custom `mutationFn`.
 * @returns The mutation result.
 *
 * @example
 * // Create a new payment with a custom function
 * const { mutate, isPending } = useAction('POST /payments', {
 *   mutationFn: (dispatch) => dispatch({ amount: 1000, date: '2023-01-01' }),
 *   onSuccess: () => console.log('Payment created!'),
 * });
 *
 * @example
 * // Perform logic before and after the mutation
 * const { mutate, isPending } = useAction('POST /payments', {
 *  mutationFn: async (dispatch) => {
 *   // Perform some logic before the mutation
 *   await dispatch({ amount: 1000, date: '2023-01-01' });
 *   // Perform some logic after the mutation
 *   console.log('Payment created!');
 *  },
 * });
 *
 * // later in the code
 * mutate();
 */
export function useAction<E extends MutationEndpoints>(
  endpoint: E,
  options: WithMutationFn<E>,
): UseMutationResult<Endpoints[E]['output'], Endpoints[E]['error'], void>;

/**
 * @overload
 * A hook to perform an action on the API.
 * The `mutate` function from the result expects the input for the endpoint.
 *
 * @param endpoint - The API endpoint to perform the action on (e.g. 'POST /payments').
 * @param options - Options for the mutation.
 * @returns The mutation result.
 *
 * @example
 * // Create a new payment
 * const { mutate, isPending } = useAction('POST /payments', {
 *   onSuccess: () => console.log('Payment created!'),
 * });
 *
 * // later in the code
 * mutate({ amount: 1000, date: '2023-01-01' });
 */
export function useAction<E extends MutationEndpoints>(
  endpoint: E,
  options?: WithoutMutationFn<E>,
): UseMutationResult<
  Endpoints[E]['output'],
  Endpoints[E]['error'],
  Endpoints[E]['input']
>;
export function useAction<E extends MutationEndpoints>(
  endpoint: E,
  options?: WithMutationFn<E> | WithoutMutationFn<E>,
): UseMutationResult<
  Endpoints[E]['output'],
  Endpoints[E]['error'],
  Endpoints[E]['input']
> {
  const queryClient = useQueryClient();
  return useMutation<
    Endpoints[E]['output'],
    Endpoints[E]['error'],
    Endpoints[E]['input'],
    unknown
  >({
    ...options,
    mutationKey: [endpoint],
    mutationFn: async (input, context) => {
      if (options && 'mutationFn' in options && options.mutationFn) {
        return options.mutationFn(
          (input) => client.request(endpoint, input),
          context,
        ) as Promise<Endpoints[E]['output']>;
      }
      return (await client.request(endpoint, input)) as Endpoints[E]['output'];
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      for (const endpoint of options?.invalidate ?? []) {
        await queryClient.invalidateQueries({
          predicate(query) {
            return query.meta?.endpoint === endpoint;
          },
        });
      }
      return options?.onSuccess?.(data, variables, data, context);
    },
  });
}

export function useActionState<E extends MutationEndpoints>(endpoint: E) {
  return useMutationState({
    filters: {
      predicate(mutation) {
        return mutation.meta?.endpoint === endpoint;
      },
    },
  });
}
