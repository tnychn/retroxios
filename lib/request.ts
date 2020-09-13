import { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from "axios";

import { Headers, Paramerator, Parameta, Queries } from "./entities";

const pathRegExp = (key?: string): RegExp => new RegExp(`{${key || ".+"}(?:=\\((.+)\\))?}`);

type Requester = (...args: any[]) => Promise<AxiosResponse>;

export default class RetroxiosRequest {
  private parametas: Parameta[] = [];
  private _config: AxiosRequestConfig = { params: {}, headers: {} };

  public static fromConfig(config: AxiosRequestConfig): RetroxiosRequest {
    if (!(config.method && config.url)) throw new Error();
    return new RetroxiosRequest(config.method, config.url);
  }

  public constructor(method: Method, endpoint: string) {
    this._config.method = method;
    this._config.url = endpoint;
  }

  public get config(): AxiosRequestConfig {
    return this._config;
  }

  public addQueries(queries: Queries): void {
    this._config.params = { ...this._config.params, ...queries };
  }

  public addHeaders(headers: Headers): void {
    this._config.headers = { ...this._config.headers, ...headers };
  }

  public extendConfig(config: AxiosRequestConfig): RetroxiosRequest {
    this._config = { ...this._config, ...config };
    return this;
  }

  private checkBodyParametas(): void {
    const hasBodyParameta = this.parametas.find((parameta) => parameta.operator === Paramerator.Body) !== undefined;
    // Disallow body for methods except POST, PUT, and PATCH
    const methods = ["POST", "PUT", "PATCH"];
    methods.push(...methods.map((method) => method.toLowerCase()));
    if (hasBodyParameta && !methods.includes(this._config.method || ""))
      throw new Error("Body is only allowed in POST, PUT and PATCH methods");
  }

  private checkSpreadParametas(paramtypes: FunctionConstructor[]): void {
    const spreadParametas = this.parametas.filter((parameta) => {
      return [Paramerator.QuerySpread, Paramerator.HeaderSpread].includes(parameta.operator);
    });
    // Check every spread parametas for whether its type is spreadable (object instead of primitive)
    for (const spreadParameta of spreadParametas) {
      const paramtypeName = paramtypes[spreadParameta.index].name;
      if (paramtypeName !== "Object") {
        throw new Error("Spread parameter must receive a spreadable Object value");
      }
    }
  }

  private checkPathParametas(): void {
    const pathParametas = this.parametas.filter((parameta) => parameta.operator === Paramerator.Path);
    // Check corresponding keys of the path parametas against replacement blocks
    for (const pathParameta of pathParametas) {
      const key = pathParameta.key;
      const match = this._config.url?.match(pathRegExp(key as string));
      if (!match) throw new Error(`Unable to find corresponding path key for '${key}'`);
    }
  }

  public withParametas(parametas: Parameta[], paramtypes: FunctionConstructor[]): RetroxiosRequest {
    this.parametas = parametas;
    this.checkBodyParametas();
    this.checkPathParametas();
    this.checkSpreadParametas(paramtypes);
    return this;
  }

  private applyParameta(operator: Paramerator, arg: any, key?: string): void {
    // Don't skip if arg is not specified is resolving path
    // as we still need to transform path templates to blank
    if (arg === undefined && ![Paramerator.Path].includes(operator)) return;
    // Resolve parametas based on their operators
    // and apply the arguments to config
    switch (operator) {
      case Paramerator.Path: {
        // arg: >> string
        const regexp = pathRegExp(key as string);
        const defaultPath = this._config.url?.match(regexp)?.[1];
        this._config.url = this._config.url?.replace(regexp, String(arg !== undefined ? arg : defaultPath || ""));
        break;
      }
      case Paramerator.Query:
        // arg: any
        this._config.params[key as string] = arg;
        break;
      case Paramerator.QuerySpread:
        // arg: object (or any spreadable types)
        this._config.params = { ...this._config.params, ...arg };
        break;
      case Paramerator.Header:
        // arg: >> string
        this._config.headers[key as string] = String(arg);
        break;
      case Paramerator.HeaderSpread:
        // arg: object (or any spreadable types)
        this._config.headers = { ...this._config.headers, ...arg };
        break;
      case Paramerator.Body:
        // arg: any
        this._config.data = arg;
        break;
    }
  }

  private mapParametas(...args: any[]): void {
    for (const parameta of this.parametas) {
      const key = parameta.key;
      const arg = args[parameta.index];
      this.applyParameta(parameta.operator, arg, key);
    }
  }

  public build(client: AxiosInstance): Requester {
    return async (...args: any[]): Promise<AxiosResponse> => {
      this.mapParametas(...args);
      return await client.request(this._config);
    };
  }

  public clone(): RetroxiosRequest {
    const request = RetroxiosRequest.fromConfig(this._config);
    request.parametas = this.parametas;
    return request;
  }
}
