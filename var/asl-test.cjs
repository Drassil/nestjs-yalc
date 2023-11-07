/**
 * Little script to test AsyncLocalStorage and how it behaves with Fastify inject method
 * if the Id in the logger are different, it means that the AsyncLocalStorage is working
 * by creating a new context for each request
 */

const fastify = require('fastify')({ logger: true });
const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

fastify.get('/', (request, reply) => {
  const store = asyncLocalStorage.getStore();
  // Store unique identifier in the store
  store.id = Math.random();
  reply.send({ id: store.id });
});

const start = async () => {
  try {
    await fastify.listen(3000);

    // Inject requests simulating different incoming requests
    asyncLocalStorage.run(new Map(), async () => {
      const response1 = await fastify.inject({
        method: 'GET',
        url: '/',
      });
      console.log('Response 1:', response1.json());

      asyncLocalStorage.run(new Map(), async () => {
        const response2 = await fastify.inject({
          method: 'GET',
          url: '/',
        });
        console.log('Response 2:', response2.json());
      });
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
