<h1 align="center">Retroxios</h1>

<p align="center">
    <strong>A type-safe HTTP client for Node.js and browsers</strong>
</p>

<p align="center">
    <a href="./package.json"><img alt="github package" src="https://img.shields.io/github/package-json/v/strmbx/retroxios"></a>
    <a href="https://www.npmjs.com/package/retroxios"><img alt="npm package" src="https://img.shields.io/npm/v/retroxios"></a>
    <a href="https://www.npmjs.com/package/retroxios"><img alt="npm downloads" src="https://img.shields.io/npm/dt/retroxios"></a>
    <a href="./LICENSE.txt"><img alt="license" src="https://img.shields.io/github/license/strmbx/retroxios"></a>
</p>

**Retroxios** allows you to easily construct declarative yet flexible HTTP clients (powered by [axios](https://github.com/axios/axios))
for API services, by using [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
and leveraging the type system of TypeScript at the same time.

It _automagically_ turns all your [decorated](#request-decorators) methods into axios HTTP request calls against your API service.

> You can think of this as a TypeScript port of [Square](https://github.com/square)'s [Retrofit](https://github.com/square/retrofit).

By using decorators, a large amount of repetitious code can be reduced. _Less code, fewer bugs, more power._

## Features

- ✍🏻 More declarative code
- 🤖 Less repetitious code (DRY)
- 👨🏻‍💻 Better developer experience
- 🦆 Make good use of TypeScript's type system

## Overview

1. Define a class containing methods (as endpoints) of the API service

```typescript
class ExampleService {
  @GET("users/{name}", {
    queries: { page: 1 }, // (default queries)
    headers: { foo: "bar" }, // (default headers)
  })
  public async getUser(
    @Path("name") name: string, // replaces '{name}' in the endpoint
    @Query("page") page: number = 1, // add 'page=1' to queries
    @Header("foo") foo: string = "bar", // add [foo: bar] to headers
    @QuerySpread filters?: Filters // entries of this argument become key-value queries
  ): Promise<AxiosResponse<UserResponse>> {
    // No body for this method as it will transform into an axios request call.
    return nothing(name, page, foo, filters); // put all unused parameters into this function
  }
}
```

2. Create an instance of `ExampleService` via `Retroxios`

```typescript
// Construct a Retroxios object with a base config.
const baseURL = "https://api.example.com/";
const builder = new Retroxios({ baseURL, headers: { Accept: "application/json" } });

// Build an ExampleService instance.
const service = builder.create(ExampleService);

// You can additionally extend the base config to
// have multiple sub services deriving from a parent config.
const subService = builder.extend({ baseURL: `${baseURL}/sub/` }).create(ExampleSubService);
```

3. Call the HTTP requests as you normally do

```typescript
// GET https://api.example.com/users/john?page=3&gender=M
// with headers: [Accept: "application/json"] [foo: "bar"]
const call = service.getUser("john", 3, undefined, { gender: "M" });
call.then(({ status, data }) => console.log(status, data)).catch(console.error);
```

## Download

```shell script
# Using NPM
$ npm install retroxios
# Using Yarn
$ yarn add retroxios
```

## Usage

- [Request Decorators](#request-decorators)
  - [Path Manipulation](#path-manipulation)
  - [Query Manipulation](#query-manipulation)
  - [Header Manipulation](#header-manipulation)
  - [Request Body](#request-body)
  - [Per Request Config]()
  - [Per Request Interceptors]()
- [Returning `nothing()`](#returning-nothing)
- [Builder Configurations](#builder-configurations)

More examples [here](./examples).

---

```typescript
import Retroxios from "retroxios";
import * as decorators from "retroxios/decorators";
```

---

### Request Decorators

> Support HTTP `GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `OPTIONS` and `PATCH` methods.

The relative endpoint of the URL is specified as the first parameter in the decorator.

```typescript
@GET("users/list")
```

The second parameter (`defaults`) receives optional default queries and headers that will be added to the request
if there is no corresponding parameters or when they are `undefined`.

```typescript
@GET("users/list", {
  queries: { page: 1, limit: 10 },
  headers: { Accept: "application/json" }
})
```

Note that these are method decorators and must be
placed **above** the [`@Config()`](#per-request-config) and [`@Intercept()`](#per-request-interceptors) method decorators.
Also, these decorators should not be attached to the same method more than once.

The methods attached with these decorators should be an `async` function that
returns `Promise<AxiosResponse<T>>` where `T` is the object type of the expected JSON response.
For example:

```typescript
public async getUser(): Promise<AxiosResponse<UserResponse>>
```

#### Path Manipulation

The path of a request endpoint can be updated dynamically using replacement blocks and parameters on the method.
A replacement block is an alphanumeric (`_` is also allowed) key surrounded by `{` and `}`.
A corresponding parameter must be decorated with `@Path("key")` using the same key.

```typescript
@GET("group/{id}/users")
public async groupList(@Path("id") groupID: number): Promise<AxiosResponse> {
  return nothing(groupID);
};
```

You can additionally specify a default value for the path to use when the corresponding parameter is `undefined`,
by using the syntax `{key=(default)}`, where the default value is surrounded by `(` and `)` following a `=`.

```typescript
@GET("group/{id=(999)}/users")
public async groupList(@Path("id") groupID = 999): Promise<AxiosResponse> {
  return nothing(groupID);
};
```

#### Query Manipulation

Queries can be added using the `@Query("key")` parameter decorator like this:

```typescript
@GET("group/{id}/users")
public async groupList(
  @Path("id") groupID: number,
  @Query("sort") sort: string
): Promise<AxiosResponse> {
  return nothing(groupID, sort);
};
```

For complex query combinations, the `@QuerySpread` parameter decorator can be used.

```typescript
@GET("group/{id}/users")
public async groupList(
  @Path("id") groupID: number,
  @QuerySpread options: Options
): Promise<AxiosResponse> {
  return nothing(groupID, options);
};
```

#### Header Manipulation

Headers can be added using the `@Header("key")` parameter decorator like this:

```typescript
@GET("group")
public async getGroup(@Header("Authorization") authorization: string): Promise<AxiosResponse> {
  return nothing(authorization);
};
```

For complex query combinations, the `@HeaderSpread` parameter decorator can be used.

```typescript
@GET("group")
public async getGroup(@HeaderSpread headers: GroupHeaders): Promise<AxiosResponse> {
  return nothing(headers);
};
```

#### Request Body

You can supply a data body to the request using the `@Body` parameter decorator like this:

```typescript
@POST("users/new")
public async createUser(@Body user: UserEntity): Promise<AxiosResponse> {
  return nothing(user);
};
```

Note that this decorator is only allowed when using the `POST`, `PUT` and `PATCH` request decorators.

#### Per Request Config

You can supply an additional config (`AxiosRequestConfig`) for a particular request like this:

```typescript
@GET("user/posts")
@Config({ ... })
public async getUserPosts(): Promise<AxiosResponse> {
  return nothing();
};
```

Some properties such as `url`, `params`, `headers` and `data` may get overridden by decorated parameters.

Note that this decorator should only be attached once per method.

#### Per Request Interceptors

You can supply interceptor(s) for a particular request like this:

```typescript
@GET("user/posts")
@Intercept({
  request: MyRequestInterceptor,
  response: MyResponseInterceptor,
})
public async getUserPosts(): Promise<AxiosResponse> {
  return nothing();
};
```

These interceptors will override those specified in the [`Retroxios`](#builder-configurations) object.

Note that this decorator should only be attached once per method.

---

### Returning `nothing()`

> The `nothing(..._args: any[])` function returns `null as any`. It accepts anything as arguments.

All methods decorated with any [request decorator](#request-decorators) are recommended to return `nothing()`.

Since these methods do not have a body and have nothing to return, linters such as `eslint` would complain
about returning `void` cannot assign to the method's return type `Promise<AxiosResponse<T>>`.
Therefore, returning `nothing()` can eliminate these warnings.

Moreover, due to the same reason, the parameters passed to the decorated method are unused.
Therefore, you can feed these unused arguments into `nothing(...args)` in order to eliminate `no-unused-vars` warnings.

---

### Builder Configurations

> Learn more about the config (`AxiosRequestConfig`) and the interceptors
> [here](https://kapeli.com/cheat_sheets/Axios.docset/Contents/Resources/Documents/index).

The `Retroxios` object acts as a builder to construct service instances based on a given config.
The service instances it creates will then inherit its config.

```typescript
const baseConfig: AxiosRequestConfig = { ... };
const baseBuilder = new Retroxios(baseConfig);

const baseService = baseBuilder.create(ExampleBaseService);
```

Additionally, you can supply interceptors like this:

```typescript
baseBuilder.interceptors.request.use(
  (config) => {
    console.log(config);
    return config;
  },
  (error) => console.log(error)
);

baseBuilder.interceptors.response.use(
  (response) => {
    console.log(response);
    return response;
  },
  (error) => console.log(error)
);
```

The `Retroxios` object can be extended with another config to create service instances that derive from a base config.

```typescript
const subConfig: AxiosRequestConfig = {};
const subBuilder = baseBuilder.extend(subConfig);

const subService = subBuilder.create(ExampleSubService);
```

---

## Contributing

If you have any ideas on how to improve this project or if you think there is a lack of features,
feel free to open an issue, or even better, open a pull request. All contributions are welcome!
