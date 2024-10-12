import { AxiosResponse } from "axios";

export enum MetadataKey {
  Client = "retroxios:client",
  Request = "retroxios:request",
  RequestConfig = "retroxios:request/config",
  RequestParametas = "retroxios:request/parametas",
  MethodManipulator = "retroxios:method/manipulator",
}

export enum HttpMethod {
  GET = "GET",
  HEAD = "HEAD",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
  PATCH = "PATCH",
}

export enum Paramerator {
  Path,
  Query,
  QuerySpread,
  Header,
  HeaderSpread,
  Body,
}

export type Parameta = { operator: Paramerator; index: number; key?: string };

export type Queries = Record<string, any>;

export type Headers = Record<string, string>;

export type Manipulator<T = any> = (response: AxiosResponse) => T;
