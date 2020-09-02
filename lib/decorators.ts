import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import RetroxiosRequest from "./request";
import { MetadataKey, HttpMethod, Paramerator, Parameta, Queries, Headers, Interceptors } from "./entities";

/**
 * This should be returned in every method with request decorator attached.
 * Since those methods should do nothing other than acting like type annotation of the HTTP request, there is nothing to return.
 * This solves the problem of returning void in a method with reqeust decorator attached.
 *
 * @param _args - All arguments passed to the method should be put here to eliminate `unused parameter` warnings of linters
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const nothing = (..._args: any[]): any => null as any;

type RequestDecoratorDefaults = { queries?: Queries; headers?: Headers };

function requestDecorator(method: HttpMethod, endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator {
  // TODO: something to do with the original method value?
  return (target, propertyKey, descriptor: PropertyDescriptor): void => {
    // Warn if any request method decorator is already attached
    if (Reflect.hasMetadata(MetadataKey.Request, target, propertyKey)) {
      console.warn("[retroxios] More than one request decorator is repeatedly attached.");
      console.warn("[retroxios] Request decorators attached below this one will get overridden.");
    }
    // Warn if defaults are specified and any request config decorator is already attached at the same time
    if (defaults && Reflect.hasMetadata(MetadataKey.RequestConfig, target, propertyKey)) {
      console.warn("[retroxios] Defaults should not be specified when a request config decorator is attached.");
      console.warn("[retroxios] Some properties specified by the request config decorator will get overridden by defaults.");
    }
    // Build the Reqeust object based on the defaults and parametas
    const config: AxiosRequestConfig = Reflect.getMetadata(MetadataKey.RequestConfig, target, propertyKey) || {};
    const interceptors: Interceptors = Reflect.getMetadata(MetadataKey.ReqeustInterceptors, target, propertyKey) || {};
    const reqeust = new RetroxiosRequest(method, endpoint).extendConfig(config).useInterceptors(interceptors);
    if (defaults) {
      defaults.queries && reqeust.addQueries(defaults.queries);
      defaults.headers && reqeust.addHeaders(defaults.headers);
    }
    const parametas: Parameta[] = Reflect.getMetadata(MetadataKey.RequestParametas, target, propertyKey) || [];
    const paramtypes: FunctionConstructor[] = Reflect.getMetadata("design:paramtypes", target, propertyKey);
    Reflect.defineMetadata(MetadataKey.Request, reqeust.withParametas(parametas, paramtypes), target, propertyKey);
    // Modify the descriptor properties and its value to make it execute the request
    descriptor.enumerable = true;
    descriptor.writable = descriptor.configurable = false;
    descriptor.value = async function (...args: any[]): Promise<AxiosResponse> {
      // Get the Client object from metadata in runtime rather than in declaration time
      // as the object is defined in Retroxios.create() (after decorators are executed)
      const client: AxiosInstance = Reflect.getMetadata(MetadataKey.Client, target.constructor);
      return await reqeust.build(client)(...args);
    };
  };
}

/**
 * A request decorator that transforms the decorated method into a HTTP `GET` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const GET = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.GET, endpoint, defaults);

/**
 * A request decorator that transforms the decorated method into a HTTP `HEAD` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const HEAD = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.HEAD, endpoint, defaults);

/**
 * A request decorator that transforms the decorated method into a HTTP `POST` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const POST = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.POST, endpoint, defaults);

/**
 * A request decorator that transforms the decorated method into a HTTP `PUT` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const PUT = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.PUT, endpoint, defaults);

/**
 * A request decorator that transforms the decorated method into a HTTP `DELETE` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const DELETE = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.DELETE, endpoint, defaults);

/**
 * A request decorator that transforms the decorated method into a HTTP `OPTIONS` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const OPTIONS = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.OPTIONS, endpoint, defaults);

/**
 * A request decorator that transforms the decorated method into a HTTP `PATCH` request.
 *
 * @param endpoint - The target URL endpoint of the request
 * @param defaults - The default options (queries and headers) of the request which may get overridden by the parameters
 */
export const PATCH = (endpoint: string, defaults?: RequestDecoratorDefaults): MethodDecorator =>
  requestDecorator(HttpMethod.PATCH, endpoint, defaults);

/**
 * Supply a specific `config` for this particular request only.
 *
 * @param config - The config to be applied, which some options may get overridden by the parameters
 */
