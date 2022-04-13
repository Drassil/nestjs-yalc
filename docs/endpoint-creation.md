# Endpoint Creation with AgGrid system

This project is backed by NestJS therefore the creation of a REST endpoint and a GraphQL one can be generally done by following the NestJS documentation creating the providers and injecting them into the related app (this is also explained in our legacy endpoint creation guide).
Generally speaking a CRUD endpoint is always composed by the following components:

- Resolver (GraphQL API layer)
- Controller (REST and generic API layer)
  - DTO (The Data Transfer Object that defines the structure of what you expose)
  - Dataloader
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

### Getting started

**DISCLAIMERS**:

- In the code snippets below the `imports` are not included since they could change overtime.

- The examples below do not include the documentation about how to create a NestJS app, how to establish a TypeORM database connection and all the steps to setup
  a working NestJS application. Please refer to the NestJS documentation for it.

- The code below needs the `@nestjs/graphql` plugin installed with the following configurations:

This is used to avoid defining graphql @Field decorators on property types that can be detected automatically (read the NestJS doc to know more about it)

```Json
"plugins": [
      {
        "name": "@nestjs/graphql",
        "options": {
          "typeFileNameSuffix": [
            ".input.ts",
            ".entity.ts",
            ".type.ts"
          ],
          "introspectComments": true
        }
      }
```

To create a simple MySQL CRUD API you need 2 files: the Entity and the Resolver Factory (The DTO file is optional but strongly suggested)

The bare minimum configuration to create a CRUD is by setting up an entity and generating the needed components by using the `AgGridDependencyFactory` method.

So if we want to implement a CRUD API to manage a collection of phone numbers we can use the following code.

First create the entity `user-phone.entity.ts`

```Typescript
@Entity('user-phone')
@Index('unique_phone', ['phoneNumber', 'userId'], { unique: true })
@ObjectType()
@AgGridObject()
export class UserPhone extends EntityWithTimestamps(BaseEntity) {
  // if not specifiec elsewhere
  // ID field name will be used by default from the single
  // resource get query as argument to use to select the resource
  @PrimaryGeneratedColumn('increment')
  ID: number;

  @Column('varchar', { length: 20 })
  phoneNumber: string;

  // this will be used as a foreign key of the user table in a following example
  @Column('varchar', { length: 36 })
  userId: string;
}
```

Then create the related resolver `user-phone.resolver.ts`

```Typescript
export const userPhoneProvidersDeps =
  AgGridDependencyFactory<UserPhone>({
    // if DTOs are not configured, the entity will be used to
    // define the graphql types
    entityModel: UserPhone,
    // if you have a different db connection than the default one, you can set this value accordingly
    service: { dbConnection: 'default' },
     // what's the primary key used by the dataloader to load the resource when not specified
     // elsewhere
    dataloader: { databaseKey: 'ID' },
  });
```

The `AgGridDependencyFactory` will generate at runtime the Resolver, the Service, the Dataloader, the Repository and, in this case,
the DTOs injecting them within the `userPhoneProvidersDeps`variable that has this interface:

```Typescript
export interface IDependencyObject<Entity> {
  providers: Array<FactoryProvider | Provider>;
  repository: ClassType<AgGridRepository<Entity>>;
}
```

These 2 properties should eventually added to your `TypeORM.forFeature` method and the NestJS providers list available in your module.

Example:

```Typescript
import { userPhoneProvidersDeps } from "./user-phone.resolver.ts"

@Module({})
export class AppModule {
  static register(dbConnection: string): DynamicModule {
    return {
      module: UserModule,
      imports: [
        TypeOrmModule.forFeature(
          [userPhoneProviders.repository],
          'default',
        ),
      ],
      providers: [
        ...userPhoneProviders.providers,
      ],
    };
  }
}
```

**NOTE:** Also remember to add the `UserPhone` Entity to the entity list of your TypeORM configurations.

That's it! This is the bare minimum code to create a full featured GraphQL CRUD based on a single entity, the operations generated are the following:

#### Queries:

- `getUserPhone(ID):` It returns a single UserPhone resource selected by the ID
- `getUserPhoneGrid(sorting, filters, startRow, endRow, join):` It returns a list of user phones that can be sorted, filtered, paginated and joined.

#### Mutations:

- `createUserPhone(input):` create a single UserPhone by specifying its own values within the input
- `updateUserPhone(input, conditions):` update a single UserPhone by passing the input and the conditions to select the resource to update
- `deleteUserPhone(conditions):` delete a single UserPhone by passing the conditions needed to select the resource to delete

Please refer to the documentation on how to use NestJS-Yalc AgGrid library to learn how to configure the query and mutation parameters properly.

**NOTE:** You can use our library based on **graphq-sofa** in order to expose RestAPI endpoints based on the queries and mutations generated above.

However, this is a very basic and non real-world example just to show you that the system is able to generate everything on his
own with just a TypeORM entity.

### A more advanced approach

To make the endpoints complete, we want to define more configurations to implement features such as:

- Endpoint authorization
- DTO with fields validation and manipulation
- GraphQL nested resource with Join and Resolve Fields (Dataloader)
- Extra arguments/input for autogenerated queries/mutations
-
