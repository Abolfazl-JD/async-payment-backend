import { OKBaseResponse } from 'src/common';

export class AggregateTransactionsResponseDto extends OKBaseResponse {
  result: SingleReport[];
}

class SingleReport {
  type: string;
  period: string;
  total: string;
}
