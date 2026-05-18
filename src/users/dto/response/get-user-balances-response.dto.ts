import { OKBaseResponse } from 'src/common';
import { UserResponseDto } from './user-response.dto';

export class GetUserBalancesResponseDto extends OKBaseResponse {
  result: UserResponseDto[];
}
