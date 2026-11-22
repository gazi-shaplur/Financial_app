import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(['CASH', 'BANK', 'CREDIT_CARD', 'MOBILE_WALLET', 'INVESTMENT', 'OTHER'])
  type: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currencyCode: string;

  @IsOptional()
  @Transform(({ value }) => String(value))
  openingBalance?: string;
}

export class CreateTransactionDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';

  @Matches(/^\d+(\.\d{1,4})?$/)
  amount: string;

  @Matches(/^[A-Z]{3}$/)
  currencyCode: string;

  @IsString()
  transactionAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  merchant?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;
}

export class CreateIncomeDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @Matches(/^\d+(\.\d{1,4})?$/)
  amount: string;

  @Matches(/^[A-Z]{3}$/)
  currencyCode: string;

  @IsString()
  incomeAt: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
