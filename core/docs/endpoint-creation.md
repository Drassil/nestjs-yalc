# Endpoint Creation

This project is backed by NestJS therefore the creation of a REST endpoint and a GraphQL one can be generally done by following the NestJS documentation creating the providers and injecting them into the related app (this is also explained in our legacy endpoint creation guide).
Generally speaking a CRUD endpoint is always composed by the following components:

- DTO (The Data Transfer Object that defines the structure of what you expose)
- Resolver (GraphQL API layer)
- Controller (REST and generic API layer)
- Service (where the business logic resides)
- Repository (where to handle the connection with the datastorage)
- Entity (The class used for your ORM)

**However**, since most of the time the codebase of the providers mentioned above is similar between all the CRUD endpoints, we have created
a collection of libraries called NestJS-Yalc (which resides in our libs/common folder) that allows us to generate the generic logic of a CRUD endpoint
by using a factory pattern. It helps to reduce the boilerplate code esponetially and avoid to unit test the same code multiple time, allowing you to
focus only on the specific business logic that shouldn't/can't be generalized.

For more insights about this concept you can have a look at this slides:

https://drive.google.com/file/d/1h2Te2SZhuIp-PxElkW99YquYa_VChfH3/view?usp=sharing

## Creation of a CRUD endpoint with our Resolver factory function

### Create a simple API

To create a simple MySQL CRUD API you need 2 files: the Entity and the Resolver Factory (The DTO file is optional but strongly suggested)
