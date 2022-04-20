# Endpoint Creation with AgGrid system

This project is backed by NestJS therefore the creation of a REST endpoint and a GraphQL one can be generally done by following the NestJS documentation creating the providers and injecting them into the related app (this is also explained in our legacy endpoint creation guide).
Generally speaking, a CRUD endpoint is always composed by the following components:

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

To make the endpoints complete, we want to define more configurations to:

- Define GraphQL nested resource with Join and Resolve Fields (Dataloader)
- Define DTO with field visibility, validation, mapping and value manipulation
- Define GraphQL parameters
- Define custom names and types for auto-generated queries/mutations
- Define endpoint authorization and decorators
- Disable/enable auto-generated queries/mutations
- Define Extra arguments/input for autogenerated queries/mutations
- Define default values for query/mutation arguments
- Define Custom Queries and Mutations

Every single piece of the `AgGridDependencyFactory` is extremely configurable.

In the following example we are going to create a `skeleton-user.resolver.ts` file to show you all the configurations available
on this system and connect this resource

#### Define GraphQL nested resource with Join and Resolve Fields (Dataloader)

To complete the `UserPhone` entity, we need to create the relationship with an User entity where we can define the owner of the
phone number.

The NestJS-Yalc system integrates a feature to convert an entity property to a nested resource (ResolveField) that can be resolved
via 2 strategies:

1. **Dataloader fetching:** high performance and cache possibility, no data intersection available
2. **Join:** lower performance but data intersection available.

To define a field as a relationship and enable the 2 features above, we should use both the TypeORM and the AgGrid decorators.

Example:

```Typescript
@Entity('skeleton-user')
@ObjectType()
@AgGridObject()
export class SkeletonUser extends EntityWithTimestamps(BaseEntity) {
  @AgGridField({ gqlType: returnValue(UUIDScalar) })
  @PrimaryColumn('varchar', { name: 'guid', length: 36 })
  guid: string;

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  password: string;

  @AgGridField<UserPhone>({
    relation: {
      type: () => UserPhone,
      relationType: 'one-to-many',
      sourceKey: { dst: 'guid' },
      targetKey: { dst: 'userId' },
    },
  })
  @OneToMany(
    () => UserPhone,
    (meta) => meta.SkeletonUser,
  )
  @JoinColumn([{ name: 'guid', referencedColumnName: 'userId' }])
  UserPhone?: UserPhone[];
}
```

while in the `UserPhone` entity:

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

  @AgGridField<UserPhone>({
    relation: {
      type: () => UserPhone,
      relationType: 'one-to-one',
      sourceKey: { dst: 'userId' },
      targetKey: { dst: 'guid' },
    },
  })
  @OneToOne(
    () => SkeletonUser,
    (meta) => meta.SkeletonPhone,
  )
  @JoinColumn([{ name: 'userId', referencedColumnName: 'guid' }])
  SkeletonUser?: SkeletonUser;
}
```

**NOTE 1:** most of the time you can avoid to use the `@AgGridField` decorator since the AgGrid system is able to automatically detect it by the TypeORM decorators, however, with the `@AgGridField` you can specify more options to include some edge cases. You could even only use AgGridField instead
if you only need the dataloader and not the join feature.

**NOTE 2:** It's a good practice to define the `@AgGridField` within a DTO instead of an entity. It's always better to separate this 2 concepts. In the example above we used the entities for simpliciy

#### Define DTO with field visibility, validation, mapping, and value manipulation

So far, we've seen how to generate CRUD Graphql operations by using the `AgGridDependencyFactory` and an `Entity`. However, we do not want to couple the
persistence layer with the presentation layer. Therefore, we should create a DTO class to define what's the structure of the data we want to expose.

In GraphQL DTOs are represented by the GraphQL Types (response payload) and Inputs (argument payload). To define a DTO we normally want to reuse
what should not be changed from the entity and redefine some properties instead.

Example:

```Typescript
@ObjectType()
@AgGridObject()
export class SkeletonUserType extends SkeletonUser {
  @AgGridField<UserPhone>({
    relation: {
      type: () => UserPhone,
      relationType: 'one-to-many',
      sourceKey: { dst: 'guid' },
      targetKey: { dst: 'userId' },
    },
  })
  UserPhone?: UserPhone[];

  @HideField()
  password: string;
}
```

In the example above we've done 2 things:

1. We've moved the `@AgGridField` to define how to resolve the `UserPhone` field within the DTO, since it's a configuration mainly tied to GraphQL.
2. We're hiding the information about the user `password` because we do not want to expose such information to the final user.

##### Advanced

#### How to define authorization and decorators on autogenerated operations

One of the feature that can't miss in a system with user login is the authorization of the endpoints.

You can implement a NestJS [Role Guard](https://docs.nestjs.com/guards#role-based-authentication) to authorize your endpoint

This is an example of how to implement a basic Role Guard assuming that you pass the role of the user within the request context

```Typescript
export enum RoleEnum {
  PUBLIC,
  USER,
  ADMIN,
}

export function RoleAuth(requiredRoles: RoleEnum[]): ClassType<CanActivate> {
  @Injectable()
  class RolesGuard implements CanActivate {
    public roles: RoleEnum[] = [];
    public userId = '';

    canActivate(context: ExecutionContext): boolean {
      const ctx = GqlExecutionContext.create(context);
      const role = ctx.getContext().req.role;

      return (
        !requiredRoles.length ||
        requiredRoles.some(
          (requiredRole) =>
            requiredRole === RoleEnum.PUBLIC || requiredRole === role,
        )
      );
    }
  }

  return RolesGuard;
}
```

Then you can use the `RoleAuth` factory method to define the role needed to execute a graphql operation on your
resolver file.

Example on how to apply the RoleAuth on the query:

```Typescript
export const skeletonUserProvidersFactory = (dbConnection: string) =>
  AgGridDependencyFactory<SkeletonUser>({
    // The model used for TypeORM
    entityModel: SkeletonUser,
    resolver: {
      queries: {
        // SkeletonModule_getSkeletonUser
        getResource: {
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))],
          idName: 'guid'
        },
        getResourceGrid: {
          decorators: [UseGuards(RoleAuth([RoleEnum.PUBLIC]))]
        },
      }
    },
    service: { dbConnection },
    dataloader: { databaseKey: 'guid' }
  });
```
