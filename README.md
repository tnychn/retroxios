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

**Retroxios** allows you to easily construct declaritvie yet flexible HTTP clients (powered by [axios](https://github.com/axios/axios))
for API services, by using [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
and leveraging the type system of TypeScript at the same time.

> You can think of this as a TypeScript port of [Square](https://github.com/square)'s [Retrofit](https://github.com/square/retrofit).

By using decorators, a large amount of repetitious code can be reduced. _Less code, fewer bugs, more power._

## Overview

```typescript
class ExampleService {
  @GET("users/{name}", {
    queries: { page: 1 },
    headers: { Foo: "Bar" },
  })
  public async getUser(
    @Path("name") name: string,
    @Query("p") page: number = 1,
    @Header("Hello") hello: string = "world",
    @QuerySpread filters?: TrendingFilters
  ): Promise<AxiosResponse<UserResponse>> {
    return nothing(name, page, hello, filters);
  }
}

const retroxios = new Retroxios({
  baseURL: "https://api.example.com/",
  headers: { Accept: `application/json` },
});
retroxios.extend({
  baseURL: "https://api.example.com/section/",
});
retroxios.interceptors.request.use(MyReqeustInterceptor);
retroxios.interceptors.response.use(MyResponseInterceptor);

const service = retroxios.create(ExampleService);
service
  // GET https://api.example.com/users/alice?p=5&gender=F
  // Headers: [Accept: "application/json"] [Foo: "foobar"]
  .getUser("alice", 5, "foobar", { gender: "F" })
  .then((response) => console.log(response.data))
  .catch((error: AxiosError) => console.log(error.isAxiosError));
```

## Download

```shell script
# Using NPM
$ npm install retroxios
# Using Yarn
$ yarn add retroxios
```

## Usage

**TODO**

More [examples](./examples) here.

## Contributing

If you have any ideas on how to improve this project or if you think there is a lack of features,
feel free to open an issue, or even better, open a pull request. All contributions are welcome!
