import axios, { AxiosInstance, AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse } from "axios";

import { MetadataKey } from "./entities";

/**
 * This class is an interface to build a class as a HTTP API service client
 * based on an axios instance created from the config given.
 */
export default class Retroxios {
  private readonly client: AxiosInstance; // TODO: should expose client to allow low-level configurations

  /**
   * @param config - The base config to create the internal axios instance
   */
  public constructor(private readonly config?: AxiosRequestConfig) {
    this.client = axios.create(config);
  }

  /**
   * Returns the `interceptors` property of the internal axios instance for configurations.
   */
  public get interceptors(): {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  } {
    return this.client.interceptors;
  }

  /**
   * Extends the base config of the internal axios instance with the given `config`.
   *
   * @param config - The config to be extended from
   *
   * @returns A new `Retroxios` instance that has an internal axios instance created with the extended config
   */
  public extend(config: AxiosRequestConfig): Retroxios {
    config = { ...this.config, ...config };
    const instance = new Retroxios(config);
    instance.interceptors.request = this.interceptors.request;
    instance.interceptors.response = this.interceptors.response;
    return instance;
  }

  /**
   * Create an instance of a class as a HTTP service client.
   * Resolves methods with any one of the request decorators
   * ({@link GET}, {@link HEAD}, {@link POST}, {@link PUT}, {@link DELETE}, {@link OPTIONS}, {@link PATCH})
   * attached to methods that actually executes HTTP requests via the internal axios instance of this.
   *
   * @param cls - The class type to be constructed
   * @param args - Arguments to be passed to construct `cls`
   *
   * @returns An instance of class `T` which has the axios instance (`retroxios:client`) metadata defined on the constructor
   */
  public create<T extends object>(cls: { new (..._: any[]): T }, ...args: any[]): T {
    const target = new cls(...args);
    Reflect.defineMetadata(MetadataKey.Client, this.client, target.constructor);
    return target;
  }
}
