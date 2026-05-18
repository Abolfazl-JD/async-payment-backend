import { OKBaseResponse } from 'src/common';
import { FullUserResponseDto } from './user-response.dto';

export class GetUserAccountDetailsResponseDto extends OKBaseResponse {
  result: FullUserResponseDto | null;
}
