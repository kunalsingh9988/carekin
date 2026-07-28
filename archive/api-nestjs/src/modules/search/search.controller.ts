import { Controller, Query, Get, UseGuards, UsePipes } from "@nestjs/common";
import { SearchProvidersInput } from "@carekin/shared-types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SearchService } from "./search.service";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get("providers")
  @UsePipes(new ZodValidationPipe(SearchProvidersInput))
  searchProviders(@Query() query: SearchProvidersInput) {
    return this.search.searchProviders(query);
  }
}
