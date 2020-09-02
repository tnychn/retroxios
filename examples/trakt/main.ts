import { AxiosResponse } from "axios";

import Retroxios, { nothing, GET, Path, Query, QuerySpread } from "../../lib";

type Response = { _: null };

class TraktService {
  private static readonly BASE_URL = "https://api.trakt.tv/";
  private static readonly CLIENT_ID = process.env["TRAKT_CLIENT_ID"];

  private readonly retroxious = new Retroxios({
    baseURL: TraktService.BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "trakt-api-key": TraktService.CLIENT_ID,
      "trakt-api-version": "2",
    },
  });

  public movie(id: string): TraktMovie {
    const baseURL = `${TraktService.BASE_URL}movies/${id}`;
    return this.retroxious.extend({ baseURL }).create(TraktMovie);
  }

  public get movies(): TraktMovies {
    const baseURL = `${TraktService.BASE_URL}movies/`;
    return this.retroxious.extend({ baseURL }).create(TraktMovies);
  }
}

class TraktMovie {
  @GET("")
  public async summary(@Query("extended") extended?: "full"): Promise<AxiosResponse<Response>> {
    return nothing(extended);
  }

  @GET("releases/{country=(us)}")
  public async releases(@Path("country") country = "us"): Promise<AxiosResponse<Response>> {
    return nothing(country);
  }
}

class TraktMovies {
  @GET("popular", {
    queries: { page: 1, limit: 10 },
  })
  public async popular(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("extended") extended?: "full",
    @QuerySpread filters?: { filters: null }
  ): Promise<AxiosResponse<Response>> {
    return nothing(page, limit, extended, filters);
  }
}

const service = new TraktService();
const request = service.movies.popular(undefined, 3, "full");
request.then(({ data }) => console.log(data)).catch(console.error);