export const Config = (config: AxiosRequestConfig): MethodDecorator => {
  return (target, propertyKey): void => {
    if (Reflect.hasMetadata(MetadataKey.RequestConfig, target, propertyKey)) {
      console.warn("[retroxios] More than one request config decorator is repeatedly attached.");
      console.warn("[retroxios] Request config decorators attached below this one will get overridden.");
    }
    if (Reflect.hasMetadata(MetadataKey.Request, target, propertyKey)) {
      console.warn("[retroxios] This is an ineffective request config decorator.");
      console.warn("[retroxios] Request config decorators must be attached below request deocrator.");
    }
    Reflect.defineMetadata(MetadataKey.RequestConfig, config, target, propertyKey);
  };
};

/**
 * Supply request/response interceptor(s) for this particular request only.
 *
 * @param interceptors - The request/response interceptor(s) to be applied
 */
export const Intercept = (interceptors: Interceptors): MethodDecorator => {
  return (target, propertyKey): void => {
    if (Reflect.hasMetadata(MetadataKey.ReqeustInterceptors, target, propertyKey)) {
      console.warn("[retroxios] More than one request intercept decorator is repeatedly attached.");
      console.warn("[retroxios] Request intercept decorators attached below this one will get overridden.");
    }
    if (Reflect.hasMetadata(MetadataKey.Request, target, propertyKey)) {
      console.warn("[retroxios] This is an ineffective request intercept decorator.");
      console.warn("[retroxios] Request intercept decorators must be attached below request deocrator.");
    }
    Reflect.defineMetadata(MetadataKey.ReqeustInterceptors, interceptors, target, propertyKey);
  };
};

function addMetadataParametas(target: object, propertyKey: string | symbol, parameta: Parameta): void {
  if (!Reflect.hasMetadata(MetadataKey.RequestParametas, target, propertyKey))
    Reflect.defineMetadata(MetadataKey.RequestParametas, [] as Parameta[], target, propertyKey);
  const existingParametas: Parameta[] = Reflect.getMetadata(MetadataKey.RequestParametas, target, propertyKey);
  Reflect.defineMetadata(MetadataKey.RequestParametas, [parameta, ...existingParametas] as Parameta[], target, propertyKey);
}

/**
 * A parameter decorator that maps a segment in the path of the request URL endpoint to the value of the parameter according to the `key`.
 *
 * @param key - The corresponding alphanumeric key which is specified in the target URL endpoint given in the reqeust decorator
 */
export const Path = (key: string): ParameterDecorator => {
  if (key.trim() === "") throw new Error("Key must not be empty");
  if (!key.match(/^[a-zA-Z0-9_]+$/)) throw new Error(`Invalid key '${key}' contains forbidden characters`);
  return (target, propertyKey, parameterIndex): void => {
    addMetadataParametas(target, propertyKey, { operator: Paramerator.Path, index: parameterIndex, key });
  };
};

/**
 * A parameter decorator that adds the value of the parameter as a key-value `query` to the request URL endpoint.
 *
 * @param key - The key of the query
 */
export const Query = (key: string): ParameterDecorator => {
  return (target, propertyKey, parameterIndex): void => {
    addMetadataParametas(target, propertyKey, { operator: Paramerator.Query, index: parameterIndex, key });
  };
};

/**
 * A parameter decorator that spreads the value of the parameter as multiple key-value queries to the request URL endpoint.
 */
export const QuerySpread: ParameterDecorator = (target, propertyKey, parameterIndex): void => {
  addMetadataParametas(target, propertyKey, { operator: Paramerator.QuerySpread, index: parameterIndex });
};

/**
 * A parameter decorator that adds the value of the parameter as a header entry to the request.
 *
 * @param key - The key of the header entry
 */
export const Header = (key: string): ParameterDecorator => {
  return (target, propertyKey, parameterIndex): void => {
    addMetadataParametas(target, propertyKey, { operator: Paramerator.Header, index: parameterIndex, key });
  };
};

/**
 * A parameter decorator that spreads the value of the parameter as multiple header entries to the reqeust.
 */
export const HeaderSpread: ParameterDecorator = (target, propertyKey, parameterIndex): void => {
  addMetadataParametas(target, propertyKey, { operator: Paramerator.HeaderSpread, index: parameterIndex });
};

/**
 * A parameter decorator that sets the data body of the reqeust to the value of the parameter.
 */
export const Booy: ParameterDecorator = (target, propertyKey, parameterIndex): void => {
  addMetadataParametas(target, propertyKey, { operator: Paramerator.Body, index: parameterIndex });
};
