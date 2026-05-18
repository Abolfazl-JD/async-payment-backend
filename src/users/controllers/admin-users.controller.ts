import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  NotFoundErrorResponse,
  OKBaseResponse,
  PaginationDto,
  Roles,
  RolesGuard,
} from 'src/common';

import { UserRole } from '@prisma/client';

import { UsersService } from '../users.service';
import { CreditUserBalanceDto } from '../dto/request';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetUserAccountDetailsResponseDto,
  GetUserBalancesResponseDto,
  GetUserBalanceUsageResponseDto,
} from '../dto/response';

@Controller('admin/users')
@ApiTags('Admin users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/credit')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'User balance credited successfully',
    type: OKBaseResponse,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundErrorResponse,
  })
  async creditBalance(
    @Param('id') userId: string,
    @Body() dto: CreditUserBalanceDto,
  ): Promise<OKBaseResponse> {
    await this.usersService.creditBalance(userId, dto.amount);
    return {
      statusCode: HttpStatus.OK,
    };
  }

  @ApiOkResponse({
    description: 'User account details retrieved successfully',
    type: GetUserAccountDetailsResponseDto,
  })
  @Get(':id/details')
  async getUserAccountDetails(
    @Param('id') userId: string,
  ): Promise<GetUserAccountDetailsResponseDto> {
    const result = await this.usersService.getUserAccountDetails(userId);
    return {
      statusCode: HttpStatus.OK,
      result,
    };
  }

  @ApiOkResponse({
    description: "Users' balances retrieved successfully",
    type: GetUserBalancesResponseDto,
  })
  @ApiQuery({
    name: 'skip',
    type: Number,
    default: 0,
    required: false,
  })
  @ApiQuery({
    name: 'take',
    type: Number,
    default: 10,
    required: false,
  })
  @Get('balances')
  async getUsersBalances(
    @Query() { skip, take }: PaginationDto,
  ): Promise<GetUserBalancesResponseDto> {
    const result = await this.usersService.getUsersBalances(skip, take);
    return {
      statusCode: HttpStatus.OK,
      result,
    };
  }

  @ApiOkResponse({
    description: 'User balance usage retrieved successfully',
    type: GetUserBalanceUsageResponseDto,
  })
  @Get(':id/balance-usage')
  async getUserBalanceUsage(
    @Param('id') userId: string,
  ): Promise<GetUserBalanceUsageResponseDto> {
    const result = await this.usersService.getUserBalanceUsage(userId);
    return {
      statusCode: HttpStatus.OK,
      result,
    };
  }
}
