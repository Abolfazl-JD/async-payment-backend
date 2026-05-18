import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BadReqErrorResponse, Public } from 'src/common';
import { LoginDto } from '../dto/request';
import { LoginResponseDto } from '../dto/response';
import { UserRole } from '@prisma/client';

@Controller('admin/auth')
@ApiTags("Admin's auth")
@ApiBadRequestResponse({
  description: 'body validation error',
  type: BadReqErrorResponse,
})
@ApiCreatedResponse({
  description: "user's access token",
  type: LoginResponseDto,
})
@Public()
export class AdminsAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async adminLogin(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(dto);

    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Admins only');
    }

    const { access_token } = await this.authService.login(user);
    return {
      statusCode: HttpStatus.CREATED,
      access_token,
    };
  }
}
